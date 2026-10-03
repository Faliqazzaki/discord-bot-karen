export interface UserWorkStat {
    discordUserId: string;
    totalDurationMs: number;
    sessionCount: number;
}

export interface GithubUserStat {
    githubUsername: string;
    commitCount: number;
    pullRequestCount: number;
    mergedPullRequestCount: number;
}

export interface ReportSummary {
    periodLabel: string;
    since: Date | null;
    workStats: UserWorkStat[];
    githubStats: GithubUserStat[];
    totalCommits: number;
    totalPullRequests: number;
}