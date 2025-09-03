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

const style = document.createElement('style');
style.textContent = 'xylo-script { display: none; }';
document.head.appendChild(style);
class XyloElement extends HTMLElement {
    constructor() {
        super();
        const code = this.textContent.trim();
        runXylo(code);
    }
}
customElements.define('xylo-script', XyloElement);

export { runXylo };