import { omit, keys } from "lodash";
import { minimatch } from "minimatch";
import path from "path";

export class CodeOwnersConfig {
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

class CodeOwner {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
}

type Statement = Array<
  CodeOwner | ((result: boolean, codeOwner: CodeOwner) => boolean)
>;

class CodeOwnerRuleStatement {
  statement: Statement;
  approvers: Array<string>;
  constructor(statementString: string, approvers: Array<string>) {
    this.approvers = approvers;
    this.statement = this.statementStringToObj(statementString);
  }

  evaluate(): boolean {
    let result: boolean = false;

    for (let i = 0; i < this.statement.length; i++) {
      const statementPiece = this.statement[i];
      if (statementPiece instanceof CodeOwner) {
        result = this.isCodeOwnerApprover(statementPiece);
      } else {
        result = statementPiece.call(
          this,
          result,
          this.statement[++i] as CodeOwner
        );
      }
    }

    return result;
  }

  isCodeOwnerApprover(codeOwner: CodeOwner): boolean {
    return this.approvers.includes(codeOwner.userId);
  }

  private and(result: boolean, codeOwner: CodeOwner): boolean {
    return result && this.isCodeOwnerApprover(codeOwner);
  }

  private or(result: boolean, codeOwner: CodeOwner): boolean {
    return result || this.isCodeOwnerApprover(codeOwner);
  }

  private statementStringToObj(statementString: string): Statement {
    const statement: Statement = [];
    statementString.split(" ").forEach((statementPiece) => {
      if (statementPiece.startsWith("@")) {
        statement.push(new CodeOwner(statementPiece.substring(1)));
      } else if (statementPiece === "&&") {
        statement.push(this.and);
      } else if (statementPiece === "||") {
        statement.push(this.or);
      } else {
        throw new Error(
          `Invalid symbol ${statementPiece} in owner rule statement`
        );
      }
    });

    return statement;
  }
}
