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