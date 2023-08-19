import { getInput, error as logError, setFailed } from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";
import { CodeOwnersConfig } from "./CodeOwnersEval";

type Octokit = ReturnType<typeof getOctokit>;

async function run(): Promise<void> {
  try {
    const defaultBranch = getDefaultBranch(context);
    const authToken = getInput("token");
    const octokit = getOctokit(authToken);

    const configFileContents = await getConfigFile(octokit, defaultBranch);

    const prNumber = getPrNumber(context);
    const changedFileNames = await getChangedFileNames(octokit, prNumber);

    const approvers = await getPRReviews(octokit, prNumber);
    const rules = interpretConfig(configFileContents);

    const codeownersConfig = new CodeOwnersConfig(
      rules,
      approvers,
      changedFileNames
    );

    if (!codeownersConfig.isSatisfied()) {
      setFailed(
        "action codeowners-plus-plus failed because approvals from codeowners are not enought"
      );
    }
  } catch (error) {
    logError(error as string);
    setFailed(error as string);
  }
}

function isValidAction(): boolean {
  return true;
}

function getDefaultBranch(context: Context): string {
  return context.payload.repository?.default_branch;
}

async function getConfigFile(
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

async function getPRReviews(octokit: Octokit, prNumber: number): Promise<any> {
  const response: any = await octokit.rest.pulls.listReviews({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  return response.data
    .filter(({ state }: { state: string }) => state === "APPROVED")
    .map(({ user }: { user: { login: string } }) => user.login);
}

function getPrNumber(context: Context): number {
  if (context.payload.pull_request?.number) {
    return context.payload.pull_request.number;
  }

  throw "action doesn't have any PR associated with it";
}

function interpretConfig(contents: string): Record<string, string> {
  return contents.split("\n").reduce((rules, line) => {
    const firstSpaceIndex = line.indexOf(" ");
    return {
      ...rules,
      [line.substring(0, firstSpaceIndex)]: line.substring(firstSpaceIndex + 1),
    };
  }, {});
}

async function getChangedFileNames(
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



run();
