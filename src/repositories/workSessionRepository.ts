import { randomUUID } from "crypto";
import { WorkSession } from "../types/session";

/**
 * Repository ini menyimpan work session di memory (Map), BUKAN database.
 * Sengaja dibuat dengan interface method yang mirip repository berbasis DB
 * (findActiveByUser, create, update, dst) supaya nanti di Phase 2 kita
 * tinggal ganti isi implementasinya ke Supabase tanpa mengubah
 * workSessionService.ts sama sekali.
 *
 * PENTING: karena in-memory, semua data HILANG saat bot restart.
 * Ini expected behavior untuk Phase 1.
 */
class WorkSessionRepository {
  private sessions = new Map<string, WorkSession>();

  /** Cari session yang sedang aktif milik user tertentu di guild tertentu. */
  findActiveByUser(userId: string, guildId: string): WorkSession | undefined {
    for (const session of this.sessions.values()) {
      if (
        session.userId === userId &&
        session.guildId === guildId &&
        session.status === "active"
      ) {
        return session;
      }
    }
    return undefined;
  }

  /** Ambil semua session yang statusnya masih aktif di suatu guild. */
  findAllActive(guildId: string): WorkSession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.guildId === guildId && s.status === "active"
    );
  }

  create(userId: string, guildId: string): WorkSession {
    const session: WorkSession = {
      id: randomUUID(),
      userId,
      guildId,
      startedAt: new Date(),
      endedAt: null,
      durationMs: null,
      status: "active",
    };
    this.sessions.set(session.id, session);
    return session;
  }

  /**
   * Hapus session sepenuhnya dari memory. Dipakai untuk rollback --
   * saat session berhasil dibuat tapi langkah berikutnya (grant role)
   * gagal, jadi session "setengah jadi" ini tidak boleh dianggap valid.
   */
  remove(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /** Tutup session: set endedAt, durationMs, dan status jadi "ended". */
  close(sessionId: string): WorkSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session dengan id ${sessionId} tidak ditemukan.`);
    }
    const endedAt = new Date();
    const updated: WorkSession = {
      ...session,
      endedAt,
      durationMs: endedAt.getTime() - session.startedAt.getTime(),
      status: "ended",
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }
}

// Singleton: satu instance dipakai di seluruh aplikasi selama proses berjalan.
export const workSessionRepository = new WorkSessionRepository();
