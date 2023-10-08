# codeowners-plus-plus
Tool to extend the functionality of GitHub's CODEOWNERS file with mandatory code reviews.

**NOTE:** _This github action is currently under development, hence use with caution_

## How it works?

1. Add `codeowners-plus-plus` file into repositories root, containing rules for code ownership. The syntax of the config is similar to github CODEOWNERS.

Sample codeowners-plus-plus config file

```
* @someone1
/some/path/** @someone1 && @someone2
/some/path/something.text @someone3

```

2. Add a github action workflow on [pull request event](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#pull_request) in your repository.

Sample workflow
```yaml
name: Codeowners Plus Plus
on: pull_request
jobs:
  approvals-check:
    name: Check mandatory approvals
    runs-on: ubuntu-latest
    permissions:
      # these permissions are required by the action to function
      pull-requests: read
      contents: read

    steps:
      - uses: actions/checkout@v3
      - name: Run codeowners-plus-plus
        uses: anshulsahni/codeowners-plus-plus
        with:
          token: ${{secrets.GITHUB_TOKEN}}
```

3. Make the above workflow as mandatory status check for merging a pull request. This can be done in by creating a Branch Protection Rule for your base branch and adding `Codeowners Plus Plus` workflow in [Require Status Checks before Merging](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)

And you are set. From now every pull request can only be merged if it has all the mandatory approvals required as per the rules in `codeowners-plus-plus`

**NOTE:** _The action always read the config from the base branch. If the codeowners-plus-plus file is changed in your current branch that will not affect ownership rules for pull request created from that branch_


## Features

We're just starting up 🤷, hence we support very less features

### OR Condition
Use `||` opperator between two github Ids of two reviewers, to implement OR condition.

**Example**

```
docs/** @user1 || @user2
```
The rule will pass if Pull Request is approved by either user1 or user2

### AND Condition
Use `&&` opperator between two github Ids of two reviewers, to implement AND condition.

**Example**

```
docs/** @user1 && @user2
```
The rule will pass only if Pull Request is approved by both user1 & user2

### Approval by Teams
Just like github CODEOWNERS features, if the repository is part of an org and you tag a team instead of a github individual user. Approval from any member of the team would be considered as success.

**Example**

```
docs/** @writers
```

Pull request changing anything in docs/ directory will require an approval from someone part of the team named writers in the same org where repository belongs

**NOTE:** _Original github CODEOWNERS considers OR rule when more than one user is tagged as codeowner for path. Currently, codeowners-plus-plus doesn't support that. So there should be an opperator between two users or team_
