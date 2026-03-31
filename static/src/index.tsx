import * as React from "bloatless-react";

import { InfoScreen } from "./infoScreen";
import { MainScreen } from "./mainScreen";
import { MessageScreen } from "./messageScreen";
import { isDisconnected } from "./model";
import { translations } from "./translations";

document.body.prepend(
    <menu>
        <a class="tab-link" href="#info-screen" active>
            <span class="icon">info</span>
            {translations.info}
        </a>
        <a class="tab-link" href="#main-screen">
            <span class="icon">settings</span>
            {translations.settings}
        </a>
        <a class="tab-link" href="#message-screen">
            <span class="icon">chat</span>
            {translations.messages}
        </a>
    </menu>,
);

document
    .querySelector("main")!
    .append(InfoScreen(), MainScreen(), MessageScreen());

document.body.append(
    <div class="modal" toggle:open={isDisconnected}>
        <div>
            <main>
                <div
                    class="flex-column align-center justify-center width-100 height-100"
                    style="gap: 1rem"
                >
                    <span class="icon error" style="font-size: 3rem">
                        signal_disconnected
                    </span>
                    <h1 class="error">{translations.disconnected}</h1>
                    <p class="secondary">{translations.reconnecting}</p>
                </div>
            </main>
        </div>
    </div>,
);
