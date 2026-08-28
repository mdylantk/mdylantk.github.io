

const TOKEN = /Math\.[a-zA-Z_]+|\d+(\.\d+)?|[+\-*/^(),]/g;

export const ALLOWED_MATH = ["sqrt", "pow"];

export const fnRegistry = {
    'calc': calc,
};

export function desugarExpression(expr) {
    expr = expr.replace(/(\d+)\s*\^\s*(\d+)/g, "$1**$2");        // ^ operator
    expr = expr.replace(/(?:√|sqrt)\s*\(/g, "Math.sqrt(");               // √(...)
    expr = expr.replace(/√(\d+)/g, "Math.sqrt($1)");            // √n
    expr = expr.replace(/\$pow\(([^,]+),([^)]*)\)/g, "Math.pow($1,$2)");
    expr = expr.replace(/\$sqrt\(([^)]+)\)/g, "Math.sqrt($1)");
    return expr;
}

export function expandExpression(expr) {
    expr = expr.replace(/\bRand\b/g, () => Math.random());
    return expr;
}

export function isValidExpression(expr) {

    // Early exit: empty or whitespace
    if (!expr || !expr.trim()) return false;

    // Early exit: unmatched parentheses
    let depth = 0;
    for (const ch of expr) {
        if (ch === "(") depth++;
        else if (ch === ")") depth--;
        if (depth < 0) return false; // premature closing
    }
    if (depth !== 0) return false; // still typing

    // Early exit: ends with operator
    if (/[+\-*/^]$/.test(expr.trim())) return false;

    // Early exit: sqrt( with no closing )
    if (/sqrt\s*\($/.test(expr.trim())) return false;
    if (/√\s*\($/.test(expr.trim())) return false;

    // Early exit: invalid characters
    if (/[^0-9+\-*/().,\s^√a-zA-Z_]/.test(expr)) return false;

    return true
    // If we reach here, the expression is complete → safe to evaluate
    // ... your rewrite + validate + evaluate pipeline ...
}

export function validateTokens(tokens) {
    const allowedOps = ["+", "-", "*", "/", "**", "^"];
    const allowedPunc = ["(", ")", ","];

    for (const t of tokens) {
        if (
            // allowed Math functions
            ALLOWED_MATH.some(fn => t === `Math.${fn}`) ||
            // allowed operators
            allowedOps.includes(t) ||
            // allowed punctuation
            allowedPunc.includes(t) ||
            // allowed numbers
            /^\d+(\.\d+)?$/.test(t)
        ) {
            continue;
        }

        throw new Error("Illegal token: " + t);
    }
}

export function validateStructure(tokens) {
    let depth = 0;

    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        if (t === "(") depth++;
        if (t === ")") depth--;

        if (depth < 0) throw new Error("Unbalanced parentheses");

        // comma must be inside Math.<fn>(...)
        if (t === ",") {
            const prev = tokens[i - 1];
            if (!prev || !prev.startsWith("Math.")) {
                throw new Error("Comma only allowed inside Math functions");
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
    const tokens = expr.match(TOKEN);
    if (!tokens) throw new Error("Invalid expression");

    // --- VALIDATE ---
    validateTokens(tokens);
    validateStructure(tokens);
    validateMath(expr);

    try {
        return Function(`"use strict"; return (${expr});`)();
    } catch (err) {
        console.error(err)
        return expr;  
    }
}

export function parseInlineFunc(text) {
    let out = "";
    let i = 0;

    while (i < text.length) {

        if (text.startsWith("$", i)) {

            let fnKey = "";
            let j = i + 1;

            while (j < text.length && /[a-zA-Z_]/.test(text[j])) {
                fnKey += text[j];
                j++;
            }


            const fn = fnRegistry[fnKey];
            if (!fn) {
                out += text[i++];
                continue;
            }

            if (text[j] !== "(") {
                out += text[i++];
                continue;
            }

            j++;
            let depth = 1;
            const argStart = j;

            while (j < text.length && depth > 0) {
                if (text[j] === "(") depth++;
                else if (text[j] === ")") depth--;
                j++;
            }
            if (depth !== 0) return text;

            const argEnd = j - 1;
            const rawArgs = text.slice(argStart, argEnd);

            out += String(fn(rawArgs));
            i = j;
            continue;
        }

        out += text[i++];
    }
    return out;
}

