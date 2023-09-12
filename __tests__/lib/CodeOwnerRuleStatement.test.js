const CodeOwner = require("../../src/lib/CodeOwner").default;
const CodeOwnerRuleStatement =
  require("../../src/lib/CodeOwnerRuleStatement").default;

describe("CodeOwnerRuleStatement", () => {
  describe("constructor()", () => {
    it("should parse statement identifying the codeowners correctly", () => {
      const ruleStatment1 = new CodeOwnerRuleStatement(
        "@contributor1 && @contributor2 || @contributor3"
      );
      expect(ruleStatment1.statement[0]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment1.statement[0].userId).toBe("contributor1");
      expect(ruleStatment1.statement[2]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment1.statement[2].userId).toBe("contributor2");
      expect(ruleStatment1.statement[4]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment1.statement[4].userId).toBe("contributor3");

      const ruleStatment2 = new CodeOwnerRuleStatement(
        "@contributor1 || @contributor2"
      );

      expect(ruleStatment2.statement[0]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment2.statement[0].userId).toBe("contributor1");
      expect(ruleStatment2.statement[2]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment2.statement[2].userId).toBe("contributor2");

      const ruleStatment3 = new CodeOwnerRuleStatement("@contributor");
      expect(ruleStatment3.statement[0]).toBeInstanceOf(CodeOwner);
      expect(ruleStatment3.statement[0].userId).toBe("contributor");
    });

    it("should parse statement identifying the codeowners", () => {});
  });

  describe("evaluate()", () => {
    test.each([
      { statement: "@someone1", approvers: ["someone1"] },
      { statement: "@someone1 || @someone2", approvers: ["someone1"] },
      {
        statement: "@someone1 && @someone2",
        approvers: ["someone1", "someone2"],
      },
      {
        statement: "@someone1 || @someone2 || @someone3",
        approvers: ["someone2"],
      },
      {
        statement: "@someone1 && @someone2 && @someone3",
        approvers: ["someone3", "someone2", "someone1"],
      },
      {
        statement: "@someone1 || @someone2 && @someone3",
        approvers: ["someone3", "someone1"],
      },
    ])(
      "it should return true with statementString: $statement & approvers: $approvers",
      ({ statement, approvers }) => {
        expect(
          new CodeOwnerRuleStatement(statement, approvers).evaluate()
        ).toBe(true);
      }
    );
  });

  describe("isCodeOwnerApprover()", () => {
    it("should return true if codOwner's user id is one of the approvers", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone1");
      expect(ruleStatement.isCodeOwnerApprover(codeOwner)).toBe(true);
    });

    it("should return false if codOwner's user id is not one of the approvers", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone2");
      expect(ruleStatement.isCodeOwnerApprover(codeOwner)).toBe(false);
    });
  });

  describe("and()", () => {
    it("should return true with result: true & approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone1");
      expect(ruleStatement.and(true, codeOwner)).toBe(true);
    });

    it("should return false with result: true & no approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone2");
      expect(ruleStatement.and(true, codeOwner)).toBe(false);
    });

    it("should return false with result: false & approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone3");
      expect(ruleStatement.and(false, codeOwner)).toBe(false);
    });

    it("should return false with result: false & no approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone2");
      expect(ruleStatement.and(false, codeOwner)).toBe(false);
    });
  });

  describe("or()", () => {
    it("should return true with result: true & approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone1");
      expect(ruleStatement.or(true, codeOwner)).toBe(true);
    });

    it("should return true with result: true & no approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone2");
      expect(ruleStatement.or(true, codeOwner)).toBe(true);
    });

    it("should return true with result: false & approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone3");
      expect(ruleStatement.or(false, codeOwner)).toBe(true);
    });

    it("should return false with result: false & no approval by codeowner", () => {
      const ruleStatement = new CodeOwnerRuleStatement(
        "@someone1 && @someone2",
        ["someone1", "someone3"]
      );
      const codeOwner = new CodeOwner("someone2");
      expect(ruleStatement.or(false, codeOwner)).toBe(false);
    });
  });
});
