"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeOwnersConfig = void 0;
const lodash_1 = require("lodash");
const minimatch_1 = require("minimatch");
class CodeOwnersConfig {
    constructor(config, approvers, changedPaths) {
        this.approvers = approvers;
        this.config = this.getConfigForAffectedRules(config, changedPaths);
    }
    isSatisfied() {
        return Object.keys(this.config).every((pathPattern) => {
            this.config[pathPattern].evaluate();
        });
    }
    getConfigForAffectedRules(config, changedPaths) {
        let affectedRules = {};
        if (config["*"] && changedPaths.length > 0) {
            affectedRules["*"] = new CodeOwnerRuleStatement(config["*"], this.approvers);
        }
        const patternInRules = (0, lodash_1.keys)((0, lodash_1.omit)(config, "*"));
        changedPaths.forEach((filePath) => {
            let currentAffectedRule = undefined;
            patternInRules.forEach((pattern) => {
                if ((0, minimatch_1.minimatch)(filePath, pattern))
                    currentAffectedRule = pattern;
            });
            if (currentAffectedRule) {
                affectedRules[currentAffectedRule] = new CodeOwnerRuleStatement(config[currentAffectedRule], this.approvers);
            }
        });
        return affectedRules;
    }
}
exports.CodeOwnersConfig = CodeOwnersConfig;
class CodeOwner {
    constructor(userId) {
        this.userId = userId;
    }
}
class CodeOwnerRuleStatement {
    constructor(statementString, approvers) {
        this.approvers = approvers;
        this.statement = this.statementStringToObj(statementString);
    }
    evaluate() {
        let result = false;
        for (let i = 0; i < this.statement.length; i++) {
            const statementPiece = this.statement[i];
            if (statementPiece instanceof CodeOwner) {
                result = this.isCodeOwnerApprover(statementPiece);
            }
            else {
                result = statementPiece.call(this, result, this.statement[++i]);
            }
        }
        return result;
    }
    isCodeOwnerApprover(codeOwner) {
        return this.approvers.includes(codeOwner.userId);
    }
    and(result, codeOwner) {
        return result && this.isCodeOwnerApprover(codeOwner);
    }
    or(result, codeOwner) {
        return result || this.isCodeOwnerApprover(codeOwner);
    }
    statementStringToObj(statementString) {
        const statement = [];
        statementString.split(" ").forEach((statementPiece) => {
            if (statementPiece.startsWith("@")) {
                statement.push(new CodeOwner(statementPiece.substring(1)));
            }
            else if (statementPiece === "&&") {
                statement.push(this.and);
            }
            else if (statementPiece === "||") {
                statement.push(this.or);
            }
            else {
                throw new Error(`Invalid symbol ${statementPiece} in owner rule statement`);
            }
        });
        return statement;
    }
}
