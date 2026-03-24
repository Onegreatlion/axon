interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  open_issues_count: number;
  updated_at: string;
  private: boolean;
}

interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  labels: { name: string }[];
  user: { login: string };
  body: string | null;
}

interface GitHubPR {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: { login: string };
  head: { ref: string };
  base: { ref: string };
  body: string | null;
  mergeable: boolean | null;
  draft: boolean;
}

interface GitHubNotification {
  id: string;
  reason: string;
  subject: { title: string; type: string; url: string };
  repository: { full_name: string };
  updated_at: string;
  unread: boolean;
}

export async function listRepos(
  accessToken: string,
  maxResults: number = 10
): Promise<GitHubRepo[]> {
  const res = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const repos = await res.json();
  return repos.map((r: any) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    description: r.description,
    html_url: r.html_url,
    language: r.language,
    stargazers_count: r.stargazers_count,
    open_issues_count: r.open_issues_count,
    updated_at: r.updated_at,
    private: r.private,
  }));
}

export async function listIssues(
  accessToken: string,
  repo: string,
  state: string = "open",
  maxResults: number = 10
): Promise<GitHubIssue[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues?state=${state}&per_page=${maxResults}&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const issues = await res.json();
  return issues
    .filter((i: any) => !i.pull_request)
    .map((i: any) => ({
      id: i.id,
      number: i.number,
      title: i.title,
      state: i.state,
      html_url: i.html_url,
      created_at: i.created_at,
      updated_at: i.updated_at,
      labels: i.labels.map((l: any) => ({ name: l.name })),
      user: { login: i.user.login },
      body: i.body,
    }));
}

export async function listPullRequests(
  accessToken: string,
  repo: string,
  state: string = "open",
  maxResults: number = 10
): Promise<GitHubPR[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/pulls?state=${state}&per_page=${maxResults}&sort=updated`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const prs = await res.json();
  return prs.map((p: any) => ({
    id: p.id,
    number: p.number,
    title: p.title,
    state: p.state,
    html_url: p.html_url,
    created_at: p.created_at,
    updated_at: p.updated_at,
    user: { login: p.user.login },
    head: { ref: p.head.ref },
    base: { ref: p.base.ref },
    body: p.body,
    mergeable: p.mergeable,
    draft: p.draft,
  }));
}

export async function getNotifications(
  accessToken: string,
  maxResults: number = 10
): Promise<GitHubNotification[]> {
  const res = await fetch(
    `https://api.github.com/notifications?per_page=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const notifications = await res.json();
  return notifications.map((n: any) => ({
    id: n.id,
    reason: n.reason,
    subject: {
      title: n.subject.title,
      type: n.subject.type,
      url: n.subject.url,
    },
    repository: { full_name: n.repository.full_name },
    updated_at: n.updated_at,
    unread: n.unread,
  }));
}

export async function createIssue(
  accessToken: string,
  repo: string,
  title: string,
  body?: string,
  labels?: string[]
): Promise<GitHubIssue> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, body, labels }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`GitHub create issue error: ${JSON.stringify(error)}`);
  }

  const issue = await res.json();
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state,
    html_url: issue.html_url,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
    labels: issue.labels.map((l: any) => ({ name: l.name })),
    user: { login: issue.user.login },
    body: issue.body,
  };
}

export async function addComment(
  accessToken: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<{ id: number; html_url: string }> {
  const res = await fetch(
    `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`GitHub comment error: ${JSON.stringify(error)}`);
  }

  const comment = await res.json();
  return { id: comment.id, html_url: comment.html_url };
}
