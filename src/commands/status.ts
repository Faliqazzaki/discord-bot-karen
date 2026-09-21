import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { workSessionService } from "../services/workSessionService";
import { formatDuration } from "../utils/duration";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Lihat siapa saja yang sedang work session aktif");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({
      content: "Command ini hanya bisa dipakai di dalam server, bukan DM.",
      ephemeral: true,
    });
    return;
  }

  const activeSessions = workSessionService.getActiveSessions(interaction.guild.id);

  if (activeSessions.length === 0) {
    await interaction.reply({
      content: "Tidak ada work session yang aktif saat ini.",
      ephemeral: true,
    });
    return;
  }

  const now = Date.now();
  const lines = activeSessions.map((s) => {
    const elapsed = formatDuration(now - s.startedAt.getTime());
    return `• <@${s.userId}> — sedang bekerja selama **${elapsed}**`;
  });

  await interaction.reply({
    content: `**Work session aktif (${activeSessions.length}):**\n${lines.join("\n")}`,
    ephemeral: false,
  });
}
