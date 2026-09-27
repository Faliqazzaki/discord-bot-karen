import { githubRepository } from "../repositories/githubRepository";
import { CommitInput, PullRequestInput } from "../types/github";
import { env } from "../config/env";

const GITHUB_API_BASE = "https://api.github.com";

interface CommitStats {
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
}

class GithubService {
  private githubApiWarningLogged = false;

  private async fetchCommitStats(repository: string, sha: string): Promise<CommitStats> {
    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "ta-workspace-bot",
      };
      if (env.githubToken) {
        headers.Authorization = `Bearer ${env.githubToken}`;
      } else if (!this.githubApiWarningLogged) {
        console.warn(
          "[githubService] GITHUB_TOKEN tidak diset -- REST API dipanggil tanpa autentikasi " +
            "(limit 60 request/jam, dan repo privat tidak akan bisa diakses)."
        );
        this.githubApiWarningLogged = true;
      }

      const response = await fetch(`${GITHUB_API_BASE}/repos/${repository}/commits/${sha}`, { headers });

      if (!response.ok) {
        console.warn(`[githubService] Gagal ambil stats commit ${sha} (HTTP ${response.status}).`);
        return { additions: null, deletions: null, changedFiles: null };
      }

      const data = (await response.json()) as any;
      return {
        additions: data.stats?.additions ?? null,
        deletions: data.stats?.deletions ?? null,
        changedFiles: Array.isArray(data.files) ? data.files.length : null,
      };
    } catch (error) {
      console.warn(`[githubService] Error saat fetch stats commit ${sha}:`, error);
      return { additions: null, deletions: null, changedFiles: null };
    }
  }

  async handlePushEvent(payload: any): Promise<number> {
    const repository = payload.repository?.full_name;
    const branch = (payload.ref as string | undefined)?.replace("refs/heads/", "");
    const commits = payload.commits ?? [];

    if (!repository || !branch || commits.length === 0) return 0;

    let savedCount = 0;
    for (const commit of commits) {
      const stats = await this.fetchCommitStats(repository, commit.id);
      const input: CommitInput = {
        repository,
        branch,
        commitSha: commit.id,
        message: commit.message,
        authorName: commit.author?.name ?? "unknown",
        authorUsername: commit.author?.username ?? null,
        authorEmail: commit.author?.email ?? null,
        url: commit.url,
        additions: stats.additions,
        deletions: stats.deletions,
        changedFiles: stats.changedFiles,
        committedAt: new Date(commit.timestamp),
      };
      await githubRepository.saveCommit(input);
      savedCount++;
    }
    return savedCount;
  }

  async handlePullRequestEvent(payload: any): Promise<void> {
    const pr = payload.pull_request;
    const repository = payload.repository?.full_name;
    if (!pr || !repository) return;

    const input: PullRequestInput = {
      repository,
      prNumber: pr.number,
      title: pr.title,
      authorUsername: pr.user?.login ?? null,
      action: payload.action,
      isMerged: Boolean(pr.merged),
      baseBranch: pr.base?.ref ?? "",
      headBranch: pr.head?.ref ?? "",
      additions: pr.additions ?? null,
      deletions: pr.deletions ?? null,
      changedFiles: pr.changed_files ?? null,
      url: pr.html_url,
      githubCreatedAt: new Date(pr.created_at),
      githubUpdatedAt: new Date(pr.updated_at),
    };

    await githubRepository.upsertPullRequest(input);
  }
}

export const githubService = new GithubService();