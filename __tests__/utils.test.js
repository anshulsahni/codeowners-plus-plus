const {
  getPrNumber,
  getDefaultBranch,
  interpretConfig,
  getChangedFileNames,
} = require("../src/utils");

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

  describe("getPrNumber()", () => {
    it("should return the pull_request number after getting data from context", () => {
      const context = {
        payload: {
          pull_request: {
            number: 10,
          },
        },
      };
      expect(getPrNumber(context)).toBe(10);
    });

    it("should throw error if pull_request.number is not present", () => {
      const context = {
        payload: {
          pull_request: {},
        },
      };
      expect(() => getPrNumber(context)).toThrowError(
        "action doesn't have any PR associated with it"
      );
    });

    it("should throw error if pull_request key is not present in payload", () => {
      const context = {
        payload: {},
      };
      expect(() => getPrNumber(context)).toThrowError(
        "action doesn't have any PR associated with it"
      );
    });

    it("should throw error if context sent is empty", () => {
      const context = {};
      expect(() => getPrNumber(context)).toThrowError();
    });

    it("should throw error if nothing is passed", () => {
      expect(() => getPrNumber()).toThrowError();
    });
  });

  describe("interpretConfig()", () => {
    it("send object of path & ownerString with ideal config", () => {
      const contents = `* @user1 && @user2
path/to/something @user3
path/to/something/more @user4 && @user5
      `;

      expect(interpretConfig(contents)).toStrictEqual({
        "*": "@user1 && @user2",
        "path/to/something": "@user3",
        "path/to/something/more": "@user4 && @user5",
      });
    });
    it("send object of path & ownerString with lines of config starting with spaces", () => {
      const contents = `* @user1 && @user2
      path/to/something @user3
      path/to/something/more @user4 && @user5
`;

      expect(interpretConfig(contents)).toStrictEqual({
        "*": "@user1 && @user2",
        "path/to/something": "@user3",
        "path/to/something/more": "@user4 && @user5",
      });
    });

    it("send object of path & ownerString with config starting having empty line at ends", () => {
      const contents = `
* @user1 && @user2
path/to/something @user3
path/to/something/more @user4 && @user5
      `;

      expect(interpretConfig(contents)).toStrictEqual({
        "*": "@user1 && @user2",
        "path/to/something": "@user3",
        "path/to/something/more": "@user4 && @user5",
      });
    });

    it("send object of path & ownerString with config having empty lines & lines starting with spaces", () => {
      const contents = `
      * @user1 && @user2
      path/to/something @user3
      path/to/something/more @user4 && @user5
      `;

      expect(interpretConfig(contents)).toStrictEqual({
        "*": "@user1 && @user2",
        "path/to/something": "@user3",
        "path/to/something/more": "@user4 && @user5",
      });
    });

    it("send an empty object if config is empty string", () => {
      const contents = ``;

      expect(interpretConfig(contents)).toStrictEqual({});
    });

    it("sends an empty object if nothing is passed", () => {
      expect(interpretConfig()).toStrictEqual({});
    });
  });

  describe("async getChangedFilesNames()", () => {
    beforeEach(() => {
      octokit = {
        rest: {
          pulls: {
            listFiles: jest.fn(() => ({
              status: 200,
              headers: {},
              data: [
                {
                  filename: "file1.txt",
                  sha: "SHA_OF_FILE1.TXT",
                  path: "list_of_changes_in_file1.txt",
                },
                {
                  filename: "file2.txt",
                  sha: "SHA_OF_FILE2.TXT",
                  path: "list_of_changes_in_file1.txt",
                },
              ],
            })),
          },
        },
      };
    });

    it("should return the array of file names", async () => {
      expect(await getChangedFileNames(octokit, 1)).toStrictEqual([
        "file1.txt",
        "file2.txt",
      ]);
    });

    it("should return call the github function with right arguments", async () => {
      await getChangedFileNames(octokit, 1);
      expect(octokit.rest.pulls.listFiles).toHaveBeenCalled();
      expect(octokit.rest.pulls.listFiles).toHaveBeenCalledWith({
        owner: "sample_owner",
        repo: "sample_repo",
        pull_number: 1,
      });
    });

    it("should return empty array if no values returned from github api", async () => {
      let octokit = {
        rest: {
          pulls: {
            listFiles: jest.fn(() => ({
              status: 200,
              headers: {},
              data: [],
            })),
          },
        },
      };

      expect(await getChangedFileNames(octokit, 1)).toStrictEqual([]);
    });
  });

  describe("getReviews()", () => {});

  describe("getConfigFile()", () => {});
});
