import { convert, getConversionName, densities, volumeIds, massIds, allIds } from './culinary_conversions.js';
import { createElement, removeElements } from './create_html_element.js'
import { markdownToHtml } from '/lib/inline_parsers/markdown_parser.js'
import { parseInlineFunction } from '/lib/inline_parsers/func_parser.js'
import { parseInlineVariable } from '/lib/inline_parsers/var_parser.js'
import { calc } from '/lib/inline_parsers/calc_parser.js'

//TODO: Maybe manage a small database of the values like the multiplier
//and type_index to get an item current value or densitry (or label)
//just need to deside on a null default (either 0 or 1 for numbers, but need to see if the calc allow ||, then the user could define something)

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
    }
    requestUpdate() {
        if (this.#requestUpdate) { return }
        this.#requestUpdate = true
        requestAnimationFrame(() => this.update(this));
    }


    idenifier = "recipe-converter"
    getLayoutHtml(idenifier = this.idenifier) {
        //TODO: add a way to load a external layout
        //but for now disable layout generation could be a solution
        return `<div class='${idenifier}'>
        
            <div class='input body'>
                <div class='row'>
                    <input id='${idenifier}-input-title' class='text-input' name='Title' placeholder='Title' title='Title'>
                    <input id='${idenifier}-input-multiplier' class='value-input' name='Multiplier' value=1 title='Multiplier'>
                </div>
                <div class='row'>
                    <textarea id='${idenifier}-input-description' name='Description' placeholder='Description' title='Description'></textarea>
                </div>
                <div id='${idenifier}-input-box'>
                </div>
                <div class='row'>
                    <select name="Add item selection" id='${idenifier}-add-item'>
                        <option value="">select an field to create</option>
                        <option value="field">A standard field</option>
                        <option value="mass">Mass conversion</option>
                        <option value="volume">volume conversion</option>
                        <option value="all">All conversion</option>
                    </select>
                </div>  
                <div class='row'>
                    <textarea id='${idenifier}-input-directions' name='Directions' placeholder='Directions' title='Directions'></textarea>
                </div>
            </div>

            <div class='output body'>
                <div id='${idenifier}-output-title' class='row' style="display: none;">
                </div>
                <div id='${idenifier}-output-description' class='row' style="display: none;">
                </div>
                <div id='${idenifier}-output-box'>
                </div>
                <div id='${idenifier}-output-directions' class='row' style="display: none;">
                </div>
            </div>
        </div>`
    }

    //this handles the basic item layout without dealing with select types
    //(the dedicated item types will handle that)
    createItem(type = 0, fromTable = allIds, toTable = undefined) {
        const item = { elements: [] }
        const elements = item.elements
        elements.push(createElement('div', this.inputBox, {}, ['row']))
        const input = elements.at(-1)
        elements.push(createElement('div', this.outputBox, {}, ['row']))
        const output = elements.at(-1)

        elements.push(createElement(
            'input',
            input,
            {
                name: 'Display Name',
                placeholder: 'Label',
                title: "Label"
            },
            ['text-input']
        ))
        const inputLabelElement = elements.at(-1)
        inputLabelElement.addEventListener('change', (event, handler = this) => {
            handler.requestUpdate()
        });

        elements.push(createElement('input', input, { name: 'Value', title: "Value", placeholder: 'Amount' }, ['value-input']))
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
            elements.push(createElement('select', input, { name: 'From', title: "From" }))
            inputFromElement = elements.at(-1)
            inputFromElement.addEventListener('change', (event, handler = this) => {
                handler.requestUpdate()
            });
            elements.push(createElement('select', input, { name: 'To', title: "To" }))
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
            elements.push(createElement('input', input, { name: 'Density', title: "Density", placeholder: 'Density' }))
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
            //this.titleInput,
            //this.upperInfoInput,
            // this.lowerInfoInput,
            // this.multiplierInput,
            // this.addItemSelection,
            // this.inputBox,
            //this.outputBox,
            //this.title,
            //this.upperInfo,
            //this.lowerInfo,
            //this.defaultStyleElement,
            //this.titleInputBox,
            //this.inputBody,
            //this.outputBody,
            this.densitiesDatalist
        ])
    }
    init(element_id = '', styles = this.defaultStyles) {
        this.styles = styles
        this.container = document.getElementById(element_id) || document.body;
        this.container.innerHTML = `${this.getLayoutHtml()}${this.container.innerHTML}`

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

        this.titleInput = document.getElementById(`${this.idenifier}-input-title`)
        this.titleOutput = document.getElementById(`${this.idenifier}-output-title`)

        this.titleInput.addEventListener('change', (event, handler = this) => {
            handler.titleOutput.innerHTML = textProcessing(event.target.value)
            if (handler.titleOutput.textContent) {
                handler.titleOutput.style.removeProperty("display");
                return
            }
            handler.titleOutput.style.display = 'none';
        })
        this.descriptionInput = document.getElementById(`${this.idenifier}-input-description`)
        this.descriptionOutput = document.getElementById(`${this.idenifier}-output-description`)

        this.descriptionInput.addEventListener('change', (event, handler = this) => {
            handler.descriptionOutput.innerHTML = textProcessing(event.target.value)
            if (handler.descriptionOutput.textContent) {
                handler.descriptionOutput.style.removeProperty("display");
                return
            }
            handler.descriptionOutput.style.display = 'none';
        })

        this.directionsInput = document.getElementById(`${this.idenifier}-input-directions`)
        this.directionsOuput = document.getElementById(`${this.idenifier}-output-directions`)

        this.directionsInput.addEventListener('change', (event, handler = this) => {
            handler.directionsOuput.innerHTML = textProcessing(event.target.value)
            if (handler.directionsOuput.textContent) {
                handler.directionsOuput.style.removeProperty("display");
                return
            }
            handler.directionsOuput.style.display = 'none';
        })

        this.inputBox = document.getElementById(`${this.idenifier}-input-box`)
        this.outputBox = document.getElementById(`${this.idenifier}-output-box`)

        this.multiplierInput = document.getElementById(`${this.idenifier}-input-multiplier`)
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


        this.addItemSelection = document.getElementById(`${this.idenifier}-add-item`)
        this.addItemSelection.addEventListener("change", (event, handler = this) => {
            switch (event.target.value) {
                case "field":
                    this.createItem(0)
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
    }
}
