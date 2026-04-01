import {
  WebSocketMessage,
  sendWebSocketMessage,
  subscriptionMap,
} from "./websocket-handler";

import Crypto from "crypto";
import { WS } from "./index";

export interface Subscriber {
  send: (message: string, compress?: boolean, id?: string) => void;
}

export class Mailbox implements Subscriber {
  // basic data
  id = Crypto.randomUUID();
  dateLastUsed = new Date();

  get expiryDate() {
    const expiryDate = new Date(this.dateLastUsed);
    expiryDate.setDate(expiryDate.getDate() + 7);
    return expiryDate;
  }

  get isExpired() {
    if (this.ws && this.ws.readyState == 1) return false;

    const today = new Date();
    return this.expiryDate < today;
  }

  // manage
  constructor(ws: WS) {
    sendWebSocketMessage(
      {
        assignedMailboxId: this.id,
      },
      ws,
    );
  }

  confirmConnection(): void {
    if (!this.ws) return;

    sendWebSocketMessage(
      {
        connectedMailboxId: this.id,
      },
      this.ws,
    );
  }

  delete(): void {
    subscriptionMap.deleteSubscriber(this);
    if (!this.ws) return;
    sendWebSocketMessage({ deletedMailbox: this.id }, this.ws);
  }

  // storage
  messages = new Map<string, string>();

  // websocket
  private _ws: WS | undefined;

  get ws(): WS | undefined {
    return this._ws;
  }

  set ws(ws: WS) {
    this._ws = ws;
    this.update();
  }

  update() {
    if (!this._ws) return;
    this.dateLastUsed = new Date();

    this.confirmConnection();
    this.sendUnreadMessages();

    const channels = subscriptionMap.getChannelList(this._ws);
    channels?.forEach((channel) => this.subscribe(channel));

    subscriptionMap.deleteSubscriber(this._ws);
  }

  // subscribing
  subscribe(channelName: string): void {
    subscriptionMap.set(this, channelName);
  }

  // sending
  send(message: string, _?: boolean, uuid?: string): void {
    this._ws?.send(message);

    if (!uuid) return;
    this.messages.set(uuid, message);
  }

  sendUnreadMessages(): void {
    this.messages.forEach((message) => {
      if (this._ws?.readyState != 1) return;

      this._ws.send(message);
      this.messages.delete(message);
    });
  }

  checkMessageReceivedConfirmation(uuid: string): void {
    if (!this.messages.has(uuid)) return;
    this.dateLastUsed = new Date();
    this.messages.delete(uuid);
  }
}

export class SubscriptionMap {
  channelsPerSubscriber = new Map<Subscriber, Set<string>>();
  subscribersPerChannel = new Map<string, Set<Subscriber>>();

  // prepare
  private prepareChannelSet(subscriber: Subscriber): void {
    if (this.channelsPerSubscriber.has(subscriber)) return;
    this.channelsPerSubscriber.set(subscriber, new Set());
  }

  private prepareSubscriberSet(channel: string): void {
    if (this.subscribersPerChannel.has(channel)) return;
    this.subscribersPerChannel.set(channel, new Set());
  }

  // utility
  getChannelList(subscriber: Subscriber): Set<string> | undefined {
    return this.channelsPerSubscriber.get(subscriber);
  }

  getClientList(channel: string): Set<Subscriber> | undefined {
    return this.subscribersPerChannel.get(channel);
  }

  // modifications
  set(subscriber: Subscriber, channel: string): void {
    this.prepareChannelSet(subscriber);
    this.prepareSubscriberSet(channel);

    this.getChannelList(subscriber)?.add(channel);
    this.getClientList(channel)?.add(subscriber);
  }

  delete(subscriber: Subscriber, channel: string): void {
    const channelList = this.getChannelList(subscriber);
    const clientList = this.getClientList(channel);

    channelList?.delete(channel);
    if (channelList?.size == 0) {
      this.channelsPerSubscriber.delete(subscriber);
    }

    clientList?.delete(subscriber);
    if (clientList?.size == 0) {
      this.subscribersPerChannel.delete(channel);
    }
  }

  deleteSubscriber(subscriber: Subscriber): void {
    this.getChannelList(subscriber)?.forEach((channel) => {
      this.delete(subscriber, channel);
    });
  }

  // messages
  forwardMessage(channels: string[], messageObject: WebSocketMessage): void {
    channels.forEach((channel) => {
      const subscribers = this.getClientList(channel);
      subscribers?.forEach((subscriber) => {
        sendWebSocketMessage(messageObject, subscriber);
      });
    });
  }
}
