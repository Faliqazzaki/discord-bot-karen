import { supabase } from "../config/supabaseClient";
import { userRepository } from "./userRepository";
import { serverRepository } from "./serverRepository";
import { WorkSession, WorkSessionStatus } from "../types/session";

interface WorkSessionRow {
  id: string;
  user_id: string;
  server_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  status: WorkSessionStatus;
}

function mapRow(row: WorkSessionRow): WorkSession {
  return {
    id: row.id,
    userId: row.user_id,
    guildId: row.server_id,
    startedAt: new Date(row.started_at),
    endedAt: row.ended_at ? new Date(row.ended_at) : null,
    durationMs: row.duration_ms,
    status: row.status,
  };
}

class WorkSessionRepository {
  async findActiveByUser(discordUserId: string, discordGuildId: string): Promise<WorkSession | undefined> {
    const user = await userRepository.upsert(discordUserId);
    const server = await serverRepository.upsert(discordGuildId);

    const { data, error } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("server_id", server.id)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw new Error(`Gagal cek session aktif: ${error.message}`);
    return data ? mapRow(data as WorkSessionRow) : undefined;
  }

  async findAllActive(discordGuildId: string): Promise<WorkSession[]> {
    const server = await serverRepository.upsert(discordGuildId);

    const { data, error } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("server_id", server.id)
      .eq("status", "active");

    if (error) throw new Error(`Gagal ambil daftar session aktif: ${error.message}`);
    return (data ?? []).map((row) => mapRow(row as WorkSessionRow));
  }

  async create(discordUserId: string, discordGuildId: string, username?: string): Promise<WorkSession> {
    const user = await userRepository.upsert(discordUserId, username);
    const server = await serverRepository.upsert(discordGuildId);

    const { data, error } = await supabase
      .from("work_sessions")
      .insert({ user_id: user.id, server_id: server.id, status: "active" })
      .select("*")
      .single();

    if (error || !data) throw new Error(`Gagal membuat session baru: ${error?.message}`);
    return mapRow(data as WorkSessionRow);
  }

  async close(sessionId: string): Promise<WorkSession> {
    const { data: existing, error: fetchError } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !existing) throw new Error(`Session dengan id ${sessionId} tidak ditemukan.`);

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - new Date(existing.started_at).getTime();

    const { data, error } = await supabase
      .from("work_sessions")
      .update({ ended_at: endedAt.toISOString(), duration_ms: durationMs, status: "ended" })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error || !data) throw new Error(`Gagal menutup session ${sessionId}: ${error?.message}`);
    return mapRow(data as WorkSessionRow);
  }

  async remove(sessionId: string): Promise<void> {
    const { error } = await supabase.from("work_sessions").delete().eq("id", sessionId);
    if (error) throw new Error(`Gagal menghapus session ${sessionId}: ${error.message}`);
  }
}

export const workSessionRepository = new WorkSessionRepository();