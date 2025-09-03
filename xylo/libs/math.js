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

const createMath = function() {
    class Vector {
    constructor(...components) {
        this.components = components;
    }

    add(v) {
        this._checkLength(v);
        return new Vector(...this.components.map((c, i) => c + v.components[i]));
    }

    subtract(v) {
        this._checkLength(v);
        return new Vector(...this.components.map((c, i) => c - v.components[i]));
    }

    scale(scalar) {
        return new Vector(...this.components.map(c => c * scalar));
    }

    dot(v) {
        this._checkLength(v);
        return this.components.reduce((sum, c, i) => sum + c * v.components[i], 0);
    }

    cross(v) {
        if (this.components.length !== 3 || v.components.length !== 3) {
            throw new Error("Cross product is only defined for 3D vectors");
        }
        const [a1, a2, a3] = this.components;
        const [b1, b2, b3] = v.components;
        return new Vector(
            a2*b3 - a3*b2,
            a3*b1 - a1*b3,
            a1*b2 - a2*b1
        );
    }

    magnitude() {
        return Math.sqrt(this.components.reduce((sum, c) => sum + c**2, 0));
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) throw new Error("Cannot normalize zero vector");
        return this.scale(1/mag);
    }

    equals(v, epsilon = 1e-6) {
        return this.components.every((c, i) => Math.abs(c - v.components[i]) < epsilon);
    }

    _checkLength(v) {
        if (this.components.length !== v.components.length) {
            throw new Error("Vectors must have same length");
        }
    }

    toString() {
        return `Vector(${this.components.join(", ")})`;
    }
    }

    class Matrix {
    constructor(rows) {
        if (!rows.every(r => r.length === rows[0].length)) {
            throw new Error("All rows must have same length");
        }
        this.rows = rows.map(row => [...row]);
        this.rowsCount = rows.length;
        this.colsCount = rows[0].length;
    }

    transpose() {
        const transposed = [];
        for (let j = 0; j < this.colsCount; j++) {
            transposed[j] = [];
            for (let i = 0; i < this.rowsCount; i++) {
                transposed[j][i] = this.rows[i][j];
            }
        }
        return new Matrix(transposed);
    }

    multiply(other) {
        if (this.colsCount !== other.rowsCount) {
            throw new Error("Columns count of A must match rows count of B");
        }
        
        const result = [];
        for (let i = 0; i < this.rowsCount; i++) {
            result[i] = [];
            for (let j = 0; j < other.colsCount; j++) {
                let sum = 0;
                for (let k = 0; k < this.colsCount; k++) {
                    sum += this.rows[i][k] * other.rows[k][j];
                }
                result[i][j] = sum;
            }
        }
        return new Matrix(result);
    }

    determinant() {
        if (!this.isSquare()) throw new Error("Matrix must be square");
        
        if (this.rowsCount === 1) return this.rows[0][0];
        if (this.rowsCount === 2) {
            return this.rows[0][0] * this.rows[1][1] - this.rows[0][1] * this.rows[1][0];
        }
        
        let det = 0;
        for (let j = 0; j < this.colsCount; j++) {
            det += this.rows[0][j] * this.cofactor(0, j);
        }
        return det;
    }

    cofactor(row, col) {
        const minor = this.minorMatrix(row, col);
        return ((-1) ** (row + col)) * minor.determinant();
    }

    minorMatrix(row, col) {
        return new Matrix(
            this.rows.filter((_, i) => i !== row)
                .map(r => r.filter((_, j) => j !== col))
        );
    }

    inverse() {
        const det = this.determinant();
        if (det === 0) throw new Error("Matrix is singular");
        
        const cofactors = [];
        for (let i = 0; i < this.rowsCount; i++) {
            cofactors[i] = [];
            for (let j = 0; j < this.colsCount; j++) {
                cofactors[i][j] = this.cofactor(i, j);
            }
        }
        
        const adjugate = new Matrix(cofactors).transpose();
        return adjugate.scale(1/det);
    }

    scale(scalar) {
        return new Matrix(this.rows.map(row => row.map(c => c * scalar)));
    }

    isSquare() {
        return this.rowsCount === this.colsCount;
    }

    equals(m, epsilon = 1e-6) {
        return this.rows.every((row, i) => 
            row.every((c, j) => Math.abs(c - m.rows[i][j]) < epsilon)
        );
    }

    toString() {
        return this.rows.map(row => row.join("\t")).join("\n");
    }

    static identity(n) {
        const rows = [];
        for (let i = 0; i < n; i++) {
            rows[i] = new Array(n).fill(0);
            rows[i][i] = 1;
        }
        return new Matrix(rows);
    }
    }

    const math = {
        pi: Math.PI,
        huge: Infinity,

        vec: {
            create: (...components) => new Vector(...components),
            add: (a, b) => a.add(b),
            sub: (a, b) => a.subtract(b),
            scale: (v, scalar) => v.scale(scalar),
            dot: (a, b) => a.dot(b),
            cross: (a, b) => a.cross(b),
            mag: (v) => v.magnitude(),
            normalize: (v) => v.normalize(),
            dist: (a, b) => a.subtract(b).magnitude(),
            angleBetween: (a, b) => {
                const dot = a.dot(b);
                return Math.acos(dot / (a.magnitude() * b.magnitude()));
            }
        },

        mat: {
            create: (rows) => new Matrix(rows),
            identity: (n) => Matrix.identity(n),
            transpose: (m) => m.transpose(),
            multiply: (a, b) => a.multiply(b),
            determinant: (m) => m.determinant(),
            inverse: (m) => m.inverse(),
            rotation2D: (theta) => {
                const c = Math.cos(theta);
                const s = Math.sin(theta);
                return new Matrix([[c, -s], [s, c]]);
            },
            rotationX: (theta) => {
                const c = Math.cos(theta);
                const s = Math.sin(theta);
                return new Matrix([
                    [1, 0, 0],
                    [0, c, -s],
                    [0, s, c]
                ]);
            },
            rotationY: (theta) => {
                const c = Math.cos(theta);
                const s = Math.sin(theta);
                return new Matrix([
                    [c, 0, s],
                    [0, 1, 0],
                    [-s, 0, c]
                ]);
            },
            rotationZ: (theta) => {
                const c = Math.cos(theta);
                const s = Math.sin(theta);
                return new Matrix([
                    [c, -s, 0],
                    [s, c, 0],
                    [0, 0, 1]
                ]);
            }
        },

        round: Math.ceil,

        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        deg: (rad) => rad * 180 / Math.PI,
        exp: Math.exp,
        floor: Math.floor,
        fmod: (a, b) => a - Math.floor(a / b) * b,
        log: (x, base) => base ? Math.log(x)/Math.log(base) : Math.log(x),
        max: (...args) => Math.max(...args),
        min: (...args) => Math.min(...args),
        modf: (x) => {
            const int = Math.trunc(x);
            return { __multiReturn: true, 1: int, 2: x - int };
        },
        rad: (deg) => deg * Math.PI / 180,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,

        frexp: (x) => {
            if(x === 0) return { __multiReturn: true, 1: 0, 2: 0 };
            const exp = Math.floor(Math.log2(Math.abs(x))) + 1;
            return { __multiReturn: true, 1: x * Math.pow(2, -exp), 2: exp };
        },

        ldexp: (m, e) => m * Math.pow(2, e),

        _randState: 1,
        randomseed: (seed) => {
            math._randState = seed ? (seed & 0x7fffffff) : 
                (new Date().getTime() & 0x7fffffff);
        },
        random: (...args) => {
            math._randState = (math._randState * 214013 + 2531011) & 0x7fffffff;
            const randVal = (math._randState >>> 16) / 0x7fff;

            if(args.length === 0) return randVal;
            if(args.length === 1) {
                const m = args[0];
                return Math.floor(randVal * m) + 1;
            }
            if(args.length === 2) {
                const [m, n] = args;
                return Math.floor(randVal * (n - m + 1)) + m;
            }
            throw new Error("wrong number of arguments to 'random'");
        },

        cosh: Math.cosh || function(x) {
            return (Math.exp(x) + Math.exp(-x)) / 2;
        },
        sinh: Math.sinh || function(x) {
            return (Math.exp(x) - Math.exp(-x)) / 2;
        },
        tanh: Math.tanh || function(x) {
            if(x === Infinity) return 1;
            if(x === -Infinity) return -1;
            return (Math.exp(2*x) - 1) / (Math.exp(2*x) + 1);
        },

        log10: (x) => Math.log10(x),
        pow: Math.pow,
        ult: (m, n) => {
            const a = m >>> 0;
            const b = n >>> 0;
            return a < b;
        },

        /**
            * Линейная интерполяция между двумя значениями.
            * @param {number} t - Коэффициент интерполяции (обычно от 0 до 1).
            * @param {number} a - Начальное значение.
            * @param {number} b - Конечное значение.
            * @returns {number} - Интерполированное значение.
        */
        lerp: function(t, a, b) {
            return a + t * (b - a);
        },

        clamp: (value, min, max) => Math.min(Math.max(value, min), max),
        smoothstep: (t, a, b) => {
            t = math.clamp((t - a) / (b - a), 0, 1);
            return t * t * (3 - 2 * t);
        },
        toPolar: (x, y) => ({
            r: Math.sqrt(x*x + y*y),
            theta: Math.atan2(y, x)
        }),
        fromPolar: (r, theta) => ({
            x: r * Math.cos(theta),
            y: r * Math.sin(theta)
        })
    };

    math.randomseed();
    return math;
}

export {createMath};