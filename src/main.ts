import {
  getInput,
  error as logError,
  setFailed,
  info as logInfo,
} from "@actions/core";
import { context, getOctokit } from "@actions/github";
import CodeOwnersConfig from "./lib/CodeOwnersConfig";
import {
  getChangedFileNames,
  getConfigFile,
  getDefaultBranch,
  getPrNumber,
  getPRReviews,
  interpretConfig,
} from "./utils";

async function run(): Promise<void> {
  try {
    const defaultBranch = getDefaultBranch(context);
    logInfo(`Got default branch for the repo: ${defaultBranch}`);

    const authToken = getInput("token");

    const octokit = getOctokit(authToken);

    const configFileContents = await getConfigFile(octokit, defaultBranch);
    logInfo(`fetched config file contents `);

    const prNumber = getPrNumber(context);
    logInfo(`Got PR number of current pull request ${prNumber}`);

    const approvers = await getPRReviews(octokit, prNumber);
    logInfo(`fetched the list of PR approvers`);

    const changedFileNames = await getChangedFileNames(octokit, prNumber);
    logInfo(`fetched the name of changed files`);

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

run();
