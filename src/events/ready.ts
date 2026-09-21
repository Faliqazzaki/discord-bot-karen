import { Client } from "discord.js";

export function registerReadyEvent(client: Client) {
  client.once("ready", (readyClient) => {
    console.log(`✅ Bot online sebagai ${readyClient.user.tag}`);
    console.log(`   Aktif di ${readyClient.guilds.cache.size} server.`);
  });
}
