export type WorkSessionStatus = "active" | "ended";

export interface WorkSession {
  id: string; // uuid sederhana, dibuat saat session dimulai
  userId: string; // Discord user ID
  guildId: string; // Discord server ID (jaga-jaga kalau bot dipakai di >1 server)
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null; // dihitung saat /endwork
  status: WorkSessionStatus;
}

// Bentuk data ringkas yang dikembalikan ke user, dipisah dari entity internal
// supaya command layer tidak bergantung langsung pada struktur repository.
export interface WorkSessionSummary {
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  durationMs: number | null;
  status: WorkSessionStatus;
}
