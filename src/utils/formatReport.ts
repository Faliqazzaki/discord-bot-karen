import { ReportSummary } from "../types/report";
import { formatDuration } from "./duration";

const MAX_ROWS = 15;

export function formatReportSummary(summary: ReportSummary): string {
  const workLines = summary.workStats
    .slice(0, MAX_ROWS)
    .map((s) => `• <@${s.discordUserId}> — ${formatDuration(s.totalDurationMs)} (${s.sessionCount}x session)`);

  const githubLines = summary.githubStats
    .slice(0, MAX_ROWS)
    .map(
      (s) =>
        `• ${s.githubUsername} — ${s.commitCount} commit, ${s.pullRequestCount} PR (${s.mergedPullRequestCount} merged)`
    );

  return (
    `**📊 Report: ${summary.periodLabel}**\n\n` +
    `**Work Session:**\n${workLines.length ? workLines.join("\n") : "_Belum ada data._"}\n\n` +
    `**GitHub Activity** (${summary.totalCommits} commit, ${summary.totalPullRequests} PR total):\n` +
    `${githubLines.length ? githubLines.join("\n") : "_Belum ada data._"}\n\n` +
    `_Catatan: GitHub activity belum terhubung ke identitas Discord -- ditampilkan berdasarkan username GitHub._`
  );
}