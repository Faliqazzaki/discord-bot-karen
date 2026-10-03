import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { reportService } from "../services/reportService";
import { formatDuration } from "../utils/duration";

export const data = new SlashCommandBuilder()
  .setName("mystats")
  .setDescription("Lihat statistik work session kamu sendiri (sepanjang waktu)");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Command ini hanya bisa dipakai di dalam server, bukan DM.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const summary = await reportService.getMyStats(interaction.guild.id, interaction.user.id);
    const mine = summary.workStats[0];

    if (!mine) {
      await interaction.editReply({ content: "Kamu belum pernah punya work session tercatat." });
      return;
    }

    await interaction.editReply({
      content:
        `**📊 Statistik kamu (${summary.periodLabel}):**\n` +
        `• Total durasi kerja: **${formatDuration(mine.totalDurationMs)}**\n` +
        `• Jumlah session: **${mine.sessionCount}**\n\n` +
        `_GitHub activity pribadi belum bisa ditampilkan -- fitur hubungkan akun GitHub (/linkgithub) belum aktif._`,
    });
  } catch (error) {
    console.error("[mystats] Unexpected error:", error);
    await interaction.editReply({ content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin." });
  }
}