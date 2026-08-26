export const conversionTable = [
    [
        1, 4, 8, 16, 12, 24, 48, 96,
        192, 384, 768, 1536, 3072, 6144, 12288
    ],//spoons and cups using 1/16 of a tsp as the base
    [1, 1000],//liters using ml as the base
    [1, 16],
    [1, 1000, 1000000]
]
export const conversionNames = [
    [
        '1/16 tsp', '1/4 tsp', '1/2 tsp', 'tsp', '1/4 tbsp', '1/2 tbsp', 'tbsp', 'fl oz',
        '1/4 cup', '1/2 cup', 'cup', 'pint', 'quart', 'half gallon', 'gallon'
    ],
    ['ml', 'litters'],
    ['oz', 'lb'],
    ['mg', 'g', 'kg']
]
export const CONVERSION_KEYS = {
    M_TSP: 0, Q_TSP: 10, H_TSP: 20, TSP: 30,
    Q_TBSP: 40, H_TBSP: 50, TBSP: 60,
    FL_OZ: 70,
    Q_CUP: 80, H_CUP: 90, CUP: 100,
    PINT: 110, QUART: 120, H_GALLON: 130, GALLON: 140,
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
export const TYPE_KEYS = {
    IMP_VOLUME: 0, MET_VOLUME: 1, IMP_MASS: 2, MET_MASS: 3, DENSITY: 4
}
export const volumeIds = [
    CONVERSION_KEYS.ML, CONVERSION_KEYS.L,
    CONVERSION_KEYS.M_TSP, CONVERSION_KEYS.Q_TSP, CONVERSION_KEYS.H_TSP, CONVERSION_KEYS.TSP,
    CONVERSION_KEYS.Q_TBSP, CONVERSION_KEYS.H_TBSP, CONVERSION_KEYS.TBSP, CONVERSION_KEYS.FL_OZ,
    CONVERSION_KEYS.Q_CUP, CONVERSION_KEYS.H_CUP, CONVERSION_KEYS.CUP,
    CONVERSION_KEYS.PINT, CONVERSION_KEYS.QUART, CONVERSION_KEYS.H_GALLON,CONVERSION_KEYS.GALLON
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