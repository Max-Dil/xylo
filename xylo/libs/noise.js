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

const createNoise = () => {
    const noise = {
        perm: new Array(512),
        grad3: [
            [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
            [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
            [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
        ],
        F2: 0.5 * (Math.sqrt(3) - 1),
        G2: (3 - Math.sqrt(3)) / 6,
        F3: 1/3,
        G3: 1/6,
    
        init: function(seed = 0) {
            const table = new Array(256);
            for (let i = 0; i < 256; i++) table[i] = i;
            
            let state = (seed * 1664525 + 1013904223) >>> 0;
            for (let i = 0; i < 256; i++) {
                state = (state * 1664525 + 1013904223) >>> 0;
                const j = state % 256;
                [table[i], table[j]] = [table[j], table[i]];
            }
            
            for (let i = 0; i < 512; i++) {
                this.perm[i] = table[i & 255];
            }
        },
    
        grad: function(hash, x, y, z) {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : (h === 12 || h === 14) ? x : z;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        },
    
        fade: function(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        },
    
        lerp: function(a, b, t) {
            return a + t * (b - a);
        },
    
        perlin1D: function(x, seed = 0) {
            this.init(seed);
            
            const X = Math.floor(x) & 255;
            x -= Math.floor(x);
            const u = this.fade(x);
            
            const A = this.perm[X];
            const B = this.perm[X + 1];
    
            return this.lerp(
                this.grad(A, x, 0, 0),
                this.grad(B, x - 1, 0, 0),
                u
            );
        },
    
        perlin2D: function(x, y, seed = 0) {
            this.init(seed);
            
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            const u = this.fade(x);
            const v = this.fade(y);
            
            const A = this.perm[X] + Y;
            const B = this.perm[X + 1] + Y;
    
            return this.lerp(
                this.lerp(
                    this.grad(this.perm[A], x, y, 0),
                    this.grad(this.perm[B], x - 1, y, 0),
                    u
                ),
                this.lerp(
                    this.grad(this.perm[A + 1], x, y - 1, 0),
                    this.grad(this.perm[B + 1], x - 1, y - 1, 0),
                    u
                ),
                v
            );
        },
    
        perlin3D: function(x, y, z, seed = 0) {
            this.init(seed);
            
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const Z = Math.floor(z) & 255;
            x -= Math.floor(x);
            y -= Math.floor(y);
            z -= Math.floor(z);
            
            const u = this.fade(x);
            const v = this.fade(y);
            const w = this.fade(z);
            
            const A = this.perm[X] + Y;
            const AA = this.perm[A] + Z;
            const AB = this.perm[A + 1] + Z;
            const B = this.perm[X + 1] + Y;
            const BA = this.perm[B] + Z;
            const BB = this.perm[B + 1] + Z;
    
            return this.lerp(
                this.lerp(
                    this.lerp(
                        this.grad(this.perm[AA], x, y, z),
                        this.grad(this.perm[BA], x - 1, y, z),
                        u
                    ),
                    this.lerp(
                        this.grad(this.perm[AB], x, y - 1, z),
                        this.grad(this.perm[BB], x - 1, y - 1, z),
                        u
                    ),
                    v
                ),
                this.lerp(
                    this.lerp(
                        this.grad(this.perm[AA + 1], x, y, z - 1),
                        this.grad(this.perm[BA + 1], x - 1, y, z - 1),
                        u
                    ),
                    this.lerp(
                        this.grad(this.perm[AB + 1], x, y - 1, z - 1),
                        this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1),
                        u
                    ),
                    v
                ),
                w
            );
        },
    
        simplex2D: function(x, y) {
            const F2 = this.F2;
            const G2 = this.G2;
    
            let s = (x + y) * F2;
            let i = Math.floor(x + s);
            let j = Math.floor(y + s);
    
            let t = (i + j) * G2;
            let X0 = i - t;
            let Y0 = j - t;
            let x0 = x - X0;
            let y0 = y - Y0;
    
            let i1, j1;
            if(x0 > y0) { i1 = 1; j1 = 0; }
            else { i1 = 0; j1 = 1; }
    
            let x1 = x0 - i1 + G2;
            let y1 = y0 - j1 + G2;
            let x2 = x0 - 1 + 2*G2;
            let y2 = y0 - 1 + 2*G2;
    
            let ii = i & 255;
            let jj = j & 255;
            
            let t0 = 0.5 - x0*x0 - y0*y0;
            let n0 = t0 < 0 ? 0 : Math.pow(t0,4) * this.dot(this.grad3[this.perm[ii + this.perm[jj]] % 12], x0, y0);
    
            let t1 = 0.5 - x1*x1 - y1*y1;
            let n1 = t1 < 0 ? 0 : Math.pow(t1,4) * this.dot(this.grad3[this.perm[ii + i1 + this.perm[jj + j1]] % 12], x1, y1);
    
            let t2 = 0.5 - x2*x2 - y2*y2;
            let n2 = t2 < 0 ? 0 : Math.pow(t2,4) * this.dot(this.grad3[this.perm[ii + 1 + this.perm[jj + 1]] % 12], x2, y2);
    
            return 70 * (n0 + n1 + n2);
        },
    
        fractalNoise: function(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
            let total = 0;
            let frequency = 1;
            let amplitude = 1;
            let maxValue = 0;
    
            for(let i = 0; i < octaves; i++) {
                total += this.perlin2D(x * frequency, y * frequency) * amplitude;
                maxValue += amplitude;
                amplitude *= persistence;
                frequency *= lacunarity;
            }
    
            return total / maxValue;
        },
    
        dot: function(g, x, y) {
            return g[0]*x + g[1]*y;
        },
    
        dot3: function(g, x, y, z) {
            return g[0]*x + g[1]*y + g[2]*z;
        }
    }
    noise.init();
    return noise;
};

export { createNoise };