"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const minimatch_1 = require("minimatch");
class CodeOwnersEval {
    constructor(approvers, changedPaths, codeOwners) {
        this.approvers = approvers;
        this.changedPaths = changedPaths;
        this.codeOwners = codeOwners;
        console.log(this.getAffectedRules());
    }
    eval() {
        return true;
    }
    getAffectedRules() {
        let affectedRules = {};
        if (this.codeOwners["*"] && this.changedPaths.length > 0) {
            affectedRules["*"] = this.codeOwners["*"];
        }
        const ownerPatterns = (0, lodash_1.keys)((0, lodash_1.omit)(this.codeOwners, "*"));
        this.changedPaths.forEach((filePath) => {
            let currentAffectedRule = undefined;
            ownerPatterns.forEach((pattern) => {
                if ((0, minimatch_1.minimatch)(filePath, pattern))
                    currentAffectedRule = pattern;
            });
            if (currentAffectedRule) {
                affectedRules[currentAffectedRule] =
                    this.codeOwners[currentAffectedRule];
            }
        });
        return affectedRules;
    }
}
exports.default = CodeOwnersEval;
