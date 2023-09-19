import {
  getInput,
  error as logError,
  setFailed,
  info as logInfo,
  notice as logNotice,
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
    logInfo(
      `Details of the repository - repo name: ${context.repo.repo}, repo owner: ${context.repo.owner}`
    );

    const defaultBranch = getDefaultBranch(context);
    logInfo(`Got default branch for the repo: ${defaultBranch}`);

    const authToken = getInput("token");
    const octokit = getOctokit(authToken);

    const configFileContents = await getConfigFile(octokit, defaultBranch);
    logInfo(`fetched config file contents`);

    const prNumber = getPrNumber(context);
    logInfo(`got PR number of current pull request ${prNumber}`);

    const approvers = await getPRReviews(octokit, prNumber);
    logInfo(`fetched the list of PR approvers`);

    const changedFileNames = await getChangedFileNames(octokit, prNumber);
    logInfo(`fetched the name of changed files`);

    const rules = interpretConfig(configFileContents);
    logInfo("interpretation of config completed");

    const codeownersConfig = new CodeOwnersConfig(
      rules,
      approvers,
      changedFileNames,
      octokit
    );
    if (!(await codeownersConfig.isSatisfied())) {
      logError(
        "action codeowners-plus-plus failed because approvals from codeowners are not enough"
      );
      setFailed(
        "action codeowners-plus-plus failed because approvals from codeowners are not enough"
      );
    } else {
      logInfo(
        "Pull Request has all required approvals according to codeowners-plus-plus"
      );
      logNotice(
        "Pull Request has all required approvals according to codeowners-plus-plus"
      );
    }
  } catch (error) {
    logError(error as string);
    setFailed(error as string);
  }
}

run();
