import { Client, EmbedBuilder, Guild, GuildMember } from "discord.js";
import { env } from "../config/env";
import { workSessionService } from "../services/workSessionService";
import { permissionService } from "../services/permissionService";
import { WorkSessionSummary } from "../types/session";
import { formatDuration } from "../utils/duration";

/**
 * Auto-endwork job.
 *
 * Kenapa perlu: kalau user lupa /endwork, session-nya tetap "active" selamanya.
 * Akibatnya data session menumpuk, /status jadi ramai, dan akses Focus Room
 * tidak pernah dicabut. Job ini menutup session yang sudah berjalan melewati
 * batas maksimum (default 8 jam) secara berkala.
 *
 * Catatan: batas durasi dihitung dari `started_at`, bukan dari "terakhir aktif",
 * karena bot tidak melacak aktivitas user secara real-time.
 */

const MAX_DURATION_MS = env.autoEndworkMaxHours * 60 * 60 * 1000;
const INTERVAL_MS = env.autoEndworkCheckIntervalMinutes * 60 * 1000;

let isRunning = false;

function buildNoticeEmbed(session: WorkSessionSummary): EmbedBuilder {
  const durationText = formatDuration(session.durationMs ?? Date.now() - session.startedAt.getTime());
  return new EmbedBuilder()
    .setColor(0xfaa61a)
    .setTitle("⏰ Work session ditutup otomatis")
    .setDescription(
      `Sesi kerja yang kamu mulai <t:${Math.floor(session.startedAt.getTime() / 1000)}:f> ` +
        `sudah berjalan **${durationText}**, melewati batas maksimum ` +
        `**${env.autoEndworkMaxHours} jam**.\n\n` +
        `Sesi sudah ditutup otomatis dan akses Focus Room dicabut. ` +
        `Kalau kamu memang masih bekerja, silakan jalankan \`/startwork\` lagi.`
    )
    .setFooter({ text: "TA Workspace Bot • Auto-endwork" });
}

async function notifyStaleUser(member: GuildMember, guild: Guild, session: WorkSessionSummary): Promise<void> {
  const embed = buildNoticeEmbed(session);

  try {
    await member.user.send({ embeds: [embed] });
    return;
  } catch (error) {
    console.warn(
      `[autoEndwork] Gagal kirim DM ke ${member.user.tag}, fallback ke system channel:`,
      (error as Error).message
    );
  }

  if (!guild.systemChannel) return;

  try {
    await guild.systemChannel.send({
      content: `<@${member.id}> sesi kerjanya ditutup otomatis karena melewati batas ${env.autoEndworkMaxHours} jam.`,
      embeds: [embed],
      allowedMentions: { users: [member.id] },
    });
  } catch (error) {
    console.warn(`[autoEndwork] Gagal kirim notifikasi di channel ${guild.name}:`, (error as Error).message);
  }
}

async function handleStaleSession(client: Client, session: WorkSessionSummary): Promise<void> {
  // Tutup dulu. Kalau user ternyata sudah /endwork duluan, hasilnya null dan
  // kita tidak perlu mencabut role / mengirim notifikasi lagi.
  const closed = await workSessionService.closeSessionIfActive(session.id);
  if (!closed) return;

  const durationText = formatDuration(closed.durationMs ?? 0);
  console.log(
    `[autoEndwork] Session ${closed.id} milik user ${closed.userId} ditutup otomatis (durasi ${durationText}).`
  );

  const guild = client.guilds.cache.get(closed.guildId);
  if (!guild) {
    console.warn(`[autoEndwork] Guild ${closed.guildId} tidak ditemukan, role Focus Room tidak dicabut.`);
    return;
  }

  let member: GuildMember | null = null;
  try {
    member = await guild.members.fetch(closed.userId);
  } catch {
    console.warn(`[autoEndwork] Member ${closed.userId} sudah tidak ada di guild ${guild.name}.`);
  }

  if (member) {
    try {
      await permissionService.revokeFocusRoomAccess(member);
    } catch (error) {
      console.error(`[autoEndwork] Gagal mencabut Focus Room dari ${member.user.tag}:`, (error as Error).message);
    }

    await notifyStaleUser(member, guild, closed);
  }
}

async function runAutoEndwork(client: Client): Promise<void> {
  // Cegah pengecekan bertumpuk kalau query Supabase lebih lama dari interval.
  if (isRunning) return;
  isRunning = true;

  try {
    const staleSessions = await workSessionService.getStaleActiveSessions(MAX_DURATION_MS);
    if (staleSessions.length === 0) return;

    console.log(
      `[autoEndwork] Ditemukan ${staleSessions.length} session aktif > ${env.autoEndworkMaxHours} jam. Menutup...`
    );

    for (const session of staleSessions) {
      try {
        await handleStaleSession(client, session);
      } catch (error) {
        console.error(`[autoEndwork] Gagal memproses session ${session.id}:`, error);
      }
    }
  } catch (error) {
    console.error("[autoEndwork] Gagal menjalankan pengecekan:", error);
  } finally {
    isRunning = false;
  }
}

export function startAutoEndworkJob(client: Client): void {
  client.once("ready", () => {
    console.log(
      `⏰ Auto-endwork aktif: batas ${env.autoEndworkMaxHours} jam, cek tiap ${env.autoEndworkCheckIntervalMinutes} menit.`
    );

    void runAutoEndwork(client);

    const timer = setInterval(() => void runAutoEndwork(client), INTERVAL_MS);
    // Jangan biarkan timer ini menahan proses tetap hidup saat bot di-shutdown.
    timer.unref();
  });
}
