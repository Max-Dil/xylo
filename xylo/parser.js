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

function parse(tokens) {
    let current = 0;

    function peek() {
        return tokens[current] || null;
    }

    function advance() {
        return tokens[current++];
    }

    function parseTypeAnnotation(isError = false) {
        if (peek() && peek().value === ':') {
            advance();
            const typeTokens = [];
            while (peek() && ['number', 'string', 'boolean', 'function', 'table', 'null', 'undefined'].includes(peek().value)) {
                typeTokens.push(advance());
                if (peek() && peek().value === '|') {
                    advance();
                }
            }
            if (typeTokens.length === 0 && !isError) {
                console.error(`Expected type after ':' at line ${peek()?.line}, column ${peek()?.column}, fileName ${peek()?.fileName}`);
                throw new Error("Stop program.");
            }
            return typeTokens.map(t => t.value);
        }
        return null;
    }

    function getPrecedence(operator) {
        switch (operator) {
            case 'unary-': case 'not': return 7;
            case '^': case '*': case '/': case '%': return 6;
            case '+': case '-': return 5;
            case '..': return 4;
            case '<': case '>': case '<=': case '>=': case '==': case '~=': case '!=': return 3;
            case 'in': return 3;
            case '&&': case 'and': return 2;
            case '||': case 'or': return 1;
            default: return 0;
        }
    }
    
    function parseExpression() {
        return parseBinaryExpression(0);
    }

    function parseBinaryExpression(precedence) {
        let left = parsePrimaryExpression();
        const stack = [];
    
        while (peek()) {
            const operator = peek();
            const opPrecedence = getPrecedence(operator.value);
            if (!opPrecedence || opPrecedence <= precedence) break;
    
            advance();
            stack.push({ left, operator: operator.value, line: operator.line, column: operator.column, fileName: operator.fileName });
            left = parsePrimaryExpression();
        }
    
        while (stack.length) {
            const { left: l, operator, line, column, fileName } = stack.pop();
            left = { type: 'BinaryExpression', operator, left: l, right: left, line, column, fileName };
        }
    
        return left;
    }

    function parsePrimaryExpression() {
        let token = advance();
        if (!token) return null;

        if (token.value === '(') {
            const expression = parseExpression();
            let nextToken = advance();

            if (!nextToken) {
                nextToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (!nextToken || nextToken.value !== ')') {
                console.error(`Expected ')' at line ${nextToken?.line}, column ${nextToken?.column}, fileName: ${nextToken?.fileName}`);
                throw new Error("Stop program.");
            }
            return expression;
        }

        if (token.value === 'local') {
            return parseLocalStatement(token);
        } else if (token.value === 'global') {
            return parseGlobalStatement(token);
        }

        if (token.value === '-') {
            return {
                type: 'UnaryExpression',
                operator: 'unary-',
                argument: parsePrimaryExpression(),
                line: token.line,
                column: token.column,
                fileName: token.fileName
            };
        }

        if (token.value === 'not') {
            return {
                type: 'UnaryExpression',
                operator: 'not',
                argument: parseExpression(),
                line: token.line,
                column: token.column,
                fileName: token.fileName
            };
        }

        switch (token.value) {
            case 'require': return parseRequireStatement(token);
            case 'function': return parseFunctionDefinition(token);
            case 'fun': return parseFunctionDefinition(token);
            case 'while': return parseWhileLoop(token);
            case 'for': return parseForLoop(token);
            case 'if': return parseIfStatement(token);
            case 'class': return parseClassDefinition(token);
            case 'break': return { type: 'BreakStatement', line: token.line, column: token.column, fileName: token.fileName };
            case 'true': return { type: 'Boolean', value: true, line: token.line, column: token.column, fileName: token.fileName };
            case 'false': return { type: 'Boolean', value: false, line: token.line, column: token.column, fileName: token.fileName };
            case 'nil': return { type: 'Nil', value: null, line: token.line, column: token.column, fileName: token.fileName };
            case 'switch': return parseSwitchStatement(token);
            case 'try': return parseTryStatement(token);
            case 'return': return parseReturnStatement(token);
            case '...': return { type: 'VarargExpression', line: token.line, column: token.column, fileName: token.fileName };
        }

        if (token.value.startsWith('"') && token.value.endsWith('"')) {
            return { type: 'String', value: token.value.slice(1, -1), line: token.line, column: token.column, fileName: token.fileName };
        }

        if (/^\d+\.?\d*$/.test(token.value)) {
            return { type: 'Number', value: Number(token.value), line: token.line, column: token.column, fileName: token.fileName };
        }

        if (/^[\p{L}_][\p{L}\p{N}_]*$/u.test(token.value)) {
            let expr = {
                type: 'Identifier',
                value: token.value,
                line: token.line,
                column: token.column,
                fileName: token.fileName
            };

            let typeAnnotation = null;
            if (peek() && peek().value === ':') {
                const oldCurrent = current;
                typeAnnotation = parseTypeAnnotation(true);
                if (typeAnnotation.length === 0) {
                    current = oldCurrent;
                }
            }

            while (peek() && (peek().value === '.' || peek().value === ':' || peek().value === '[' || peek().value === '(')) {
                const nextToken = peek();
                if (nextToken.value === '[') {
                    advance();
                    const property = parseExpression();
                    const closing = advance();
                    if (closing.value !== ']') {
                        console.error(`Expected ']' at line ${closing.line}, column ${closing.column}, fileName ${closing.fileName}`);
                        throw new Error("Stop program.");
                    }
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property: property,
                        computed: true,
                        line: nextToken.line,
                        column: nextToken.column,
                        fileName: nextToken.fileName
                    };
                } else if (nextToken.value === '.') {
                    advance();
                    const propToken = advance();
                    if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(propToken.value)) {
                        console.error(`Invalid identifier at line ${propToken.line}, column ${propToken.column}, fileName ${propToken.fileName}`);
                        throw new Error("Stop program.");
                    }
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property: { type: 'Identifier', value: propToken.value, line: propToken.line, column: propToken.column, fileName: propToken.fileName },
                        computed: false,
                        line: nextToken.line,
                        column: nextToken.column,
                        fileName: nextToken.fileName
                    };
                } else if (nextToken.value === ':') {
                    advance();
                    const methodToken = advance();
                    if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(methodToken.value)) {
                        console.error(`Invalid method name at line ${methodToken.line}, column ${methodToken.column}, fileName ${methodToken.fileName}`);
                        throw new Error("Stop program.");
                    }
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property: { type: 'Identifier', value: methodToken.value, line: methodToken.line, column: methodToken.column, fileName: methodToken.fileName },
                        computed: false,
                        line: nextToken.line,
                        column: nextToken.column,
                        fileName: nextToken.fileName
                    };
                    if (peek() && peek().value === '(') {
                        expr = parseMethodCallWithColon(expr);
                    }
                } else if (nextToken.value === '(') {
                    expr = parseFunctionCall(expr);
                }
            }

            if (peek() && peek().value === '++') {
                advance();
                return {
                    type: 'UpdateExpression',
                    operator: '++',
                    argument: expr,
                    prefix: false,
                    line: token.line,
                    column: token.column,
                    fileName: token.fileName
                };
            }

            if (peek() && peek().value === ':') {
                advance();
                const methodToken = advance();
                if (peek() && peek().value === '(') {
                    expr = {
                        type: 'MemberExpression',
                        object: expr,
                        property: { type: 'Identifier', value: methodToken.value, line: methodToken.line, column: methodToken.column, fileName: methodToken.fileName },
                        computed: false,
                        line: token.line,
                        column: token.column,
                        fileName: token.fileName
                    };
                    return {
                        type: 'FunctionMethodCall',
                        callee: expr,
                        arguments: parseArguments(),
                        line: token.line,
                        column: token.column,
                        fileName: token.fileName
                    };
                }
            }

            if (peek() && peek().value === '=') {
                advance();
                const value = parseExpression();
                return {
                    type: 'AssignmentExpression',
                    target: expr,
                    value: value,
                    typeAnnotation: typeAnnotation || undefined,
                    line: token.line,
                    column: token.column,
                    fileName: token.fileName
                };
            }

            return expr;
        }

        if (token.value === '{') {
            return parseTable(token);
        }

        console.error(`Unexpected token '${token.value}' at line ${token.line}, column ${token.column}, fileName ${token.fileName}`);
        throw new Error("Stop program.");
    }

    function parseMethodCallWithColon(callee) {
        advance();
        const args = [];

        while (peek() && peek().value !== ')') {
            args.push(parseExpression());
            if (peek() && peek().value === ',') {
                advance();
            }
        }

        let closing = advance();
        
        if (!closing) {
            closing = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (!closing || closing.value !== ')') {
            console.error(`Expected ')' at line ${closing.line}, column ${closing.column}, fileName ${closing.fileName}`);
            throw new Error("Stop program.");
        }

        const selfArg = callee.object;
        args.unshift(selfArg);

        let expr = {
            type: 'FunctionMethodCall',
            callee: callee,
            arguments: args,
            line: callee.line,
            column: callee.column,
            fileName: callee.fileName
        };

        while (peek() && (peek().value === '.' || peek().value === ':' || peek().value === '[' || peek().value === '(')) {
            const operator = advance();
            if (operator.value === '[') {
                const property = parseExpression();
                const closing = advance();
                if (closing.value !== ']') {
                    console.error(`Expected ']' at line ${closing.line}, column ${closing.column}, fileName ${closing.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: property,
                    computed: true,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
            } else if (operator.value === '.') {
                const propToken = advance();
                if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(propToken.value)) {
                    console.error(`Invalid identifier at line ${propToken.line}, column ${propToken.column}, fileName ${propToken.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', value: propToken.value, line: propToken.line, column: propToken.column, fileName: propToken.fileName },
                    computed: false,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
            } else if (operator.value === ':') {
                const methodToken = advance();
                if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(methodToken.value)) {
                    console.error(`Invalid method name at line ${methodToken.line}, column ${methodToken.column}, fileName ${methodToken.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', value: methodToken.value, line: methodToken.line, column: methodToken.column, fileName: methodToken.fileName },
                    computed: false,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
                if (peek() && peek().value === '(') {
                    expr = parseMethodCallWithColon(expr);
                }
            } else if (operator.value === '(') {
                expr = parseFunctionCall(expr);
            }
        }

        return expr;
    }

    function parseGlobalStatement(keywordToken) {
        const identifierToken = advance();
        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(identifierToken.value)) {
            console.error(`Expected identifier at line ${identifierToken.line}, column ${identifierToken.column}, fileName ${identifierToken.fileName}`);
            throw new Error("Stop program.");
        }

        const typeAnnotation = parseTypeAnnotation();

        let value = null;
        if (peek() && peek().value === '=') {
            advance();
            value = parseExpression();
        }

        return {
            type: 'GlobalDeclaration',
            identifier: {
                type: 'Identifier',
                value: identifierToken.value,
                line: identifierToken.line,
                column: identifierToken.column,
                fileName: identifierToken.fileName
            },
            value,
            typeAnnotation,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseLocalStatement(keywordToken) {
        const identifierToken = advance();
        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(identifierToken.value)) {
            console.error(`Expected identifier at line ${identifierToken.line}, column ${identifierToken.column}, fileName ${identifierToken.fileName}`);
            throw new Error("Stop program.");
        }

        const typeAnnotation = parseTypeAnnotation();

        let value = null;
        if (peek() && peek().value === '=') {
            advance();
            value = parseExpression();
        }

        return {
            type: 'LocalDeclaration',
            identifier: {
                type: 'Identifier',
                value: identifierToken.value,
                line: identifierToken.line,
                column: identifierToken.column,
                fileName: identifierToken.fileName
            },
            value,
            typeAnnotation,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseFunctionDefinition(keywordToken) {
        let name = `anon_${Math.random().toString(36).substr(2, 8)}`;
        let isMethod = false;
        let isAsync = false;

        if (peek() && peek().value === '*') {
            isAsync = true;
            advance();
        }

        let token = peek();
        if (token && /^[\p{L}_][\p{L}\p{N}_]*$/u.test(token.value)) {
            name = advance().value;
            token = peek();
        }

        if (token && token.value === ':') {
            isMethod = true;
            advance();
            const methodNameToken = advance();
            name = methodNameToken.value;
            token = peek();
        }

        if (!token) token = tokens[current - 1] || tokens[tokens.length - 1];
        if (token.value !== '(') {
            console.error(`Expected '(' at line ${token.line}, column ${token.column}`);
            throw new Error("Stop program.");
        }
        advance();

        const params = [];
        let hasVararg = false;
        while (peek() && peek().value !== ')') {
            const paramToken = advance();
            if (paramToken.value === '...') {
                hasVararg = true;
                params.push({
                    type: 'Vararg',
                    value: '...',
                    line: paramToken.line,
                    column: paramToken.column,
                    fileName: paramToken.fileName
                });
                break;
            }
            const paramType = parseTypeAnnotation();
            params.push({
                type: 'Identifier',
                value: paramToken.value,
                typeAnnotation: paramType,
                line: paramToken.line,
                column: paramToken.column,
                fileName: paramToken.fileName
            });
            if (peek() && peek().value === ',') advance();
        }

        let closingParen = advance();
        if (!closingParen) {
            closingParen = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (closingParen.value !== ')') {
            console.error(`Expected ')' at line ${closingParen.line}, column ${closingParen.column}`);
            throw new Error("Stop program.");
        }

        const returnType = parseTypeAnnotation();

        const body = [];
        while (peek() && peek().value !== 'end') {
            body.push(parseExpression());
        }

        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (endToken.value !== 'end') {
            console.error(`Expected 'end' at line ${endToken.line}, column ${endToken.column}`);
            throw new Error("Stop program.");
        }

        return {
            type: isMethod ? 'FunctionMethodDefinition' : 'FunctionDefinition',
            name,
            isAsync,
            params,
            hasVararg,
            returnType,
            body,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseFunctionCall(callee) {
        advance();
        const args = [];
    
        while (peek() && peek().value !== ')') {
            args.push(parseExpression());
            if (peek() && peek().value === ',') {
                advance();
            }
        }
    
        let closing = advance();
        if (!closing) {
            closing = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (!closing || closing.value !== ')') {
            console.error(`Expected ')' at line ${closing.line}, column ${closing.column}, fileName ${closing.fileName}`);
            throw new Error("Stop program.");
        }
    
        let expr = {
            type: callee.type === 'Identifier' && /^[A-Z]/.test(callee.value) ? 'ClassInstantiation' : 'FunctionCall',
            callee: callee,
            arguments: args,
            line: callee.line,
            column: callee.column,
            fileName: callee.fileName
        };

        while (peek() && (peek().value === '.' || peek().value === ':' || peek().value === '[' || peek().value === '(')) {
            const operator = advance();
            if (operator.value === '[') {
                const property = parseExpression();
                const closing = advance();
                if (closing.value !== ']') {
                    console.error(`Expected ']' at line ${closing.line}, column ${closing.column}, fileName ${closing.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: property,
                    computed: true,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
            } else if (operator.value === '.') {
                const propToken = advance();
                if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(propToken.value)) {
                    console.error(`Invalid identifier at line ${propToken.line}, column ${propToken.column}, fileName ${propToken.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', value: propToken.value, line: propToken.line, column: propToken.column, fileName: propToken.fileName },
                    computed: false,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
            } else if (operator.value === ':') {
                const methodToken = advance();
                if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(methodToken.value)) {
                    console.error(`Invalid method name at line ${methodToken.line}, column ${methodToken.column}, fileName ${methodToken.fileName}`);
                    throw new Error("Stop program.");
                }
                expr = {
                    type: 'MemberExpression',
                    object: expr,
                    property: { type: 'Identifier', value: methodToken.value, line: methodToken.line, column: methodToken.column, fileName: methodToken.fileName },
                    computed: false,
                    line: operator.line,
                    column: operator.column,
                    fileName: operator.fileName
                };
                if (peek() && peek().value === '(') {
                    expr = parseMethodCallWithColon(expr);
                }
            } else if (operator.value === '(') {
                expr = parseFunctionCall(expr);
            }
        }

        return expr;
    }

    function parseTable(startToken) {
        const table = {
            type: 'Table',
            properties: [],
            typeAnnotation: parseTypeAnnotation(),
            line: startToken.line,
            column: startToken.column,
            fileName: startToken.fileName
        };

        let index = 0;
        let hasExplicitKeys = false;

        while (peek() && peek().value !== '}') {
            let key;

            if (peek().value === '[') {
                advance();
                key = parseExpression();
                const closingBracket = advance();
                if (closingBracket.value !== ']') {
                    console.error(`Expected ']' at line ${closingBracket.line}, column ${closingBracket.column}, fileName ${closingBracket.fileName}`);
                    throw new Error("Stop program.");
                }
                hasExplicitKeys = true;
            }
            else if (/^[\p{L}_][\p{L}\p{N}_]*$/u.test(peek().value) && tokens[current + 1]?.value === '=') {
                key = {
                    type: 'String',
                    value: advance().value,
                    line: peek()?.line,
                    column: peek()?.column,
                    fileName: peek()?.fileName
                };
                hasExplicitKeys = true;
            } 
            else if (!hasExplicitKeys) {
                key = {
                    type: 'Number',
                    value: index++,
                    line: peek()?.line,
                    column: peek()?.column,
                    fileName: peek()?.fileName
                };
            } else {
                console.error(`Expected key definition at line ${peek()?.line}, column ${peek()?.column}, fileName ${peek()?.fileName}`);
                throw new Error("Stop program.");
            }

            if (peek() && peek().value === '=') {
                advance();
            } else if (hasExplicitKeys) {
                console.error(`Expected '=' after key at line ${peek()?.line}, column ${peek()?.column}, fileName ${peek()?.fileName}`);
                throw new Error("Stop program.");
            }

            const value = parseExpression();
            table.properties.push({
                key: key,
                value: value,
                line: key.line,
                column: key.column,
                fileName: key.fileName
            });

            if (peek()?.value === ',') advance();
            else if (peek()?.value !== '}') {
                console.error(`Expected ',' or '}' at line ${peek()?.line}, column ${peek()?.column}, fileName ${peek()?.fileName}`);
                throw new Error("Stop program.");
            }
        }

        const closingBrace = advance();
        if (!closingBrace || closingBrace.value !== '}') {
            console.error(`Expected '}' at line ${closingBrace?.line}, column ${closingBrace?.column}, fileName ${closingBrace?.fileName}`);
            throw new Error("Stop program.");
        }

        return table;
    }

    // function parseTable(startToken) {
    //     const table = {
    //         type: 'Table',
    //         value: {},
    //         isArray: true,
    //         typeAnnotation: parseTypeAnnotation(),
    //         line: startToken.line,
    //         column: startToken.column,
    //         fileName: startToken.fileName
    //     };

    //     let index = 0;
    //     let hasExplicitKeys = false;

    //     while (peek() && peek().value !== '}') {
    //         let keyValue;

    //         if (peek().value === '[') {
    //             advance();
    //             const keyNode = parseExpression();
    //             advance();
    //             advance();
    //             if (keyNode.type === 'Identifier') keyValue = keyNode.value;
    //             else if (keyNode.type === 'Number') keyValue = keyNode.value;
    //             else if (keyNode.type === 'String') keyValue = keyNode.value;
    //             else console.error(`Invalid key type`);
    //             hasExplicitKeys = true;
    //         } else if (/^[\p{L}_][\p{L}\p{N}_]*$/u.test(peek().value) && tokens[current + 1]?.value === '=') {
    //             const identifier = advance();
    //             advance();
    //             keyValue = identifier.value;
    //             hasExplicitKeys = true;
    //         } else {
    //             keyValue = index++;
    //         }

    //         const value = parseExpression();
    //         table.value[keyValue] = value;
    //         table.isArray = !hasExplicitKeys;

    //         if (peek()?.value === ',') advance();
    //     }

    //     advance();
    //     return table;
    // }

    function parseWhileLoop(keywordToken) {
        const condition = parseExpression();
        let doToken = advance();
        if (!doToken) {
            doToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (doToken.value !== 'do') {
            console.error(`Expected 'do' at line ${doToken.line}, column ${doToken.column}, fileName ${doToken.fileName}`);
            throw new Error("Stop program.");
        }

        const body = [];
        while (peek() && peek().value !== 'end') {
            body.push(parseExpression());
        }

        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (endToken.value !== 'end') {
            console.error(`Expected 'end' at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`);
            throw new Error("Stop program.");
        }

        return {
            type: 'WhileStatement',
            condition: condition,
            body: body,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseForLoop(keywordToken) {
        let variableToken = advance();

        if (!variableToken) {
            variableToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }

        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(variableToken.value)) {
            console.error(
                `Expected variable name after 'for' at line ${variableToken.line}, column ${variableToken.column}, fileName ${variableToken.fileName}`
            );
            throw new Error("Stop program.");
        }
        let nextToken = peek();

        if (nextToken && nextToken.value === '=') {
            advance();
            const start = parseExpression();

            let commaToken1 = advance();
            if (!commaToken1) {
                commaToken1 = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (commaToken1.value !== ',') {
                console.error(
                    `Expected ',' after start value in for loop at line ${commaToken1.line}, column ${commaToken1.column}, fileName ${commaToken1.fileName}`
                );
                throw new Error("Stop program.");
            }

            const end = parseExpression();

            let step = {
                type: 'Number',
                value: 1,
                line: keywordToken.line,
                column: keywordToken.column,
                fileName: keywordToken.fileName
            };

            if (peek() && peek().value === ',') {
                advance();
                step = parseExpression();
            }

            let doToken = advance();
            if (!doToken) {
                doToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (doToken.value !== 'do') {
                console.error(
                    `Expected 'do' after for loop parameters at line ${doToken.line}, column ${doToken.column}, fileName ${doToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            const body = [];
            while (peek() && peek().value !== 'end') {
                body.push(parseExpression());
            }

            let endToken = advance();
            if (!endToken) {
                endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (endToken.value !== 'end') {
                console.error(
                    `Expected 'end' after for loop body at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            return {
                type: 'ForStatement',
                variable: {
                    type: 'Identifier',
                    value: variableToken.value,
                    line: variableToken.line,
                    column: variableToken.column,
                    fileName: variableToken.fileName
                },
                start: start,
                end: end,
                step: step,
                body: body,
                line: keywordToken.line,
                column: keywordToken.column,
                fileName: keywordToken.fileName
            };
        } else {
            let commaToken = advance();
            if (!commaToken) {
                commaToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }

            if (commaToken.value !== ',') {
                console.error(
                    `Expected ',' after variable name in for loop at line ${commaToken.line}, column ${commaToken.column}, fileName ${variableToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            let valueVariableToken = advance();

            if (!valueVariableToken) {
                valueVariableToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }

            if (!/[a-zA-Z_][a-zA-Z0-9_]*/.test(valueVariableToken.value)) {
                console.error(
                    `Expected variable name after ',' at line ${valueVariableToken.line}, column ${valueVariableToken.column}, fileName ${valueVariableToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            let inToken = advance();
            if (!inToken) {
                inToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }

            if (inToken.value !== 'in') {
                console.error(
                    `Expected 'in' after variable name in for loop at line ${inToken.line}, column ${inToken.column}, fileName ${inToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            const iteratorCall = parseExpression();

            if (iteratorCall.type !== 'FunctionCall') {
                console.error(
                    `Expected function call after 'in' in for loop at line ${iteratorCall.line}, column ${iteratorCall.column}, fileName ${iteratorCall.fileName}`
                );
                throw new Error("Stop program.");
            }

            let doToken = advance();
            if (!doToken) {
                doToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (doToken.value !== 'do') {
                console.error(
                    `Expected 'do' after for loop parameters at line ${doToken.line}, column ${doToken.column}, fileName ${doToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            const body = [];
            while (peek() && peek().value !== 'end') {
                body.push(parseExpression());
            }

            let endToken = advance();
            if (!endToken) {
                endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
            }
            if (endToken.value !== 'end') {
                console.error(
                    `Expected 'end' after for loop body at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`
                );
                throw new Error("Stop program.");
            }

            return {
                type: 'ForInStatement',
                keyVariable: {
                    type: 'Identifier',
                    value: variableToken.value,
                    line: variableToken.line,
                    column: variableToken.column,
                    fileName: variableToken.fileName
                },
                valueVariable: {
                    type: 'Identifier',
                    value: valueVariableToken.value,
                    line: valueVariableToken.line,
                    column: valueVariableToken.column,
                    fileName: valueVariableToken.fileName
                },
                iteratorCall: iteratorCall,
                body: body,
                line: keywordToken.line,
                column: keywordToken.column,
                fileName: keywordToken.fileName
            };
        }
    }

    function parseIfStatement(keywordToken) {
        const condition = parseExpression();

        let thenToken = advance();
        if (!thenToken) {
            thenToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (thenToken.value !== 'then') {
            console.error(
                `Expected 'then' after 'if' condition at line ${thenToken.line}, column ${thenToken.column}, fileName ${thenToken.fileName}`
            );
            throw new Error("Stop program.");
        }

        const thenBody = [];
        while (peek() && peek().value !== 'else' && peek().value !== 'end') {
            thenBody.push(parseExpression());
        }

        let elseBody = [];
        if (peek() && peek().value === 'else') {
            advance();
            while (peek() && peek().value !== 'end') {
                elseBody.push(parseExpression());
            }
        }

        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (endToken.value !== 'end') {
            console.error(
                `Expected 'end' after 'if' statement at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`
            );
            throw new Error("Stop program.");
        }

        return {
            type: 'IfStatement',
            condition: condition,
            thenBody: thenBody,
            elseBody: elseBody,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseRequireStatement(keywordToken) {
        const openParen = advance();
        if (openParen.value !== '(') {
            console.error(`Expected '(' at line ${openParen.line}, column ${openParen.column}, fileName ${openParen.fileName}`);
            throw new Error("Stop program.");
        }

        const moduleToken = advance();
        if (!moduleToken.value.startsWith('"')) {
            console.error(`Expected string literal at line ${moduleToken.line}, column ${moduleToken.column}, fileName ${moduleToken.fileName}`);
            throw new Error("Stop program.");
        }

        const closeParen = advance();
        if (closeParen.value !== ')') {
            console.error(`Expected ')' at line ${closeParen.line}, column ${closeParen.column}, fileName ${closeParen.fileName}`);
            throw new Error("Stop program.");
        }

        return {
            type: 'RequireStatement',
            moduleName: moduleToken.value.slice(1, -1),
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseReturnStatement(keywordToken) {
        const value = parseExpression();
        return {
            type: 'ReturnStatement',
            argument: value,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseArguments() {
        advance();
        const args = [];

        while (peek() && peek().value !== ')') {
            args.push(parseExpression());
            if (peek() && peek().value === ',') {
                advance();
            }
        }

        const closing = advance();
        if (closing.value !== ')') {
            console.error(`Expected ')' at line ${closing.line}, column ${closing.column}`);
            throw new Error("Stop program.");
        }

        return args;
    }

    function parseClassDefinition(keywordToken) {
        const nameToken = advance();
        if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(nameToken.value)) {
            console.error(`Expected class name at line ${nameToken.line}, column ${nameToken.column}, fileName ${nameToken.fileName}`);
            throw new Error("Stop program.");
        }
    
        let parent = null;
        if (peek() && peek().value === 'extends') {
            advance();
            const parentToken = advance();
            if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(parentToken.value)) {
                console.error(`Expected parent class name at line ${parentToken.line}, column ${parentToken.column}, fileName ${parentToken.fileName}`);
                throw new Error("Stop program.");
            }
            parent = {
                type: 'Identifier',
                value: parentToken.value,
                line: parentToken.line,
                column: parentToken.column,
                fileName: parentToken.fileName
            };
        }
    
        const fields = [];
        const methods = [];
        const staticFields = [];
        const staticMethods = [];
    
        while (peek() && peek().value !== 'end') {
            const modifierToken = peek();
            let isStatic = false;
            let isPrivate = false;
    
            if (modifierToken.value === 'static') {
                isStatic = true;
                advance();
            } else if (modifierToken.value === 'private') {
                isPrivate = true;
                advance();
            } else if (modifierToken.value === 'public') {
                advance();
            }
    
            const nextToken = peek();
            if (nextToken.value === 'function' || nextToken.value === 'fun') {
                const method = parseFunctionDefinition(advance());
                if (isStatic) {
                    staticMethods.push(method);
                } else {
                    method.isPrivate = isPrivate;
                    methods.push(method);
                }
            } else {
                const fieldToken = advance();
                if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(fieldToken.value)) {
                    console.error(`Expected field name at line ${fieldToken.line}, column ${fieldToken.column}, fileName ${fieldToken.fileName}`);
                    throw new Error("Stop program.");
                }
                let value = null;
                if (peek() && peek().value === '=') {
                    advance();
                    value = parseExpression();
                }
                const field = {
                    type: 'FieldDeclaration',
                    name: fieldToken.value,
                    value: value,
                    isPrivate: isPrivate,
                    line: fieldToken.line,
                    column: fieldToken.column,
                    fileName: fieldToken.fileName
                };
                if (isStatic) {
                    staticFields.push(field);
                } else {
                    fields.push(field);
                }
            }
        }
    
        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (!endToken || endToken.value !== 'end') {
            console.error(`Expected 'end' at line ${endToken?.line}, column ${endToken?.column}, fileName ${endToken?.fileName}`);
            throw new Error("Stop program.");
        }
    
        return {
            type: 'ClassDefinition',
            name: nameToken.value,
            parent: parent,
            fields: fields,
            methods: methods,
            staticFields: staticFields,
            staticMethods: staticMethods,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseSwitchStatement(keywordToken) {
        const value = parseExpression();
        const cases = [];
        let defaultCase = null;

        while (peek() && peek().value !== 'end') {
            const nextToken = peek();
            if (nextToken.value === 'case') {
                advance();
                const caseValue = parseExpression();
                const caseColon = advance();
                if (caseColon.value !== ':') {
                    console.error(`Expected ':' after case value at line ${caseColon.line}, column ${caseColon.column}, fileName ${caseColon.fileName}`);
                    throw new Error("Stop program.");
                }
                const body = [];
                while (peek() && peek().value !== 'case' && peek().value !== 'default' && peek().value !== 'end') {
                    body.push(parseExpression());
                }
                cases.push({
                    test: caseValue,
                    body: body,
                    line: nextToken.line,
                    column: nextToken.column,
                    fileName: nextToken.fileName
                });
            } else if (nextToken.value === 'default') {
                advance();
                const defaultColon = advance();
                if (defaultColon.value !== ':') {
                    console.error(`Expected ':' after default at line ${defaultColon.line}, column ${defaultColon.column}, fileName ${defaultColon.fileName}`);
                    throw new Error("Stop program.");
                }
                const body = [];
                while (peek() && peek().value !== 'case' && peek().value !== 'default' && peek().value !== 'end') {
                    body.push(parseExpression());
                }
                defaultCase = {
                    body: body,
                    line: nextToken.line,
                    column: nextToken.column,
                    fileName: nextToken.fileName
                };
            } else {
                console.error(`Expected 'case', 'default', or 'end' at line ${nextToken.line}, column ${nextToken.column}, fileName ${nextToken.fileName}`);
                advance();
            }
        }

        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (endToken.value !== 'end') {
            console.error(`Expected 'end' after switch statement at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`);
            throw new Error("Stop program.");
        }

        return {
            type: 'SwitchStatement',
            discriminant: value,
            cases: cases,
            defaultCase: defaultCase,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    function parseTryStatement(keywordToken) {
        const tryBody = [];
        while (peek() && peek().value !== 'catch' && peek().value !== 'end') {
            tryBody.push(parseExpression());
        }

        let catchClause = null;
        if (peek() && peek().value === 'catch') {
            advance();
            const paramToken = advance();
            if (!/^[\p{L}_][\p{L}\p{N}_]*$/u.test(paramToken.value)) {
                console.error(`Expected identifier after 'catch' at line ${paramToken.line}, column ${paramToken.column}, fileName ${paramToken.fileName}`);
                throw new Error("Stop program.");
            }
            const catchBody = [];
            while (peek() && peek().value !== 'end') {
                catchBody.push(parseExpression());
            }
            catchClause = {
                param: {
                    type: 'Identifier',
                    value: paramToken.value,
                    line: paramToken.line,
                    column: paramToken.column,
                    fileName: paramToken.fileName
                },
                body: catchBody
            };
        }

        let endToken = advance();
        if (!endToken) {
            endToken = tokens[(current-1)] ? tokens[(current-1)] : tokens[(tokens.length-1)];
        }
        if (endToken.value !== 'end') {
            console.error(`Expected 'end' after try statement at line ${endToken.line}, column ${endToken.column}, fileName ${endToken.fileName}`);
            throw new Error("Stop program.");
        }

        return {
            type: 'TryStatement',
            block: tryBody,
            handler: catchClause,
            line: keywordToken.line,
            column: keywordToken.column,
            fileName: keywordToken.fileName
        };
    }

    const ast = [];
    while (current < tokens.length) {
        const expr = parseExpression();
        if (expr && expr.type !== 'End') {
            ast.push(expr);
        }
    }

    return ast;
}

export { parse };