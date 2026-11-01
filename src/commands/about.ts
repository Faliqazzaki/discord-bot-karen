import fs from "fs";
import path from "path";
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { formatDuration } from "../utils/duration";

const REPO_URL = "https://github.com/Faliqazzaki/discord-bot-karen";

function readVersion(): string {
  try {
    // Di dev: src/commands -> ../../package.json
    // Di build: dist/commands -> ../../package.json
    const packagePath = path.join(__dirname, "..", "..", "package.json");
    const pkg = JSON.parse(fs.readFileSync(packagePath, "utf-8")) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : "unknown";
  } catch (error) {
    console.warn("[about] Gagal membaca versi dari package.json:", (error as Error).message);
    return "unknown";
  }
}

const VERSION = readVersion();

export const data = new SlashCommandBuilder()
  .setName("about")
  .setDescription("Info tentang bot: versi, uptime, dan link repository");

export async function execute(interaction: ChatInputCommandInteraction) {
  const uptimeMs = Math.round(process.uptime() * 1000);

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("ℹ️ Tentang TA Workspace Bot")
    .setDescription("Discord bot untuk workspace produktivitas tim saat mengerjakan TA.")
    .addFields(
      { name: "🏷️ Versi", value: `\`v${VERSION}\``, inline: true },
      { name: "⏱️ Uptime", value: `**${formatDuration(uptimeMs)}**`, inline: true },
      { name: "🔗 Repository", value: `[Faliqazzaki/discord-bot-karen](${REPO_URL})`, inline: true }
    )
    .setFooter({ text: "TA Workspace Bot" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
