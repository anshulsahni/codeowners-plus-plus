import { getInput } from "@actions/core";
import * as glob from "@actions/glob";

async function run(): Promise<void> {
  const branch = getInput("branch");

  const globber = await glob.create("codeowners-plus-plus");
  const files = await globber.glob();
  console.log({ files, branch });
}

run();
