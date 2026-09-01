const pattern = /%[A-Za-z0-9_]+/g;

export const defaultVariables = {
    '0': 0, //temp var. may add up to nine more(0-9), but rather let the user decide how many they want. //note: inline functions may be needed to set these via inline calls
    'prev_rand': Math.random(),
    "date_year": () => new Date().getFullYear(),
    "date_month": () => new Date().getMonth() + 1,
    "date_day": () => new Date().getDate(),
    "date_hour": () => new Date().getHours(),
    "date_minute": () => new Date().getMinutes(),
    "date_second": () => new Date().getSeconds(),
}

export class InlineVariableParser {
    #identifierPrefix = "%"
    #pattern = new RegExp(`(?<!\\\\)${this.#identifierPrefix}[A-Za-z0-9_]+`, "g");
    #escapePattern = new RegExp(`\\\\${this.#identifierPrefix}([A-Za-z0-9_]+)`, "g");
    get identifierPrefix() {
        return this.#identifierPrefix;
    }
    set identifierPrefix(value) {
        this.identifierPrefix = value || '%'
        this.#pattern = new RegExp(`(?<!\\\\)${this.#identifierPrefix}[A-Za-z0-9_]+`, "g");
        this.#escapePattern = new RegExp(`\\\\${this.#identifierPrefix}([A-Za-z0-9_]+)`, "g");
    }

    #variableRegistry

    addInlineVariable(id, value) {
        if (typeof value === 'function' || (typeof value !== 'object' && value !== null)) {
            return this.#variableRegistry.set(id, value);
        }
    }
    getInlineVariable(id) {
        let value = this.#variableRegistry.get(id);
        //need to handle specail cases for built in defaults that is dependent on state
        //may add flags later to disable certain features
        if (typeof value === 'undefined') {
            if (id === 'random') {
                value = this.next_rand();
            }
        }
        if (typeof value === 'function') {
            return value()
        }
        return value
    }
    removeInlineVariable(id) {
        return this.#variableRegistry.delete(id);
    }
    getInlineVariableList() {
        return this.#variableRegistry.keys();
    }

    next_rand() {
        const rand = Math.random()
        this.#variableRegistry.set('%prev_rand', rand)
        return rand
    }

    parseInlineVariables(text) {
        let escape
        text = text.replace(this.#escapePattern, (_, id) => {
            escape = true
            return this.#identifierPrefix + id;
        });
        if (escape){return text}
        return text.replace(this.#pattern, (match) => {
            const id = match.slice(this.#identifierPrefix.length)
            const value = this.getInlineVariable(id)
            return value === undefined ? match : value;
        });
    }

    constructor(inlineVariables = defaultVariables) {
        this.#variableRegistry = new Map(Object.entries(inlineVariables));
    }

}
export const inlineVariableParser = new InlineVariableParser()

export function parseInlineVariable(text) {
    return inlineVariableParser.parseInlineVariables(text)
}

