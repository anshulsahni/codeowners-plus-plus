import CodeOwner from "./CodeOwner";

export default class CodeOwnerRuleStatement {
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

export type Statement = Array<
  CodeOwner | ((result: boolean, codeOwner: CodeOwner) => boolean)
>;
