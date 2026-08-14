
const volConvId = {
    MET_TO_IMP: 0, M_TSP: 1, TSP: 2, TBSP: 3, FL_OZ: 4,
    CUP: 5, PINT: 6, QUART: 7, GALLON: 8,
    ML: 9, L: 10
}
const volConvTable = [
    3.24614624, 1, 16, 48, 96,
    768, 1536, 3072, 12288,
    1, 1000
]
const VOL_MET_START = 9

function convert(value, from = 0, to = 0, table = [], secondSetStart = 0) {
    let result = value
    const fromMulti = table[from]
    const toMulti = table[to]
    if (fromMulti) {
        result *= fromMulti
    }
    //will only handle a second set. if there more than 2 conversion type, then the upper can chain these in the correct order and split
    //the table into sets of two. or could make another function that solve it. generally this is for imp and met
    //and not nessary needed.could have the upper convert to smallest unit of each case and then run these 
    //and have a table of each conversion (can still group related conversion, just need to make sure the checks catches them)
    if (secondSetStart) {
        if (from >= VOL_MET_START && to < VOL_MET_START || to >= VOL_MET_START && from < VOL_MET_START) {
            //convert to the correct unit
            if (from > to) {
                //met to imp
                result *= table[0]
            }
            else {
                //imp to met
                result /= table[0]
            }
        }
    }
    if (toMulti) {
        result /= toMulti
    }
    return result
}
function convertVol(value, from = 0, to = 0) {
    return convert(value, from, to, volConvTable, VOL_MET_START)
}
let value = 10, from = 2, to = VOL_MET_START
console.log(value, ' ', from, ' ', to, ' ', convertVol(value, from, to))

//the idea is this will proveide an init function that will find and populate an element with the passed id
//(might use doc body if none or log an error)
//the container will have a multipler and a add section 
//while add provides a few elements that represent mass conversion, volumn conversion, value entry(for just multication), and  maybe a mass/volumn conversion that
//item types to be defined due to the mass to volumn need a const that diffrent base on the item

//NOTE sould add a string feild that represents what the item is. also may be good to add a feature to use an output element that display only the results
//may be better to have the results at a diffrent area. reduce the size of the input and keep the results simple. name plus value also multipler at top with maybe a title
//if added. 

class RecipeConversion {
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
    roughFormat = true
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


    //start of css class overrides
    titleInputClass //user defined feild for things like title of a recipe
    upperInfoInputClass //user defined feild for things like what the recipe is about
    lowerInfoInputClass //user defined feild for other info such as baking instructions. this part would render below the results if printouts are supported
    multiplierInputClass //a number feild that will mulitply the input by if greater than 0
    addItemSelectionClass

    titleClass //user defined feild for things like title of a recipe
    upperInfoClass //user defined feild for things like what the recipe is about
    lowerInfoClass


    inputBoxClass
    inputLabelClass
    inputTypeClass
    inputValueClass
    inputFromClass
    inputToClass
    inputOptionsClass //this is for things like rounding the results or not to round and maybe other things

    outputBoxClass
    outputlabelClass
    outputTypeClass
    outputValueClass

    massConvClass
    volConvClass
    //end of css class overrides

    //Note: each element would have a class realted to the role
    //title, multiplier, container for the conversions, container for the results, display name, value, type, from, to, remove, add

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
                element.classList.add(this.cssClass)
            }
        }
        if (parent) {
            parent.appendChild(element)
        }
        return element
    }
    conversionTable = [
        [1, 16, 48, 96, 768, 1536, 3072, 12288],//spoons and cups using 1/16 of a tsp as the base
        [1, 1000]//liters using ml as the base
    ]
    convertValue(value, from, to, table = this.conversionTable) {
        let result = value

        //note: 0124 where 12 is the index and 4 is the type
        const fromType = from % 10
        const fromIndex = Math.floor(from / 10)
        const toType = to % 10
        const toIndex = Math.floor(to / 10)
        const fromValue = table[fromType][fromIndex] || 1
        const toValue = table[toType][toIndex] || 1
        result *= fromValue
        if (fromType !== toType) {
            //run the conversion logic between types
        }
        result /= toValue

        return result
    }
    //this handles the basic item layout without dealing with select types
    //(the dedicated item types will handle that)
    createItem(type = 0, fromTable = {}, toTable = {}) {
        const item = { elements: [] }
        const elements = item.elements
        elements.push(this.addElement('div', this.inputBox))
        const input = elements.at(-1)
        elements.push(this.addElement('div', this.outputBox))
        const output = elements.at(-1)

        elements.push(this.addElement('input', input, { name: 'Display Name' }, [this.inputLabelClass]))
        const inputLabelElement = elements.at(-1)
        elements.push(this.addElement('span', output, { innerText: inputLabelElement.value }, [this.outputLabelClass]))
        const outputLabelElement = elements.at(-1)
        inputLabelElement.addEventListener('change', () => {
            outputLabelElement.innerText = inputLabelElement.value
        });

        elements.push(this.addElement('input', input, { name: 'Value' }, [this.inputValueClass]))
        const inputValueElement = elements.at(-1)
        elements.push(this.addElement('span', output, { innerText: inputValueElement.value }, [this.outputValueClass]))
        const outputValueElement = elements.at(-1)
        inputValueElement.addEventListener('change', (event, handler = this) => {
            //outputValueElement.innerText = onValueChange(inputValueElement.value)
            handler.requestUpdate()
        });

        let inputFromElement
        let inputToElement
        if (type === 1) {
            elements.push(this.addElement('select', input, { name: 'From' }, [this.inputFromClass]))
            inputFromElement = elements.at(-1)
            inputFromElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            elements.push(this.addElement('select', input, { name: 'To' }, [this.inputToClass]))
            inputToElement = elements.at(-1)
            inputToElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            if (fromTable) {
                Object.keys(fromTable).forEach(key => {
                    elements.push(this.addElement('option', inputFromElement, { value: fromTable[key] || 0, textContent: key }))
                });
            }
            if (toTable) {
                Object.keys(toTable).forEach(key => {
                    elements.push(this.addElement('option', inputToElement, { value: toTable[key] || 0, textContent: key }))
                });
            }
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
                outputValueElement.innerText = this.convertValue(inputValueElement.value, inputFromElement.value, inputToElement.value) * this.multiplier
                return
            }
            outputValueElement.innerText = inputValueElement.value * this.multiplier
        }
        this.updateSignals.add(onValueChange)

        elements.push(this.addElement('button', input, { innerHTML: 'x' }, [this.removeButtonClass]))
        elements.at(-1).addEventListener('click', (event, handler = this) => {
            this.updateSignals.delete(onValueChange)
            handler.removeElements(elements)
            item.elements.length = 0;
            if (item.updateValue) { delete item.updateValue }
        });


        return item
    }

    //Note: add conv also add results. also the remove callable should remove the conv and results so there no reason to keep track of them
    addMassConvItem() {
        const item = this.createItem(1)

    }
    addVolConvItem() {
        //TODO: the table can be stored elsewhere or handle diffrently. depends since mass to vol would be pulling from these tables
        //may make a big static(or single instance) table and just pass their display names as a array to the create item to pull from that table
        //or keep the id and add a display name table. (note: current index is not safe for an array look up due to only 2-3 of the first digets being used)
        const table = {
            M_TSP: 0, TSP: 10, TBSP: 20, FL_OZ: 30,
            CUP: 40, PINT: 50, QUART: 60, GALLON: 70
        }
        const item = this.createItem(1, table, table)

    }
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
            this.lowerInfo

        ])
    }
    init(element_id = '') {
        this.container = document.getElementById(element_id) || document.body;
        //todo: should verify the element for existing componets, but this really should only be called to create it

        this.titleInput = this.addElement(
            'input',
            undefined,
            {
                type: "text",
                name: 'Title',
                placeholder: 'Title'
            },
            [this.titleInputClass]
        )
        this.titleInput.addEventListener('change', (event, handler = this) => {
            handler.title.innerText = event.target.value
        })

        this.upperInfoInput = this.addElement(
            'textarea',
            undefined,
            {
                name: 'Description',
                placeholder: 'Description'
            },
            [this.upperInfoInputClass]
        )
        this.upperInfoInput.addEventListener('change', (event, handler = this) => {
            handler.upperInfo.innerText = event.target.value
        })

        this.lowerInfoInput = this.addElement(
            'textarea',
            undefined,
            {
                name: 'Directions',
                placeholder: 'Directions'
            },
            [this.lowerInfoInputClass]
        )
        this.lowerInfoInput.addEventListener('change', (event, handler = this) => {
            handler.lowerInfo.innerText = event.target.value
        })

        this.multiplierInput = this.addElement(
            'input',
            undefined,
            {
                type: 'number',
                name: 'Multiplier',
                min: Number.MIN_VALUE,
                value: 1
            },
            [this.multiplierInputClass]
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
        this.inputBox = this.addElement('div', undefined, {}, [this.inputBoxClass])


        this.addItemSelection = this.addElement(
            'select',
            undefined,
            { name: "Add item selection" },
            [this.addItemSelectionClass]
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
                textContent: 'A field that allows mass conversio'
            }
        )
        this.addElement('option', this.addItemSelection,
            {
                value: 'volumn',
                textContent: 'A field that allows Volumn conversion'
            }
        )

        this.addItemSelection.addEventListener("change", (event, handler = this) => {
            switch (event.target.value) {
                case "field":
                    const item = this.createItem(0)
                    break;
                case "mass":
                    this.addMassConvItem()
                    break;
                case "volumn":
                    this.addVolConvItem()
                    break;
                default:
                    if (handler.debug) { console.log("Unknown selection.") }
            }
            if (handler.debug) { console.log(event.target.value, ' was selected.') }
            event.target.value = "";

        });


        this.outputBox = this.addElement('div', undefined, {}, [this.outputBoxClass])

        this.title = this.addElement('p', undefined, {}, [this.titleClass])
        this.upperInfo = this.addElement('p', undefined, {}, [this.upperInfoClass])
        this.lowerInfo = this.addElement('p', undefined, {}, [this.lowerInfoClass])

        //adding the elements in the ideal order

        this.container.appendChild(this.titleInput);
        this.container.appendChild(this.multiplierInput);
        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.upperInfoInput);

        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.inputBox);

        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.addItemSelection);

        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.lowerInfoInput);


        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.title);
        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.upperInfo);
        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.outputBox);
        if (this.roughFormat) { this.container.appendChild(document.createElement("br")); }
        this.container.appendChild(this.lowerInfo);

    }
}

//const testWidget = new RecipeConversion()
//const testContainer = document.createElement("div");
//testContainer.id = 'testContainer'
//document.body.appendChild(testContainer);
//testWidget.init('testContainer')