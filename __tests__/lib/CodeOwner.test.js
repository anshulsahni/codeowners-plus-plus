const { Individual, Team } = require("../../src/lib/CodeOwner");

describe("Individual#CodeOwner", () => {
  describe("isCodeOwnerApprover()", () => {
    it("should return true if the userId is part of approvers", () => {
      const individual = new Individual({
        login: "sample_user",
        id: 123,
      });

      expect(
        individual.isCodeOwnerApprover([
          "sample_user",
          "sample_user2",
          "sample_user3",
        ])
      ).toBe(true);
    });

    it("should return false if userId is not part approvers list", () => {
      const individual = new Individual({
        login: "sample_user",
        id: 123,
      });

      expect(
        individual.isCodeOwnerApprover(["sample_user2", "sample_user3"])
      ).toBe(false);
    });

    it("should return false if approvers list is empty", () => {
      const individual = new Individual({
        login: "sample_user",
        id: 123,
      });

      expect(individual.isCodeOwnerApprover([])).toBe(false);
    });
  });
});

describe("Team#CodeOwner", () => {
  describe("constructor()", () => {
    it("should assign members as Individuals from members attributes", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        [
          { login: "sampleUser1", id: 789 },
          { login: "sampleUser2", id: 456 },
          { login: "sampleUser3", id: 124 },
        ]
      );
      expect(team.members[0]).toBeInstanceOf(Individual);
      expect(team.members[1]).toBeInstanceOf(Individual);
    });
  });
  describe("isCodeOwnerApprover", () => {
    it("should return true if approvers contains at least 1 member of team", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        [
          { login: "sampleUser1", id: 789 },
          { login: "sampleUser2", id: 456 },
          { login: "sampleUser3", id: 124 },
        ]
      );
      expect(
        team.isCodeOwnerApprover(["sampleUser2", "sampleUser4", "sampleUser5"])
      ).toBe(true);
    });

    it("should return true if approvers contains more than 1 member of team", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        [
          { login: "sampleUser1", id: 789 },
          { login: "sampleUser2", id: 456 },
          { login: "sampleUser3", id: 124 },
        ]
      );
      expect(
        team.isCodeOwnerApprover(["sampleUser2", "sampleUser3", "sampleUser5"])
      ).toBe(true);
    });

    it("should return false if approvers doesn't contain any member of the team", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        [
          { login: "sampleUser1", id: 789 },
          { login: "sampleUser2", id: 456 },
          { login: "sampleUser3", id: 124 },
        ]
      );
      expect(
        team.isCodeOwnerApprover(["sampleUser4", "sampleUser5", "sampleUser6"])
      ).toBe(false);
    });

    it("should return false if approvers list is empty", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        [
          { login: "sampleUser1", id: 789 },
          { login: "sampleUser2", id: 456 },
          { login: "sampleUser3", id: 124 },
        ]
      );
      expect(team.isCodeOwnerApprover([])).toBe(false);
    });

    it("should return false if no members in the team", () => {
      const team = new Team(
        {
          slug: "sample_team",
          id: 123,
        },
        []
      );
      expect(
        team.isCodeOwnerApprover(["sampleUser4", "sampleUser5", "sampleUser6"])
      ).toBe(false);
    });
  });
});
