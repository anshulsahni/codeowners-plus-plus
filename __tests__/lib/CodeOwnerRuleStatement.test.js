const { Individual, Team } = require("../../src/lib/CodeOwner");

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
    describe("should return true if approvers satisfy statement's condition", () => {
      it("with single user in statement and in approver", async () => {
        const statement = "@someone1";
        const approvers = ["someone1"];
        const octokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
              listMembersInOrg: jest.fn(),
            },
            users: {
              getByUsername: jest.fn(() =>
                Promise.resolve({
                  status: 200,
                  data: { login: "someone1", id: 123 },
                })
              ),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("with single user in statement and two approvers", async () => {
        const statement = "@someone1";
        const approvers = ["someone1", "someone2"];

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 123 } })
        );
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone2", id: 456 } })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
              listMembersInOrg: jest.fn(),
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("with team and approvers part of team members", async () => {
        const statement = "@team1";
        const approvers = ["someone1"];

        const mockGetTeamByName = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: { slug: "team1", id: 123 },
          })
        );
        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: [{ login: "someone1", id: 456 }],
          })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: jest.fn(),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("with team and one approvers part of team members and other not", async () => {
        const statement = "@team1";
        const approvers = ["someone1", "someone2"];

        const mockGetTeamByName = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: { slug: "team1", id: 123 },
          })
        );
        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone1", id: 456 },
              { login: "someone3", id: 789 },
            ],
          })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: jest.fn(),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from two individuals and both approved it", async () => {
        const statement = "@someone1 && @someone2";
        const approvers = ["someone1", "someone2"];

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone1", id: 123 },
        });
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone2", id: 456 },
        });
        const octokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
              listMembersInOrg: jest.fn(),
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from either of two individuals and one approved it", async () => {
        const statement = "@someone1 || @someone2";
        const approvers = ["someone1"];

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone1", id: 123 },
        });
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone2", id: 456 },
        });
        const octokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
              listMembersInOrg: jest.fn(),
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from two teams and members from both approve it", async () => {
        const statement = "@team1 && @team2";
        const approvers = ["someone1", "someone3"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone1", id: 1 },
              { login: "someone2", id: 2 },
            ],
          })
        );
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone1", id: 123 },
        });
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone2", id: 456 },
        });
        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: jest.fn(),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from either of two teams and members from first team approves it", async () => {
        const statement = "@team1 || @team2";
        const approvers = ["someone1"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone1", id: 1 },
              { login: "someone2", id: 2 },
            ],
          })
        );
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone1", id: 123 },
        });
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone2", id: 456 },
        });
        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: jest.fn(),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from either of two teams and members from second approves it", async () => {
        const statement = "@team1 || @team2";
        const approvers = ["someone3"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone1", id: 1 },
              { login: "someone2", id: 2 },
            ],
          })
        );
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone1", id: 123 },
        });
        mockGetByUsername.mockReturnValueOnce({
          status: 200,
          data: { login: "someone2", id: 456 },
        });
        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: jest.fn(),
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from a team and individual and approval comes from individual and team member", async () => {
        const statement = "@someone1 && @team2";
        const approvers = ["someone3", "someone1"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: { login: "someone1", id: 123 },
          })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from a team and individual and approval comes from individual", async () => {
        const statement = "@someone1 || @team2";
        const approvers = ["someone1"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: { login: "someone1", id: 123 },
          })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });

      it("when approvals required from a team or individual and approval comes from team member", async () => {
        const statement = "@someone1 || @team2";
        const approvers = ["someone3"];

        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn();
        mockListMembersInOrg.mockReturnValueOnce(
          Promise.resolve({
            status: 200,
            data: [
              { login: "someone3", id: 3 },
              { login: "someone4", id: 4 },
            ],
          })
        );

        const mockGetByUsername = jest.fn(() =>
          Promise.resolve({
            status: 200,
            data: { login: "someone1", id: 123 },
          })
        );

        const octokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };

        const ruleStatement = new CodeOwnerRuleStatement(
          statement,
          approvers,
          octokit
        );
        expect(await ruleStatement.evaluate()).toBe(true);
      });
    });
  });

  describe("statementStringToObj()", () => {
    describe("should return Statement", () => {
      it("with correct order of Individuals - 1", async () => {
        const statementString = "@someone1";
        const sampleOctokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
            },
            users: {
              getByUsername: jest.fn(() =>
                Promise.resolve({
                  status: 200,
                  data: { login: "someone1", id: 123 },
                })
              ),
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement[0]).toBeInstanceOf(Individual);
        expect(statement[0].userId).toBe("someone1");
      });

      it("with correct order of Individuals - 2 ", async () => {
        const statementString = "@someone1 @someone2";
        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 123 } })
        );
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone2", id: 123 } })
        );
        const sampleOctokit = {
          rest: {
            teams: {
              getByName: jest.fn(() => Promise.reject({ status: 404 })),
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement.length).toBe(2);
        expect(statement[0]).toBeInstanceOf(Individual);
        expect(statement[1]).toBeInstanceOf(Individual);
        expect(statement[0].userId).toBe("someone1");
        expect(statement[1].userId).toBe("someone2");
      });

      it("with correct order of Teams - 1", async () => {
        const statementString = "@team1";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: jest.fn(() =>
                Promise.resolve({ status: 200, data: [] })
              ),
            },
            users: {
              getByUsername: jest.fn(() => Promise.reject({ status: 404 })),
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement.length).toBe(1);
        expect(statement[0]).toBeInstanceOf(Team);
        expect(statement[0].teamId).toBe("team1");
      });

      it("with correct order of Teams - 2", async () => {
        const statementString = "@team1 @team2";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: jest.fn(() =>
                Promise.resolve({ status: 200, data: [] })
              ),
            },
            users: {
              getByUsername: jest.fn(() => Promise.reject({ status: 404 })),
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement.length).toBe(2);
        expect(statement[0]).toBeInstanceOf(Team);
        expect(statement[0].teamId).toBe("team1");
        expect(statement[1]).toBeInstanceOf(Team);
        expect(statement[1].teamId).toBe("team2");
      });

      it("with correct order of CodeOwners with combination of team and individual - 1", async () => {
        const statementString = "@someone1 @team1";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement.length).toBe(2);
        expect(statement[0]).toBeInstanceOf(Individual);
        expect(statement[0].userId).toBe("someone1");
        expect(statement[1]).toBeInstanceOf(Team);
        expect(statement[1].teamId).toBe("team1");
      });

      it("with correct order of CodeOwners with combination of team and individual - 2", async () => {
        const statementString = "@team1 @someone1";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 123 } })
        );
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 456 } })
        );

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement.length).toBe(2);
        expect(statement[0]).toBeInstanceOf(Team);
        expect(statement[0].teamId).toBe("team1");
        expect(statement[1]).toBeInstanceOf(Individual);
        expect(statement[1].userId).toBe("someone1");
      });

      it("with correct order of operators (AND) and users", async () => {
        const statementString = "@someone1 && @someone2";
        const mockGetTeamByName = jest.fn(() =>
          Promise.reject({ status: 404 })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 456 } })
        );
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone2", id: 789 } })
        );

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement[0]).toBeInstanceOf(Individual);
        expect(typeof statement[1]).toBe("function");
        expect(statement[1].name).toBe("and");
        expect(statement[2]).toBeInstanceOf(Individual);
      });

      it("with correct order of operators (OR) and users", async () => {
        const statementString = "@someone1 || @someone2";
        const mockGetTeamByName = jest.fn(() =>
          Promise.reject({ status: 404 })
        );

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 456 } })
        );
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone2", id: 789 } })
        );

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement[0]).toBeInstanceOf(Individual);
        expect(typeof statement[1]).toBe("function");
        expect(statement[1].name).toBe("or");
        expect(statement[2]).toBeInstanceOf(Individual);
      });

      it("with correct order of operators (OR) and team", async () => {
        const statementString = "@team1 || @team2";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 456 } })
        );
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team2", id: 456 } })
        );

        const mockGetByUsername = jest.fn();

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement[0]).toBeInstanceOf(Team);
        expect(typeof statement[1]).toBe("function");
        expect(statement[1].name).toBe("or");
        expect(statement[2]).toBeInstanceOf(Team);
      });

      it("with correct order of operators (AND) team and user", async () => {
        const statementString = "@team1 && @someone1";
        const mockGetTeamByName = jest.fn();
        mockGetTeamByName.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { slug: "team1", id: 456 } })
        );
        mockGetTeamByName.mockReturnValueOnce(Promise.reject({ status: 404 }));

        const mockGetByUsername = jest.fn();
        mockGetByUsername.mockReturnValueOnce(
          Promise.resolve({ status: 200, data: { login: "someone1", id: 789 } })
        );

        const mockListMembersInOrg = jest.fn(() =>
          Promise.resolve({ status: 200, data: [] })
        );

        const sampleOctokit = {
          rest: {
            teams: {
              getByName: mockGetTeamByName,
              listMembersInOrg: mockListMembersInOrg,
            },
            users: {
              getByUsername: mockGetByUsername,
            },
          },
        };
        const statement = await new CodeOwnerRuleStatement(
          statementString,
          [],
          sampleOctokit
        ).statementStringToObj(statementString, sampleOctokit);

        expect(Array.isArray(statement)).toBe(true);
        expect(statement[0]).toBeInstanceOf(Team);
        expect(typeof statement[1]).toBe("function");
        expect(statement[1].name).toBe("and");
        expect(statement[2]).toBeInstanceOf(Individual);
      });
    });
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
