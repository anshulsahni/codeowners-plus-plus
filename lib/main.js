"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const CodeOwnersEval_1 = require("./CodeOwnersEval");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const defaultBranch = getDefaultBranch(github_1.context);
            const authToken = (0, core_1.getInput)("token");
            const octokit = (0, github_1.getOctokit)(authToken);
            const configFileContents = yield getConfigFile(octokit, defaultBranch);
            const prNumber = getPrNumber(github_1.context);
            const changedFileNames = yield getChangedFileNames(octokit, prNumber);
            const approvers = yield getPRReviews(octokit, prNumber);
            const rules = interpretConfig(configFileContents);
            const codeownersConfig = new CodeOwnersEval_1.CodeOwnersConfig(rules, approvers, changedFileNames);
            if (!codeownersConfig.isSatisfied()) {
                (0, core_1.setFailed)("action codeowners-plus-plus failed because approvals from codeowners are not enought");
            }
        }
        catch (error) {
            (0, core_1.error)(error);
            (0, core_1.setFailed)(error);
        }
    });
}
function isValidAction() {
    return true;
}
function getDefaultBranch(context) {
    var _a;
    return (_a = context.payload.repository) === null || _a === void 0 ? void 0 : _a.default_branch;
}
function getConfigFile(octokit, defaultBranch) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.repos.getContent({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            path: "codeowners-plus-plus",
            ref: defaultBranch,
        });
        return Buffer.from(response.data.content, response.data.encoding).toString();
    });
}
function getPRReviews(octokit, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.pulls.listReviews({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            pull_number: prNumber,
        });
        return response.data
            .filter(({ state }) => state === "APPROVED")
            .map(({ user }) => user.login);
    });
}
function getPrNumber(context) {
    var _a;
    if ((_a = context.payload.pull_request) === null || _a === void 0 ? void 0 : _a.number) {
        return context.payload.pull_request.number;
    }
    throw "action doesn't have any PR associated with it";
}
function interpretConfig(contents) {
    return contents.split("\n").reduce((rules, line) => {
        const firstSpaceIndex = line.indexOf(" ");
        return Object.assign(Object.assign({}, rules), { [line.substring(0, firstSpaceIndex)]: line.substring(firstSpaceIndex + 1) });
    }, {});
}
function getChangedFileNames(octokit, prNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield octokit.rest.pulls.listFiles({
            owner: github_1.context.repo.owner,
            repo: github_1.context.repo.repo,
            pull_number: prNumber,
        });
        return response.data.map((files) => files.filename);
    });
}
run();
