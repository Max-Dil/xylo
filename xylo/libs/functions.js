/*
Phoenix Developer License (PDL), Version 1.0
Copyright Max-Dil, 2025
Software Usage Terms
This license governs your use of the software, its source code, components, and related materials (hereinafter referred to as the "Software").
By accepting the terms of this license, you agree to comply with its provisions.
By editing the source code, you automatically accept the license.
1. Grant of Rights
The Licensor grants you a non-exclusive, non-transferable, limited right to:
Use the Software on any number of devices.
Modify the source code for personal purposes or internal use.
2. Restrictions
You are prohibited from:
Distributing, publishing, or transferring the source code of the Software or its modified versions to third parties without written permission from the Licensor.
Using the Software for purposes that violate the laws of your jurisdiction.
Removing, obscuring, or altering copyright notices or license terms from the source code.
3. Disclaimer of Warranties and Liability
The Software is provided "as is," without any warranties, express or implied.
The Licensor shall not be held liable for any direct, indirect, incidental, consequential damages, loss of profits, or other losses arising from the use or inability to use the Software.
4. Copyright and Modification
All rights to the source code, structure, logic, and documentation belong to the Licensor.
Any modifications to the Software are considered derivative works. Their distribution requires written consent from the Licensor.
5. Termination
This license automatically terminates if you breach its terms. In such cases, you must destroy all copies of the Software.
6. Governing Law
This license is governed by the laws of the Russian Federation. Disputes shall be resolved in the courts of the respective jurisdiction.
*/
const pcall = async (func, ...args) => {
    try {
        if (typeof func !== 'function') {
            return { result: null, error: 'Attempt to call a non-function', isComplete: false };
        }

        const result = await func(...args);
        return { result: result, error: null, isComplete: true };
    } catch (error) {
        console.error("pcall caught error:", error);
        return { result: null, error: error.message, isComplete: false };
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message || 'Condition is false'}`);
    }
};

const error = (message) => {
    throw new Error(message);
};

const xpcall = async (func, errHandler, ...args) => {
    try {
        const result = await func(...args);
        return { result: result, error: null, isComplete: true };
    } catch (error) {
        try {
            const errResult = await errHandler(error); 
            return { result: errResult, error: error.message, isComplete: false, handled: true };
        } catch (handlerError) {
            console.error("Error handler failed:", handlerError);
            return { result: null, error: handlerError.message, isComplete: false, handled: false };

        }
    }
};

const tonumber = (value, base = 0) => {
    const num = Number(value);
    return isNaN(num) ? base : num;
};

const tostring = function(value) {
    return String(value);
}


const type = (value) => {
    if (value === null) {
        return 'null';
    }
    if (value === undefined) {
        return 'undefined';
    }

    const jsType = typeof value;
    if (jsType === 'number') {
        return 'number';
    } else if (jsType === 'string') {
        return 'string';
    } else if (jsType === 'boolean') {
        return 'boolean';
    } else if (jsType === 'function') {
        return 'function';
    } else if (jsType === 'object') {
        return 'table';
    } else {
        return jsType;
    }
};

const warn = (message) => {
    console.warn(message);
};

const len = async function (...inputs) {
    let totalLength = 0;  
  
    for (const input of inputs) {
      totalLength += tonumber((Array.isArray(input) || typeof input === 'string'  ? input.length : Object.keys(input).length));
    }   

    return totalLength;
};

const createIterator = function(generator) {
    let nextValue = generator();
    return {
        next: () => {
            if (nextValue === null) {
                return { done: true };
            }
            const value = nextValue;
            nextValue = generator();
            return { value: value, done: false };
        },
        [Symbol.iterator]: function() { return this; }
    };
}

const toArray = (table) => Object.entries(table).sort((a, b) => Number(a[0]) - Number(b[0])).map(([_, v]) => v);
const ipairs = (table) => {
    let array = table;
    if (type(table) === "table") {
        array = toArray(table);
    }
    if (!Array.isArray(array) && typeof array != 'string') {
        throw new Error("ipairs expects array-like table");
    }

    let i = 0;
    return createIterator(() => {
        if (i < array.length) {
            return [i, array[i++]];
        }
        return null;
    });
};

const pairs = (table) => {
    if (Array.isArray(table)) {
        const keys = Object.keys(table);
        return createIterator(() => {
            if (i < keys.length) {
                const key = keys[i];
                i++;
                return [Number(key), table[key]];
            }
            return null;
        });
    }
    
    const keys = Object.keys(table);
    let i = 0;
    return createIterator(() => {
        if (i < keys.length) {
            const key = keys[i];
            i++;
            return [key, table[key]];
        }
        return null;
    });
};

const next = (table, state) => {
    const keys = Object.keys(table);
    let startIndex = state === null ? 0 : keys.indexOf(state) + 1;

    if (startIndex < keys.length) {
        const key = keys[startIndex];
        return [key, table[key]];
    } else {
        return null;
    }
};

const print = function(...args) {
    console.log(...args);
};

export {
    print,
    pcall,
    len,
    warn,
    assert,
    xpcall,
    type,
    tostring,
    tonumber,
    error,
    ipairs,
    pairs,
    next,
}