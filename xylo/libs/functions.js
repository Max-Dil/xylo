/*
MIT License

Copyright (c) 2025 Max-Dil

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
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