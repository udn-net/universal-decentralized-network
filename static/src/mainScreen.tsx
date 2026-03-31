import * as React from "bloatless-react";

import {
    deleteMailbox,
    isDisconnected,
    isMailboxDisonnected,
    isMessageEmpty,
    lastReceivedMessage,
    newMessageBody,
    newMessageChannel,
    requestMailbox,
    sendMessage,
    subscribe,
    subscriptionChannel,
    unsubscribe,
} from "./model";

import { translations } from "./translations";

export function MainScreen() {
    // UI
    return (
        <article id="main-screen">
            <header>{translations.settings}</header>
            <div>
                <div class="tile width-input">
                    <div>
                        <b>{translations.messageLastReceived}</b>
                        <p
                            class="secondary"
                            subscribe:innerText={lastReceivedMessage}
                        ></p>
                    </div>
                </div>

                <hr></hr>

                <div class="tile width-input">
                    <div>
                        <b>{translations.mailbox}</b>
                        <p
                            class="secondary"
                            toggle:hidden={isMailboxDisonnected}
                        >
                            {translations.mailboxConnected}
                        </p>
                    </div>
                </div>

                <div class="flex-row width-input justify-end">
                    <button
                        class="danger width-50"
                        on:click={deleteMailbox}
                        toggle:disabled={isMailboxDisonnected}
                    >
                        {translations.deleteMailbox}
                    </button>
                    <button
                        class="primary width-50"
                        on:click={requestMailbox}
                        toggle:disabled={isDisconnected}
                    >
                        {translations.requestMailbox}
                        <span class="icon">inbox</span>
                    </button>
                </div>

                <hr></hr>

                <label class="tile">
                    <div>
                        <span>{translations.subscribeToChannel}</span>
                        <input
                            placeholder={translations.channel_placeholder}
                            bind:value={subscriptionChannel}
                            on:enter={subscribe}
                        ></input>
                    </div>
                </label>

                <div class="flex-row width-input justify-end">
                    <button class="danger width-50" on:click={unsubscribe}>
                        {translations.unsubscribe}
                    </button>
                    <button class="primary width-50" on:click={subscribe}>
                        {translations.subscribe}
                        <span class="icon">arrow_forward</span>
                    </button>
                </div>

                <hr></hr>

                <label class="tile">
                    <div>
                        <span>{translations.channel}</span>
                        <input
                            placeholder={translations.channel_placeholder}
                            bind:value={newMessageChannel}
                            on:enter={sendMessage}
                        ></input>
                    </div>
                </label>

                <label class="tile">
                    <div>
                        <span>{translations.message}</span>
                        <input
                            placeholder={translations.message_placeholder}
                            bind:value={newMessageBody}
                            on:enter={sendMessage}
                        ></input>
                    </div>
                </label>

                <div class="flex-row width-input justify-end">
                    <button
                        class="primary width-50"
                        on:click={sendMessage}
                        toggle:disabled={isMessageEmpty}
                    >
                        {translations.send}
                        <span class="icon">send</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
