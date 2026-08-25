export const conversionTable = [
    [1, 16, 48, 96, 768, 1536, 3072, 12288],//spoons and cups using 1/16 of a tsp as the base
    [1, 1000],//liters using ml as the base
    [1, 16],
    [1, 1000, 1000000],
    [
        1000,
        530, 570, 430,
        850, 720, 560,
        910, 920, 910,
        1030, 1010, 1020,
        1420, 1370, 1400,
        750, 410, 680,
        920, 920,
        870, 900,
        1220, 590,
    ]//in mg/ml
]
export const conversionNames = [
    ['1/16 tsp', 'tsp', 'tbsp', 'fl oz', 'cup', 'pint', 'quart', 'gallon'],
    ['ml', 'litters'],
    ['oz', 'lb'],
    ['mg', 'g', 'kg'],
    [
        'water',
        'all-purpose flour', 'bread flour', 'cake flour',
        'granulated sugar', 'brown sugar', 'powder sugar',
        'butter', 'lard', 'soild shortening',
        'milk', 'heavy cream', 'half and half',
        'honey', 'maple syrup', 'molasses',
        'rice', 'oats', 'quinoa',
        'vegetable oil', 'olive oil',
        'baking soda', 'baking powder',
        'table salt', 'cocoa powder'
    ]
]
export const CONVERSION_KEYS = {
    M_TSP: 0, TSP: 10, TBSP: 20, FL_OZ: 30,
    CUP: 40, PINT: 50, QUART: 60, GALLON: 70,
    ML: 1, L: 11,
    OZ: 2, LB: 12,
    MG: 3, G: 13, KG: 23
}
//may use this instead
export const densities = {
    'water': 100,
    'all-purpose flour': 530, 'bread flour': 570, 'cake flour': 430,
    'granulated sugar': 850, 'brown sugar': 720, 'powder sugar': 560,
    'butter': 910, 'lard': 920, 'soild shortening': 920,
    'milk': 1030, 'heavy cream': 1010, 'half and half': 1020,
    'honey': 1420, 'maple syrup': 1370, 'molasses': 1400,
    'rice': 750, 'oats': 410, 'quinoa': 680,
    'vegetable oil': 920, 'olive oil': 920,
    'baking soda': 870, 'baking powder': 900,
    'table salt': 1220, 'cocoa powder': 590
}
//seprate keys for density ids
export const DENSITY_KEYS = {
    WATER: 4,
    FLOUR: 14, BREAD_FLOUR: 24, CAKE_FLOUR: 34,
    SUGAR: 44, BROWN_SUGAR: 54, POWDER_SUGAR: 64,
    BUTTER: 74, LARD: 84, SHORTENING: 94,
    MILK: 104, HEAVY_CREAM: 114, HALF_AND_HALF: 124,
    HONEY: 134, SYRUP: 144, MOLASSES: 154,
    RICE: 164, OATS: 174, QUINOA: 184,
    VEG_OIL: 194, OLIVE_OIL: 204,
    BAKING_SODA: 214, BAKING_POWDER: 224,
    SALT: 234, COCOA: 244

}
export const TYPE_KEYS = {
    IMP_VOLUME: 0, MET_VOLUME: 1, IMP_MASS: 2, MET_MASS: 3, DENSITY: 4
}
export const volumeIds = [
    CONVERSION_KEYS.ML, CONVERSION_KEYS.L,
    CONVERSION_KEYS.M_TSP, CONVERSION_KEYS.TSP, CONVERSION_KEYS.TBSP, CONVERSION_KEYS.FL_OZ,
    CONVERSION_KEYS.CUP, CONVERSION_KEYS.PINT, CONVERSION_KEYS.QUART, CONVERSION_KEYS.GALLON
];
export const massIds = [
    CONVERSION_KEYS.MG, CONVERSION_KEYS.G, CONVERSION_KEYS.KG,
    CONVERSION_KEYS.OZ, CONVERSION_KEYS.LB
]
export const allIds = [
    ...volumeIds,
    ...massIds
]
export function getIndex(id = 0) {
    return Math.floor(id / 10)
}
export function getType(id = 0) {
    return id % 10
}
export function getConversionValue(id = 0) {
    return conversionTable[getType(id)][getIndex(id)] || 1
}
export function getConversionName(id = 0) {
    return conversionNames[getType(id)][getIndex(id)] || 1
}

export function impToMetVolume(value) {
    return value * 0.308057599
}
export function metToImpVolume(value) {
    return value / 0.308057599
}
export function impToMetMass(value) {
    return value * 28349.5231
}
export function metToImpMass(value) {
    return value * 0.00003527
}
export function convert(value = 1, fromId = 0, toId = 0, modifier = 1) {
    const fromType = getType(fromId)
    const toType = getType(toId)
    //note: -1 is due to the first index(0) being used of type conversion
    //can change to -2 and insert mass densities to index 1. note: this would
    //mean all types would need be increased by one
    value *= getConversionValue(fromId)
    if (fromType !== toType) {
        if ((fromType === 0 || fromType === 1) && (toType === 0 || toType === 1)) {
            value = fromType < toType ? impToMetVolume(value) : metToImpVolume(value);
        }
        else if ((fromType === 2 || fromType === 3) && (toType === 2 || toType === 3)) {
            value = fromType < toType ? impToMetMass(value) : metToImpMass(value);
        }
        else {
            console.log(fromType, toType)
            //convert to metric for density
            if (fromType === 0 && (toType === 2 || toType === 3)) {
                console.log(modifier)
                value = impToMetVolume(value) * modifier;

            }
            else if (fromType === 2 && (toType === 0 || toType === 1)) {
                console.log(modifier)
                value = impToMetMass(value) / modifier;

            }
            value = fromType < toType ? value * modifier : value / modifier;
            if (toType === 0) {
                value = metToImpVolume(value)
            }
            else if (toType === 2) {
                value = metToImpMass(value)
            }

            //apply density base
            //then convert to imp IF to is imp 

            console.log('NOTE: density conversion logic needed. ')
            //may need to convert to met if imp (case 1 and 2) and then apply the desity value(gain from modifier)
        }
    }

    value /= getConversionValue(toId)
    return value
}

export class RecipeConversion {
    container
    #multiplier = 1
    get multiplier() {
        return this.#multiplier
    }
    set multiplier(value = 1) {
        if (!isNaN(value)) {
            if (value > 0 && this.#multiplier !== value) {
                this.#multiplier = value
                this.requestUpdate()
            }
        }
    }
    debug = 1;
    roughFormat = false;
    updateSignals = new Set()
    #requestUpdate = false
    //this update other elements such as output 
    update(target) {
        target.#requestUpdate = false
        for (const value of this.updateSignals) {
            value();
        }
        if (target.debug) { console.log('updating') }
    }
    requestUpdate() {
        if (this.#requestUpdate) { return }
        this.#requestUpdate = true
        requestAnimationFrame(() => this.update(this));
    }

    densitiesDatalistId = 'RC_densitiesDatalist'

    //defualt style classes are the default style and could be disable on init
    defaultBodyClass = 'RC_defaultBody'
    //the default style for the containers such as the input box, and output box
    defaultContainerClass = 'RC_defaultContainer'
    //the default style for the container rows or Group of related items
    defaultRowClass = 'RC_defaultRow'
    //the default style for items, feilds, buttons, and inputs
    defaultItemClass = 'RC_defaultItem'
    defaultNumberClass = 'RC_defaultNumber'
    defaultTextClass = 'RC_defaultText'

    //Note: each element would have a class realted to the role
    //title, multiplier, container for the conversions, container for the results, display name, value, type, from, to, remove, add
    createDefaultStyle() {
        if (typeof this.defaultStyleElement === "undefined" || this.defaultStyleElement === null) {
            this.defaultStyleElement = document.createElement('style');
        }
        this.defaultStyleElement.type = 'text/css';

        // 2. Define default widget CSS
        this.defaultStyleElement.textContent = `
            .${this.defaultBodyClass} {
                display: grid;
            }
            .${this.defaultContainerClass} {
                display: grid;
            }
            .${this.defaultRowClass} {
                grid-column: 1 / -1;
            }
            .${this.defaultItemClass} {
                margin: 8px;
            }
            .${this.defaultNumberClass} {
                width: 10%;
                min-width: 32px;
                max-width: 128px;
                margin: 8px;
            }
            .${this.defaultTextClass} {
                width: 25%;
                min-width: 128px;
                max-width: 320px;
                margin: 8px;
            }
        `;

        // 3. Append style to <head> so it applies globally
        document.head.appendChild(this.defaultStyleElement);
    }

    removeElements(elements = []) {
        for (let element of elements) {
            if (element) {
                element.remove()
            }
        }
        //this is to be used as a callable. items should be a cache array of the items in question instead of have two remove (one for an item and another for two items)
        //NOTE: on change and update results may be created inside the add functions due to each case handling it diffrently
    }

    addElement(type = 'div', parent = document.body, properties = {}, cssClasses = []) {
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

    //this handles the basic item layout without dealing with select types
    //(the dedicated item types will handle that)
    createItem(type = 0, fromTable = allIds, toTable = undefined) {
        const item = { elements: [] }
        const elements = item.elements
        elements.push(this.addElement('div', this.inputBox, {}, [this.defaultRowClass]))
        const input = elements.at(-1)
        elements.push(this.addElement('div', this.outputBox, {}, [this.defaultRowClass]))
        const output = elements.at(-1)

        elements.push(this.addElement(
            'input',
            input,
            {
                name: 'Display Name',
                placeholder: 'Label',
                title: "Label"
            },
            [this.defaultTextClass, this.styles.inputLabelClass]))
        const inputLabelElement = elements.at(-1)
        elements.push(this.addElement('span', output, { innerText: inputLabelElement.value }, [this.defaultTextClass, this.styles.outputLabelClass]))
        const outputLabelElement = elements.at(-1)
        inputLabelElement.addEventListener('change', () => {
            outputLabelElement.innerText = inputLabelElement.value
        });

        elements.push(this.addElement('input', input, { name: 'Value', title: "Value", placeholder: 'Amount' }, [this.defaultNumberClass, this.inputValueClass]))
        const inputValueElement = elements.at(-1)
        elements.push(this.addElement('span', output, { innerText: inputValueElement.value }, [this.defaultNumberClass, this.styles.outputValueClass]))
        const outputValueElement = elements.at(-1)
        inputValueElement.addEventListener('change', (event, handler = this) => {
            //outputValueElement.innerText = onValueChange(inputValueElement.value)
            handler.requestUpdate()
        });

        let inputFromElement
        let inputToElement
        let outputValueTypeElement
        let inputDensityElement
        if (type === 1 || type === 2) {
            elements.push(this.addElement('select', input, { name: 'From', title: "From" }, [this.defaultItemClass, this.styles.inputFromClass]))
            inputFromElement = elements.at(-1)
            inputFromElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            elements.push(this.addElement('select', input, { name: 'To', title: "To" }, [this.defaultItemClass, this.styles.inputToClass]))
            inputToElement = elements.at(-1)
            inputToElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });

            elements.push(this.addElement('span', output, {}, [this.defaultTextlass, this.styles.outputValueTypeClass]))
            outputValueTypeElement = elements.at(-1)


            if (fromTable) {
                for (const id of fromTable) {
                    elements.push(this.addElement('option', inputFromElement, { value: id || 0, textContent: getConversionName(id) }))
                }
                //Object.keys(fromTable).forEach(key => {
                //    elements.push(this.addElement('option', inputFromElement, { value: fromTable[key] || 0, textContent: key }))
                //});
            }
            if (toTable) {
                for (const id of toTable) {
                    elements.push(this.addElement('option', inputToElement, { value: id || 0, textContent: getConversionName(id) }))
                }
                //Object.keys(toTable).forEach(key => {
                //    elements.push(this.addElement('option', inputToElement, { value: toTable[key] || 0, textContent: key }))
                //});
            }
        }
        if (type === 2) {
            elements.push(this.addElement('input', input, { name: 'Density', title: "Density", placeholder: 'Density' }, [this.defaultItemClass, this.styles.inputDensityClass]))
            inputDensityElement = elements.at(-1)
            inputDensityElement.setAttribute("list", this.densitiesDatalistId);
            inputDensityElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            //NOTE: below is for the dynamic added input to display the density values as a title
            //if it a valid entry.
            inputDensityElement.addEventListener("input", function () {
                const value = this.value.trim();
                if (densities.hasOwnProperty(value)) {
                    this.title = `Density: ${densities[value]} mg/ml`;
                } else {

                    let newValue = parseFloat(value);
                    if (!Number.isFinite(newValue) || newValue <= 0) {
                        newValue = '';
                        this.title = "Select or input density. Currently using 1000 mg/ml";
                    }
                    else {
                        this.title = "Custom density.";
                    }
                    this.value = newValue;
                }
            });
            inputDensityElement.addEventListener("mousedown", function () {
                let value = parseFloat(this.value)
                if(this.value && (!Number.isFinite(value) || value <= 0)){
                    this.value = ''
                }
            })
        }


        const onValueChange = () => {

            //Note: this is for conversion with same type. need a conversion value and identifier for each type conversion
            //such as imp to metric and mass to vol.
            //in short a conversion function may be needed that takes the keys and pull from static tables
            //the keys in questions would need to be formated so their types can be extracted either prefix them or use
            //a fixed int structure

            if (item.updateValue) {
                outputValueElement.innerText = item.updateValue(inputValueElement.value) * this.multiplier
                return
            }
            if (type === 1) {
                //using `this` may be risky in callables, but since this is called in the class instance, then it should be fine
                //note: table may be change to an array if names(values) to be used or kept as is and values will be replace by string id or number index 
                //might just use an int and split into two componets. type and index. so if type is diffrent, will do the conversion on the type table untill in correct scope
                //and then use the conversion table
                outputValueElement.innerText = convert(inputValueElement.value, inputFromElement.value, inputToElement.value) * this.multiplier
                outputValueTypeElement.innerText = getConversionName(inputToElement.value)
                return
            }
            if (type === 2) {
                outputValueElement.innerText = convert(
                    inputValueElement.value,
                    inputFromElement.value,
                    inputToElement.value,
                    densities[inputDensityElement.value] ? densities[inputDensityElement.value] : inputDensityElement.value || 1000
                ) * this.multiplier
                outputValueTypeElement.innerText = getConversionName(inputToElement.value)
                return
            }
            outputValueElement.innerText = inputValueElement.value * this.multiplier
        }
        this.updateSignals.add(onValueChange)

        elements.push(this.addElement('button', input, { innerHTML: 'x', title: "Remove" }, [this.defaultItemClass, this.styles.removeButtonClass]))
        elements.at(-1).addEventListener('click', (event, handler = this) => {
            this.updateSignals.delete(onValueChange)
            handler.removeElements(elements)
            item.elements.length = 0;
            if (item.updateValue) { delete item.updateValue }
        });


        return item
    }

    //Note: add conv also add results. also the remove callable should remove the conv and results so there no reason to keep track of them
    remove() {
        this.removeElements([
            this.titleInput,
            this.upperInfoInput,
            this.lowerInfoInput,
            this.multiplierInput,
            this.addItemSelection,
            this.inputBox,
            this.outputBox,
            this.title,
            this.upperInfo,
            this.lowerInfo,
            this.defaultStyleElement,
            this.titleInputBox,
            this.body,
            this.densitiesDatalist
        ])
    }
    init(element_id = '', styles = {}, createDefaultStyle = true) {
        this.styles = styles
        this.container = document.getElementById(element_id) || document.body;
        //todo: should verify the element for existing componets, but this really should only be called to create it
        if (createDefaultStyle) {
            this.createDefaultStyle()
        }
        //data list for densities
        this.densitiesDatalist = document.createElement("datalist");
        if (!this.densitiesDatalistId) {
            //need an id, but may need to make the name less likly to be used
            this.densitiesDatalistId = 'RC_densitiesDatalist_defaultNULL'
        }
        this.densitiesDatalist.id = this.densitiesDatalistId
        Object.entries(densities).forEach(([key, value]) => {
            const option = document.createElement("option");
            option.value = key;
            this.densitiesDatalist.appendChild(option);
        });
        document.body.appendChild(this.densitiesDatalist);



        //this.defaultRowClass
        this.body = this.addElement('div', this.container, {}, [this.defaultBodyClass, styles.bodyClass])
        this.titleInputBox = this.addElement('div', this.body, {}, [this.defaultRowClass, styles.titleInputBoxClass])
        this.titleInput = this.addElement(
            'input',
            this.titleInputBox,
            {
                type: "text",
                name: 'Title',
                placeholder: 'Title',
                title: "Title"
            },
            [this.defaultTextClass, styles.titleInputClass]
        )
        this.titleInput.addEventListener('change', (event, handler = this) => {
            handler.title.innerText = event.target.value
        })
        this.upperInfoInput = this.addElement(
            'textarea',
            this.body,
            {
                name: 'Description',
                placeholder: 'Description',
                title: "Description"
            },
            [this.defaultRowClass, styles.upperInfoInputClass]
        )
        this.upperInfoInput.addEventListener('change', (event, handler = this) => {
            handler.upperInfo.innerText = event.target.value
        })

        this.multiplierInput = this.addElement(
            'input',
            this.titleInputBox,
            {
                type: 'number',
                name: 'Multiplier',
                min: Number.MIN_VALUE,
                value: 1,
                title: "Multiplier"
            },
            [this.defaultNumberClass, styles.multiplierInputClass]
        )

        this.multiplierInput.addEventListener('change', (event, handler = this) => {
            const value = Number(event.target.value);
            handler.multiplier = value;
            if (handler.multiplier != value) {
                event.target.value = handler.multiplier
                if (handler.debug) { console.warn(`multiplier value is invaild, reseting to last value(${handler.multiplier})  (value should be a positive number greater than 0).`) }
            }
            else {
                if (handler.debug) { console.log('multiplier value is set to ', handler.multiplier) }
            }
        });

        //this.inputBox = document.createElement("div");
        this.inputBox = this.addElement('div', this.body, {}, [this.defaultContainerClass, styles.inputBoxClass])


        this.addItemSelection = this.addElement(
            'select',
            this.body,
            { name: "Add item selection" },
            [this.defaultItemClass, styles.addItemSelectionClass]
        )
        this.addElement('option', this.addItemSelection,
            {
                value: '',
                textContent: 'select an field to create'
            }
        )
        this.addElement('option', this.addItemSelection,
            {
                value: 'field',
                textContent: 'A standard field'
            }
        )
        this.addElement('option', this.addItemSelection,
            {
                value: 'mass',
                textContent: 'Mass conversion'
            }
        )
        this.addElement('option', this.addItemSelection,
            {
                value: 'volume',
                textContent: 'volume conversion'
            }
        )
        this.addElement('option', this.addItemSelection,
            {
                value: 'all',
                textContent: 'All conversion'
            }
        )


        this.addItemSelection.addEventListener("change", (event, handler = this) => {
            switch (event.target.value) {
                case "field":
                    const item = this.createItem(0)
                    break;
                case "mass":
                    this.createItem(1, massIds, massIds)
                    break;
                case "volume":
                    this.createItem(1, volumeIds, volumeIds)
                    break;
                case "all":
                    this.createItem(2, allIds, allIds)
                    break;
                default:
                    if (handler.debug) { console.log("Unknown selection.") }
            }
            if (handler.debug) { console.log(event.target.value, ' was selected.') }
            event.target.value = "";

        });

        this.lowerInfoInput = this.addElement(
            'textarea',
            this.body,
            {
                name: 'Directions',
                placeholder: 'Directions',
                title: "Directions"
            },
            [this.defaultRowClass, styles.lowerInfoInputClass]
        )
        this.lowerInfoInput.addEventListener('change', (event, handler = this) => {
            handler.lowerInfo.innerText = event.target.value
        })




        this.title = this.addElement('p', this.body, {}, [this.defaultRowClass, styles.titleClass])
        this.upperInfo = this.addElement('p', this.body, {}, [this.defaultRowClass, styles.upperInfoClass])

        this.outputBox = this.addElement('div', this.body, {}, [this.defaultContainerClass, styles.outputBoxClass])

        this.lowerInfo = this.addElement('p', this.body, {}, [this.defaultRowClass, styles.lowerInfoClass])

    }
}
