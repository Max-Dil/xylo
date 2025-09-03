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