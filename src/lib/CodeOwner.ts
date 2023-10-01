import _intersection from "lodash/intersection";
import _map from "lodash/map";

export interface CodeOwner {
  isCodeOwnerApprover(approvers: Array<string>): boolean;
}

export type GithubIndividual = {
  login: string;
  id: number;
};

export type GithubTeam = {
  slug: string;
  id: number;
};

export class Individual implements CodeOwner {
  userId: string;
  id: number;
  constructor(userAttribs: GithubIndividual) {
    this.userId = userAttribs.login;
    this.id = userAttribs.id;
  }

  isCodeOwnerApprover(approvers: Array<string>): boolean {
    return approvers.includes(this.userId);
  }
}

export class Team implements CodeOwner {
  teamId: string;
  members: Array<Individual>;
  id: number;

  constructor(teamAttribs: GithubTeam, members: Array<GithubIndividual>) {
    this.teamId = teamAttribs.slug;
    this.id = teamAttribs.id;
    this.members = members.map((member) => new Individual(member));
  }

  isCodeOwnerApprover(approvers: Array<string>): boolean {
    return _intersection(approvers, _map(this.members, "userId")).length > 0;
  }
}
