import { workSessionRepository } from "../repositories/workSessionRepository";
import { WorkSession, WorkSessionSummary } from "../types/session";

export class WorkSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkSessionError";
  }
}

function toSummary(session: WorkSession): WorkSessionSummary {
  return {
    id: session.id,
    userId: session.userId,
    guildId: session.guildId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationMs: session.durationMs,
    status: session.status,
  };
}

class WorkSessionService {
  async startSession(userId: string, guildId: string, username?: string): Promise<WorkSessionSummary> {
    const existing = await workSessionRepository.findActiveByUser(userId, guildId);
    if (existing) {
      throw new WorkSessionError(
        "Kamu sudah punya work session yang sedang aktif. Gunakan `/endwork` dulu sebelum memulai yang baru."
      );
    }
    const session = await workSessionRepository.create(userId, guildId, username);
    return toSummary(session);
  }

  async cancelSession(sessionId: string): Promise<void> {
    await workSessionRepository.remove(sessionId);
  }

  async endSession(userId: string, guildId: string): Promise<WorkSessionSummary> {
    const existing = await workSessionRepository.findActiveByUser(userId, guildId);
    if (!existing) {
      throw new WorkSessionError("Kamu tidak punya work session yang aktif. Mulai dulu dengan `/startwork`.");
    }
    const closed = await workSessionRepository.close(existing.id);
    return toSummary(closed);
  }

  async getActiveSessions(guildId: string): Promise<WorkSessionSummary[]> {
    const sessions = await workSessionRepository.findAllActive(guildId);
    return sessions.map(toSummary);
  }

  /** Session aktif yang durasinya sudah melewati batas (dipakai auto-endwork). */
  async getStaleActiveSessions(maxDurationMs: number): Promise<WorkSessionSummary[]> {
    const sessions = await workSessionRepository.findStaleActive(maxDurationMs);
    return sessions.map(toSummary);
  }

  /**
   * Tutup session berdasarkan id. Kalau ternyata sudah ditutup lebih dulu,
   * hasilnya `null` (bukan error) supaya job bisa lanjut ke session berikutnya.
   */
  async closeSessionIfActive(sessionId: string): Promise<WorkSessionSummary | null> {
    const closed = await workSessionRepository.closeIfActive(sessionId);
    return closed ? toSummary(closed) : null;
  }

  async hasActiveSession(userId: string, guildId: string): Promise<boolean> {
    const existing = await workSessionRepository.findActiveByUser(userId, guildId);
    return existing !== undefined;
  }
}

export const workSessionService = new WorkSessionService();