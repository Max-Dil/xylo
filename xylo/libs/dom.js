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

const createDom = function() {
    return {
        get: (selector, parent = document) => parent.querySelector(selector),
        
        getAll: (selector, parent = document) => Array.from(parent.querySelectorAll(selector)),
        
        byId: (id) => document.getElementById(id),
    
        create: async (tagName, options = {}) => {
            const el = document.createElement(tagName);
            if (options.attrs) {
                Object.entries(options.attrs).forEach(([key, value]) => {
                    el.setAttribute(key, value);
                });
            }
            if (options.text) el.textContent = options.text;
            if (options.html) el.innerHTML = options.html;
            if (options.listeners) {
                Object.entries(options.listeners).forEach(([event, handler]) => {
                    el.addEventListener(event, handler);
                });
            }
            return el;
        },
    
        append: async (parent, ...children) => {
            children.forEach(child => parent.appendChild(child));
            return parent;
        },
    
        remove: (el) => el.parentNode.removeChild(el),
    
        addClass: async (el, ...classes) => {
            el.classList.add(...classes.flatMap(c => c.split(' ')));
            return el;
        },
    
        removeClass: async (el, ...classes) => {
            el.classList.remove(...classes.flatMap(c => c.split(' ')));
            return el;
        },
    
        css: async (el, styles) => {
            if (typeof styles === 'string') return el.style[styles];
            Object.assign(el.style, styles);
            return el;
        },
    
        on: async (el, event, handler, options) => {
            const callback = (e) => handler(e.detail || e);
            el.addEventListener(event, callback, options);
            return () => el.removeEventListener(event, callback, options);
        },
    
        val: async (el, value) => {
            if (typeof value !== 'undefined') {
                el.value = value;
                return el;
            }
            return el.value;
        },
    
        animate: async (el, keyframes, options) => {
            const animation = el.animate(keyframes, options);
            return {
                finished: animation.finished,
                cancel: () => animation.cancel()
            };
        },
    
        show: async (el) => {
            const originalDisplay = el.dataset.originalDisplay || 'block';
            el.style.display = originalDisplay;
            return el;
        },
    
        hide: async (el) => {
            if (el.style.display !== 'none') {
                el.dataset.originalDisplay = getComputedStyle(el).display;
            }
            el.style.display = 'none';
            return el;
        },
    
        fetch: async (url, options = {}) => {
            try {
                const response = await window.fetch(url, options);
                return {
                    ok: response.ok,
                    status: response.status,
                    json: async () => await response.json(),
                    text: async () => await response.text(),
                    blob: async () => await response.blob()
                };
            } catch (error) {
                return {
                    ok: false,
                    error: error.message
                };
            }
        },
    
        trigger: async (el, eventName, detail = null) => {
            const event = new CustomEvent(eventName, { detail });
            el.dispatchEvent(event);
            return el;
        },
    
        data: async (el, key, value) => {
            if (typeof value !== 'undefined') {
                el.dataset[key] = value;
                return el;
            }
            return el.dataset[key];
        },
    
        delegate: async (parent, event, selector, handler) => {
            const callback = (e) => {
                const target = e.target.closest(selector);
                if (target && parent.contains(target)) {
                    handler.call(target, e);
                }
            };
            parent.addEventListener(event, callback);
            return () => parent.removeEventListener(event, callback);
        },
    
        isVisible: async (el) => {
            return el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0;
        },
    
        serialize: async (form) => {
            return Object.fromEntries(new FormData(form).entries());
        },
    
        prepend: async (parent, ...children) => {
            children.reverse().forEach(child => parent.prepend(child));
            return parent;
        },
        
        before: async (el, ...siblings) => {
            siblings.forEach(sibling => el.before(sibling));
            return el;
        },
        
        after: async (el, ...siblings) => {
            siblings.forEach(sibling => el.after(sibling));
            return el;
        },
    
        toggleClass: async (el, className) => {
            el.classList.toggle(className);
            return el;
        },
        
        hasClass: async (el, className) => el.classList.contains(className),
        
        attr: async (el, name, value) => {
            if (typeof value !== 'undefined') {
                el.setAttribute(name, value);
                return el;
            }
            return el.getAttribute(name);
        },
    
        replace: async (oldEl, newEl) => {
            oldEl.replaceWith(newEl);
            return newEl;
        },
    
        clone: async (el, deep = true) => {
            return el.cloneNode(deep);
        },
    
        children: async (el) => {
            return Array.from(el.children);
        },
    
        parent: async (el) => {
            return el.parentElement;
        },
    
        siblings: async (el) => {
            return Array.from(el.parentElement.children).filter(child => child !== el);
        },
    
        closest: async (el, selector) => {
            return el.closest(selector);
        },
    
        matches: async (el, selector) => {
            return el.matches(selector);
        },
    
        toggle: async (el) => {
            const isHidden = el.style.display === 'none';
            return isHidden ? dom.show(el) : dom.hide(el);
        },
    
        scrollTo: async (el, options = {}) => {
            el.scrollIntoView(options);
            return el;
        },
    
        getStyle: async (el, property) => {
            return getComputedStyle(el)[property];
        },
    
        debug: async (el) => {
            const info = {
                tag: el.tagName,
                id: el.id || null,
                classes: Array.from(el.classList),
                attributes: Object.fromEntries([...el.attributes].map(attr => [attr.name, attr.value])),
                rect: el.getBoundingClientRect(),
                computedStyles: getComputedStyle(el)
            };
            console.log('DOM Element Debug:', info);
            return el;
        },
    
        batchUpdate: async (parent, updates) => {
            const fragment = document.createDocumentFragment();
            updates.forEach(update => {
                const el = update.element || dom.create(update.tag, update.options);
                fragment.appendChild(el);
            });
            parent.appendChild(fragment);
            return parent;
        },
    
        observe: async (el, callback, options = { attributes: true, childList: true, subtree: true }) => {
            const observer = new MutationObserver((mutations) => callback(mutations));
            observer.observe(el, options);
            return () => observer.disconnect();
        },
    
        loadScript: async (src, options = {}) => {
            const script = await dom.create('script', {
                attrs: { src, ...options.attrs },
                listeners: {
                    load: options.onload,
                    error: options.onerror
                }
            });
            document.head.appendChild(script);
            return script;
        },
    
        loadStyle: async (href, options = {}) => {
            const link = await dom.create('link', {
                attrs: { rel: 'stylesheet', href, ...options.attrs }
            });
            document.head.appendChild(link);
            return link;
        },
    
        findByText: async (text, parent = document) => {
            const regex = new RegExp(text, 'i');
            return dom.getAll('*', parent).filter(el => regex.test(el.textContent));
        },
    
        disable: async (el) => {
            el.setAttribute('disabled', 'true');
            return el;
        },
    
        enable: async (el) => {
            el.removeAttribute('disabled');
            return el;
        },
    
        setFocus: async (el) => {
            el.focus();
            return el;
        },
    
        clear: async (el) => {
            el.innerHTML = '';
            return el;
        }
    };
}

export { createDom };