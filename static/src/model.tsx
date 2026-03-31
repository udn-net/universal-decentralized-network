import * as React from "bloatless-react";

import UDNFrontend from "udn-frontend";
import { translations } from "./translations";

export class Message {
    constructor(
        public channel: string,
        public body: string,
    ) {}
}

// STATE
// connection
export const isDisconnected = new React.State(true);

// mailbox
export const mailboxId = React.restoreState("mailbox-id", "");
export const isMailboxDisonnected = new React.State(true);

// messages
export const messages = new React.ListState<Message>();
export const lastReceivedMessage = new React.State(
    translations.noMessagesReceived,
);

// stats
export const statHTMLString = new React.State<string>("");
export async function updateStats() {
    const response = await fetch(
        `${window.location.protocol}//${window.location.host}/stats`,
    );
    const data: [string, string][] = await response.json();

    let html = "";
    data.forEach((item) => {
        const tile = (
            <div class="tile">
                <span class="secondary flex width-100">
                    {item[0].toString()}
                </span>
                <b>{item[1].toString()}</b>
            </div>
        );
        html += tile.outerHTML;
    });
    statHTMLString.value = html;
}

// channels
export const subscriptionChannel = new React.State("");

export const newMessageChannel = new React.State("");
export const newMessageBody = new React.State("");

export const isMessageEmpty = React.createProxyState(
    [newMessageChannel, newMessageBody],
    () => newMessageChannel.value == "" || newMessageBody.value == "",
);

// UDN Frontend
const UDN = new UDNFrontend();

UDN.onconnect = () => {
    isDisconnected.value = false;
    updateStats();

    if (mailboxId.value != "") {
        UDN.connectMailbox(mailboxId.value);
    }
};

UDN.onmessage = (data) => {
    lastReceivedMessage.value = JSON.stringify(data, null, 4);

    const { messageChannel, messageBody } = data;
    if (messageChannel && messageBody) {
        const messageObject = new Message(messageChannel, messageBody);
        if (messageBody) messages.add(messageObject);
    }
};

UDN.onmailboxcreate = (id) => {
    console.log(id);
    mailboxId.value = id;
    UDN.connectMailbox(id);
};

UDN.onmailboxconnect = () => {
    isMailboxDisonnected.value = false;
};

UDN.onmailboxdelete = () => {
    isMailboxDisonnected.value = true;
};

UDN.ondisconnect = () => {
    isDisconnected.value = true;
    isMailboxDisonnected.value = true;
    setTimeout(connect, 1000);
};

function connect() {
    UDN.connect(
        `${window.location.protocol.replace("http", "ws")}//${window.location.host}`,
    );
}
connect();

// METHODS
export function subscribe() {
    UDN.subscribe(subscriptionChannel.value);
}

export function unsubscribe() {
    UDN.unsubscribe(subscriptionChannel.value);
}

export function sendMessage() {
    if (isMessageEmpty.value == true) return;
    UDN.sendMessage(newMessageChannel.value, newMessageBody.value);
    newMessageBody.value = "";
}

export function requestMailbox() {
    UDN.requestMailbox();
}

export function deleteMailbox() {
    console.log("test");
    UDN.deleteMailbox(mailboxId.value);
}
