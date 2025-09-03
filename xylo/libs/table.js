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

const createTable = function() {
    const clone = (obj) => {
        if (typeof obj === 'object' && obj !== null) {
            return Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, clone(v)])
            );
        }
        return obj;
    };

    const toArray = (table) => Object.entries(table).sort((a, b) => Number(a[0]) - Number(b[0])).map(([_, v]) => v);
    const fromArray = (arr) => Object.fromEntries(arr.map((v, i) => [i, v]));
    const updateTable = (table, arr) => {
        Object.keys(table).forEach(key => delete table[key]);
        arr.forEach((v, i) => table[i] = v);
    };

    return {
        concat: (table, sep, i, j) => {
            sep = sep || '';
            i = i || 0;
            const arr = toArray(table);
            j = j || arr.length - 1;
    
            const parts = [];
            for (let idx = i; idx <= j; idx++) {
                if (arr[idx] !== undefined) {
                    parts.push(String(arr[idx]));
                }
            }
            return parts.join(sep);
        },
    
        insert: (table, pos, value) => {
            const arr = toArray(table);
            if (value === undefined) {
                value = pos;
                pos = arr.length;
            }
    
            arr.splice(pos, 0, value);
            updateTable(table, arr);
            return table;
        },
    
        remove: (table, pos) => {
            const arr = toArray(table);
            pos = pos === undefined ? arr.length - 1 : pos;
            if (pos < 0 || pos >= arr.length) return null;
            const removed = arr.splice(pos, 1)[0];
            updateTable(table, arr);
            return removed;
        },
    
        sort: async (table, comp) => {
            const arr = toArray(table);
            const partition = async (arr, low, high) => {
                const pivot = arr[high];
                let i = low - 1;
                for (let j = low; j < high; j++) {
                    if (comp ? await comp(arr[j], pivot) : arr[j] <= pivot) {
                        i++;
                        [arr[i], arr[j]] = [arr[j], arr[i]];
                    }
                }
                [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
                return i + 1;
            };
    
            const quickSort = async (arr, low, high) => {
                if (low < high) {
                    const pi = await partition(arr, low, high);
                    quickSort(arr, low, pi - 1);
                    quickSort(arr, pi + 1, high);
                }
            };
    
            await quickSort(arr, 0, arr.length - 1);
            updateTable(table, arr);
            return table;
        },
    
        move: (t1, f, e, t, t2) => {
            const a1 = toArray(t1);
            t2 = t2 || t1;
            const a2 = toArray(t2);
            f = f === undefined ? 0 : f;
            e = e === undefined ? a1.length - 1 : e;
            t = t === undefined ? 0 : t;
    
            const elements = a1.slice(f, e + 1);
            for (let i = 0; i < elements.length; i++) {
                a2[t + i] = elements[i];
            }
    
            updateTable(t2, a2);
            return t2;
        },
    
        sub: (table, start, end) => {
            const arr = toArray(table);
            start = start || 0;
            end = end || arr.length;
            return fromArray(arr.slice(start, end));
        },
    
        maxn: (table) => {
            return Math.max(...Object.keys(table).map(Number).filter(n => !isNaN(n)));
        },
    
        pack: (...args) => {
            return fromArray(args);
        },
    
        unpack: (table, i, j) => {
            const arr = toArray(table);
            i = i || 0;
            j = j || arr.length;
            return arr.slice(i, j);
        },
    
        find: (table, value, init) => {
            const arr = toArray(table);
            init = init || 0;
            for (let i = init; i < arr.length; i++) {
                if (arr[i] === value) return i;
            }
            return null;
        },
    
        filter: async (table, fn) => {
            const arr = toArray(table);
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                if (await fn(arr[i])) result.push(arr[i]);
            }
            return fromArray(result);
        },

        map: async (table, fn) => {
            const arr = toArray(table);
            const result = [];
            for (let i = 0; i < arr.length; i++) {
                result[i] = await fn(arr[i], i);
            }
            updateTable(table, result);
            return table;
        },
    
        forEach: async (table, fn) => {
            const arr = toArray(table);
            for (let i = 0; i < arr.length; i++) {
                await fn(arr[i], i);
            }
        },
    
        reduce: async (table, fn, initial) => {
            const arr = toArray(table);
            let accumulator = initial !== undefined ? initial : arr[0];
            const start = initial !== undefined ? 0 : 1;
            for (let i = start; i < arr.length; i++) {
                accumulator = await fn(accumulator, arr[i], i);
            }
            return accumulator;
        },
    
        reverse: (table) => {
            const arr = toArray(table);
            updateTable(table, arr.reverse());
            return table;
        },
    
        contains: (table, value) => {
            return toArray(table).includes(value);
        },
    
        count: (table, value) => {
            return toArray(table).reduce((acc, item) => acc + (item === value ? 1 : 0), 0);
        },
    
        merge: (table1, table2) => {
            return fromArray([...toArray(table1), ...toArray(table2)]);
        },
    
        unique: (table) => {
            return fromArray([...new Set(toArray(table))]);
        },
    
        shuffle: (table) => {
            const arr = toArray(table);
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            updateTable(table, arr);
            return table;
        },
    
        isEmpty: (table) => {
            return Object.keys(table).length === 0;
        },
    
        clone: clone,
    
        indexOf: (table, value, init) => {
            return toArray(table).indexOf(value, init || 0);
        },
    
        lastIndexOf: (table, value) => {
            return toArray(table).lastIndexOf(value);
        },
    
        every: (table, fn) => {
            return toArray(table).every(fn);
        },
    
        some: (table, fn) => {
            return toArray(table).some(fn);
        }
    };
}

export { createTable };