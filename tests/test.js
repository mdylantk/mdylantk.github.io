import { convert, getConversionName, densities, volumeIds, massIds, allIds } from './culinary_conversions.js';
import { createElement, removeElements } from './create_html_element.js'
import { markdownToHtml } from '/lib/inline_parsers/markdown_parser.js'
import { parseInlineFunction } from '/lib/inline_parsers/func_parser.js'
import { parseInlineVariable } from '/lib/inline_parsers/var_parser.js'
import { calc } from '/lib/inline_parsers/calc_parser.js'


function textProcessing(text) {
    text = parseInlineVariable(text)
    text = parseInlineFunction(text)
    text = markdownToHtml(text);
    return text
}
function numberProcessing(exp) {
    //parse the vars if some are numbers
    //note: too much var could casue issues and this
    //not a solution for a large database
    exp = parseInlineVariable(exp)
    exp = Number(calc(exp))
    if (!Number.isNaN(exp)) {
        return exp
    }
    return 0
}

export class RecipeConversion {
    defaultStyles = {}
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
        console.log(this.outputBody.innerText)
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
        //this.defaultStyleElement.type = 'text/css';

        this.defaultStyleElement.textContent = `
            .${this.defaultBodyClass} {
                border: 1px solid #000306;
            }
            .${this.defaultContainerClass} {
                display:block;
                margin: 1px;
            }
            .${this.defaultRowClass} {
                display:block;
            }
            .${this.defaultItemClass} {
                margin: 1px;
            }
            .${this.defaultNumberClass} {
                width: 10%;
                min-width: 32px;
                max-width: 128px;
                margin: 1px;
            }
            .${this.defaultTextClass} {
                width: 25%;
                min-width: 128px;
                max-width: 320px;
                margin: 1px;
            }
        `;

        // 3. Append style to <head> so it applies globally
        document.head.appendChild(this.defaultStyleElement);
    }

    //this handles the basic item layout without dealing with select types
    //(the dedicated item types will handle that)
    createItem(type = 0, fromTable = allIds, toTable = undefined) {
        const item = { elements: [] }
        const elements = item.elements
        elements.push(createElement('div', this.inputBox, {}, [this.defaultRowClass]))
        const input = elements.at(-1)
        elements.push(createElement('div', this.outputBox, {}, [this.defaultRowClass]))
        const output = elements.at(-1)

        elements.push(createElement(
            'input',
            input,
            {
                name: 'Display Name',
                placeholder: 'Label',
                title: "Label"
            },
            [this.defaultTextClass, this.styles.inputLabelClass]))
        const inputLabelElement = elements.at(-1)
        inputLabelElement.addEventListener('change', (event, handler = this) => {
            handler.requestUpdate()
        });

        elements.push(createElement('input', input, { name: 'Value', title: "Value", placeholder: 'Amount' }, [this.defaultNumberClass, this.inputValueClass]))
        const inputValueElement = elements.at(-1)
        inputValueElement.addEventListener('change', (event, handler = this) => {
            //outputValueElement.innerText = onValueChange(inputValueElement.value)
            //number processing needed for the input box, not output
            try {
                event.target.value = numberProcessing(event.target.value);
            }
            catch (error) {
                if (this.debug) { console.log(error) }
                event.target.value = 0
            }
            handler.requestUpdate()
        });

        let inputFromElement
        let inputToElement
        let inputDensityElement
        if (type === 1 || type === 2) {
            elements.push(createElement('select', input, { name: 'From', title: "From" }, [this.defaultItemClass, this.styles.inputFromClass]))
            inputFromElement = elements.at(-1)
            inputFromElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            elements.push(createElement('select', input, { name: 'To', title: "To" }, [this.defaultItemClass, this.styles.inputToClass]))
            inputToElement = elements.at(-1)
            inputToElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });

            if (fromTable) {
                for (const id of fromTable) {
                    elements.push(createElement('option', inputFromElement, { value: id || 0, textContent: getConversionName(id) }))
                }
                //Object.keys(fromTable).forEach(key => {
                //    elements.push(createElement('option', inputFromElement, { value: fromTable[key] || 0, textContent: key }))
                //});
            }
            if (toTable) {
                for (const id of toTable) {
                    elements.push(createElement('option', inputToElement, { value: id || 0, textContent: getConversionName(id) }))
                }
                //Object.keys(toTable).forEach(key => {
                //    elements.push(createElement('option', inputToElement, { value: toTable[key] || 0, textContent: key }))
                //});
            }
        }
        if (type === 2) {
            elements.push(createElement('input', input, { name: 'Density', title: "Density", placeholder: 'Density' }, [this.defaultItemClass, this.styles.inputDensityClass]))
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
                if (this.value && (!Number.isFinite(value) || value <= 0)) {
                    this.value = ''
                }
            })
        }


        const onValueChange = () => {
            let value = inputValueElement.value * this.multiplier
            let measurement
            if (type === 1) {
                value = convert(inputValueElement.value, inputFromElement.value, inputToElement.value) * this.multiplier
                measurement = getConversionName(inputToElement.value)
            }
            if (type === 2) {
                value = convert(
                    inputValueElement.value,
                    inputFromElement.value,
                    inputToElement.value,
                    densities[inputDensityElement.value] ? densities[inputDensityElement.value] : inputDensityElement.value || 1000
                ) * this.multiplier
                measurement = getConversionName(inputToElement.value)
            }
            output.innerHTML = textProcessing(`${inputLabelElement.value} ${value} ${measurement || ''}`)
        }
        this.updateSignals.add(onValueChange)

        elements.push(createElement('button', input, { innerHTML: 'x', title: "Remove" }, [this.defaultItemClass, this.styles.removeButtonClass]))
        elements.at(-1).addEventListener('click', (event, handler = this) => {
            this.updateSignals.delete(onValueChange)
            removeElements(elements)
            item.elements.length = 0;
            if (item.updateValue) { delete item.updateValue }
        });


        return item
    }


    //Note: add conv also add results. also the remove callable should remove the conv and results so there no reason to keep track of them
    remove() {
        removeElements([
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
            this.inputBody,
            this.outputBody,
            this.densitiesDatalist
        ])
    }
    init(element_id = '', styles = this.defaultStyles, createDefaultStyle = true) {
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
        this.inputBody = createElement('div', this.container, {}, [this.defaultBodyClass, styles.inputBodyClass])
        this.titleInputBox = createElement('div', this.inputBody, {}, [this.defaultRowClass, styles.titleInputBoxClass])
        this.titleInput = createElement(
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
            handler.title.innerHTML = textProcessing(event.target.value)
        })
        this.upperInfoInput = createElement(
            'textarea',
            this.inputBody,
            {
                name: 'Description',
                placeholder: 'Description',
                title: "Description"
            },
            [this.defaultRowClass, styles.upperInfoInputClass]
        )
        this.upperInfoInput.addEventListener('change', (event, handler = this) => {
            handler.upperInfo.innerHTML = textProcessing(event.target.value)
        })

        this.multiplierInput = createElement(
            'input',
            this.titleInputBox,
            {

                name: 'Multiplier',
                min: Number.MIN_VALUE,
                value: 1,
                title: "Multiplier"
            },
            [this.defaultNumberClass, styles.multiplierInputClass]
        )
        this.multiplierInput.addEventListener('change', (event, handler = this) => {
            let value = 1
            try {
                value = numberProcessing(event.target.value);
            }
            catch (error) {
                if (this.debug) { console.log(error) }
            }
            if (event.target.value != value) {
                event.target.value = value;
            }
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
        this.inputBox = createElement('div', this.inputBody, {}, [this.defaultContainerClass, styles.inputBoxClass])


        this.addItemSelection = createElement(
            'select',
            this.inputBody,
            { name: "Add item selection" },
            [this.defaultItemClass, styles.addItemSelectionClass]
        )
        createElement('option', this.addItemSelection,
            {
                value: '',
                textContent: 'select an field to create'
            }
        )
        createElement('option', this.addItemSelection,
            {
                value: 'field',
                textContent: 'A standard field'
            }
        )
        createElement('option', this.addItemSelection,
            {
                value: 'mass',
                textContent: 'Mass conversion'
            }
        )
        createElement('option', this.addItemSelection,
            {
                value: 'volume',
                textContent: 'volume conversion'
            }
        )
        createElement('option', this.addItemSelection,
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

        this.lowerInfoInput = createElement(
            'textarea',
            this.inputBody,
            {
                name: 'Directions',
                placeholder: 'Directions',
                title: "Directions"
            },
            [this.defaultRowClass, styles.lowerInfoInputClass]
        )
        this.lowerInfoInput.addEventListener('change', (event, handler = this) => {
            handler.lowerInfo.innerHTML = textProcessing(event.target.value)
        })






        this.outputBody = createElement('div', this.container, {}, [this.defaultBodyClass, styles.outputBodyClass])
        this.title = createElement('p', this.outputBody, {}, [this.defaultRowClass, styles.titleClass])
        this.upperInfo = createElement('p', this.outputBody, {}, [this.defaultRowClass, styles.upperInfoClass])
        this.outputBox = createElement('div', this.outputBody, {}, [this.defaultContainerClass, styles.outputBoxClass])
        this.lowerInfo = createElement('p', this.outputBody, {}, [this.defaultRowClass, styles.lowerInfoClass])

    }
}
