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

// подключаемые функции
import {print, pcall, len, warn,assert,xpcall,type,tostring,tonumber,error,ipairs,pairs,next} from "./libs/functions.js";
import {createMath} from "./libs/math.js";
import {createJson} from "./libs/json.js";
import {createOs} from "./libs/os.js";
import {createString} from "./libs/string.js";
import {createTable} from "./libs/table.js";
import {createDom} from "./libs/dom.js";

import {createNoise} from "./libs/noise.js";
import {createHttp} from "./libs/http.js";

// intepretator
import { tokenize } from "./lexer.js";
import { parse } from "./parser.js";

class ReturnSignal extends Error {
    constructor(value) {
        super();
        this.value = value;
    }
}

const global = {
    math: createMath(),
    json: createJson(),
    os: createOs(),
    string: createString(),
    table: createTable(),
    dom: createDom(),
    _G: {},
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
    console,
    setTimeout,
    setInterval,
    clearInterval: clearInterval,
    await: async function(func, ...args) {
        return await func(...args);
    },
    awaitListener: function(func, listener, ...args) {
        const threadSync = async function () {
            const result = await func(...args);
            listener(result)
        }
        threadSync();
        return;
    },
    loadstring: async function(code) {
        const fileName = 'loadstring';
        const timestamp = new Date().toISOString();
        const tokens = tokenize(code, fileName);
        const ast = parse(tokens);
        const interpreter = new Interpreter();
        try {
            const result = await interpreter.run(ast, fileName);
            return result;
        } catch (error) {
            console.error(`Error during execution of ${fileName} at ${timestamp}:`, error);
            throw error;
        }
    },
    loadscript: async function(code) {
        const fileName = 'loadscript';
        const timestamp = new Date().toISOString();
        try {
            if (typeof window !== 'undefined') {
                const blob = new Blob([code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const module = await import(url);
                URL.revokeObjectURL(url);
                return module.default || module;
            } else {
                const vm = require('vm');
                const script = new vm.Script(code);
                const context = vm.createContext(Object.create(global));
                script.runInContext(context);
                return context;
            }
        } catch (error) {
            console.error(`Error during execution of ${fileName} at ${timestamp}:`, error);
            throw error;
        }
    },
    setenv: function(func, newEnv) {
        if (typeof func !== 'function') {
            throw new Error("setenv expects a function as the first argument");
        }
        if (newEnv !== null && typeof newEnv !== 'object') {
            throw new Error("setenv expects an object or null as the second argument");
        }

        func.env = newEnv ? newEnv : null;
    },
};

if (typeof window != "undefined") {
    global.window = window;
    global.document = document;
    global.localStorage = localStorage;
    global.requestAnimationFrame = requestAnimationFrame;
    global.eval = eval;
    if (typeof indexedDB != "undefined") {
        global.indexedDB = indexedDB;
    }
}

global.__global = global;
const globalsEnvs = [];

class Interpreter {
    constructor(moduleCache = {}, parentModulePath = null) {
        this.globalEnv = {
            ...global
        };
        globalsEnvs.push(this.globalEnv);
        this.env = this.createEnvironment(this.globalEnv);
        this.moduleCache = moduleCache;
        this.currentModulePath = parentModulePath;
        this.requireJs = {
            noise: () => createNoise(),
            http: () => createHttp(),
            math: () => createMath(),
            json: () => createJson(),
            os: () => createOs(),
            string: () => createString(),
            table: () => createTable(),
            dom: () => createDom(),
        };
        this.functionCache = new Map();
        this.classPrototypes = new Map();
        this.privateFields = new WeakMap();
        this.typeAnnotations = new Map();
    }

    checkType(value, expectedTypes, node) {
		const actualType = type(value);
		if (!expectedTypes || new Set(expectedTypes).has(actualType)) return;
		throw new Error(`Type mismatch: expected ${expectedTypes.join(' or ')}, got ${actualType} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
	}

    createEnvironment(parent) {
        return Object.create(parent || null);
    }

    resolveModulePath(moduleName, currentModulePath) {
        if (moduleName.startsWith('.')) {
            const effectivePath = currentModulePath || this.currentModulePath;

            if (!effectivePath) {
                if (typeof window !== 'undefined') {
                    const baseUrl = window.location.href.split('/').slice(0, -1).join('/') || '/';
                    return `${baseUrl}/${moduleName}`.replace(/\/+/g, '/');
                } else if (typeof require !== 'undefined') {
                    try {
                        const path = require('path');
                        return path.resolve(moduleName);
                    } catch (e) {
                        throw new Error(`Cannot resolve relative path '${moduleName}' without current module path: ${e.message}`);
                    }
                }
                throw new Error("Cannot resolve relative path without current module path");
            }

            if (typeof require !== 'undefined') {
                const path = require('path');
                return path.resolve(path.dirname(effectivePath), moduleName);
            } else {
                const basePath = effectivePath.split('/').slice(0, -1).join('/');
                return `${basePath}/${moduleName}`.replace(/\/+/g, '/');
            }
        }
        if (typeof require !== 'undefined') {
            try {
                const path = require('path');

                const searchPaths = [
                    path.dirname(currentModulePath || process.cwd()),
                    ...(require.main?.paths || []),
                    ...module.paths
                ].filter(Boolean);

                return require.resolve(moduleName, {
                    paths: searchPaths
                });
            } catch (e) {
                console.debug(`Failed to resolve module via require.resolve: ${e.message}`);
            }
        }

        if (typeof window !== 'undefined' && (moduleName.startsWith('http://') || moduleName.startsWith('https://'))) {
            return moduleName;
        }

        return moduleName;
    }

    async readFile(modulePath) {
        if (typeof window !== 'undefined') {
            try {
                const response = await fetch(modulePath);
                if (!response.ok) {
                    throw new Error(`Failed to load module: ${modulePath}. Status: ${response.status}`);
                }
                return await response.text();
            } catch (fetchError) {
                throw new Error(`Failed to load module: ${modulePath}. ${fetchError}`);
            }
        } else if (typeof require !== 'undefined') {
            try {
                const fs = require('fs');
                return fs.readFileSync(modulePath, 'utf-8');
            } catch (error) {
                throw new Error(`Failed to read file: ${modulePath}. ${error.message}`);
            }
        } else {
            throw new Error("No file reading mechanism available in this environment");
        }
    }

    async loadModule(moduleName, currentModulePath) {
        if (this.requireJs[moduleName]) {
            return await this.requireJs[moduleName]();
        }
        let resolvedPath = this.resolveModulePath(moduleName, currentModulePath);

        if (this.moduleCache[resolvedPath]) {
            return this.moduleCache[resolvedPath].exports;
        }

        const extensionsToCheck = [];
        if (resolvedPath.endsWith('.js')) {
            extensionsToCheck.push(resolvedPath);
        } else if (resolvedPath.endsWith('.xylo')) {
            extensionsToCheck.push(resolvedPath);
        } else {
            extensionsToCheck.push(
                `${resolvedPath}.xylo`,
                resolvedPath,
                `${resolvedPath}.js`
            );
        }

        let actualPath;
        let code;
        for (const path of extensionsToCheck) {
            try {
                code = await this.readFile(path);
                actualPath = path;
                break;
            } catch (e) {
                continue;
            }
        }

        if (!actualPath) {
            if (typeof require !== 'undefined' && !moduleName.startsWith('.')) {
                try {
                    const module = require(moduleName);
                    this.moduleCache[resolvedPath] = { exports: module.default || module };
                    return module.default || module;
                } catch (e) {
                    throw new Error(`Module not found: ${moduleName} (tried: ${extensionsToCheck.join(', ')}) and Node.js require failed: ${e.message}`);
                }
            }
            throw new Error(`Module not found: ${moduleName} (tried: ${extensionsToCheck.join(', ')})`);
        }

        if (actualPath.endsWith('.xylo')) {
            const tokens = tokenize(code, actualPath);
            const ast = parse(tokens);
            const moduleInterpreter = new Interpreter(this.moduleCache, this.currentModulePath || currentModulePath); // Pass currentModulePath
            moduleInterpreter.currentModulePath = actualPath;
            const moduleExports = {};
            moduleInterpreter.env.exports = moduleExports;
            await moduleInterpreter.run(ast);
            this.moduleCache[actualPath] = { exports: moduleExports };
            return moduleExports;
        }

        if (actualPath.endsWith('.js')) {
            try {
                if (typeof window !== 'undefined') {
                    const module = await import(actualPath);
                    this.moduleCache[actualPath] = { exports: module.default || module };
                    return module.default || module;
                } else {
                    if (actualPath.endsWith('.mjs') || (process.env.npm_package_type === 'module' && !actualPath.endsWith('.cjs'))) {
                        const module = await import(actualPath);
                        this.moduleCache[actualPath] = { exports: module.default || module };
                        return module.default || module;
                    } else {
                        const module = require(actualPath);
                        this.moduleCache[actualPath] = { exports: module.default || module };
                        return module.default || module;
                    }
                }
            } catch (e) {
                throw new Error(`JS module load error: ${e.message}`);
            }
        }

        throw new Error(`Unsupported module type: ${actualPath}`);
    }

    async evaluate(node) {
        try {
            switch (node.type) {
                case 'LocalDeclaration':
                    return await this.handleLocalDeclaration(node);
                case 'AssignmentExpression':
                    return await this.handleAssignment(node);
                case 'FunctionDefinition':
                    this.env[node.name] = this.createFunction(node);
                    break;
                case 'FunctionMethodDefinition':
                    this.env[node.object.value][node.name] = this.createFunction(node);
                    break;
                case 'FunctionCall':
                    return await this.handleFunctionCallAsync(node);
                case 'FunctionMethodCall':
                    return await this.handleFunctionMethodCallAsync(node);
                case 'MemberExpression':
                    return await this.handleMemberAccessAsync(node);
                case 'WhileStatement':
                    return await this.handleWhileStatementAsync(node);
                case 'ForStatement':
                    return await this.handleForStatementAsync(node);
                case 'ForInStatement':
                    return await this.handleForInStatementAsync(node);
                case 'IfStatement':
                    return await this.handleIfStatementAsync(node);
                case 'BinaryExpression':
                    return await this.evaluateBinaryExpressionAsync(node);
                case 'UnaryExpression':
                    return await this.evaluateUnaryExpressionAsync(node);
                case 'UpdateExpression':
                    return await this.handleUpdateExpressionAsync(node);
                case 'ReturnStatement':
                    return await this.evaluateValueAsync(node.argument);
                case 'ClassDefinition':
                    this.env[node.name] = this.createClass(node);
                    break;
                case 'ClassInstantiation':
                    return await this.handleClassInstantiation(node);
                case 'BreakStatement':
                    return await this.handleBreakStatement(node);
                case 'SwitchStatement':
                    return await this.handleSwitchStatementAsync(node);
                case 'TryStatement':
                    return await this.handleTryStatementAsync(node);
                case 'RequireStatement':
                    return await this.loadModule(node.moduleName, this.currentModulePath);
                case 'GlobalDeclaration':
                    return await this.handleGlobalDeclaration(node);
                default:
                    throw new Error(`Unknown node type: ${node.type} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }
        } catch (error) {
            if (!error.message.includes("line") && node.line !== undefined && node.column !== undefined) {
                throw new Error(`${error.message} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }
            throw error;
        }
    }

    async evaluateValueAsync(node) {
        if (node.typeAnnotation) {
            this.checkType(value, node.typeAnnotation, node);
        }
        if (node.type === 'Number' || node.type === 'Boolean') {
            return node.value;
        }
        if (node.type === 'String') {
            return node.value.replaceAll("\\n","\n");
        }
        if (node.type === 'Nil') {
            return null;
        }
    
        switch (node.type) {
            case 'Identifier':
                if (!(node.value in this.env)) {
                    throw new Error(`Undefined variable: ${node.value} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
                }
                return this.env[node.value];
            case 'Table':
                return await this.createTable(node);
            case 'MemberExpression':
                return await this.handleMemberAccessAsync(node);
            case 'AssignmentExpression':
                return await this.handleAssignment(node);
            case 'FunctionCall':
                return await this.handleFunctionCallAsync(node);
            case 'FunctionMethodCall':
                return await this.handleFunctionMethodCallAsync(node);
            case 'FunctionDefinition':
                return this.createFunction(node);
            case 'ClassDefinition':
                return this.createClass(node);
            case 'ClassInstantiation':
                return await this.handleClassInstantiation(node);
            case 'BinaryExpression':
                return await this.evaluateBinaryExpressionAsync(node);
            case 'UnaryExpression':
                return await this.evaluateUnaryExpressionAsync(node);
            case 'RequireStatement':
                return await this.loadModule(node.moduleName, this.currentModulePath);
            case 'VarargExpression':
                if (!('...' in this.env)) {
                    throw new Error(`Vararg '...' used outside of vararg function at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
                }
                return this.env['...'];
            default:
                throw new Error(`Unsupported value type: ${node.type} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }
    }

    async handleClassInstantiation(node) {
        const classObj = await this.evaluateValueAsync(node.callee);
        if (!classObj || typeof classObj !== 'function') {
            throw new Error(`Cannot instantiate non-class '${node.callee.value}' at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }
        const args = await Promise.all(node.arguments.map(arg => this.evaluateValueAsync(arg)));
        return await classObj(...args);
    }

    async handleGlobalDeclaration(node) {
        const identifier = node.identifier.value;
        let value = null;

        if (node.value) {
            value = await this.evaluateValueAsync(node.value);
            this.checkType(value, node.typeAnnotation, node);
        }

        if (node.typeAnnotation) {
            this.typeAnnotations.set(identifier, node.typeAnnotation);
        }

        for (const envId in globalsEnvs) {
            globalsEnvs[envId][identifier] = value;
        };
        this.globalEnv.__global[identifier] = value;
        return value;
    }

    async handleLocalDeclaration(node) {
        const identifier = node.identifier.value;
        let value = null;

        if (node.value) {
            value = await this.evaluateValueAsync(node.value);
            this.checkType(value, node.typeAnnotation, node);
        }

        if (node.typeAnnotation) {
            this.typeAnnotations.set(identifier, node.typeAnnotation);
        }

        this.env[identifier] = value;
        return value;
    }

    async handleSwitchStatementAsync(node) {
        const discriminant = await this.evaluateValueAsync(node.discriminant);
        let matched = false;
        let result = null;

        try {
            for (const caseNode of node.cases) {
                const testValue = await this.evaluateValueAsync(caseNode.test);
                if (discriminant === testValue) {
                    matched = true;
                    for (const expr of caseNode.body) {
                        result = await this.evaluate(expr);
                        if (result === Symbol.for('break')) {
                            return;
                        }
                    }
                    break;
                }
            }

            if (!matched && node.defaultCase) {
                for (const expr of node.defaultCase.body) {
                    result = await this.evaluate(expr);
                    if (result === Symbol.for('break')) {
                        return;
                    }
                }
            }
        } catch (e) {
            throw e;
        }

        return result;
    }

    async handleTryStatementAsync(node) {
        try {
            let result = null;
            for (const expr of node.block) {
                result = await this.evaluate(expr);
            }
            return result;
        } catch (error) {
            if (node.handler) {
                const catchEnv = this.createEnvironment(this.env);
                catchEnv[node.handler.param.value] = error.message || error;
                const handlerInterpreter = new Interpreter(this.moduleCache);
                handlerInterpreter.env = catchEnv;
                handlerInterpreter.globalEnv = this.globalEnv;
                handlerInterpreter.currentModulePath = this.currentModulePath;

                let result = null;
                for (const expr of node.handler.body) {
                    result = await handlerInterpreter.evaluate(expr);
                }
                return result;
            }
            throw error;
        }
    }

    async handleAssignment(node) {
        const target = node.target;
        const value = await this.evaluateValueAsync(node.value);
    
        if (target.type === 'Identifier') {
            const varName = target.value;
            let env = this.env;
            let foundEnv = null;
    
            while (env !== null) {
                if (Object.prototype.hasOwnProperty.call(env, varName)) {
                    foundEnv = env;
                    break;
                }
                env = Object.getPrototypeOf(env);
            }
    
            if (node.typeAnnotation) {
                this.typeAnnotations.set(varName, node.typeAnnotation);
            }
    
            const storedType = this.typeAnnotations.get(varName);
            if (storedType) {
                this.checkType(value, storedType, node);
            }
    
            if (foundEnv !== null) {
                foundEnv[varName] = value;
                this.env[varName] = value;
            } else {
                this.globalEnv[varName] = value;
                this.env[varName] = value;
            }
        } else if (target.type === 'MemberExpression') {
            const obj = await this.evaluateValueAsync(target.object);
            const prop = target.computed ? await this.evaluateValueAsync(target.property) : target.property.value;
    
            if (this.privateFields.has(obj) && this.privateFields.get(obj).has(prop)) {
                if (this.env.self === obj) {
                    this.privateFields.get(obj).set(prop, value);
                } else {
                    throw new Error(`Cannot assign to private field '${prop}' at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
                }
            } else {
                obj[prop] = value;
            }
        }
    
        return value;
    }
    
    createFunction(node) {
        const cacheKey = JSON.stringify({ params: node.params, body: node.body });
        if (this.functionCache.has(cacheKey)) return this.functionCache.get(cacheKey);
    
        let typesChecked = false;
        const paramLength = node.params.length;
    
        const func = async (...args) => {
            const oldEnv = this.env;
            this.env = func.env || this.createEnvironment(this.env);
    
            let varargs = [];
            if (node.hasVararg) {
                const varargStart = node.params.length - 1;
                varargs = args.slice(varargStart);
                args.length = varargStart;
            }
    
            if (!typesChecked) {
                for (let i = 0; i < paramLength; i++) {
                    const param = node.params[i];
                    if (param.typeAnnotation) {
                        this.checkType(args[i], param.typeAnnotation, param);
                    }
                    this.env[param.value] = param.type === 'Vararg' ? varargs : args[i];
                }
                typesChecked = true;
            } else {
                for (let i = 0; i < paramLength; i++) {
                    const param = node.params[i];
                    this.env[param.value] = param.type === 'Vararg' ? varargs : args[i];
                }
            }
    
            let result = null;
            for (const expr of node.body) {
                result = await this.evaluate(expr);
                if (expr.type === 'ReturnStatement') {
                    this.checkType(result, node.returnType, node);
                    this.env = oldEnv;
                    return result;
                }
            }
            this.checkType(result, node.returnType, node);
            this.env = oldEnv;
            return result;
        };
    
        func.isAsync = node.isAsync;
        func.env = this.createEnvironment(this.env);
        this.functionCache.set(cacheKey, func);
        return func;
    }

    async handleFunctionMethodCallAsync(node) {
        let callee;
        try {
            callee = await this.evaluateValueAsync(node.callee.property);
        } catch {
            callee = await this.evaluateValueAsync(node.callee);
        }
        const args = [];
        for (const argNode of node.arguments) {
            args.push(await this.evaluateValueAsync(argNode));
        }

        if (typeof callee !== 'function') {
            args.unshift(callee);
            callee = callee[node.callee.property.value];
        }
        if (typeof callee !== 'function') {
            throw new Error(`Trying to call non-function: ${typeof callee} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }

        if (callee.isAsync) {
            callee(...args).catch(err => {
                console.error('Async error:', err.message);
                throw new Error("Stop program.");
            });
            return undefined;
        } else {
            return await callee(...args);
        }
    }

    async handleFunctionCallAsync(node) {
        const callee = await this.evaluateValueAsync(node.callee);
        const args = [];
        for (const argNode of node.arguments) {
            args.push(await this.evaluateValueAsync(argNode));
        }

        if (typeof callee !== 'function') {
            throw new Error(`Trying to call non-function: ${typeof callee} at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }

        if (callee.isAsync) {
            callee(...args).catch(err => {
                console.error('Async error:', err.message);
                throw new Error("Stop program.");
            });
            return undefined;
        } else {
            return await callee(...args);
        }
    }

    async handleMemberAccessAsync(node) {
        const obj = await this.evaluateValueAsync(node.object);
        const prop = node.computed
            ? await this.evaluateValueAsync(node.property)
            : node.property.value;
    
        if (obj === null || obj === undefined) {
            throw new Error(`Cannot read property '${prop}' of null/undefined at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }
    
        if (this.privateFields.has(obj) && this.privateFields.get(obj).has(prop)) {
            if (this.env.self !== obj) {
                throw new Error(`Cannot access private field '${prop}' at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }
            return this.privateFields.get(obj).get(prop);
        }
    
        const value = obj[prop];
        if (typeof value === 'function' && obj !== window && obj !== document) {
            return value.bind(obj);
        }
        return value;
    }

    async createTable(node) {
        const table = {};
        for (const prop of node.properties) {
            const key = await this.evaluateValueAsync(prop.key);
            const value = await this.evaluateValueAsync(prop.value);
            if (node.typeAnnotation) {
                this.checkType(value, node.typeAnnotation, node);
            }
            table[key] = value;
        }
        return table;
    }

    async handleForStatementAsync(node) {
        const variableName = node.variable.value;
        const startValue = await this.evaluateValueAsync(node.start);
        const endValue = await this.evaluateValueAsync(node.end);
        const stepValue = await this.evaluateValueAsync(node.step);

        this.env[variableName] = startValue;

        if (stepValue > 0) {
        while (this.env[variableName] <= endValue) {
            for (const expr of node.body) {
                const result = await this.evaluate(expr);
                if (result === Symbol.for('break')) {
                    return;
                }
            }
            this.env[variableName] += stepValue;
        }
        } else {
        while (this.env[variableName] >= endValue) {
            for (const expr of node.body) {
                const result = await this.evaluate(expr);
                if (result === Symbol.for('break')) {
                    return;
                }
            }
            this.env[variableName] += stepValue;
        }
        }
    }

    async handleWhileStatementAsync(node) {
        while (this.convertToBoolean(await this.evaluateValueAsync(node.condition))) {
            for (const expr of node.body) {
                const result = await this.evaluate(expr);
                if (result === Symbol.for('break')) {
                    return;
                }
            }
        }
    }

    async handleForInStatementAsync(node) {
        const keyVariable = node.keyVariable.value;
        const valueVariable = node.valueVariable.value;
        const iteratorCall = node.iteratorCall;

        const iterator = await this.evaluateValueAsync(iteratorCall.callee);
        const table = await this.evaluateValueAsync(iteratorCall.arguments[0]);
        const iteratorObject = await iterator(table);

        let result = await iteratorObject.next();

        while (!result.done) {
            const [key, value] = result.value;

            this.env[keyVariable] = key;
            this.env[valueVariable] = value;

            for (const expr of node.body) {
                const evalResult = await this.evaluate(expr);
                if (evalResult === Symbol.for('break')) {
                    return;
                }
            }

            result = await iteratorObject.next();
        }
    }

    async handleBreakStatement() {
        return Symbol.for('break');
    }

    async handleIfStatementAsync(node) {
        if (this.convertToBoolean(await this.evaluateValueAsync(node.condition))) {
            for (const expr of node.thenBody) {
                const result = await this.evaluate(expr);
                if (result === Symbol.for('break')) {
                    return result;
                }
            }
        } else {
            for (const expr of node.elseBody) {
                const result = await this.evaluate(expr);
                if (result === Symbol.for('break')) {
                    return result;
                }
            }
        }
        return null;
    }

    async evaluateBinaryExpressionAsync(node) {
        const left = await this.evaluateValueAsync(node.left);
        const right = await this.evaluateValueAsync(node.right);
    
        switch (node.operator) {
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '==': return left === right;
            case '..': return String(left) + String(right);
            case 'and': return this.convertToBoolean(left) ? right : left;
            case 'or': return this.convertToBoolean(left) ? left : right;
            case '<': return left < right;
            case '<=': return left <= right;
            case '>': return left > right;
            case '>=': return left >= right;
            case '~=': case '!=': return left != right;
            case '%': return left % right;
            case '^': return Math.pow(left, right);
            case '&&': return this.convertToBoolean(left) && this.convertToBoolean(right);
            case '||': return this.convertToBoolean(left) || this.convertToBoolean(right);
        }
    
        throw new Error(`Unknown operator: ${node.operator}`);
    }

    async evaluateUnaryExpressionAsync(node) {
        const argument = await this.evaluateValueAsync(node.argument);
        
        switch(node.operator) {
            case 'unary-':
                if (typeof argument !== 'number') {
                    throw new Error(`Unary '-' cannot be applied to type ${typeof argument}`);
                }
                return -argument;
            case 'not':
                return !this.convertToBoolean(argument);
            default:
                throw new Error(`Unknown unary operator: ${node.operator}`);
        }
    }

    convertToBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (value === null || value === undefined) {
            return false;
        }
        if (typeof value === 'number') {
            return value !== 0;
        }
        if (typeof value === 'string') {
            return value !== '';
        }
        return true;
    }

    createClass(node) {
        const classEnv = this.createEnvironment(this.env);
        const prototype = {};
    
        for (const field of node.staticFields) {
            classEnv[field.name] = field.value ? this.evaluateValueAsync(field.value) : null;
        }
        for (const method of node.staticMethods) {
            classEnv[method.name] = this.createFunction(method);
        }
    
        for (const field of node.fields) {
            if (!field.isPrivate) {
                prototype[field.name] = field.value ? this.evaluateValueAsync(field.value) : null;
            }
        }
        for (const method of node.methods) {
            prototype[method.name] = this.createFunction(method);
        }
    
        if (node.parent) {
            const parentClass = this.env[node.parent.value];
            if (!parentClass || !parentClass.prototype) {
                throw new Error(`Parent class '${node.parent.value}' not found at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }
            Object.setPrototypeOf(prototype, parentClass.prototype);
        }
    
        const constructor = prototype.init || (async (self) => self);
    
        const classObj = async (...args) => {
            const instance = Object.create(prototype);
            const privateFields = new Map();
            this.privateFields.set(instance, privateFields);
    
            for (const field of node.fields) {
                if (field.isPrivate) {
                    privateFields.set(field.name, field.value ? await this.evaluateValueAsync(field.value) : null);
                }
            }
    
            const instanceEnv = this.createEnvironment(this.env);
            instanceEnv.self = instance; 
    
            for (const methodName in prototype) {
                if (typeof prototype[methodName] === 'function') {
                    prototype[methodName].env = instanceEnv;
                }
            }
    
            await constructor.call(instance, instance, ...args);
            return instance;
        };
    
        classObj.prototype = prototype;
        for (const [key, value] of Object.entries(classEnv)) {
            classObj[key] = value;
        }
    
        this.classPrototypes.set(node.name, prototype);
        return classObj;
    }

    async handleUpdateExpressionAsync(node) {
        const argument = node.argument;

        if (argument.type === 'Identifier') {
            const variableName = argument.value;
            if (!(variableName in this.env)) {
                throw new Error(`Undefined variable '${node.value}' at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }

            const oldValue = this.env[variableName];
            if (typeof oldValue !== 'number') {
                throw new Error(`Increment/decrement operator can only be applied to numbers at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }

            const newValue = oldValue + (node.operator === '++' ? 1 : -1);

            let env = this.env;
            let foundEnv = null;
    
            while (env !== null) {
                if (Object.prototype.hasOwnProperty.call(env, variableName)) {
                    foundEnv = env;
                    break;
                }
                env = Object.getPrototypeOf(env);
            }
            if (foundEnv !== null) {
                foundEnv[variableName] = newValue;
                this.env[variableName] = newValue;
            } else {
                this.globalEnv[variableName] = newValue;
            }

            return node.prefix ? newValue : oldValue;
        } else if (argument.type === 'MemberExpression') {
            const obj = await this.evaluateValueAsync(argument.object);
            const prop = await this.evaluateValueAsync(argument.property);

            if (typeof obj !== 'object' || obj === null) {
                throw new Error(`Cannot read property '${prop}' of non-object at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }

            if (typeof obj[prop] !== 'number') {
                throw new Error(`Increment/decrement operator can only be applied to numbers at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
            }

            const oldValue = obj[prop];
            const newValue = oldValue + (node.operator === '++' ? 1 : -1);
            obj[prop] = newValue;

            return node.prefix ? newValue : oldValue;
        } else {
            throw new Error(`Invalid argument for update expression at line ${node.line}, column ${node.column}, fileName ${node.fileName}`);
        }
    }

    async run(ast, modulePath) {
        //console.log(ast);
        let result = null;
        try {
            for (const node of ast) {
                result = await this.evaluate(node);
            }
        } catch (e) {
            if (e instanceof ReturnSignal) {
                return e.value;
            }
            throw e;
        }
        return result;
    }
}


export { Interpreter};