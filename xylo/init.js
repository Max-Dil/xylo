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

import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";
import { Interpreter } from "./intepretator.js";

let interpreter;
function runXylo(code, modulePath) {
    const fileName = 'main.xylo';
    const timestamp = new Date().toISOString();


    let defaultModulePath;
    if (typeof window !== 'undefined') {
        defaultModulePath = window.location.href.split('/').slice(0, -1).join('/') || '/';
    } else if (typeof __dirname !== 'undefined') {
        defaultModulePath = __dirname;
    } else {
        defaultModulePath = '';
    }

    const tokens = tokenize(code, fileName);
    const ast = parse(tokens);

    interpreter = new Interpreter();
    interpreter.currentModulePath = modulePath || defaultModulePath;
    try {
        const result = interpreter.run(ast, fileName);
        return result;
    } catch (error) {
        console.error(`Error during execution of ${fileName} at ${timestamp}:`, error);
        throw error;
    }
}

export { runXylo };