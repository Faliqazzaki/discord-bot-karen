import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { reportService } from "../services/reportService";
import { aiService, AIServiceError } from "../services/aiService";
import { formatReportSummary } from "../utils/formatReport";

export const data = new SlashCommandBuilder()
  .setName("weeklyreport")
  .setDescription("Lihat ringkasan aktivitas tim 7 hari terakhir");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild) {
    await interaction.reply({ content: "Command ini hanya bisa dipakai di dalam server, bukan DM.", ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const summary = await reportService.getWeeklyReport(interaction.guild.id);
    const objectiveText = formatReportSummary(summary);

    let aiSection: string;
    try {
      const aiSummary = await aiService.summarizeReport(summary, "mingguan");
      aiSection = `\n\n**🤖 Ringkasan AI:**\n${aiSummary}`;
    } catch (error) {
      const reason = error instanceof AIServiceError ? error.message : "kesalahan tak terduga";
      console.warn("[weeklyreport] AI summary gagal dibuat:", reason);
      aiSection = `\n\n_🤖 Ringkasan AI tidak tersedia saat ini (${reason})._`;
    }

    await interaction.editReply({ content: objectiveText + aiSection });
  } catch (error) {
    console.error("[weeklyreport] Unexpected error:", error);
    await interaction.editReply({ content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin." });
  }
}