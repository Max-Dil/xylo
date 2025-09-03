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

function getLineAndColumn(code, index) {
    let line = 1;
    let column = 1;

    for (let i = 0; i < index; i++) {
        if (code[i] === '\n') {
            line++;
            column = 1;
        } else {
            column++;
        }
    }
    return { line, column };
}

function tokenize(code, fileName) {
    const tokens = [];
    const regex = /([a-zA-Z_\u0410-\u044F][a-zA-Z0-9_\u0410-\u044F]*)|((==|\+\+|!=|<=|>=|&&|\.\.\.|\|\||\.\.|~=|=|\{|\}|[()]|,|:|;|\[|\]|<|>|\+|-|\*|\/|%|\^|\.|end|then|if|else|true|false|nil|require|and|or|not|local|global|break|class|extends|static|private|public|init|number|string|boolean|function|table|null|undefined))|(\d+\.?\d*)|('[^']*')|("[\s\S]*?")|(\/\/.*)|(--.*)|(\|)/gy;

    let lastIndex = 0;
    while (lastIndex < code.length) {
        if (code.slice(lastIndex, lastIndex + 2) === '--' || code.slice(lastIndex, lastIndex + 2) === '//') {
            lastIndex = code.indexOf('\n', lastIndex);
            if (lastIndex === -1) lastIndex = code.length;
            else lastIndex++;
            continue;
        }

        regex.lastIndex = lastIndex;
        const match = regex.exec(code);

        if (!match || (match && match[0] === ';')) {
            lastIndex++;
            continue;
        }

        const startIndex = match.index;
        const value = match[0];

        const { line, column } = getLineAndColumn(code, startIndex);

        let tokenValue = value;
        if (value.startsWith("'") && value.endsWith("'")) {
            tokenValue = `"${value.slice(1, -1)}"`;
        }

        tokens.push({
            value: tokenValue,
            line,
            column,
            fileName
        });

        lastIndex = regex.lastIndex;
    }

    // console.log(tokens);
    return tokens;
}

export { tokenize };