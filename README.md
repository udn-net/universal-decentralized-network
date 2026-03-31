# universal-decentralized-network

The UDN project aims to provide decentralized and localhost-able infrastructure for messaging and communication. This infrastructure can be utilized in any scenario where data needs to be sent between devices, especially when no internet connection is present.

# Contents

- [How it works](#how-it-works)
    - [Channels](#channels)
    - [Scalability](#scalability)
    - [Example](#example)
- [User's guide](#users-guide)
    - [Getting Connected](#getting-connected)
    - [Using Apps](#using-apps)
    - [Getting Apps](#getting-apps)
- [Administrator's Guide](#administrators-guide)
    - [Getting Started](#getting-started)
    - [Configuration](#configuration)
    - [TLS](#tls)
    - [Connecting Multiple Servers](#connecting-multiple-servers)
- [App Developer's Guide](#app-developers-guide)
    - [Guidelines](#guidelines)
    - [The Recommended Way](#the-recommended-way)
    - [The Manual Way](#the-manual-way)

# How it works

## Introduction

Let's assume you want to set up a local network at home. Using this local network, you want to chat with family members. This has two advantages: nothing is sent out to the internet, so no company can observe your messages; and your communication continues to function even if the internet is unavailable. All you need is a local Wi-Fi network and a so-called server. You can set up any computer in your house as a server.

Remember that the UDN project provides infrastructure and is utilized by separate apps. While your server does provide basic messaging, these messages are not encrypted and only intended for maintenance purposes. You can find a list of apps in the User's Guide below.

## Channels

Communication via the UDN project is based on so-called channels. Think of channels as radio frequencies. You can subscribe to and send messages on one or multiple channels. When a message is sent on a channel you subscribe to, you will receive the message. Other messages will not be sent to your device.

In the standard scenario, we can think of a channel as a group chat that everybody can join, sending a message on this channel will send it to every "member of the group". As always, the name of a group chat should describe what the chat is about. We'll call this channel the "primary channel" and ignore the other channels for now.

Subscriptions and messages are handled by a server:

```md
**Josh** --(subscribe to "my-channel")-> **Server**
**Josh** <-(subscription confirmed )-- **Server**

**Bob** --(subscribe to "my-channel")-> **Server**
**Bob** <-(subscription confirmed )-- **Server**

**Josh** --("hello" on "my-channel" )-> **Server**
**Josh** <-("hello" on "my-channel" )-- **Server**
**Bob** <-("hello" on "my-channel" )-- **Server**
```

## Scalability

Now, let's assume we have an organization with hundreds of users. If all of these users connected to the same server, that server would have a very bad time. To solve this issue, we can set up multiple different servers and evenly distribute the users. This reduces the stress on each server and allows the network to scale.

However, each individual server is responsible for receiving and forwarding messages. If we want everybody on the network to be able to communicate, even when they are connected to different servers, our servers will need to talk to each other. Servers talk to servers the same way user devices talk to servers: they connect and then subscribe to channels.

It would be highly impractical to make every server subscribe to every primary channel there is. So instead, we utilize the fact that users can send on multiple channels. Let's explore this in an example:

## Example

**Scenario**
John and Alice have set up their own UDN server, called S1. Their neighbors, Jane and Bob, did the same, we'll call their server S2. In this scenario, John can chat with Alice, and Jane can chat with Bob. But what if John wants reach Bob about his car's extended warranty? To achieve this, we need to first connect S1 and S2.

**The bad way**

We could simply tell John, Bob, S1, and S2 to subscribe to "car-warranty", a primary channel (it describes the topic of the chat). What if Alice and Jane want to chat as well? In this setup, they'd have to use the "car-warranty" channel too, because anything else will not be sent to the other server. But that would interrupt John's highly important business. Also, Alice and Jane don't care about Bob's car, so they should create their own primary channel describing their conversation anyway.

They would then have to reconfigure S1 and S2 to also subscribe to this new primary channel, restart the servers to load the new config, and then start messaging. That would be a lot of effort, and it would have to be repeated for every new topic.

**The good way**

As said previously, a message can be sent on multiple channels. One of them is the primary channel describing the topic of the chat, every other channel is called secondary. Instead of adding primary channels to our server configs, we'll decide on a secondary channel, for example "s1-and-s2". This needs to be set up only once.

Then, John will send his messages on both "s1-and-s2" and "car-warranty". As always, his server will forward this message to every device subscribing to either of the channels. So the transfer would look like:

```md
# John and Bob subscribe:

**John** --(subscribe to "car-warranty")-> **S1**
**John** <-(subscription confirmed )-- **S1**

**Bob** --(subscribe to "car-warranty")-> **S2**
**Bob** <-(subscription confirmed )-- **S2**

---

# The servers subscribe:

**S1** --(subscribe to "s1-and-s2" )-> **S2**
**S2** --(subscribe to "s1-and-s2" )-> **S1**

---

# Sending the Message:

John sends the message to his server
**John** --("hello" on: )-> **S1**
( - "s1-and-s2" )
( - "car-warranty" )

S2 subscribed to "s1-and-s2", so S1 sends this message to S2
**S1** --("hello" on: )-> **S2**
( - "s1-and-s2" )
( - "car-warranty" )

Bob subscribed to "car-warranty", so S2 sends this message to Bob
**S2** --("hello" on: )-> **Bob**
( - "s1-and-s2" )
( - "car-warranty" )
```

This requires John to know of "s1-and-s2" and, obviously, Bob to subscribe to "car-warranty". Jane and Alice could agree on their own primary channel and use "s1-and-s2" just like John did.

We could now add a third server, connect it to at least one of S1 and S2, configure it to subscribe to the same secondary channel, and thereby extend the network further. We could also create another secondary channel like "s2-and-s3" and expect John to send his stuff on all thee channels.

As you can see, there are many ways to connect multiple servers and communicate across them, all with their own pros and cons.

# User's Guide

## Getting Connected

1. **Your administrator will give you a server address**. This address will likely look like `http://192.168.0.69` or `https://192.168.0.69`.
2. Make sure your device is **connected to the right Wi-Fi network**.
3. Access the server by **opening the address in a web browser**.
4. If the address starts with `https://` you may be warned that the connection is "insecure" or "not private". This is because your administrator created and signed the server's certificate locally, and because the certificate is not registered with an official certification authority. As long as you are connecting to the server through your local network, you can safely **ignore the risk and proceed to load the site**.
5. If you are using a smartphone, **add the site to your homescreen** (you can find this option in the share sheet or site menu), launch it, and **repeat step 3**. If you skip this, apps may refuse to connect to your server.
6. If you are on a computer, consider trusting the server's certificate on system level if you want to install apps as PWA. This process varies based on your operating system, please google how to do this on your system.

## Using Apps

1. Apps are likely hosted as websites on the internet or your local network. If this is not the case, follow instructions given by the developers or your administrator.
2. To use an app, **open it in your web browser**. Most apps will install offline support automatically so you can use them on local networks without an internet connection.
3. If you are using a smartphone, **add the app to your homescreen and launch it**.
4. If you are using a computer, you can **install the app as PWA** (this option may be called "Add to Dock" or "Create Shortcut"). Please google how to do this in your specific browser.
5. If the app requests your server address, note that:

- `http://` or `https://` (the secure variant) are protocols to request data and receive a single response
- To send messages, apps use so-called WebSockets instead. Their protocol is `ws://` or `wss://` (the secure variant)
- You will need to **replace `http` with `ws`**:
    - `http://192.168.0.100:3000` -> `ws://192.168.0.100:3000`
    - `https://192.168.0.200:3000` -> `wss://192.168.0.200:3000`

## Getting Apps

Anyone can develop apps for the UDN project. Examples of such apps are listed below. If you have developed an app for the UDN project and you want your app to be listed here, create an issue.

| App Name | Description       | Links                                                                                                |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| Comms    | Messenger for UDN | [more info](https://github.com/marlon-erler/udn-comms/) - [install](https://udn-comms.onrender.com/) |

---

# Administrator's Guide

## Getting Started

The UDN project is based on [bun](https://bun.sh/), a faster and more streamlined alternative to node.js.

1. Make sure bun is installed on your server.
2. Create a directory for your server and open it in a terminal.
3. Run `bun add udn` to install the UDN server package.
4. Start the server with `bun run start`.
5. A configuration file will be created automatically.

## Configuration

By default, the configuration file looks like this:

```JSON
{
  "port": 3000,
  "connectedServers": [],
  "subscribedChannels": []
}
```

The port and channels are self-explanatory. For servers, you'll need to provide full addresses:

```JSON
{
  "port": 3000,
  "connectedServers": [
    "ws://192.168.0.100:3000",
    "wss://192.168.0.200:3000"
  ],
  "subscribedChannels": [
    "secondary-channel-1",
    "secondary-channel-2"
  ]
}
```

## TLS

TLS is a protocol that encrypts network traffic and ensures a secure context. Features like offline support and cryptography (needed i.e. for encryption) require this secure context.

Any website loaded through a secure context will refuse to connect to insecure WebSockets, including local ones like `ws://192.168.0.100:3000`. If you want your local server to work with these apps, your server must use TLS.

In local networks, you will likely need co create a self-signed certificate. This certificate is used to encrypt network traffic and identify your server.

1. Change into your server directory.
2. Create the certificate with `openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 365`. This command will ask you a few questions and create the files required by your server.
3. Provide the passphrase via the `TLS_PASSPHRASE` environment variable (i.e. `export TLS_PASSPHRASE="my-securepass-phrase"`);

## Connecting Multiple Servers

1. Add the WebSocket addresses of servers you want to connect to the `connectedServers` array in the configuration file.
2. Add secondary channels to the `subscribedChannels` array in the configuration file.

Use the code example given above for reference.

As explained in the _How it works_ section, you may want to use multiple servers on your network. In this case, consider the following:

- Server-to-server-connections are bidirectional, so connecting server A to server B yields the same output as connecting server B to server A.
- Servers will attempt to restore lost connections to other servers periodically.
- You should make sure to evenly distribute your clients to different servers, so give your clients addresses of different servers to avoid everybody using the same one.
- Decide on one secondary channel for your network, configure all servers to subscribe, and make sure your users know this channel.
- If you are using self-signed certificates, your servers may refuse to connect to other TLS-enabled servers.
- In case your clients need to use `http`-served apps, these apps may refuse to connect to TLS-enabled servers.
- Therefore, you should have at least one TLS-enabled server, and at least one server without TLS.
- Configure the TLS-enabled servers to connect to those without TLS; connecting vice-versa may not work.

---

# App Developer's Guide

## Guidelines

- Connect to one server at a time
- When supporting networks with multiple servers, differentiate between primary and secondary channels according to the explanation above.
- Subscribe only to the primary channel, send on the primary and all secondary channels.
- Make sure to label these channels as primary and secondary (you may translate these along with the rest of your app) as users are instructed on these terms.

## The Recommended Way

**Base**
For TypeScript-based projects, you can use the [udn-frontend](https://github.com/marlon-erler/udn-frontend) package to manage the connection. This project provides methods for connecting/disconnecting, subscribing/unsubscribing, and sending messages. If you want to/need to implement this yourself, follow the manual instructions.

**Interface**
The web interface of the server itself is based on my other two projects, [carbon-mini](https://github.com/marlon-erler/carbon-mini) (preconfigured foundation for static websites, including a complete stylesheet) and [bloatless-react](https://github.com/marlon-erler/bloatless-react) (a minimalist alternative to react).
Both of these projects are very minimal, bloat-free, and quick to get started with. I'd suggest you to build your app based on the same foundation for a consistent user experience, but you can use any framework you want.

1. Download [carbon-mini](https://github.com/marlon-erler/carbon-mini) from the releases page and read the docs
2. Install [bloatless-react](https://github.com/marlon-erler/bloatless-react) and read the docs
3. Install [udn-frontend](https://github.com/marlon-erler/udn-frontend) and read the docs
4. Generate your app icon [here](https://icongen.onrender.com/), move it to the `dist` directory
5. Start developing

## The Manual Way

UDN is based on WebSockets sending JSON strings.

The JSON object can have any of these properties:

```TypeScript
export interface WebSocketMessage {
  // subscribing to channel
  subscribeChannel?: string;
  unsubscribeChannel?: string;
  subscribed?: boolean; // sent by the server to confirm subscription

  //sending or receiving message
  messageChannel?: string;
  messageBody?: string;
}
```

**Setup**

1. Create a WebSocket connection to the server
2. Listen to messages, when receiving:

- parse the message
- handle it in whatever way you need

3. Define functions to send whatever you need to send

**Sending messages**

1. Create an empty object
2. Add the properties you want to send
3. Stringify the object via `JSON.stringify()`
4. Send the string via WebSocket
