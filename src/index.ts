import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./config/env";
import { registerReadyEvent } from "./events/ready";
import { registerInteractionCreateEvent } from "./events/interactionCreate";
import { Command } from "./types/command";

// Import semua command secara eksplisit.
// Untuk Phase 1 dengan 3 command, import manual ini cukup jelas dan mudah dilacak.
// Kalau nanti command sudah banyak, baru worth it bikin auto-loader dari folder.
import * as startwork from "./commands/startwork";
import * as endwork from "./commands/endwork";
import * as status from "./commands/status";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers, // dibutuhkan untuk baca & ubah role member
  ],
});

// Daftarkan semua command ke Map, supaya interactionCreate bisa mencarinya dengan cepat.
client.commands = new Map<string, Command>();
const commandModules = [startwork, endwork, status];
for (const mod of commandModules) {
  client.commands.set(mod.data.name, mod as Command);
}

registerReadyEvent(client);
registerInteractionCreateEvent(client);

client.login(env.discordToken).catch((error) => {
  console.error("❌ Gagal login ke Discord. Cek DISCORD_TOKEN di .env.");
  console.error(error);
  process.exit(1);
});
