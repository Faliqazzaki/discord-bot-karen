export interface CommitInput {
  repository: string;
  branch: string;
  commitSha: string;
  message: string;
  authorName: string;
  authorUsername: string | null;
  authorEmail: string | null;
  url: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  committedAt: Date;
}

export interface PullRequestInput {
  repository: string;
  prNumber: number;
  title: string;
  authorUsername: string | null;
  action: string;
  isMerged: boolean;
  baseBranch: string;
  headBranch: string;
  additions: number | null;
  deletions: number | null;
  changedFiles: number | null;
  url: string;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;
}