import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { workSessionService, WorkSessionError } from "../services/workSessionService";
import { permissionService } from "../services/permissionService";
import { formatDuration } from "../utils/duration";

export const data = new SlashCommandBuilder()
  .setName("endwork")
  .setDescription("Akhiri work session dan cabut akses Focus Room");

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: "Command ini hanya bisa dipakai di dalam server, bukan DM.",
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;

  await interaction.deferReply();

  // 1. Validasi + tutup session dulu. Durasi kerja lebih penting dicatat,
  //    jadi TIDAK di-rollback walau langkah 2 (revoke role) gagal.
  let session;
  try {
    session = workSessionService.endSession(member.id, interaction.guild.id);
  } catch (error) {
    if (error instanceof WorkSessionError) {
      await interaction.editReply({ content: `⚠️ ${error.message}` });
      return;
    }
    console.error("[endwork] Unexpected error saat menutup session:", error);
    await interaction.editReply({
      content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin.",
    });
    return;
  }

  const durationText = session.durationMs ? formatDuration(session.durationMs) : "0d";

  // 2. Cabut akses Focus Room. Kalau gagal, session TETAP dianggap selesai.
  try {
    await permissionService.revokeFocusRoomAccess(member);
  } catch (error) {
    console.error("[endwork] Gagal revoke role (session tetap ditutup):", error);
    await interaction.editReply({
      content:
        `🛑 Work session selesai. Total durasi: **${durationText}**.\n` +
        `⚠️ Tapi gagal mencabut akses Focus Room secara otomatis. ` +
        `Minta admin cabut role Focus Room Access secara manual.`,
    });
    return;
  }

  await interaction.editReply({
    content:
      `🛑 Work session selesai. Total durasi: **${durationText}**.\n` +
      `Akses Focus Room sudah dicabut. Kerja bagus!`,
  });
}