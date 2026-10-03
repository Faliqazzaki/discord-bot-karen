import { reportRepository } from "../repositories/reportRepository";
import { ReportSummary } from "../types/report";

class ReportService {
  private async buildSummary(guildId: string, since: Date | null, periodLabel: string): Promise<ReportSummary> {
    const [workStats, githubStats] = await Promise.all([
      reportRepository.getWorkStatsSince(guildId, since),
      reportRepository.getGithubStatsSince(since),
    ]);

    workStats.sort((a, b) => b.totalDurationMs - a.totalDurationMs);
    githubStats.sort((a, b) => b.commitCount - a.commitCount);

    return {
      periodLabel,
      since,
      workStats,
      githubStats,
      totalCommits: githubStats.reduce((sum, s) => sum + s.commitCount, 0),
      totalPullRequests: githubStats.reduce((sum, s) => sum + s.pullRequestCount, 0),
    };
  }

  async getDailyReport(guildId: string): Promise<ReportSummary> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    return this.buildSummary(guildId, since, "Hari ini");
  }

  async getWeeklyReport(guildId: string): Promise<ReportSummary> {
    const since = new Date();
    since.setDate(since.getDate() - 7);
    return this.buildSummary(guildId, since, "7 hari terakhir");
  }

  async getMyStats(guildId: string, discordUserId: string): Promise<ReportSummary> {
    const workStats = await reportRepository.getWorkStatsSince(guildId, null);
    const mine = workStats.filter((s) => s.discordUserId === discordUserId);

    return {
      periodLabel: "Sepanjang waktu",
      since: null,
      workStats: mine,
      githubStats: [],
      totalCommits: 0,
      totalPullRequests: 0,
    };
  }

  async getTeamStats(guildId: string): Promise<ReportSummary> {
    return this.buildSummary(guildId, null, "Sepanjang waktu");
  }
}

export const reportService = new ReportService();