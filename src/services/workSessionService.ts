import { workSessionRepository } from "../repositories/workSessionRepository";
import { WorkSession, WorkSessionSummary } from "../types/session";

/**
 * Custom error class supaya command layer bisa membedakan
 * "error karena business rule dilanggar" vs "error teknis tak terduga",
 * dan menampilkan pesan yang sesuai ke user.
 */
export class WorkSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkSessionError";
  }
}

function toSummary(session: WorkSession): WorkSessionSummary {
  return {
    userId: session.userId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    status: session.status,
  };
}

class WorkSessionService {
  /**
   * Mulai work session baru untuk user.
   * Gagal jika user sudah punya session aktif (mencegah double /startwork).
   */
  startSession(userId: string, guildId: string): WorkSessionSummary {
    const existing = workSessionRepository.findActiveByUser(userId, guildId);
    if (existing) {
      throw new WorkSessionError(
        "Kamu sudah punya work session yang sedang aktif. Gunakan `/endwork` dulu sebelum memulai yang baru."
      );
    }
    const session = workSessionRepository.create(userId, guildId);
    return toSummary(session);
  }

  /**
   * Akhiri work session aktif milik user.
   * Gagal jika user tidak punya session aktif.
   */
  endSession(userId: string, guildId: string): WorkSessionSummary {
    const existing = workSessionRepository.findActiveByUser(userId, guildId);
    if (!existing) {
      throw new WorkSessionError(
        "Kamu tidak punya work session yang aktif. Mulai dulu dengan `/startwork`."
      );
    }
    const closed = workSessionRepository.close(existing.id);
    return toSummary(closed);
  }

  /** Ambil daftar semua session yang sedang aktif di suatu guild. */
  getActiveSessions(guildId: string): WorkSessionSummary[] {
    return workSessionRepository.findAllActive(guildId).map(toSummary);
  }

  /** Cek apakah user tertentu sedang punya session aktif. */
  hasActiveSession(userId: string, guildId: string): boolean {
    return workSessionRepository.findActiveByUser(userId, guildId) !== undefined;
  }
}

export const workSessionService = new WorkSessionService();
