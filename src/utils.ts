import { Context } from "@actions/github/lib/context";
import { context, getOctokit } from "@actions/github";

export type Octokit = ReturnType<typeof getOctokit>;

export function interpretConfig(contents: string): Record<string, string> {
  return contents.split("\n").reduce((rules, line) => {
    const firstSpaceIndex = line.trim().indexOf(" ");
    return {
      ...rules,
      [line.substring(0, firstSpaceIndex)]: line.substring(firstSpaceIndex + 1),
    };
  }, {});
}

export async function getChangedFileNames(
  octokit: Octokit,
  prNumber: number
): Promise<Array<string>> {
  const response: any = await octokit.rest.pulls.listFiles({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });
  return response.data.map((files: { filename: string }) => files.filename);
}

export async function getPRReviews(
  octokit: Octokit,
  prNumber: number
): Promise<any> {
  const response: any = await octokit.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return response.data
    .filter(({ state }: { state: string }) => state === "APPROVED")
    .map(({ user }: { user: { login: string } }) => user.login);
}

export async function getConfigFile(
  octokit: Octokit,
  defaultBranch: string
): Promise<string> {
  const response: any = await octokit.rest.repos.getContent({
    owner: context.repo.owner,
    repo: context.repo.repo,
    path: "codeowners-plus-plus",
    ref: defaultBranch,
  });

  return Buffer.from(response.data.content, response.data.encoding).toString();
}

export function getPrNumber(context: Context): number {
  if (context.payload.pull_request?.number) {
    return context.payload.pull_request.number;
  }

  throw "action doesn't have any PR associated with it";
}

export const getDefaultBranch = (context: Context): string =>
  context.payload.repository?.default_branch;
