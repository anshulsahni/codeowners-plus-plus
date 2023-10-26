// Simple Arithmetics Grammar
// ==========================
//
// Accepts expressions like "2 * (3 + 4)" and computes their value.

grammar = CODEOWNER_PLUS_PLUS_CONFIG;

CODEOWNER_PLUS_PLUS_CONFIG "codeowner_plus_plus_config"
 = (newline* PathExpression newline*)+

PathExpression
 = path:PATHGLOB ownership_rule:OWNERSHIP_RULE
 {
	return {
		path:path,ownership_rules:ownership_rule
	}
 }

OWNERSHIP_RULE "ownership_rule"
= (CODEOWNER (OWNERSHIP_OPERATOR CODEOWNER)*)+


PATHGLOB "pathglob"
 = chars:[A-Za-z0-9/*_.-]+ space*
 {
	return {
    	type: "PathGlob",
        value: chars.join("")
	}
 }

space
= [ \t]+

newline
= [\r\n]+

CODEOWNER "codeowner"
 = "@" chars:[a-zA-Z0-9_-]+ digits:("["[0-9]+"]")? space*
 {
 	return {
   		type: "CodeOwner",
        value: chars.join(""),
        minReviews: digits ? parseInt(digits[1].join(""),10) : null
    }
 }

OWNERSHIP_OPERATOR
 = "&&" space* {return {type: "OwnershipOperator", operator: "and"} }
 / "||" space* {return {type: "OwnershipOperator", operator: "or"} }
