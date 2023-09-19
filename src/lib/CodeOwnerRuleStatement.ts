import { isTeamOrIndividual, Octokit } from "../utils";
import { CodeOwner } from "./CodeOwner";

type Operator = (result: boolean, codeOwner: CodeOwner) => boolean;
export type Statement = Array<CodeOwner | Operator>;

export default class CodeOwnerRuleStatement {
  statementString: string;
  approvers: Array<string>;
  octokit: Octokit;
  statement: null | Statement;
  constructor(
    statementString: string,
    approvers: Array<string>,
    octokit: Octokit
  ) {
    this.approvers = approvers;
    this.statementString = statementString;
    this.octokit = octokit;
    this.statement = null;
  }
  async evaluate(): Promise<boolean> {
    const statement: Statement = await this.statementStringToObj(
      this.statementString,
      this.octokit
    );
    let result = true;
    for (let i = 0; i < statement.length; i++) {
      const statementPiece = statement[i];
      if (
        typeof (statementPiece as CodeOwner).isCodeOwnerApprover === "function"
      ) {
        result = (statementPiece as CodeOwner).isCodeOwnerApprover(
          this.approvers
        );
      } else {
        result = (statementPiece as Operator).call(
          this,
          result,
          statement[++i] as CodeOwner
        );
      }
    }

    return result;
  }

  private and(result: boolean, codeOwner: CodeOwner): boolean {
    return result && codeOwner.isCodeOwnerApprover(this.approvers);
  }

  private or(result: boolean, codeOwner: CodeOwner): boolean {
    return result || codeOwner.isCodeOwnerApprover(this.approvers);
  }

  private async statementStringToObj(
    statementString: string,
    octokit: Octokit
  ): Promise<Statement> {
    const statement: Statement = [];
    for await (const statementPiece of statementString.split(" ")) {
      if (statementPiece.startsWith("@")) {
        statement.push(
          await isTeamOrIndividual(octokit, statementPiece.substring(1))
        );
      } else if (statementPiece === "&&") {
        statement.push(this.and);
      } else if (statementPiece === "||") {
        statement.push(this.or);
      } else {
        throw new Error(
          `Invalid symbol ${statementPiece} in owner rule statement`
        );
      }
    }

    return statement;
  }
}
