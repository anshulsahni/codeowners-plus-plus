const getDefaultBranch = require("../src/utils").getDefaultBranch;

describe("utils.ts", () => {
  describe("getDefaultBranchd()", () => {
    it("should return the name of default branch from context", () => {
      const context = {
        payload: {
          repository: {
            default_branch: "defaultBranch",
          },
        },
      };
      expect(getDefaultBranch(context)).toBe("defaultBranch");
    });

    it("should return undefined if repository is not present in context", () => {
      const context = {
        payload: {},
      };
      expect(getDefaultBranch(context)).toBeUndefined();
    });

    it("should raise exception if payload is not present in context", () => {
      const context = {};
      expect(() => getDefaultBranch(context)).toThrowError(
        "Cannot read property 'repository' of undefined"
      );
    });

    it("should return undefined if default_branch is not present in passed context", () => {
      const context = {
        payload: {
          repository: {},
        },
      };
      expect(getDefaultBranch(context)).toBeUndefined();
    });
  });
});
