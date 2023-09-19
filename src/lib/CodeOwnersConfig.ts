import { keys, omit } from "lodash";
import { minimatch } from "minimatch";
import { Octokit } from "../utils";
import CodeOwnerRuleStatement from "./CodeOwnerRuleStatement";

export default class CodeOwnersConfig {
  config: Record<string, CodeOwnerRuleStatement>;
  approvers: Array<string>;

  constructor(
    config: Record<string, string>,
    approvers: Array<string>,
    changedPaths: Array<string>,
    octokit: Octokit
  ) {
    this.approvers = approvers;
    this.config = this.getConfigForAffectedRules(config, changedPaths, octokit);
  }

  async isSatisfied(): Promise<boolean> {
    const ruleSatisfactions = await Promise.all(
      Object.keys(this.config).map(async (pathPattern) => {
        const evaluation = await this.config[pathPattern].evaluate();
        return evaluation;
      })
    );
    return ruleSatisfactions.every(Boolean);
  }

  private getConfigForAffectedRules(
    config: Record<string, string>,
    changedPaths: Array<string>,
    octokit: Octokit
  ): Record<string, CodeOwnerRuleStatement> {
    let affectedRules: Record<string, CodeOwnerRuleStatement> = {};
    if (config["*"] && changedPaths.length > 0) {
      affectedRules["*"] = new CodeOwnerRuleStatement(
        config["*"],
        this.approvers,
        octokit
      );
    }

    const patternInRules = keys(omit(config, "*"));
    changedPaths.forEach((filePath) => {
      let currentAffectedRule: string | undefined = undefined;
      patternInRules.forEach((pattern) => {
        if (minimatch(filePath, pattern)) currentAffectedRule = pattern;
      });

      if (currentAffectedRule) {
        affectedRules[currentAffectedRule] = new CodeOwnerRuleStatement(
          config[currentAffectedRule],
          this.approvers,
          octokit
        );
      }
    });

    return affectedRules;
  }
}
