import { Mailbox, Subscriber, SubscriptionMap } from "./subscriptionHandler";
import {
    doIfIsString,
    parseMessage,
    stringifyMessage,
    writeError,
    writeSuccess,
} from "./utility";

import Crypto from "crypto";
import { WS } from "./index";
import { defaultConfig } from "./config-handler";

// requests
export interface WebSocketMessage {
    uuid?: string;

    // connecting to server
    requestingServerConnection?: boolean;

    // mailbox
    requestingMailboxSetup?: boolean;
    requestedMailbox?: string;
    deletingMailbox?: string;
    assignedMailboxId?: string; // sent by server
    connectedMailboxId?: string; // sent by server
    deletedMailbox?: string; // sent by server

    // subscribing to channel
    subscribeChannel?: string;
    unsubscribeChannel?: string;
    subscribed?: boolean; // sent by server

    //sending message
    messageChannel?: string;
    messageBody?: string;

    // confirming message
    confirmingMessageReceived?: boolean;
}

// TRACKING
const knownMessageIds = new Set<string>();

export const subscriptionMap = new SubscriptionMap();

export const clientsConnected = new Set<WS>();
export const mailboxes = new Map<string, Mailbox>();

export const serversConnectedAsClient = new Set<WS>();
export const serversConnected = new Set<WebSocket>();
export const serversDisconnected = new Set<string>();

export function getServerCount() {
    return serversConnected.size + serversConnectedAsClient.size;
}

export function trackConnection(ws: WS) {
    clientsConnected.add(ws);
}

export function forgetConnection(ws: WS): void {
    clientsConnected.delete(ws);
    serversConnectedAsClient.delete(ws);
    subscriptionMap.deleteSubscriber(ws);
}

export function trackSubscription(
    subscriber: Subscriber,
    channel: string,
): void {
    subscriptionMap.set(subscriber, channel);
    confirmSubscription(subscriber, channel);
}

export function forgetSubscription(
    subscriber: Subscriber,
    channel: string,
): void {
    subscriptionMap.delete(subscriber, channel);
    confirmSubscription(subscriber, channel);
}

// AUDIT
export function getWebSocketStats(): [string, number][] {
    return [
        ["channels", subscriptionMap.subscribersPerChannel.size],
        ["clients connected", clientsConnected.size],
        ["mailboxes", mailboxes.size],
        ["servers connected", getServerCount()],
        ["servers disconnected", serversDisconnected.size],
    ];
}

// OTHER SERVERS
export function connectServers(config: typeof defaultConfig): void {
    config.connectedServers.forEach((serverAddress) => {
        connectServer(serverAddress, config);
    });
}

export function reconnectServers(config: typeof defaultConfig): void {
    [...serversDisconnected.values()].forEach((address) => {
        connectServer(address, config);
    });
}

export function connectServer(
    address: string,
    config: typeof defaultConfig,
): void {
    try {
        // connect
        const ws = new WebSocket(address);
        serversConnected.add(ws);

        // listen
        ws.addEventListener("open", () => {
            serversDisconnected.delete(address);

            writeSuccess(`connected to server at "${address}".`);

            subscribeChannels(ws, config);
            requestServerConnection(ws);
        });

        ws.addEventListener("message", (message) => {
            processMessage(ws, message.data.toString(), config);
        });

        ws.addEventListener("close", () => {
            serversConnected.delete(ws);
            serversDisconnected.add(address);
            writeError(`server at "${address}" disconnected`);
        });
    } catch (error) {
        writeError(`failed to connect to server at "${address}": ${error}`);
    }
}

function subscribeChannels(ws: WS, config: typeof defaultConfig): void {
    config.subscribedChannels.forEach((channel) => {
        subscribeChannel(ws, channel);
    });
}

export function subscribeChannel(server: WS, channel: string): void {
    const message: WebSocketMessage = {
        subscribeChannel: channel,
    };
    const messageString = stringifyMessage(message);
    server.send(messageString);
}

// PROCESS MESSAGE
export function processMessage(
    ws: WS,
    messageString: string,
    config: typeof defaultConfig,
): void {
    // MESSAGE ID
    // check id
    const messageObject: WebSocketMessage = parseMessage(messageString);
    if (!messageObject.uuid) {
        // assign if no id
        messageObject.uuid = Crypto.randomUUID();
    } else if (messageObject.confirmingMessageReceived == true) {
        // received confirmation
        mailboxes.forEach((mailbox) => {
            if (mailbox.ws != ws) return;
            return mailbox.checkMessageReceivedConfirmation(
                messageObject.uuid!,
            );
        });
    } else {
        // ignore if already seen
        if (knownMessageIds.has(messageObject.uuid)) return;
    }
    // remember message
    knownMessageIds.add(messageObject.uuid);

    // SUBSCRIPTIONS
    doIfIsString(messageObject.subscribeChannel, (subscribeChannel) => {
        trackSubscription(ws, subscribeChannel);
    });
    doIfIsString(messageObject.unsubscribeChannel, (unsubscribeChannel) => {
        forgetSubscription(ws, unsubscribeChannel);
    });

    // MESSAGE
    doIfIsString(messageObject.messageChannel, (messageChannel) => {
        if (messageObject.messageBody == undefined) return;
        sendMessage(
            messageChannel,
            messageObject.messageBody,
            messageObject.uuid!,
        );
    });

    // MAILBOX
    if (messageObject.requestingMailboxSetup == true) {
        const mailbox = new Mailbox(ws);
        mailboxes.set(mailbox.id, mailbox);
    }
    doIfIsString(messageObject.requestedMailbox, (requestedMailbox) => {
        const mailbox = mailboxes.get(requestedMailbox);
        if (!mailbox)
            return sendWebSocketMessage(
                { deletedMailbox: requestedMailbox },
                ws,
            );
        mailbox.ws = ws;
    });
    doIfIsString(messageObject.deletingMailbox, (deletingMailbox) => {
        const mailbox = mailboxes.get(deletingMailbox);
        if (!mailbox) return;
        removeMailbox(mailbox);
    });

    // OTHER SERVER
    if (messageObject.requestingServerConnection == true) {
        clientsConnected.delete(ws);
        serversConnectedAsClient.add(ws);
        subscribeChannels(ws, config);
    }
}

// MAILBOX
export function removeExpiredMailboxes() {
    mailboxes.forEach((mailbox) => {
        if (mailbox.isExpired) removeMailbox(mailbox);
    });
}

export function removeMailbox(mailbox: Mailbox) {
    mailbox.delete();
    mailboxes.delete(mailbox.id);
}

// MESSAGING
export function sendWebSocketMessage(
    messageObject: WebSocketMessage,
    destination: Subscriber,
): void {
    const messageString = JSON.stringify(messageObject);
    destination.send(messageString, false, messageObject.uuid);
}

export function sendMessage(
    messageChannel: string,
    messageBody: string,
    uuid: string,
): void {
    const channels = messageChannel.split("/");
    subscriptionMap.forwardMessage(channels, {
        uuid,
        messageChannel,
        messageBody,
    });
}

function requestServerConnection(ws: WS): void {
    const messageObject = {
        requestingServerConnection: true,
    };
    const messageString = stringifyMessage(messageObject);
    ws.send(messageString);
}

function confirmSubscription(
    subscriber: Subscriber,
    messageChannel: string,
): void {
    const messageObject: WebSocketMessage = {
        messageChannel,
        subscribed: subscriptionMap
            .getChannelList(subscriber)
            ?.has(messageChannel)
            ? true
            : false,
    };
    const messageString = stringifyMessage(messageObject);
    subscriber.send(messageString);
}
