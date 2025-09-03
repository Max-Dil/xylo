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

const createString = function() {
    const escapeRegex = function(pattern) {
        return pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    const iteratorToObject = function(iterator) {
        const obj = {};
        let index = 0;
        for (const value of iterator) {
            obj[index++] = value;
        }
        return obj;
    }

    return {
        byte: (s, i = 0) => s.charCodeAt(i),
    
        char: (...args) => {
            return String.fromCharCode(...args);
        },
    
        dump: (func) => {
            return func.toString();
        },
    
        find: (s, pattern, init = 0, plain = false) => {
            init = Math.max(init, 0);
            if (plain) pattern = escapeRegex(pattern);
            
            const regex = new RegExp(pattern);
            const match = s.slice(init).match(regex);
            
            return match 
                ? {0: match.index + init, 1: match.index + init + match[0].length - 1}
                : null;
        },
    
        format: (formatString, ...args) => {
            let argIndex = 0;
            return formatString.replace(/%([%scdefgiouxXq])/g, (match, specifier) => {
                if (specifier === '%') {
                    return '%';
                }
    
                if (argIndex >= args.length) {
                    return match;
                }
    
                const arg = args[argIndex++];
    
                switch (specifier) {
                    case 's': return String(arg);
                    case 'c': return String.fromCharCode(Number(arg));
                    case 'd':
                    case 'i': return parseInt(arg, 10).toString();
                    case 'e': return Number(arg).toExponential();
                    case 'f': return Number(arg).toFixed(6);
                    case 'g': return Number(arg).toPrecision();
                    case 'o': return parseInt(arg, 10).toString(8);
                    case 'u': return Math.abs(parseInt(arg, 10)).toString();
                    case 'x': return parseInt(arg, 10).toString(16);
                    case 'X': return parseInt(arg, 10).toString(16).toUpperCase();
                    case 'q': return `"${String(arg).replace(/"/g, '\\"')}"`;
                    default: return match;
                }
            });
        },
    
        gmatch: (s, pattern) => {
            const regex = new RegExp(pattern, 'g');
            let match;
            const iterator = {
                next: () => {
                    match = regex.exec(s);
                    if (match) {
                        const obj = {};
                        match.slice(0).forEach((val, i) => obj[i] = val);
                        return {value: obj, done: false};
                    } else {
                        return {value: undefined, done: true};
                    }
                },
                [Symbol.iterator]() { return this; }
            };
    
            return iterator;
        },
    
        gsub: async (s, pattern, repl, n = Infinity) => {
            let count = 0;
            let result = '';
            let lastIndex = 0;
    
            let regex;
            if (typeof pattern === 'string') {
                regex = new RegExp(pattern, 'g');
            } else {
                regex = pattern;
            }
        
            let match;
            while ((match = regex.exec(s)) !== null && count < n) {
                result += s.substring(lastIndex, match.index);
                let replacement;
        
                if (typeof repl === 'function') {
                    const matchObj = {};
                    match.slice(0).forEach((val, i) => matchObj[i] = val);
                    replacement = await repl(matchObj);
                } else if (typeof repl === 'string') {
                    replacement = repl.replace(/%(\d+)/g, (m, digit) => {
                        const index = parseInt(digit);
                        return match[index] || m;
                    });
                } else {
                    replacement = String(repl);
                }
        
                result += replacement;
                lastIndex = match.index + match[0].length;
                count++;
        
                if (regex.lastIndex === lastIndex && lastIndex < s.length) {
                    regex.lastIndex++;
                }
            }
        
            result += s.substring(lastIndex);
            return result;
        },
    
        len: (s) => {
            return s.length;
        },
    
        lower: (s) => {
            return s.toLowerCase();
        },
    
        match: (s, pattern, init = 0) => {
            const regex = new RegExp(pattern);
            const match = s.substring(init).match(regex);
            if (match) {
                const result = {};
                if (match.length > 1) {
                    match.slice(1).forEach((val, i) => result[i] = val);
                } else {
                    result[0] = match[0];
                }
                return result;
            }
            return null;
        },
    
        rep: (s, n) => {
            return s.repeat(n);
        },
    
        reverse: (s) => {
            return s.split("").reverse().join("");
        },
    
        sub: (s, i, j) => {
            i = i >= 0 ? i : s.length + i;
            j = j ?? s.length;
            j = j >= 0 ? j : s.length + j;
            
            return s.slice(i, j + 1);
        },
    
        upper: (s) => {
            return s.toUpperCase();
        },
    
        split: (s, sep) => {
            if (!sep) {
                const arr = s.trim().split(/\s+/);
                const obj = {};
                arr.forEach((val, i) => obj[i] = val);
                return obj;
            }
            const regex = new RegExp(escapeRegex(sep));
            const arr = s.split(regex);
            const obj = {};
            arr.forEach((val, i) => obj[i] = val);
            return obj;
        },
    
        trim: (s) => {
            return s.trim();
        },
    
        ltrim: (s) => {
            return s.replace(/^\s+/, '');
        },
    
        rtrim: (s) => {
            return s.replace(/\s+$/, '');
        },
    
        startsWith: (s, prefix) => {
            return s.startsWith(prefix);
        },
    
        endsWith: (s, suffix) => {
            return s.endsWith(suffix);
        },
    
        contains: (s, substring) => {
            return s.includes(substring);
        },
    
        padLeft: (s, length, char = ' ') => {
            return s.padStart(length, char);
        },
    
        padRight: (s, length, char = ' ') => {
            return s.padEnd(length, char);
        },
    
        capitalize: (s) => {
            return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        },
    
        isEmpty: (s) => {
            return s.length === 0;
        },
    
        count: (s, substring, start = 0, end = s.length) => {
            const sub = s.slice(start, end);
            return (sub.match(new RegExp(escapeRegex(substring), 'g')) || []).length;
        },
    
        join: (obj, separator = '') => {
            const values = Object.values(obj);
            return values.join(separator);
        },
    
        replaceFirst: (s, pattern, replacement) => {
            return s.replace(pattern, replacement);
        },
    
        toBytes: (s) => {
            const bytes = Array.from(s).map(char => char.charCodeAt(0));
            const result = {};
            bytes.forEach((val, i) => result[i] = val);
            return result;
        },
    
        fromBytes: (bytesObj) => {
            const bytes = Object.values(bytesObj);
            return String.fromCharCode(...bytes);
        }
    };
}

export { createString };