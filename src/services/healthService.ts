import { supabase } from "../config/supabaseClient";

const SUPABASE_TIMEOUT_MS = 5000;

export interface SupabaseHealth {
  ok: boolean;
  latencyMs: number;
  message: string;
}

class HealthService {
  /**
   * Cek apakah Supabase bisa dijangkau dengan query ringan.
   * Sengaja pakai timeout supaya /health tidak menggantung kalau jaringan lambat.
   */
  async checkSupabase(): Promise<SupabaseHealth> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

    try {
      const { error } = await supabase
        .from("users")
        .select("id")
        .limit(1)
        .abortSignal(controller.signal);

      const latencyMs = Date.now() - startedAt;

      if (error) {
        return { ok: false, latencyMs, message: error.message };
      }
      return { ok: true, latencyMs, message: "Terhubung" };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message = controller.signal.aborted
        ? `Timeout setelah ${SUPABASE_TIMEOUT_MS / 1000} detik`
        : (error as Error).message;
      return { ok: false, latencyMs, message };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const healthService = new HealthService();
