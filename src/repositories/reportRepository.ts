import { supabase } from "../config/supabaseClient";
import { serverRepository } from "./serverRepository";
import { UserWorkStat, GithubUserStat } from "../types/report";

class ReportRepository {
  async getWorkStatsSince(discordGuildId: string, since: Date | null): Promise<UserWorkStat[]> {
    const server = await serverRepository.upsert(discordGuildId);

    let query = supabase
      .from("work_sessions")
      .select("started_at, ended_at, duration_ms, status, users(discord_user_id)")
      .eq("server_id", server.id);

    if (since) {
      query = query.gte("started_at", since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Gagal ambil work stats: ${error.message}`);

    const now = Date.now();
    const map = new Map<string, UserWorkStat>();

    for (const row of (data ?? []) as any[]) {
      const discordUserId: string | undefined = row.users?.discord_user_id;
      if (!discordUserId) continue;

      const durationMs: number =
        row.duration_ms ?? (row.status === "active" ? now - new Date(row.started_at).getTime() : 0);

      const existing = map.get(discordUserId);
      if (existing) {
        existing.totalDurationMs += durationMs;
        existing.sessionCount += 1;
      } else {
        map.set(discordUserId, { discordUserId, totalDurationMs: durationMs, sessionCount: 1 });
      }
    }

    return Array.from(map.values());
  }

  async getGithubStatsSince(since: Date | null): Promise<GithubUserStat[]> {
    let commitQuery = supabase.from("commits").select("author_username");
    if (since) commitQuery = commitQuery.gte("committed_at", since.toISOString());
    const { data: commitRows, error: commitError } = await commitQuery;
    if (commitError) throw new Error(`Gagal ambil commit stats: ${commitError.message}`);

    let prQuery = supabase.from("pull_requests").select("author_username, is_merged");
    if (since) prQuery = prQuery.gte("github_created_at", since.toISOString());
    const { data: prRows, error: prError } = await prQuery;
    if (prError) throw new Error(`Gagal ambil PR stats: ${prError.message}`);

    const map = new Map<string, GithubUserStat>();
    const ensure = (username: string): GithubUserStat => {
      let entry = map.get(username);
      if (!entry) {
        entry = { githubUsername: username, commitCount: 0, pullRequestCount: 0, mergedPullRequestCount: 0 };
        map.set(username, entry);
      }
      return entry;
    };

    for (const row of (commitRows ?? []) as any[]) {
      ensure(row.author_username ?? "(tidak diketahui)").commitCount += 1;
    }

    for (const row of (prRows ?? []) as any[]) {
      const entry = ensure(row.author_username ?? "(tidak diketahui)");
      entry.pullRequestCount += 1;
      if (row.is_merged) entry.mergedPullRequestCount += 1;
    }

    return Array.from(map.values());
  }
}

export const reportRepository = new ReportRepository();