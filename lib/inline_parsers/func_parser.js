import { calc } from './calc_parser.js'

export const defaultFunctions = {
    'calc': calc,
}

export class InlineFunctionParser {
    #identifierPrefix = "$"
    get identifierPrefix() {
        return this.#identifierPrefix;
    }
    set identifierPrefix(value) {
        if (!value) {
            this.identifierPrefix = '$'
            return
        }
        this.identifierPrefix = value
    }

    #functionRegistry
    addInlineFunction(id, fn) {
        if (fn && typeof fn === 'function') {
            return this.#functionRegistry.set(id, fn);
        }
    }
    getInlineFunction(id) {
        return this.#functionRegistry.get(id);
    }
    removeInlineFunction(id) {
        return this.#functionRegistry.delete(id);
    }
    getInlineFunctionsList() {
        return this.#functionRegistry.keys();
    }

    parseInlineFunction(text) {
        let out = "";
        let i = 0;
        let escaped;
        while (i < text.length) {
            escaped = false;
            if (text.startsWith(this.#identifierPrefix, i)) {
                //escape if prefix with \ and remove it. this allow one to display the comand
                if (text.startsWith('\\', i - 1)) {
                    out = out.slice(0,-1) + this.#identifierPrefix;
                    escaped = true;
                    i++
                    continue;
                }

                let fnKey = "";
                let j = i + 1;

                while (j < text.length && /[a-zA-Z_]/.test(text[j])) {
                    fnKey += text[j];
                    j++;
                }

                const fn = this.#functionRegistry.get(fnKey);
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
            if (!escaped){
                out += text[i++];
            }
            
        }
        return out;
    }
    constructor(inlineFunctions = defaultFunctions) {
        this.#functionRegistry = new Map(Object.entries(inlineFunctions));
    }
}

export const inlineFunctionParser = new InlineFunctionParser()


export function parseInlineFunction(text) {
    return inlineFunctionParser.parseInlineFunction(text);
}

