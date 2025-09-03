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

const createOs = function() {
    return (() => {
        const isNode = typeof process !== 'undefined' && process.versions?.node;
        const virtualEnv = {};
    
        const common = {
            time: () => Math.floor(Date.now()),
    
            date: (format, time) => {
                const date = time ? new Date(time * 1000) : new Date();
    
                const replacements = {
                    '%Y': date.getFullYear(),
                    '%m': (date.getMonth() + 1).toString().padStart(2, '0'),
                    '%d': date.getDate().toString().padStart(2, '0'),
                    '%H': date.getHours().toString().padStart(2, '0'),
                    '%M': date.getMinutes().toString().padStart(2, '0'),
                    '%S': date.getSeconds().toString().padStart(2, '0'),
                    '%w': date.getDay(),
                    '%j': Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000),
                    '%c': date.toLocaleString(),
                    '%x': date.toLocaleDateString(),
                    '%X': date.toLocaleTimeString()
                };
    
                return format.replace(/%./g, match => replacements[match] || match);
            },
    
            difftime: (t2, t1) => t2 - t1,
    
            clock: () => {
                if (isNode) {
                    const t = process.hrtime();
                    return t[0] + t[1] / 1e9;
                }
                return performance.now() * 1000;
            },
    
            sleep: async (...args) => await new Promise(resolve => setTimeout(resolve, ...args)),
        };
    
        const nodeSpecific = {
            execute: (command) => {
                const { execSync } = require('child_process');
                try {
                    const output = execSync(command).toString();
                    return [0, output];
                } catch (e) {
                    return [e.status, e.message];
                }
            },
            
            getenv: (varname) => process.env[varname] || null,
    
            exit: (code = 0) => process.exit(code),
    
            tmpname: () => {
                const os = require('os');
                return `${os.tmpdir()}/tmp_${Math.random().toString(36).substr(2)}`;
            }
        };
    
        const browserSpecific = {
            execute: () => [null, "execute not supported in browser"],
    
            getenv: (varname) => {
                try {
                    return localStorage.getItem(varname);
                } catch {
                    return virtualEnv[varname] || null;
                }
            },
    
            exit: () => console.warn("exit() ignored in browser"),
    
            tmpname: () => `tmp_${Math.random().toString(36).substr(2)}.tmp`,
    
            setenv: (name, value) => {
                try {
                    localStorage.setItem(name, value);
                } catch {
                    virtualEnv[name] = value;
                }
            }
        };
    
        return {
            ...common,
            ...(isNode ? nodeSpecific : browserSpecific)
        };
    })();
}

export {createOs};