import { calc } from './calc_parser.js'

//note: this would be shared in a active global scope. may need to add a parameter to extend it or override it
//also can wrap it in an object and init it. 
const functionRegistry = new Map(Object.entries({
    'calc': calc,
}));
export function addInlineFunction(id, fn) {
    if (fn && typeof fn === 'function') {
        return functionRegistry.set(id, fn);
    }
}
export function getInlineFunction(id) {
    return functionRegistry.get(id);
}
export function removeInlineFunction(id) {
    return functionRegistry.delete(id);
}
export function getInlineFunctionsList() {
    return functionRegistry.keys();
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

            const fn = functionRegistry.get(fnKey);
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

