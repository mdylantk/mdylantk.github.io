const pattern = /%[A-Za-z0-9_]+/g;

function next_rand() {
    const rand = Math.random()
    varRegistry.set('%prev_rand', rand)
    return rand
}

//note: this would be shared in a active global scope. may need to add a parameter to extend it or override it
//also can wrap it in an object and init it. 
const varRegistry = new Map(Object.entries({
    '%0': 0, //temp var. may add up to nine more(0-9), but rather let the user decide how many they want
    '%prev_rand': Math.random(),
    '%random': next_rand,
    "%date_year": () => new Date().getFullYear(),
    "%date_month": () => new Date().getMonth() + 1, 
    "%date_day": () => new Date().getDate(),
    "%date_hour": () => new Date().getHours(),
    "%date_minute": () => new Date().getMinutes(),
    "%date_second": () => new Date().getSeconds(),
}));

export function addInlineVar(id, value) {
    if (typeof value === 'function' || (typeof value !== 'object' && value !== null)) {
        return varRegistry.set(id, value);
    }
}
export function getInlineVar(id) {
    const value = varRegistry.get(id);
    if (typeof value === 'function') {
        return value()
    }
    return value
}
export function removeInlineVar(id) {
    return varRegistry.delete(id);
}
export function getInlineVarList() {
    return varRegistry.keys();
}

export function parseInlineVar(text) {
    return text.replace(pattern, (match) => {
        const value = getInlineVar(match)
        if (value === undefined) {
            return match;
        }
        return value;
    });
}

