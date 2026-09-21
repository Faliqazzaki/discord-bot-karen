import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
} from "discord.js";
import { workSessionService, WorkSessionError } from "../services/workSessionService";
import { permissionService, PermissionError } from "../services/permissionService";

export const data = new SlashCommandBuilder()
  .setName("startwork")
  .setDescription("Mulai work session dan dapatkan akses Focus Room");

export async function execute(interaction: ChatInputCommandInteraction) {
  // Command ini hanya masuk akal dipakai di dalam server, bukan DM.
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: "Command ini hanya bisa dipakai di dalam server, bukan DM.",
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;

  try {
    // 1. Validasi + buat session (business logic ada di service, bukan di sini)
    const session = workSessionService.startSession(
      member.id,
      interaction.guild.id
    );

    // 2. Kalau session berhasil dibuat, baru grant akses Focus Room.
    //    Urutan ini penting: jangan grant akses kalau session gagal dibuat.
    await permissionService.grantFocusRoomAccess(member);

    await interaction.reply({
      content:
        `✅ Work session dimulai pada <t:${Math.floor(
          session.startedAt.getTime() / 1000
        )}:T>.\n` + `Kamu sekarang punya akses ke Focus Room. Selamat bekerja!`,
      ephemeral: false,
    });
  } catch (error) {
    if (error instanceof WorkSessionError || error instanceof PermissionError) {
      await interaction.reply({ content: `⚠️ ${error.message}`, ephemeral: true });
      return;
    }
    // Error tak terduga: jangan bocorkan detail internal ke user
    console.error("[startwork] Unexpected error:", error);
    await interaction.reply({
      content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin.",
      ephemeral: true,
    });
  }
}
