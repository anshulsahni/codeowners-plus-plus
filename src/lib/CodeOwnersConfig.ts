import { keys, omit } from "lodash";
import { minimatch } from "minimatch";
import CodeOwnerRuleStatement from "./CodeOwnerRuleStatement";

export default class CodeOwnersConfig {
  config: Record<string, CodeOwnerRuleStatement>;
  approvers: Array<string>;

  constructor(
    config: Record<string, string>,
    approvers: Array<string>,
    changedPaths: Array<string>
  ) {
    this.approvers = approvers;
    this.config = this.getConfigForAffectedRules(config, changedPaths);
  }

  isSatisfied(): boolean {
    return Object.keys(this.config).every((pathPattern) => {
      this.config[pathPattern].evaluate();
    });
  }

  private getConfigForAffectedRules(
    config: Record<string, string>,
    changedPaths: Array<string>
  ): Record<string, CodeOwnerRuleStatement> {
    let affectedRules: Record<string, CodeOwnerRuleStatement> = {};
    if (config["*"] && changedPaths.length > 0) {
      affectedRules["*"] = new CodeOwnerRuleStatement(
        config["*"],
        this.approvers
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
          this.approvers
        );
      }
    });

    return affectedRules;
  }
}
