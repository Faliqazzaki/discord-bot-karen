import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { env } from "../config/env";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Lihat daftar command dan fungsinya");

const COMMAND_GROUPS = [
  {
    name: "⏱️ Work Session",
    value: [
      "`/startwork` — Mulai work session dan dapatkan akses Focus Room.",
      "`/endwork` — Akhiri work session, akses Focus Room dicabut, durasi ditampilkan.",
      "`/status` — Lihat siapa saja yang sedang work session aktif saat ini.",
    ].join("\n"),
  },
  {
    name: "📊 Laporan Tim",
    value: [
      "`/dailyreport` — Ringkasan aktivitas tim hari ini + ringkasan AI.",
      "`/weeklyreport` — Ringkasan aktivitas tim 7 hari terakhir + ringkasan AI.",
    ].join("\n"),
  },
  {
    name: "📈 Statistik",
    value: [
      "`/mystats` — Statistik work session kamu sendiri (sepanjang waktu).",
      "`/teamstats` — Statistik keseluruhan tim (sepanjang waktu).",
    ].join("\n"),
  },
  {
    name: "🤖 Otomatis",
    value:
      `Work session yang aktif lebih dari **${env.autoEndworkMaxHours} jam** akan ditutup otomatis ` +
      "dan akses Focus Room dicabut, supaya data tidak menumpuk kalau lupa `/endwork`.",
  },
  {
    name: "❓ Bantuan & Debug",
    value: [
      "`/help` — Tampilkan pesan bantuan ini.",
      "`/health` — Cek latensi Discord, koneksi Supabase, dan konfigurasi AI.",
      "`/about` — Info versi bot, uptime, dan link repository.",
    ].join("\n"),
  },
];

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("📖 Daftar Command TA Workspace Bot")
    .setDescription(
      "Semua command di bawah ini adalah slash command — ketik `/` di Discord lalu pilih namanya."
    )
    .addFields(COMMAND_GROUPS)
    .setFooter({ text: "TA Workspace Bot • Phase 1" });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
