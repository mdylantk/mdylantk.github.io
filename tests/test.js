
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
function convertVol(value,from=0,to=0){
   return convert(value, from, to, volConvTable, VOL_MET_START)
}
let value = 10, from = 2, to = VOL_MET_START
console.log(value,' ',from,' ',to,' ',convertVol(value,from,to))

//the idea is this will proveide an init function that will find and populate an element with the passed id
//(might use doc body if none or log an error)
//the container will have a multipler and a add section 
//while add provides a few elements that represent mass conversion, volumn conversion, value entry(for just multication), and  maybe a mass/volumn conversion that
//item types to be defined due to the mass to volumn need a const that diffrent base on the item

//NOTE sould add a string feild that represents what the item is. also may be good to add a feature to use an output element that display only the results
//may be better to have the results at a diffrent area. reduce the size of the input and keep the results simple. name plus value also multipler at top with maybe a title
//if added. 

class recipeConversion{
    container
    //Note: each element would have a class realted to the role
    //title, multiplier, container for the conversions, container for the results, display name, value, type, from, to, remove, add

    removeItems(items=[]){
        //this is to be used as a callable. items should be a cache array of the items in question instead of have two remove (one for an item and another for two items)
        //NOTE: on change and update results may be created inside the add functions due to each case handling it diffrently
    }
    
    //Note: add conv also add results. also the remove callable should remove the conv and results so there no reason to keep track of them
    addMassConvItem(){
        const item = document.createElement("div");
        item.classList.add("item")
        this.container.appendChild(item);

    }
    addVolConvItem(){

    }
    init(element_id=''){
        this.container = document.getElementById(element_id) || document.body;
        
    }
}