import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { reportService } from "../services/reportService";
import { formatReportSummary } from "../utils/formatReport";

export const data = new SlashCommandBuilder()
  .setName("dailyreport")
  .setDescription("Lihat ringkasan aktivitas tim hari ini");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Command ini hanya bisa dipakai di dalam server, bukan DM.", ephemeral: true });
    return;
  }
  await interaction.deferReply();
  try {
    const summary = await reportService.getDailyReport(interaction.guild.id);
    await interaction.editReply({ content: formatReportSummary(summary) });
  } catch (error) {
    console.error("[dailyreport] Unexpected error:", error);
    await interaction.editReply({ content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin." });
  }
}