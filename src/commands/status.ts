import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { workSessionService } from "../services/workSessionService";
import { formatDuration } from "../utils/duration";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Lihat siapa saja yang sedang work session aktif");

const MAX_LISTED_SESSIONS = 25;

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
  const sorted = [...activeSessions].sort(
    (a, b) => a.startedAt.getTime() - b.startedAt.getTime()
  );

  const shown = sorted.slice(0, MAX_LISTED_SESSIONS);
  const remaining = sorted.length - shown.length;

  const lines = shown.map((s) => {
    const elapsed = formatDuration(now - s.startedAt.getTime());
    return `• <@${s.userId}> — sedang bekerja selama **${elapsed}**`;
  });

  if (remaining > 0) {
    lines.push(`_...dan ${remaining} lainnya._`);
  }

  await interaction.reply({
    content: `**Work session aktif (${activeSessions.length}):**\n${lines.join("\n")}`,
    ephemeral: false,
  });
}