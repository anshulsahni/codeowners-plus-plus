import { getInput } from "@actions/core";
import * as glob from "@actions/glob";
import * as github from "@actions/github";

async function run(): Promise<void> {
  const branch = getInput("branch");
  console.log(JSON.stringify(github.context));

  const globber = await glob.create("codeowners-plus-plus");
  const files = await globber.glob();
  console.log({ files, branch });
}

run();
