//this only evalulate math expresion from a string. if it contains anything else, then it likly won't work
const MATH_TOKEN = /Math\.[a-zA-Z_]+|\d+(\.\d+)?|[+\-*/^(),]/g;

const ALLOWED_MATH = ["sqrt", "pow"];
const allowedOps = ["+", "-", "*", "/", "**", "^"];
const allowedPunc = ["(", ")", ","];

export const varRegistry = {
    'rand': Math.random,
};

export function desugarExpression(expr) {
    expr = expr.replace(/(\d+)\s*\^\s*(\d+)/g, "$1**$2");
    expr = expr.replace(/(?:√|sqrt)\s*\(/g, "Math.sqrt(");
    expr = expr.replace(/√(\d+)/g, "Math.sqrt($1)");
    expr = expr.replace(/\$pow\(([^,]+),([^)]*)\)/g, "Math.pow($1,$2)");
    expr = expr.replace(/\$sqrt\(([^)]+)\)/g, "Math.sqrt($1)");
    return expr;
}

export function expandExpression(expr) {
    expr = expr.replace(/\bRand\b/g, () => Math.random());
    expr = expr.replace(/π|PI/g, Math.PI);
    return expr;
}

export function isValidExpression(expr) {
    if (!expr || !expr.trim()) return false;

    //unmatched parentheses
    let depth = 0;
    for (const ch of expr) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
        if (depth < 0) return false;
    }
    // still typing
    if (depth !== 0) return false;

    //ends with operator
    if (/[+\-*/^]$/.test(expr.trim())) return false;

    // no closing
    if (/sqrt\s*\($/.test(expr.trim())) return false;
    if (/√\s*\($/.test(expr.trim())) return false;

    //invalid characters
    if (/[^0-9+\-*/().,\s^√a-zA-Z_]/.test(expr)) return false;

    return true
}

export function validateMathTokens(tokens) {


    for (const t of tokens) {
        if (
            ALLOWED_MATH.some(fn => t === `Math.${fn}`) ||
            allowedOps.includes(t) ||
            allowedPunc.includes(t) ||
            /^\d+(\.\d+)?$/.test(t)
        ) {
            continue;
        }

        throw new Error("Illegal token: " + t);
    }
}

export function validateMathStructure(tokens) {
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t === "(") depth++;
        if (t === ")") depth--;

        if (depth < 0) throw new Error("Unbalanced parentheses");

        // comma must be inside vaild function calls.
        if (t === ",") {
            const prev = tokens[i - 1];
            if (!prev || !prev.startsWith("Math.")) {
                throw new Error("Comma only allowed inside functions");
            }
        }
    }

    if (depth !== 0) throw new Error("Unbalanced parentheses");
}

export function validateMath(expr) {
    const allowGroup = ALLOWED_MATH.join("|");
    const disallowPattern = new RegExp(`Math\\.(?!(${allowGroup})\\b)`);

    if (disallowPattern.test(expr)) {
        throw new Error("Only sqrt and pow allowed");
    }
}

export function calc(expr) {

    if (!isValidExpression(expr)) {
        return expr
    }

    expr = desugarExpression(expr)
    expr = expandExpression(expr)

    // --- TOKENIZE ---
    const tokens = expr.match(MATH_TOKEN);
    if (!tokens) throw new Error("Invalid expression");

    // --- VALIDATE ---
    validateMathTokens(tokens);
    validateMathStructure(tokens);
    validateMath(expr);

    try {
        return Function(`"use strict"; return (${expr});`)();
    } catch (err) {
        console.error(err)
        return expr;
    }
}