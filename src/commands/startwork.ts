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
  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: "Command ini hanya bisa dipakai di dalam server, bukan DM.",
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;

  await interaction.deferReply();

  // 1. Validasi + buat session dulu (murni in-memory, cepat).
  let session;
  try {
    session = await workSessionService.startSession(member.id, interaction.guild.id, member.user.tag);
  } catch (error) {
    if (error instanceof WorkSessionError) {
      await interaction.editReply({ content: `⚠️ ${error.message}` });
      return;
    }
    console.error("[startwork] Unexpected error saat membuat session:", error);
    await interaction.editReply({
      content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin.",
    });
    return;
  }

  // 2. Baru grant akses Focus Room. Kalau ini gagal, ROLLBACK session yang
  //    barusan dibuat.
  try {
    await permissionService.grantFocusRoomAccess(member);
  } catch (error) {
        try {
          await workSessionService.cancelSession(session.id);
       } catch (rollbackError) {
        console.error("[startwork] Gagal rollback session:", rollbackError);
    }

    if (error instanceof PermissionError) {
      await interaction.editReply({ content: `⚠️ ${error.message}` });
      return;
    }
    console.error("[startwork] Unexpected error saat grant role:", error);
    await interaction.editReply({
      content: "❌ Terjadi kesalahan tak terduga. Coba lagi atau hubungi admin.",
    });
    return;
  }

  await interaction.editReply({
    content:
      `✅ Work session dimulai pada <t:${Math.floor(
        session.startedAt.getTime() / 1000
      )}:T>.\n` + `Kamu sekarang punya akses ke Working Voice. Selamat bekerja!`,
  });
}