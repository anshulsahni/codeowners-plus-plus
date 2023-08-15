import { omit, keys } from "lodash";
import { minimatch } from "minimatch";

export default class CodeOwnersEval {
  approvers: Array<string>;
  changedPaths: Array<string>;
  codeOwners: Record<string, string>;

  constructor(
    approvers: Array<string>,
    changedPaths: Array<string>,
    codeOwners: Record<string, string>
  ) {
    this.approvers = approvers;
    this.changedPaths = changedPaths;
    this.codeOwners = codeOwners;

    console.log(this.getAffectedRules());
  }

  eval(): boolean {
    return true;
  }

  private getAffectedRules(): Record<string, string> {
    let affectedRules: Record<string, string> = {};
    if (this.codeOwners["*"] && this.changedPaths.length > 0) {
      affectedRules["*"] = this.codeOwners["*"];
    }

    const ownerPatterns = keys(omit(this.codeOwners, "*"));
    this.changedPaths.forEach((filePath) => {
      let currentAffectedRule: string | undefined = undefined;
      ownerPatterns.forEach((pattern) => {
        if (minimatch(filePath, pattern)) currentAffectedRule = pattern;
      });

      if (currentAffectedRule) {
        affectedRules[currentAffectedRule] =
          this.codeOwners[currentAffectedRule];
      }
    });

    return affectedRules;
  }
}
