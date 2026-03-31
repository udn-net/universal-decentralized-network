#!/usr/bin/env bun

import {
    connectServers,
    forgetConnection,
    getWebSocketStats,
    processMessage,
    reconnectServers,
    removeExpiredMailboxes,
    trackConnection,
} from "./websocket-handler";
import {
    createFileResponse,
    getVersionNumber,
    writeError,
    writeStatNumber,
    writeStatString,
    writeSuccess,
} from "./utility";

import Colors from "colors";
import IP from "ip";
import Path from "path";
import { ServerWebSocket } from "bun";
import { getConfig } from "./config-handler";

// CONFIG
export const CODE_DIR = Path.dirname(import.meta.path);
export const STATIC_DIR = Path.join(CODE_DIR, "static/dist");
export const PACKAGE_FILE = Path.join(CODE_DIR, "package.json");
export const DEFAULT_PAGE = "index.html";

// TYPES
export type WS = ServerWebSocket<unknown> | WebSocket;

// MAIN
async function main() {
    // CONFIG
    const config = await getConfig();
    const versionNumber = await getVersionNumber();

    // SERVER
    const server = Bun.serve({
        port: config.port,

        fetch(request, server) {
            // allow websockets
            server.upgrade(request);

            // respond
            const requestPath = new URL(request.url).pathname;
            switch (requestPath) {
                case "/":
                    return createFileResponse(DEFAULT_PAGE);
                case "/stats":
                    return new Response(JSON.stringify(getAllStats()));
                default:
                    return createFileResponse(requestPath);
            }
        },

        websocket: {
            open(ws) {
                try {
                    trackConnection(ws);
                } catch (error) {
                    writeError(error);
                }
            },
            message(ws, message) {
                try {
                    processMessage(ws, message.toString(), config);
                } catch (error) {
                    writeError(error);
                }
            },
            close(ws) {
                try {
                    forgetConnection(ws);
                } catch (error) {
                    writeError(error);
                }
            },
        },

        tls: await (async () => {
            const keyFile = Bun.file("./key.pem");
            const certFile = Bun.file("./cert.pem");

            if (
                (await keyFile.exists()) == false ||
                (await certFile.exists()) == false
            )
                return undefined;

            return {
                key: keyFile,
                cert: certFile,
                passphrase: process.env.TLS_PASSPHRASE,
            };
        })(),
    });

    // OTHER SERVERS
    connectServers(config);

    // AUDIT
    function getServerStats(): [string, string][] {
        return [
            ["server url", server.url.toString()],
            ["server ip address", IP.address()],
            ["server version", versionNumber],
        ];
    }

    function getAllStats(): [string, string | number][] {
        return [...getServerStats(), ...getWebSocketStats()];
    }

    // CLI
    function updateCLI() {
        return;
        console.clear();

        console.log(Colors.bold.bgWhite("UNIVERSAL DECENTRALIZED NETWORK"));
        console.log(
            Colors.yellow("relevant output is available in the 'logs' file"),
        );
        console.log();

        console.log(new Date().toLocaleString());
        console.log();

        getServerStats().forEach((entry) => writeStatString(...entry));
        console.log();

        getWebSocketStats().forEach((entry) => writeStatNumber(...entry));
        console.log();
    }

    // LOOP
    setInterval(() => {
        if (process.env.DEV != "1") {
            updateCLI();
            reconnectServers(config);
        }

        removeExpiredMailboxes();
    }, 2000);

    // FINISH
    writeSuccess(`###\nstarted up ${new Date().toLocaleString()}`);
}

main();
