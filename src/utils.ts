import { Context } from "@actions/github/lib/context";
import { context, getOctokit } from "@actions/github";
import {
  GithubIndividual,
  GithubTeam,
  Individual,
  Team,
} from "./lib/CodeOwner";

export type Octokit = ReturnType<typeof getOctokit>;

export function interpretConfig(contents: string = ""): Record<string, string> {
  return contents.split("\n").reduce((rules, line) => {
    const trimmedLine = line.trim();
    const firstSpaceIndex = trimmedLine.indexOf(" ");
    return {
      ...rules,
      // if trimmed line is not empty, only then assign
      ...(trimmedLine && {
        [trimmedLine.substring(0, firstSpaceIndex)]: trimmedLine.substring(
          firstSpaceIndex + 1
        ),
      }),
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

export async function isTeamOrIndividual(
  octokit: Octokit,
  slug: string
): Promise<Team | Individual> {
  try {
    const user = await octokit.rest.users.getByUsername({
      username: slug,
    });
    return new Individual(user.data as GithubIndividual);
  } catch (error: any) {
    if (error.status === 404) {
      try {
        const githubTeamResponse = await octokit.rest.teams.getByName({
          org: context.payload.organization.login,
          team_slug: slug,
        });
        const membersResponse = await octokit.rest.teams.listMembersInOrg({
          org: context.payload.organization.login,
          team_slug: slug,
        });
        return new Team(
          githubTeamResponse.data as GithubTeam,
          membersResponse.data as Array<GithubIndividual>
        );
      } catch (error: any) {
        throw `Slug - ${slug} is neither associated with a user or a org's team`;
      }
    } else {
      throw `Slug - ${slug} is neither associated with a user or a org's team`;
    }
  }
}

export const getDefaultBranch = (context: Context): string =>
  context.payload.repository?.default_branch;

