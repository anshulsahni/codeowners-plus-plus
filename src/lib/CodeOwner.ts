export class Individual {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
}

export class Team {
  teamId: string;
  members: Array<string>;
  constructor(teamId: string, members: Array<string>) {
    this.teamId = teamId;
    this.members = members;
  }
}

export default class CodeOwner {
  userId: string;
  constructor(userId: string) {
    this.userId = userId;
  }
}
