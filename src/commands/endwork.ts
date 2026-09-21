import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { workSessionService, WorkSessionError } from "../services/workSessionService";
import { permissionService, PermissionError } from "../services/permissionService";
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

  try {
    // 1. Validasi + tutup session dulu.
    const session = workSessionService.endSession(member.id, interaction.guild.id);

    // 2. Baru cabut akses Focus Room.
    await permissionService.revokeFocusRoomAccess(member);

    const durationText = session.durationMs
      ? formatDuration(session.durationMs)
      : "0d";

    await interaction.reply({
      content:
        `🛑 Work session selesai. Total durasi: **${durationText}**.\n` +
        `Akses Focus Room sudah dicabut. Kerja bagus!`,
      ephemeral: false,
    });
  } catch (error) {
    if (error instanceof WorkSessionError || error instanceof PermissionError) {
      await interaction.reply({ content: `⚠️ ${error.message}`, ephemeral: true });
      return;
    }
    console.error("[endwork] Unexpected error:", error);
    await interaction.reply({
      content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin.",
      ephemeral: true,
    });
  }
}
