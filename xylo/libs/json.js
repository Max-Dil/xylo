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

const createJson = function() {
    return (function() {

        /**
         • Кодирует JavaScript-объект в JSON-строку.
         *
         • @param {any} obj Объект для кодирования.
         • @returns {string} JSON-строка.
         • @throws {TypeError} Если объект содержит циклические ссылки.
         */
         function encode(obj) {
            try {
                return JSON.stringify(obj);
            } catch (e) {
                if (e instanceof TypeError && e.message.startsWith('cyclic object value')) {
                    throw new TypeError('JSONLib.encode: Unexpected cyclic reference detected after deep copy.  This is a bug in deepCopy().');
                }
                throw e;
            }
        } 
      
        /**
         • Декодирует JSON-строку в JavaScript-объект.
         *
         • @param {string} str JSON-строка.
         • @returns {any} JavaScript-объект.
         • @throws {SyntaxError} Если строка не является валидным JSON.
         */
        function decode(str) {
            try {
                return JSON.parse(str);
            } catch (e) {
                throw new SyntaxError('JSONLib.decode: Недопустимый JSON: ' + e.message);
            }
        }
      
        /**
         • Валидирует, является ли переданная строка допустимым JSON.
         *
         • @param {string} str Строка для проверки.
         • @returns {boolean} `true`, если строка является допустимым JSON, `false` в противном случае.
         */
        function isValid(str) {
            try {
                JSON.parse(str);
                return true;
            } catch (e) {
                return false;
            }
        }
      
        /**
         • Форматирует JSON-строку для удобства чтения.
         *
         • @param {string} str JSON-строка для форматирования.
         • @param {number} [indent=2] Количество пробелов для отступа.  По умолчанию 2.
         • @returns {string} Отформатированная JSON-строка.  Возвращает исходную строку, если не является валидным JSON.
         */
        function pretty(str, indent = 2) {
            try {
                const obj = JSON.parse(str);
                return JSON.stringify(obj, null, indent);
            } catch (e) {
                return str;
            }
        }
      
        /**
         •  Безопасно получает значение по пути из JSON-объекта.  Возвращает `defaultValue`, если путь не существует.
         •  Избегает ошибок, когда пытаются получить доступ к свойствам `null` или `undefined`.
         *
         • @param {object} obj  JSON объект.
         • @param {string} path Путь к значению, разделенный точками (например, "a.b.c").
         • @param {any} defaultValue Значение по умолчанию, если путь не найден.
         • @returns {any} Значение по указанному пути или `defaultValue`, если путь не существует.
         */
        function get(obj, path, defaultValue = undefined) {
            if (typeof obj !== 'object' || obj === null) {
                return defaultValue;
            }
    
            const pathParts = path.split('.');
            let current = obj;
    
            for (const part of pathParts) {
                if (typeof current !== 'object' || current === null || !(part in current)) {
                    return defaultValue;
                }
                current = current[part];
            }
    
            return current;
        }
      
        return {
            encode: encode,
            decode: decode,
            isValid: isValid,
            pretty: pretty,
            get: get
        };
    })();
}

export {createJson};