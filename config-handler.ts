// CONFIG
const configPath = "config.json";

export const defaultConfig = {
    port: 3000,
    connectedServers: [],
    subscribedChannels: [],
};

// METHODS
export async function createConfig() {
    const configString = JSON.stringify(defaultConfig, null, 4);
    await Bun.write(configPath, configString);
}

export async function getConfig(): Promise<typeof defaultConfig> {
    try {
        const configString = await Bun.file(configPath).text();
        const configObject = JSON.parse(configString);

        // validate config file
        Object.keys(defaultConfig).forEach((key) => {
            if (!configObject[key]) throw null;
        });

        return configObject;
    } catch {
        await createConfig();
        return defaultConfig;
    }
}
