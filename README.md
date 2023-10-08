# codeowners-plus-plus
Tool to extend the functionality of Github's CODEOWNERS file. It allows developers working on repositories with multiple contributors to create different rules for mandating the code reviews for different file paths in a pull request.

## How it works?

1. Add `codeowners-plus-plus` file into repositories root, containing rules for code ownership. The syntaxe of the config is similar to github CODEOWNERS

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
