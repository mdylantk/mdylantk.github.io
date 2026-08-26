export function removeElements(elements = []) {
    for (let element of elements) {
        if (element) {
            element.remove()
        }
    }
    //this is to be used as a callable. items should be a cache array of the items in question instead of have two remove (one for an item and another for two items)
    //NOTE: on change and update results may be created inside the add functions due to each case handling it diffrently
}
export function createElement(type = 'div', parent = document.body, properties = {}, cssClasses = []) {
    const element = document.createElement(type)
    Object.assign(element, properties);
    for (let cssClass of cssClasses) {
        if (cssClass) {
            element.classList.add(cssClass)
        }
    }
    if (parent) {
        parent.appendChild(element)
    }
    return element
}