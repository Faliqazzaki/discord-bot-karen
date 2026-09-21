import { REST, Routes } from "discord.js";
import { env } from "./config/env";

import * as startwork from "./commands/startwork";
import * as endwork from "./commands/endwork";
import * as status from "./commands/status";

/**
 * Script terpisah dari bot utama. Jalankan manual setiap kali kamu
 * menambah/mengubah command:
 *
 *   npm run deploy-commands
 *
 * Kita deploy ke satu guild spesifik (bukan global) supaya perubahan
 * command langsung muncul (global command butuh waktu ~1 jam untuk propagate).
 */

const commands = [startwork, endwork, status].map((mod) => mod.data.toJSON());

const rest = new REST().setToken(env.discordToken);

async function main() {
  try {
    console.log(`⏳ Mendaftarkan ${commands.length} slash command...`);

    await rest.put(
      Routes.applicationGuildCommands(env.discordClientId, env.discordGuildId),
      { body: commands }
    );

    console.log("✅ Slash command berhasil didaftarkan ke server.");
  } catch (error) {
    console.error("❌ Gagal mendaftarkan slash command:", error);
    process.exit(1);
  }
}

main();
