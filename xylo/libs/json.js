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