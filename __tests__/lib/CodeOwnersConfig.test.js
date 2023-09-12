const { config } = require("process");
const { default: CodeOwner } = require("../../src/lib/CodeOwner");

const CodeOwnerRuleStatement =
  require("../../src/lib/CodeOwnerRuleStatement").default;
const CodeOwnersConfig = require("../../src/lib/CodeOwnersConfig").default;

describe("CodeOwnersConfig", () => {
  describe("contructor()", () => {
    describe("assign config with affected rules when", () => {
      it("rules have * and a file is changed", () => {
        const coc = new CodeOwnersConfig(
          { "*": "@someone1" },
          [],
          ["test.txt"]
        );
        expect(coc.config).toHaveProperty("*");
        expect(coc.config["*"]).toBeInstanceOf(CodeOwnerRuleStatement);
      });

      it("rules have a owner for directory and file changed inside directory", () => {
        const coc = new CodeOwnersConfig(
          { "/something/**": "@someone1" },
          [],
          ["/something/test.txt"]
        );

        expect(coc.config).toHaveProperty("/something/**");
        expect(coc.config["/something/**"]).toBeInstanceOf(
          CodeOwnerRuleStatement
        );
      });

      it("rules have a spefic file as codeowner and that file is changed", () => {
        const coc = new CodeOwnersConfig(
          { "something.txt": "@someone1" },
          [],
          ["something.txt"]
        );

        expect(coc.config).toHaveProperty(["something.txt"]);
        expect(coc.config["something.txt"]).toBeInstanceOf(
          CodeOwnerRuleStatement
        );
      });

      it("rules with two rules and file changed in both", () => {
        const coc = new CodeOwnersConfig(
          { "something.txt": "@someone1", "somemore.txt": "@someone2" },
          [],
          ["something.txt", "somemore.txt"]
        );
        console.log(coc.config);
        expect(coc.config).toHaveProperty(["something.txt"]);
        expect(coc.config["something.txt"]).toBeInstanceOf(
          CodeOwnerRuleStatement
        );
        expect(coc.config).toHaveProperty(["somemore.txt"]);
        expect(coc.config["somemore.txt"]).toBeInstanceOf(
          CodeOwnerRuleStatement
        );
      });

      it("rules with two rules and only one file is changed", () => {
        const coc = new CodeOwnersConfig(
          { "something.txt": "@someone1", "somemore.txt": "@someone2" },
          [],
          ["something.txt"]
        );
        expect(coc.config).toHaveProperty(["something.txt"]);
        expect(coc.config["something.txt"]).toBeInstanceOf(
          CodeOwnerRuleStatement
        );
      });

      it("rules when with * and any file is changed", () => {
        const coc = new CodeOwnersConfig(
          { "*": "@someone1" },
          [],
          ["something.txt"]
        );
        expect(coc.config).toHaveProperty(["*"]);
        expect(coc.config["*"]).toBeInstanceOf(CodeOwnerRuleStatement);
      });
    });
  });
  // TODO: Write tests for isSatisfied()
});
