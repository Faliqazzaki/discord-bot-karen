import { supabase } from "../config/supabaseClient";
import { CommitInput, PullRequestInput } from "../types/github";

class GithubRepository {
  async saveCommit(input: CommitInput): Promise<void> {
    const { error } = await supabase.from("commits").upsert(
      {
        repository: input.repository,
        branch: input.branch,
        commit_sha: input.commitSha,
        message: input.message,
        author_name: input.authorName,
        author_username: input.authorUsername,
        author_email: input.authorEmail,
        url: input.url,
        additions: input.additions,
        deletions: input.deletions,
        changed_files: input.changedFiles,
        committed_at: input.committedAt.toISOString(),
      },
      { onConflict: "commit_sha" }
    );

    if (error) throw new Error(`Gagal menyimpan commit ${input.commitSha}: ${error.message}`);
  }

  async upsertPullRequest(input: PullRequestInput): Promise<void> {
    const { error } = await supabase.from("pull_requests").upsert(
      {
        repository: input.repository,
        pr_number: input.prNumber,
        title: input.title,
        author_username: input.authorUsername,
        action: input.action,
        is_merged: input.isMerged,
        base_branch: input.baseBranch,
        head_branch: input.headBranch,
        additions: input.additions,
        deletions: input.deletions,
        changed_files: input.changedFiles,
        url: input.url,
        github_created_at: input.githubCreatedAt.toISOString(),
        github_updated_at: input.githubUpdatedAt.toISOString(),
      },
      { onConflict: "repository,pr_number" }
    );

    if (error) throw new Error(`Gagal menyimpan PR #${input.prNumber} (${input.repository}): ${error.message}`);
  }
}

export const githubRepository = new GithubRepository();