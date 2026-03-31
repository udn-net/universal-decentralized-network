import { PACKAGE_FILE, STATIC_DIR, WS } from ".";

import Colors from "colors";
import Fs from "fs/promises";
import Path from "path";
import {
  WebSocketMessage,
} from "./websocket-handler";

// CONFIG
const STAT_INDENT = 25;

// MISC
export function doIfIsString(data: any, cb: (data: string) => void): void {
  if (typeof data != "string" || data == "") return;
  cb(data);
}

export async function getVersionNumber(): Promise<string> {
  try {
    const packageString = await Bun.file(PACKAGE_FILE).text();
    const packageObject = JSON.parse(packageString);
    return packageObject.version;
  } catch {
    return "unknown";
  }
}

// SERVER
export function createFileResponse(requestPath: string): Response {
  const fullPath = Path.join(STATIC_DIR, requestPath);
  return new Response(Bun.file(fullPath));
}

// OUTPUT
async function writeToLogFile(message: string): Promise<void> {
  await Fs.appendFile("logs", `${message}\n`);
}

// stats
export function writeStatString(label: string, value: string): void {
  console.log(`${label.padEnd(STAT_INDENT, " ")} ${Colors.bold.green(value)}`);
}

export function writeStatNumber(label: string, value: number): void {
  console.log(
    `${label.padEnd(STAT_INDENT, " ")} ${Colors.bold.blue(value.toString())}`
  );
}

// logging
export function writeError(message: any): void {
  console.log(Colors.bold.red(message));
  writeToLogFile(message);
}

export function writeSuccess(message: string): void {
  console.log(Colors.bold.green(message));
  writeToLogFile(message);
}

// MESSAGES
export function stringifyMessage(messageObject: WebSocketMessage): string {
  return JSON.stringify(messageObject);
}

export function parseMessage(messageString: string): Object {
  return JSON.parse(messageString);
}