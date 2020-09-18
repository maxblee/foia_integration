
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    	  path: basedir,
    	  exports: {},
    	  require: function (path, base) {
          return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
        }
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var js_cookie = createCommonjsModule(function (module, exports) {
    (function (factory) {
    	var registeredInModuleLoader;
    	{
    		module.exports = factory();
    		registeredInModuleLoader = true;
    	}
    	if (!registeredInModuleLoader) {
    		var OldCookies = window.Cookies;
    		var api = window.Cookies = factory();
    		api.noConflict = function () {
    			window.Cookies = OldCookies;
    			return api;
    		};
    	}
    }(function () {
    	function extend () {
    		var i = 0;
    		var result = {};
    		for (; i < arguments.length; i++) {
    			var attributes = arguments[ i ];
    			for (var key in attributes) {
    				result[key] = attributes[key];
    			}
    		}
    		return result;
    	}

    	function decode (s) {
    		return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
    	}

    	function init (converter) {
    		function api() {}

    		function set (key, value, attributes) {
    			if (typeof document === 'undefined') {
    				return;
    			}

    			attributes = extend({
    				path: '/'
    			}, api.defaults, attributes);

    			if (typeof attributes.expires === 'number') {
    				attributes.expires = new Date(new Date() * 1 + attributes.expires * 864e+5);
    			}

    			// We're using "expires" because "max-age" is not supported by IE
    			attributes.expires = attributes.expires ? attributes.expires.toUTCString() : '';

    			try {
    				var result = JSON.stringify(value);
    				if (/^[\{\[]/.test(result)) {
    					value = result;
    				}
    			} catch (e) {}

    			value = converter.write ?
    				converter.write(value, key) :
    				encodeURIComponent(String(value))
    					.replace(/%(23|24|26|2B|3A|3C|3E|3D|2F|3F|40|5B|5D|5E|60|7B|7D|7C)/g, decodeURIComponent);

    			key = encodeURIComponent(String(key))
    				.replace(/%(23|24|26|2B|5E|60|7C)/g, decodeURIComponent)
    				.replace(/[\(\)]/g, escape);

    			var stringifiedAttributes = '';
    			for (var attributeName in attributes) {
    				if (!attributes[attributeName]) {
    					continue;
    				}
    				stringifiedAttributes += '; ' + attributeName;
    				if (attributes[attributeName] === true) {
    					continue;
    				}

    				// Considers RFC 6265 section 5.2:
    				// ...
    				// 3.  If the remaining unparsed-attributes contains a %x3B (";")
    				//     character:
    				// Consume the characters of the unparsed-attributes up to,
    				// not including, the first %x3B (";") character.
    				// ...
    				stringifiedAttributes += '=' + attributes[attributeName].split(';')[0];
    			}

    			return (document.cookie = key + '=' + value + stringifiedAttributes);
    		}

    		function get (key, json) {
    			if (typeof document === 'undefined') {
    				return;
    			}

    			var jar = {};
    			// To prevent the for loop in the first place assign an empty array
    			// in case there are no cookies at all.
    			var cookies = document.cookie ? document.cookie.split('; ') : [];
    			var i = 0;

    			for (; i < cookies.length; i++) {
    				var parts = cookies[i].split('=');
    				var cookie = parts.slice(1).join('=');

    				if (!json && cookie.charAt(0) === '"') {
    					cookie = cookie.slice(1, -1);
    				}

    				try {
    					var name = decode(parts[0]);
    					cookie = (converter.read || converter)(cookie, name) ||
    						decode(cookie);

    					if (json) {
    						try {
    							cookie = JSON.parse(cookie);
    						} catch (e) {}
    					}

    					jar[name] = cookie;

    					if (key === name) {
    						break;
    					}
    				} catch (e) {}
    			}

    			return key ? jar[key] : jar;
    		}

    		api.set = set;
    		api.get = function (key) {
    			return get(key, false /* read as raw */);
    		};
    		api.getJSON = function (key) {
    			return get(key, true /* read as json */);
    		};
    		api.remove = function (key, attributes) {
    			set(key, '', extend(attributes, {
    				expires: -1
    			}));
    		};

    		api.defaults = {};

    		api.withConverter = init;

    		return api;
    	}

    	return init(function () {});
    }));
    });

    var papaparse_min = createCommonjsModule(function (module, exports) {
    /* @license
    Papa Parse
    v5.3.0
    https://github.com/mholt/PapaParse
    License: MIT
    */
    !function(e,t){module.exports=t();}(commonjsGlobal,function s(){var f="undefined"!=typeof self?self:"undefined"!=typeof window?window:void 0!==f?f:{};var n=!f.document&&!!f.postMessage,o=n&&/blob:/i.test((f.location||{}).protocol),a={},h=0,b={parse:function(e,t){var i=(t=t||{}).dynamicTyping||!1;U(i)&&(t.dynamicTypingFunction=i,i={});if(t.dynamicTyping=i,t.transform=!!U(t.transform)&&t.transform,t.worker&&b.WORKERS_SUPPORTED){var r=function(){if(!b.WORKERS_SUPPORTED)return !1;var e=(i=f.URL||f.webkitURL||null,r=s.toString(),b.BLOB_URL||(b.BLOB_URL=i.createObjectURL(new Blob(["(",r,")();"],{type:"text/javascript"})))),t=new f.Worker(e);var i,r;return t.onmessage=m,t.id=h++,a[t.id]=t}();return r.userStep=t.step,r.userChunk=t.chunk,r.userComplete=t.complete,r.userError=t.error,t.step=U(t.step),t.chunk=U(t.chunk),t.complete=U(t.complete),t.error=U(t.error),delete t.worker,void r.postMessage({input:e,config:t,workerId:r.id})}var n=null;"string"==typeof e?n=t.download?new l(t):new p(t):!0===e.readable&&U(e.read)&&U(e.on)?n=new g(t):(f.File&&e instanceof File||e instanceof Object)&&(n=new c(t));return n.stream(e)},unparse:function(e,t){var n=!1,m=!0,_=",",v="\r\n",s='"',a=s+s,i=!1,r=null,o=!1;!function(){if("object"!=typeof t)return;"string"!=typeof t.delimiter||b.BAD_DELIMITERS.filter(function(e){return -1!==t.delimiter.indexOf(e)}).length||(_=t.delimiter);("boolean"==typeof t.quotes||"function"==typeof t.quotes||Array.isArray(t.quotes))&&(n=t.quotes);"boolean"!=typeof t.skipEmptyLines&&"string"!=typeof t.skipEmptyLines||(i=t.skipEmptyLines);"string"==typeof t.newline&&(v=t.newline);"string"==typeof t.quoteChar&&(s=t.quoteChar);"boolean"==typeof t.header&&(m=t.header);if(Array.isArray(t.columns)){if(0===t.columns.length)throw new Error("Option columns is empty");r=t.columns;}void 0!==t.escapeChar&&(a=t.escapeChar+s);"boolean"==typeof t.escapeFormulae&&(o=t.escapeFormulae);}();var h=new RegExp(q(s),"g");"string"==typeof e&&(e=JSON.parse(e));if(Array.isArray(e)){if(!e.length||Array.isArray(e[0]))return f(null,e,i);if("object"==typeof e[0])return f(r||u(e[0]),e,i)}else if("object"==typeof e)return "string"==typeof e.data&&(e.data=JSON.parse(e.data)),Array.isArray(e.data)&&(e.fields||(e.fields=e.meta&&e.meta.fields),e.fields||(e.fields=Array.isArray(e.data[0])?e.fields:u(e.data[0])),Array.isArray(e.data[0])||"object"==typeof e.data[0]||(e.data=[e.data])),f(e.fields||[],e.data||[],i);throw new Error("Unable to serialize unrecognized input");function u(e){if("object"!=typeof e)return [];var t=[];for(var i in e)t.push(i);return t}function f(e,t,i){var r="";"string"==typeof e&&(e=JSON.parse(e)),"string"==typeof t&&(t=JSON.parse(t));var n=Array.isArray(e)&&0<e.length,s=!Array.isArray(t[0]);if(n&&m){for(var a=0;a<e.length;a++)0<a&&(r+=_),r+=y(e[a],a);0<t.length&&(r+=v);}for(var o=0;o<t.length;o++){var h=n?e.length:t[o].length,u=!1,f=n?0===Object.keys(t[o]).length:0===t[o].length;if(i&&!n&&(u="greedy"===i?""===t[o].join("").trim():1===t[o].length&&0===t[o][0].length),"greedy"===i&&n){for(var d=[],l=0;l<h;l++){var c=s?e[l]:l;d.push(t[o][c]);}u=""===d.join("").trim();}if(!u){for(var p=0;p<h;p++){0<p&&!f&&(r+=_);var g=n&&s?e[p]:p;r+=y(t[o][g],p);}o<t.length-1&&(!i||0<h&&!f)&&(r+=v);}}return r}function y(e,t){if(null==e)return "";if(e.constructor===Date)return JSON.stringify(e).slice(1,25);!0===o&&"string"==typeof e&&null!==e.match(/^[=+\-@].*$/)&&(e="'"+e);var i=e.toString().replace(h,a),r="boolean"==typeof n&&n||"function"==typeof n&&n(e,t)||Array.isArray(n)&&n[t]||function(e,t){for(var i=0;i<t.length;i++)if(-1<e.indexOf(t[i]))return !0;return !1}(i,b.BAD_DELIMITERS)||-1<i.indexOf(_)||" "===i.charAt(0)||" "===i.charAt(i.length-1);return r?s+i+s:i}}};if(b.RECORD_SEP=String.fromCharCode(30),b.UNIT_SEP=String.fromCharCode(31),b.BYTE_ORDER_MARK="\ufeff",b.BAD_DELIMITERS=["\r","\n",'"',b.BYTE_ORDER_MARK],b.WORKERS_SUPPORTED=!n&&!!f.Worker,b.NODE_STREAM_INPUT=1,b.LocalChunkSize=10485760,b.RemoteChunkSize=5242880,b.DefaultDelimiter=",",b.Parser=w,b.ParserHandle=i,b.NetworkStreamer=l,b.FileStreamer=c,b.StringStreamer=p,b.ReadableStreamStreamer=g,f.jQuery){var d=f.jQuery;d.fn.parse=function(o){var i=o.config||{},h=[];return this.each(function(e){if(!("INPUT"===d(this).prop("tagName").toUpperCase()&&"file"===d(this).attr("type").toLowerCase()&&f.FileReader)||!this.files||0===this.files.length)return !0;for(var t=0;t<this.files.length;t++)h.push({file:this.files[t],inputElem:this,instanceConfig:d.extend({},i)});}),e(),this;function e(){if(0!==h.length){var e,t,i,r,n=h[0];if(U(o.before)){var s=o.before(n.file,n.inputElem);if("object"==typeof s){if("abort"===s.action)return e="AbortError",t=n.file,i=n.inputElem,r=s.reason,void(U(o.error)&&o.error({name:e},t,i,r));if("skip"===s.action)return void u();"object"==typeof s.config&&(n.instanceConfig=d.extend(n.instanceConfig,s.config));}else if("skip"===s)return void u()}var a=n.instanceConfig.complete;n.instanceConfig.complete=function(e){U(a)&&a(e,n.file,n.inputElem),u();},b.parse(n.file,n.instanceConfig);}else U(o.complete)&&o.complete();}function u(){h.splice(0,1),e();}};}function u(e){this._handle=null,this._finished=!1,this._completed=!1,this._halted=!1,this._input=null,this._baseIndex=0,this._partialLine="",this._rowCount=0,this._start=0,this._nextChunk=null,this.isFirstChunk=!0,this._completeResults={data:[],errors:[],meta:{}},function(e){var t=E(e);t.chunkSize=parseInt(t.chunkSize),e.step||e.chunk||(t.chunkSize=null);this._handle=new i(t),(this._handle.streamer=this)._config=t;}.call(this,e),this.parseChunk=function(e,t){if(this.isFirstChunk&&U(this._config.beforeFirstChunk)){var i=this._config.beforeFirstChunk(e);void 0!==i&&(e=i);}this.isFirstChunk=!1,this._halted=!1;var r=this._partialLine+e;this._partialLine="";var n=this._handle.parse(r,this._baseIndex,!this._finished);if(!this._handle.paused()&&!this._handle.aborted()){var s=n.meta.cursor;this._finished||(this._partialLine=r.substring(s-this._baseIndex),this._baseIndex=s),n&&n.data&&(this._rowCount+=n.data.length);var a=this._finished||this._config.preview&&this._rowCount>=this._config.preview;if(o)f.postMessage({results:n,workerId:b.WORKER_ID,finished:a});else if(U(this._config.chunk)&&!t){if(this._config.chunk(n,this._handle),this._handle.paused()||this._handle.aborted())return void(this._halted=!0);n=void 0,this._completeResults=void 0;}return this._config.step||this._config.chunk||(this._completeResults.data=this._completeResults.data.concat(n.data),this._completeResults.errors=this._completeResults.errors.concat(n.errors),this._completeResults.meta=n.meta),this._completed||!a||!U(this._config.complete)||n&&n.meta.aborted||(this._config.complete(this._completeResults,this._input),this._completed=!0),a||n&&n.meta.paused||this._nextChunk(),n}this._halted=!0;},this._sendError=function(e){U(this._config.error)?this._config.error(e):o&&this._config.error&&f.postMessage({workerId:b.WORKER_ID,error:e,finished:!1});};}function l(e){var r;(e=e||{}).chunkSize||(e.chunkSize=b.RemoteChunkSize),u.call(this,e),this._nextChunk=n?function(){this._readChunk(),this._chunkLoaded();}:function(){this._readChunk();},this.stream=function(e){this._input=e,this._nextChunk();},this._readChunk=function(){if(this._finished)this._chunkLoaded();else {if(r=new XMLHttpRequest,this._config.withCredentials&&(r.withCredentials=this._config.withCredentials),n||(r.onload=y(this._chunkLoaded,this),r.onerror=y(this._chunkError,this)),r.open(this._config.downloadRequestBody?"POST":"GET",this._input,!n),this._config.downloadRequestHeaders){var e=this._config.downloadRequestHeaders;for(var t in e)r.setRequestHeader(t,e[t]);}if(this._config.chunkSize){var i=this._start+this._config.chunkSize-1;r.setRequestHeader("Range","bytes="+this._start+"-"+i);}try{r.send(this._config.downloadRequestBody);}catch(e){this._chunkError(e.message);}n&&0===r.status&&this._chunkError();}},this._chunkLoaded=function(){4===r.readyState&&(r.status<200||400<=r.status?this._chunkError():(this._start+=this._config.chunkSize?this._config.chunkSize:r.responseText.length,this._finished=!this._config.chunkSize||this._start>=function(e){var t=e.getResponseHeader("Content-Range");if(null===t)return -1;return parseInt(t.substring(t.lastIndexOf("/")+1))}(r),this.parseChunk(r.responseText)));},this._chunkError=function(e){var t=r.statusText||e;this._sendError(new Error(t));};}function c(e){var r,n;(e=e||{}).chunkSize||(e.chunkSize=b.LocalChunkSize),u.call(this,e);var s="undefined"!=typeof FileReader;this.stream=function(e){this._input=e,n=e.slice||e.webkitSlice||e.mozSlice,s?((r=new FileReader).onload=y(this._chunkLoaded,this),r.onerror=y(this._chunkError,this)):r=new FileReaderSync,this._nextChunk();},this._nextChunk=function(){this._finished||this._config.preview&&!(this._rowCount<this._config.preview)||this._readChunk();},this._readChunk=function(){var e=this._input;if(this._config.chunkSize){var t=Math.min(this._start+this._config.chunkSize,this._input.size);e=n.call(e,this._start,t);}var i=r.readAsText(e,this._config.encoding);s||this._chunkLoaded({target:{result:i}});},this._chunkLoaded=function(e){this._start+=this._config.chunkSize,this._finished=!this._config.chunkSize||this._start>=this._input.size,this.parseChunk(e.target.result);},this._chunkError=function(){this._sendError(r.error);};}function p(e){var i;u.call(this,e=e||{}),this.stream=function(e){return i=e,this._nextChunk()},this._nextChunk=function(){if(!this._finished){var e,t=this._config.chunkSize;return t?(e=i.substring(0,t),i=i.substring(t)):(e=i,i=""),this._finished=!i,this.parseChunk(e)}};}function g(e){u.call(this,e=e||{});var t=[],i=!0,r=!1;this.pause=function(){u.prototype.pause.apply(this,arguments),this._input.pause();},this.resume=function(){u.prototype.resume.apply(this,arguments),this._input.resume();},this.stream=function(e){this._input=e,this._input.on("data",this._streamData),this._input.on("end",this._streamEnd),this._input.on("error",this._streamError);},this._checkIsFinished=function(){r&&1===t.length&&(this._finished=!0);},this._nextChunk=function(){this._checkIsFinished(),t.length?this.parseChunk(t.shift()):i=!0;},this._streamData=y(function(e){try{t.push("string"==typeof e?e:e.toString(this._config.encoding)),i&&(i=!1,this._checkIsFinished(),this.parseChunk(t.shift()));}catch(e){this._streamError(e);}},this),this._streamError=y(function(e){this._streamCleanUp(),this._sendError(e);},this),this._streamEnd=y(function(){this._streamCleanUp(),r=!0,this._streamData("");},this),this._streamCleanUp=y(function(){this._input.removeListener("data",this._streamData),this._input.removeListener("end",this._streamEnd),this._input.removeListener("error",this._streamError);},this);}function i(_){var a,o,h,r=Math.pow(2,53),n=-r,s=/^\s*-?(\d+\.?|\.\d+|\d+\.\d+)(e[-+]?\d+)?\s*$/,u=/(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))/,t=this,i=0,f=0,d=!1,e=!1,l=[],c={data:[],errors:[],meta:{}};if(U(_.step)){var p=_.step;_.step=function(e){if(c=e,m())g();else {if(g(),0===c.data.length)return;i+=e.data.length,_.preview&&i>_.preview?o.abort():(c.data=c.data[0],p(c,t));}};}function v(e){return "greedy"===_.skipEmptyLines?""===e.join("").trim():1===e.length&&0===e[0].length}function g(){if(c&&h&&(k("Delimiter","UndetectableDelimiter","Unable to auto-detect delimiting character; defaulted to '"+b.DefaultDelimiter+"'"),h=!1),_.skipEmptyLines)for(var e=0;e<c.data.length;e++)v(c.data[e])&&c.data.splice(e--,1);return m()&&function(){if(!c)return;function e(e,t){U(_.transformHeader)&&(e=_.transformHeader(e,t)),l.push(e);}if(Array.isArray(c.data[0])){for(var t=0;m()&&t<c.data.length;t++)c.data[t].forEach(e);c.data.splice(0,1);}else c.data.forEach(e);}(),function(){if(!c||!_.header&&!_.dynamicTyping&&!_.transform)return c;function e(e,t){var i,r=_.header?{}:[];for(i=0;i<e.length;i++){var n=i,s=e[i];_.header&&(n=i>=l.length?"__parsed_extra":l[i]),_.transform&&(s=_.transform(s,n)),s=y(n,s),"__parsed_extra"===n?(r[n]=r[n]||[],r[n].push(s)):r[n]=s;}return _.header&&(i>l.length?k("FieldMismatch","TooManyFields","Too many fields: expected "+l.length+" fields but parsed "+i,f+t):i<l.length&&k("FieldMismatch","TooFewFields","Too few fields: expected "+l.length+" fields but parsed "+i,f+t)),r}var t=1;!c.data.length||Array.isArray(c.data[0])?(c.data=c.data.map(e),t=c.data.length):c.data=e(c.data,0);_.header&&c.meta&&(c.meta.fields=l);return f+=t,c}()}function m(){return _.header&&0===l.length}function y(e,t){return i=e,_.dynamicTypingFunction&&void 0===_.dynamicTyping[i]&&(_.dynamicTyping[i]=_.dynamicTypingFunction(i)),!0===(_.dynamicTyping[i]||_.dynamicTyping)?"true"===t||"TRUE"===t||"false"!==t&&"FALSE"!==t&&(function(e){if(s.test(e)){var t=parseFloat(e);if(n<t&&t<r)return !0}return !1}(t)?parseFloat(t):u.test(t)?new Date(t):""===t?null:t):t;var i;}function k(e,t,i,r){var n={type:e,code:t,message:i};void 0!==r&&(n.row=r),c.errors.push(n);}this.parse=function(e,t,i){var r=_.quoteChar||'"';if(_.newline||(_.newline=function(e,t){e=e.substring(0,1048576);var i=new RegExp(q(t)+"([^]*?)"+q(t),"gm"),r=(e=e.replace(i,"")).split("\r"),n=e.split("\n"),s=1<n.length&&n[0].length<r[0].length;if(1===r.length||s)return "\n";for(var a=0,o=0;o<r.length;o++)"\n"===r[o][0]&&a++;return a>=r.length/2?"\r\n":"\r"}(e,r)),h=!1,_.delimiter)U(_.delimiter)&&(_.delimiter=_.delimiter(e),c.meta.delimiter=_.delimiter);else {var n=function(e,t,i,r,n){var s,a,o,h;n=n||[",","\t","|",";",b.RECORD_SEP,b.UNIT_SEP];for(var u=0;u<n.length;u++){var f=n[u],d=0,l=0,c=0;o=void 0;for(var p=new w({comments:r,delimiter:f,newline:t,preview:10}).parse(e),g=0;g<p.data.length;g++)if(i&&v(p.data[g]))c++;else {var m=p.data[g].length;l+=m,void 0!==o?0<m&&(d+=Math.abs(m-o),o=m):o=m;}0<p.data.length&&(l/=p.data.length-c),(void 0===a||d<=a)&&(void 0===h||h<l)&&1.99<l&&(a=d,s=f,h=l);}return {successful:!!(_.delimiter=s),bestDelimiter:s}}(e,_.newline,_.skipEmptyLines,_.comments,_.delimitersToGuess);n.successful?_.delimiter=n.bestDelimiter:(h=!0,_.delimiter=b.DefaultDelimiter),c.meta.delimiter=_.delimiter;}var s=E(_);return _.preview&&_.header&&s.preview++,a=e,o=new w(s),c=o.parse(a,t,i),g(),d?{meta:{paused:!0}}:c||{meta:{paused:!1}}},this.paused=function(){return d},this.pause=function(){d=!0,o.abort(),a=U(_.chunk)?"":a.substring(o.getCharIndex());},this.resume=function(){t.streamer._halted?(d=!1,t.streamer.parseChunk(a,!0)):setTimeout(t.resume,3);},this.aborted=function(){return e},this.abort=function(){e=!0,o.abort(),c.meta.aborted=!0,U(_.complete)&&_.complete(c),a="";};}function q(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function w(e){var O,D=(e=e||{}).delimiter,I=e.newline,T=e.comments,A=e.step,L=e.preview,F=e.fastMode,z=O=void 0===e.quoteChar?'"':e.quoteChar;if(void 0!==e.escapeChar&&(z=e.escapeChar),("string"!=typeof D||-1<b.BAD_DELIMITERS.indexOf(D))&&(D=","),T===D)throw new Error("Comment character same as delimiter");!0===T?T="#":("string"!=typeof T||-1<b.BAD_DELIMITERS.indexOf(T))&&(T=!1),"\n"!==I&&"\r"!==I&&"\r\n"!==I&&(I="\n");var M=0,j=!1;this.parse=function(a,t,i){if("string"!=typeof a)throw new Error("Input must be a string");var r=a.length,e=D.length,n=I.length,s=T.length,o=U(A),h=[],u=[],f=[],d=M=0;if(!a)return R();if(F||!1!==F&&-1===a.indexOf(O)){for(var l=a.split(I),c=0;c<l.length;c++){if(f=l[c],M+=f.length,c!==l.length-1)M+=I.length;else if(i)return R();if(!T||f.substring(0,s)!==T){if(o){if(h=[],b(f.split(D)),S(),j)return R()}else b(f.split(D));if(L&&L<=c)return h=h.slice(0,L),R(!0)}}return R()}for(var p=a.indexOf(D,M),g=a.indexOf(I,M),m=new RegExp(q(z)+q(O),"g"),_=a.indexOf(O,M);;)if(a[M]!==O)if(T&&0===f.length&&a.substring(M,M+s)===T){if(-1===g)return R();M=g+n,g=a.indexOf(I,M),p=a.indexOf(D,M);}else {if(-1!==p&&(p<g||-1===g)){if(!(p<_)){f.push(a.substring(M,p)),M=p+e,p=a.indexOf(D,M);continue}var v=x(p,_,g);if(v&&void 0!==v.nextDelim){p=v.nextDelim,_=v.quoteSearch,f.push(a.substring(M,p)),M=p+e,p=a.indexOf(D,M);continue}}if(-1===g)break;if(f.push(a.substring(M,g)),C(g+n),o&&(S(),j))return R();if(L&&h.length>=L)return R(!0)}else for(_=M,M++;;){if(-1===(_=a.indexOf(O,_+1)))return i||u.push({type:"Quotes",code:"MissingQuotes",message:"Quoted field unterminated",row:h.length,index:M}),E();if(_===r-1)return E(a.substring(M,_).replace(m,O));if(O!==z||a[_+1]!==z){if(O===z||0===_||a[_-1]!==z){-1!==p&&p<_+1&&(p=a.indexOf(D,_+1)),-1!==g&&g<_+1&&(g=a.indexOf(I,_+1));var y=w(-1===g?p:Math.min(p,g));if(a[_+1+y]===D){f.push(a.substring(M,_).replace(m,O)),a[M=_+1+y+e]!==O&&(_=a.indexOf(O,M)),p=a.indexOf(D,M),g=a.indexOf(I,M);break}var k=w(g);if(a.substring(_+1+k,_+1+k+n)===I){if(f.push(a.substring(M,_).replace(m,O)),C(_+1+k+n),p=a.indexOf(D,M),_=a.indexOf(O,M),o&&(S(),j))return R();if(L&&h.length>=L)return R(!0);break}u.push({type:"Quotes",code:"InvalidQuotes",message:"Trailing quote on quoted field is malformed",row:h.length,index:M}),_++;}}else _++;}return E();function b(e){h.push(e),d=M;}function w(e){var t=0;if(-1!==e){var i=a.substring(_+1,e);i&&""===i.trim()&&(t=i.length);}return t}function E(e){return i||(void 0===e&&(e=a.substring(M)),f.push(e),M=r,b(f),o&&S()),R()}function C(e){M=e,b(f),f=[],g=a.indexOf(I,M);}function R(e){return {data:h,errors:u,meta:{delimiter:D,linebreak:I,aborted:j,truncated:!!e,cursor:d+(t||0)}}}function S(){A(R()),h=[],u=[];}function x(e,t,i){var r={nextDelim:void 0,quoteSearch:void 0},n=a.indexOf(O,t+1);if(t<e&&e<n&&(n<i||-1===i)){var s=a.indexOf(D,n);if(-1===s)return r;n<s&&(n=a.indexOf(O,n+1)),r=x(s,n,i);}else r={nextDelim:e,quoteSearch:t};return r}},this.abort=function(){j=!0;},this.getCharIndex=function(){return M};}function m(e){var t=e.data,i=a[t.workerId],r=!1;if(t.error)i.userError(t.error,t.file);else if(t.results&&t.results.data){var n={abort:function(){r=!0,_(t.workerId,{data:[],errors:[],meta:{aborted:!0}});},pause:v,resume:v};if(U(i.userStep)){for(var s=0;s<t.results.data.length&&(i.userStep({data:t.results.data[s],errors:t.results.errors,meta:t.results.meta},n),!r);s++);delete t.results;}else U(i.userChunk)&&(i.userChunk(t.results,n,t.file),delete t.results);}t.finished&&!r&&_(t.workerId,t.results);}function _(e,t){var i=a[e];U(i.userComplete)&&i.userComplete(t),i.terminate(),delete a[e];}function v(){throw new Error("Not implemented.")}function E(e){if("object"!=typeof e||null===e)return e;var t=Array.isArray(e)?[]:{};for(var i in e)t[i]=E(e[i]);return t}function y(e,t){return function(){e.apply(t,arguments);}}function U(e){return "function"==typeof e}return o&&(f.onmessage=function(e){var t=e.data;void 0===b.WORKER_ID&&t&&(b.WORKER_ID=t.workerId);if("string"==typeof t.input)f.postMessage({workerId:b.WORKER_ID,results:b.parse(t.input,t.config),finished:!0});else if(f.File&&t.input instanceof File||t.input instanceof Object){var i=b.parse(t.input,t.config);i&&f.postMessage({workerId:b.WORKER_ID,results:i,finished:!0});}}),(l.prototype=Object.create(u.prototype)).constructor=l,(c.prototype=Object.create(u.prototype)).constructor=c,(p.prototype=Object.create(p.prototype)).constructor=p,(g.prototype=Object.create(u.prototype)).constructor=g,b});
    });

    var Papa = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(null), papaparse_min, {
        'default': papaparse_min,
        __moduleExports: papaparse_min
    }));

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const init$1 = {
      recipientFirstName: { text: 'Recipient First Name', value: '' },
      recipientLastName: { text: 'Recipient Last Name', value: '' },
      agencyName: { text: 'Agency Name', value: '' },
      foiaEmail: { text: 'Public Records Email', value: '' },
      // the us is the first option in the select, so this allows ppl to not actively select us
      agencyState: { text: 'Agency State', value: 'US' },
      agencyStreetAddress: { text: 'Agency Street Address', value: '' },
      agencyMunicipality: { text: 'Agency Municipality', value: '' },
      agencyZip: { text: 'Agency ZIP Code', value: '' },
    };
    Object.freeze(init$1);

    const errorInit = {
      requestErrors: {},
      recipientErrors: [{}]
    };

    function createSources() {
      const { subscribe, update } = writable([[]]);
      const addItem = () => update((n) => [...n, []]);
      const deleteItem = (idx) => {
        return update((n) => [...n.slice(0, idx), ...n.slice(idx + 1, n.length)])
      };
      const newSources = (idx, sources) => {
        return update((n) => {
          n[idx] = sources;
          return n
        })
      };
      return {
        subscribe,
        addItem,
        deleteItem,
        newSources,
      }
    }

    function createErrorDict() {
      const { subscribe, update } = writable(Object.assign({}, errorInit));
      const addItem = () => update((n) => {
        return {
          requestErrors: n.requestErrors,
          recipientErrors: [...n.recipientErrors, {}]
        }
      });
      const deleteItem = (idx) => update((n) => {
        const recip = n.recipientErrors;
        return {
          requestErrors: n.requestErrors,
          recipientErrors: [...recip.slice(0, idx), ...recip.slice(idx + 1, recip.length)]
        }
      });
      const changeAll = (errorData) => update(() => errorData);
      return {
        subscribe,
        addItem,
        deleteItem,
        changeAll
      }
    }

    function createRecipients() {
      const { subscribe, update } = writable([Object.assign({}, init$1)]);
      const addItem = () => update((n) => [...n, Object.assign({}, init$1)]);
      const deleteItem = (idx) =>
        update((n) => [...n.slice(0, idx), ...n.slice(idx + 1, n.length)]);
      const changeItem = (current, idx, fieldKey, newVal) => {
        let morphedItems = current.map((d, i) => {
          if (i === idx) {
            // create new object so it doesn't alter existing data
            let obj = {};
            for (const key of Object.keys(init$1)) {
              obj[key] = Object.create(d[key]);
              if (key === fieldKey) {
                obj[key].value = newVal;
              }
            }
            return obj
          } else return d
        });
        return update(() => morphedItems)
      };

      return {
        subscribe,
        addItem,
        deleteItem,
        changeItem,
      }
    }

    const recipients = createRecipients();
    const start = init$1;
    const count = derived(recipients, ($recipients) => $recipients.length);
    const sources = createSources();
    const errors = createErrorDict();
    const request = writable({
      subject: { text: 'subject', value: '' },
      requestedRecords: { text: 'Requested Records', value: '' },
      expeditedProcessing: {
        text: 'Expedited Processing Justification',
        value: '',
      },
      feeWaiver: { text: 'Fee Waiver Justification', value: '' },
    });

    /* src/RecipientField.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/RecipientField.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	child_ctx[30] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[25] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[33] = list[i];
    	return child_ctx;
    }

    // (209:4) {#if errorInfo}
    function create_if_block_7(ctx) {
    	let div;
    	let each_value_3 = /*errorInfo*/ ctx[13];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "recipient__errors");
    			add_location(div, file, 209, 4, 5230);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*errorInfo*/ 8192) {
    				each_value_3 = /*errorInfo*/ ctx[13];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(209:4) {#if errorInfo}",
    		ctx
    	});

    	return block;
    }

    // (211:6) {#each errorInfo as err}
    function create_each_block_3(ctx) {
    	let div;
    	let t_value = /*err*/ ctx[33] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "recipient__error form__error__item svelte-ch0zvp");
    			add_location(div, file, 211, 6, 5299);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*errorInfo*/ 8192 && t_value !== (t_value = /*err*/ ctx[33] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(211:6) {#each errorInfo as err}",
    		ctx
    	});

    	return block;
    }

    // (227:2) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*firstAgencies*/ ctx[7].length > 0 && create_if_block_6(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*isAgencyField*/ ctx[6]) return create_if_block_1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "text__container");
    			add_location(div, file, 227, 4, 5676);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*firstAgencies*/ ctx[7].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(227:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (217:2) {#if fieldType === 'select'}
    function create_if_block(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(select, "id", /*idField*/ ctx[8]);
    			attr_dev(select, "name", /*nameField*/ ctx[10]);
    			attr_dev(select, "class", "svelte-ch0zvp");
    			add_location(select, file, 217, 4, 5440);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectVal*/ ctx[12]);

    			if (!mounted) {
    				dispose = listen_dev(select, "blur", /*updateStore*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*options*/ 8) {
    				each_value = /*options*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*idField*/ 256) {
    				attr_dev(select, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty[0] & /*nameField*/ 1024) {
    				attr_dev(select, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty[0] & /*selectVal, options*/ 4104) {
    				select_option(select, /*selectVal*/ ctx[12]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(217:2) {#if fieldType === 'select'}",
    		ctx
    	});

    	return block;
    }

    // (229:6) {#if firstAgencies.length > 0}
    function create_if_block_6(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*firstAgencies*/ ctx[7].length + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("There are ");
    			t1 = text(t1_value);
    			t2 = text(" matching agencies. Use the arrow keys\n          to browse.");
    			attr_dev(div, "class", "sr-only");
    			attr_dev(div, "role", "status");
    			attr_dev(div, "aria-live", "polite");
    			add_location(div, file, 229, 8, 5751);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*firstAgencies*/ 128 && t1_value !== (t1_value = /*firstAgencies*/ ctx[7].length + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(229:6) {#if firstAgencies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (272:6) {:else}
    function create_else_block_2(ctx) {
    	let input;
    	let t;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*$sources*/ ctx[14][/*idx*/ ctx[0]].length > 0 && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input, "id", /*idField*/ ctx[8]);
    			attr_dev(input, "name", /*nameField*/ ctx[10]);
    			input.value = /*fieldVal*/ ctx[11];
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "aria-autocomplete", "list");
    			attr_dev(input, "class", "svelte-ch0zvp");
    			add_location(input, file, 272, 8, 7264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", /*autocompleteKeydown*/ ctx[17], false, false, false),
    					listen_dev(input, "input", /*updateAndQuery*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*idField*/ 256) {
    				attr_dev(input, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty[0] & /*nameField*/ 1024) {
    				attr_dev(input, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty[0] & /*fieldVal*/ 2048 && input.value !== /*fieldVal*/ ctx[11]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[11]);
    			}

    			if (/*$sources*/ ctx[14][/*idx*/ ctx[0]].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(272:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (235:6) {#if isAgencyField}
    function create_if_block_1(ctx) {
    	let input;
    	let t;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*firstAgencies*/ ctx[7].length > 0 && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input, "id", /*idField*/ ctx[8]);
    			attr_dev(input, "name", /*nameField*/ ctx[10]);
    			input.value = /*fieldVal*/ ctx[11];
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "aria-autocomplete", "list");
    			attr_dev(input, "class", "svelte-ch0zvp");
    			add_location(input, file, 235, 8, 5969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", /*autocompleteKeydown*/ ctx[17], false, false, false),
    					listen_dev(input, "input", /*updateAndQuery*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*idField*/ 256) {
    				attr_dev(input, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty[0] & /*nameField*/ 1024) {
    				attr_dev(input, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty[0] & /*fieldVal*/ 2048 && input.value !== /*fieldVal*/ ctx[11]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[11]);
    			}

    			if (/*firstAgencies*/ ctx[7].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(235:6) {#if isAgencyField}",
    		ctx
    	});

    	return block;
    }

    // (281:8) {#if $sources[idx].length > 0}
    function create_if_block_4(ctx) {
    	let div1;
    	let div0;
    	let each_value_2 = /*$sources*/ ctx[14][/*idx*/ ctx[0]];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "autocomplete__list");
    			attr_dev(div0, "role", "listbox");
    			attr_dev(div0, "tabindex", "-1");
    			add_location(div0, file, 282, 12, 7591);
    			attr_dev(div1, "class", "autocomplete__results svelte-ch0zvp");
    			add_location(div1, file, 281, 10, 7543);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*autocompleteField, autocompleteClick, $sources, idx, autocompleteSelected*/ 279073) {
    				each_value_2 = /*$sources*/ ctx[14][/*idx*/ ctx[0]];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(281:8) {#if $sources[idx].length > 0}",
    		ctx
    	});

    	return block;
    }

    // (295:16) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let t0_value = /*source*/ ctx[31]["name"] + "";
    	let t0;
    	let t1;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "autocomplete__item svelte-ch0zvp");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 295, 18, 8146);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$sources, idx*/ 16385 && t0_value !== (t0_value = /*source*/ ctx[31]["name"] + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(295:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (285:16) {#if autocompleteSelected === i}
    function create_if_block_5(ctx) {
    	let div;
    	let t0_value = /*source*/ ctx[31]["name"] + "";
    	let t0;
    	let t1;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "autocomplete__item selected svelte-ch0zvp");
    			attr_dev(div, "aria-selected", "true");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 285, 18, 7769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$sources, idx*/ 16385 && t0_value !== (t0_value = /*source*/ ctx[31]["name"] + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(285:16) {#if autocompleteSelected === i}",
    		ctx
    	});

    	return block;
    }

    // (284:14) {#each $sources[idx] as source, i}
    function create_each_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*autocompleteSelected*/ ctx[5] === /*i*/ ctx[30]) return create_if_block_5;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_3(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(284:14) {#each $sources[idx] as source, i}",
    		ctx
    	});

    	return block;
    }

    // (244:8) {#if firstAgencies.length > 0}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let each_value_1 = /*firstAgencies*/ ctx[7];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "autocomplete__list");
    			attr_dev(div0, "role", "listbox");
    			attr_dev(div0, "tabindex", "-1");
    			add_location(div0, file, 245, 12, 6296);
    			attr_dev(div1, "class", "autocomplete__results svelte-ch0zvp");
    			add_location(div1, file, 244, 10, 6248);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*autocompleteField, autocompleteClick, firstAgencies, autocompleteSelected*/ 262816) {
    				each_value_1 = /*firstAgencies*/ ctx[7];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(244:8) {#if firstAgencies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (258:16) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t0_value = /*agency*/ ctx[28]["agencyName"] + "";
    	let t0;
    	let t1;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "autocomplete__item svelte-ch0zvp");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 258, 18, 6857);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*firstAgencies*/ 128 && t0_value !== (t0_value = /*agency*/ ctx[28]["agencyName"] + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(258:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (248:16) {#if autocompleteSelected === i}
    function create_if_block_3(ctx) {
    	let div;
    	let t0_value = /*agency*/ ctx[28]["agencyName"] + "";
    	let t0;
    	let t1;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "autocomplete__item selected svelte-ch0zvp");
    			attr_dev(div, "aria-selected", "true");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 248, 18, 6474);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[18], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*firstAgencies*/ 128 && t0_value !== (t0_value = /*agency*/ ctx[28]["agencyName"] + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[30]}`)) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(248:16) {#if autocompleteSelected === i}",
    		ctx
    	});

    	return block;
    }

    // (247:14) {#each firstAgencies as agency, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*autocompleteSelected*/ ctx[5] === /*i*/ ctx[30]) return create_if_block_3;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(247:14) {#each firstAgencies as agency, i}",
    		ctx
    	});

    	return block;
    }

    // (223:6) {#each options as option}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[25].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[25].abbr;
    			option.value = option.__value;
    			add_location(option, file, 223, 8, 5583);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*options*/ 8 && t_value !== (t_value = /*option*/ ctx[25].name + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*options*/ 8 && option_value_value !== (option_value_value = /*option*/ ctx[25].abbr)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(223:6) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let label;
    	let t0_value = start[/*fieldKey*/ ctx[1]].text + "";
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let t3;
    	let if_block0 = /*errorInfo*/ ctx[13] && create_if_block_7(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*fieldType*/ ctx[2] === "select") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if_block1.c();
    			toggle_class(span, "optional", !/*required*/ ctx[4]);
    			toggle_class(span, "required", /*required*/ ctx[4]);
    			add_location(span, file, 207, 4, 5155);
    			attr_dev(label, "for", /*idField*/ ctx[8]);
    			attr_dev(label, "class", "svelte-ch0zvp");
    			add_location(label, file, 205, 2, 5102);
    			attr_dev(div, "class", "form__field svelte-ch0zvp");
    			add_location(div, file, 204, 0, 5074);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, span);
    			append_dev(label, t2);
    			if (if_block0) if_block0.m(label, null);
    			append_dev(div, t3);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fieldKey*/ 2 && t0_value !== (t0_value = start[/*fieldKey*/ ctx[1]].text + "")) set_data_dev(t0, t0_value);

    			if (dirty[0] & /*required*/ 16) {
    				toggle_class(span, "optional", !/*required*/ ctx[4]);
    			}

    			if (dirty[0] & /*required*/ 16) {
    				toggle_class(span, "required", /*required*/ ctx[4]);
    			}

    			if (/*errorInfo*/ ctx[13]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_7(ctx);
    					if_block0.c();
    					if_block0.m(label, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty[0] & /*idField*/ 256) {
    				attr_dev(label, "for", /*idField*/ ctx[8]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $recipients;
    	let $errors;
    	let $sources;
    	validate_store(recipients, "recipients");
    	component_subscribe($$self, recipients, $$value => $$invalidate(20, $recipients = $$value));
    	validate_store(errors, "errors");
    	component_subscribe($$self, errors, $$value => $$invalidate(21, $errors = $$value));
    	validate_store(sources, "sources");
    	component_subscribe($$self, sources, $$value => $$invalidate(14, $sources = $$value));
    	let { idx = 0 } = $$props;
    	let { fieldKey = "recipientFirstName" } = $$props;
    	let { fieldType = "text" } = $$props;
    	let { options = [] } = $$props;
    	let { required = false } = $$props;
    	let autocompleteSelected;
    	let agencies = [];

    	async function updateAndQuery(event) {
    		updateStore(event);

    		if (isAgencyField) {
    			let agencyUrl = "/api/current-user/autocomplete/agencies";

    			const agencyResults = await fetch(`${agencyUrl}?field=${fieldKey}&q=${event.target.value}`).then(response => response.json()).then(data => data.results).catch(err => {
    				console.error(err);
    			});

    			$$invalidate(19, agencies = event.target.value === "" ? [] : agencyResults);
    		}
    	}

    	function updateStore(event) {
    		const newVal = event.target.value;
    		recipients.changeItem($recipients, idx, fieldKey, newVal);
    	}

    	async function autocompleteKeydown(event) {
    		switch (event.code) {
    			case "ArrowDown":
    				if (autocompleteSelected === undefined) {
    					$$invalidate(5, autocompleteSelected = 0);
    				} else if (autocompleteSelected < firstAgencies.length - 1) {
    					$$invalidate(5, autocompleteSelected += 1);
    				} else {
    					$$invalidate(5, autocompleteSelected = undefined);
    				}
    				break;
    			case "ArrowUp":
    				if (autocompleteSelected === undefined) {
    					$$invalidate(5, autocompleteSelected = firstAgencies.length - 1);
    				} else if (autocompleteSelected === 0) {
    					$$invalidate(5, autocompleteSelected = undefined);
    				} else {
    					$$invalidate(5, autocompleteSelected -= 1);
    				}
    				break;
    			case "Enter":
    				// ordinarily this is a bad idea https://www.tjvantoll.com/2013/01/01/enter-should-submit-forms-stop-messing-with-that/
    				// but here it's necessary to allow predictable keyboard use of the autocomplete
    				event.preventDefault();
    				if (autocompleteSelected !== undefined) {
    					updateData();
    				}
    				break;
    		}
    	}

    	async function autocompleteClick(event) {
    		$$invalidate(5, autocompleteSelected = parseInt(event.target.id.match(/[0-9]$/g)));
    		updateData();
    	}

    	async function updateData() {
    		if (isAgencyField) updateRecipient(); else updateSource();
    	}

    	async function updateRecipient() {
    		const selectedItem = firstAgencies[autocompleteSelected];

    		for (let inputField of Object.keys(selectedItem)) {
    			recipients.changeItem($recipients, idx, inputField, selectedItem[inputField]);
    		}

    		const praEmail = $recipients[idx].foiaEmail.value;

    		const agencySources = await fetch(`/api/current-user/autocomplete/sources?agency=${praEmail}`).then(response => response.json()).then(data => data.results).catch(err => {
    			console.error(err);
    		});

    		sources.newSources(idx, agencySources);
    		$$invalidate(19, agencies = []);
    		$$invalidate(5, autocompleteSelected = undefined);
    	}

    	function updateSource() {
    		const selectedItem = $sources[idx][autocompleteSelected];
    		recipients.changeItem($recipients, idx, "recipientFirstName", selectedItem.firstName);
    		recipients.changeItem($recipients, idx, "recipientLastName", selectedItem.lastName);

    		// reset source list
    		sources.newSources(idx, []);

    		$$invalidate(5, autocompleteSelected = undefined);
    	}

    	const writable_props = ["idx", "fieldKey", "fieldType", "options", "required"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RecipientField> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RecipientField", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("fieldKey" in $$props) $$invalidate(1, fieldKey = $$props.fieldKey);
    		if ("fieldType" in $$props) $$invalidate(2, fieldType = $$props.fieldType);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("required" in $$props) $$invalidate(4, required = $$props.required);
    	};

    	$$self.$capture_state = () => ({
    		recipients,
    		start,
    		sources,
    		errors,
    		idx,
    		fieldKey,
    		fieldType,
    		options,
    		required,
    		autocompleteSelected,
    		agencies,
    		updateAndQuery,
    		updateStore,
    		autocompleteKeydown,
    		autocompleteClick,
    		updateData,
    		updateRecipient,
    		updateSource,
    		isAgencyField,
    		firstAgencies,
    		idField,
    		autocompleteField,
    		nameField,
    		fieldVal,
    		$recipients,
    		selectVal,
    		errorInfo,
    		$errors,
    		$sources
    	});

    	$$self.$inject_state = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("fieldKey" in $$props) $$invalidate(1, fieldKey = $$props.fieldKey);
    		if ("fieldType" in $$props) $$invalidate(2, fieldType = $$props.fieldType);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("required" in $$props) $$invalidate(4, required = $$props.required);
    		if ("autocompleteSelected" in $$props) $$invalidate(5, autocompleteSelected = $$props.autocompleteSelected);
    		if ("agencies" in $$props) $$invalidate(19, agencies = $$props.agencies);
    		if ("isAgencyField" in $$props) $$invalidate(6, isAgencyField = $$props.isAgencyField);
    		if ("firstAgencies" in $$props) $$invalidate(7, firstAgencies = $$props.firstAgencies);
    		if ("idField" in $$props) $$invalidate(8, idField = $$props.idField);
    		if ("autocompleteField" in $$props) $$invalidate(9, autocompleteField = $$props.autocompleteField);
    		if ("nameField" in $$props) $$invalidate(10, nameField = $$props.nameField);
    		if ("fieldVal" in $$props) $$invalidate(11, fieldVal = $$props.fieldVal);
    		if ("selectVal" in $$props) $$invalidate(12, selectVal = $$props.selectVal);
    		if ("errorInfo" in $$props) $$invalidate(13, errorInfo = $$props.errorInfo);
    	};

    	let isAgencyField;
    	let firstAgencies;
    	let idField;
    	let autocompleteField;
    	let nameField;
    	let fieldVal;
    	let selectVal;
    	let errorInfo;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*fieldKey*/ 2) {
    			// just show top 5 agencies
    			 $$invalidate(6, isAgencyField = fieldKey.startsWith("agency") || fieldKey === "foiaEmail");
    		}

    		if ($$self.$$.dirty[0] & /*agencies*/ 524288) {
    			 $$invalidate(7, firstAgencies = agencies.slice(0, 5));
    		}

    		if ($$self.$$.dirty[0] & /*fieldKey, idx*/ 3) {
    			 $$invalidate(8, idField = `id_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty[0] & /*fieldKey, idx*/ 3) {
    			 $$invalidate(9, autocompleteField = `autocomplete_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty[0] & /*fieldKey, idx*/ 3) {
    			 $$invalidate(10, nameField = `${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty[0] & /*$recipients, idx, fieldKey*/ 1048579) {
    			 $$invalidate(11, fieldVal = $recipients[idx][fieldKey].value);
    		}

    		if ($$self.$$.dirty[0] & /*fieldType, options, fieldVal*/ 2060) {
    			 $$invalidate(12, selectVal = fieldType === "select" && options.length > 0 && fieldVal === ""
    			? options[0].abbr
    			: fieldVal);
    		}

    		if ($$self.$$.dirty[0] & /*$errors, idx, fieldKey*/ 2097155) {
    			 $$invalidate(13, errorInfo = $errors.recipientErrors[idx][fieldKey]);
    		}
    	};

    	return [
    		idx,
    		fieldKey,
    		fieldType,
    		options,
    		required,
    		autocompleteSelected,
    		isAgencyField,
    		firstAgencies,
    		idField,
    		autocompleteField,
    		nameField,
    		fieldVal,
    		selectVal,
    		errorInfo,
    		$sources,
    		updateAndQuery,
    		updateStore,
    		autocompleteKeydown,
    		autocompleteClick
    	];
    }

    class RecipientField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance,
    			create_fragment,
    			safe_not_equal,
    			{
    				idx: 0,
    				fieldKey: 1,
    				fieldType: 2,
    				options: 3,
    				required: 4
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RecipientField",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get idx() {
    		throw new Error("<RecipientField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idx(value) {
    		throw new Error("<RecipientField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fieldKey() {
    		throw new Error("<RecipientField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fieldKey(value) {
    		throw new Error("<RecipientField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fieldType() {
    		throw new Error("<RecipientField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fieldType(value) {
    		throw new Error("<RecipientField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<RecipientField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<RecipientField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<RecipientField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<RecipientField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Recipient.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$1 = "src/Recipient.svelte";

    // (1:0) <script>   import { recipients, count, request, sources, errors }
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>   import { recipients, count, request, sources, errors }",
    		ctx
    	});

    	return block;
    }

    // (153:32)        <RecipientField         {idx}
    function create_then_block(ctx) {
    	let recipientfield;
    	let current;

    	recipientfield = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyState",
    				fieldType: "select",
    				required: true,
    				options: /*options*/ ctx[16]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(recipientfield.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(recipientfield, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const recipientfield_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield_changes.idx = /*idx*/ ctx[0];
    			if (dirty & /*states*/ 2) recipientfield_changes.options = /*options*/ ctx[16];
    			recipientfield.$set(recipientfield_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipientfield.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipientfield.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(recipientfield, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(153:32)        <RecipientField         {idx}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>   import { recipients, count, request, sources, errors }
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>   import { recipients, count, request, sources, errors }",
    		ctx
    	});

    	return block;
    }

    // (169:6) {#if idx === $count - 1}
    function create_if_block_2$1(ctx) {
    	let button;
    	let svg;
    	let title;
    	let t;
    	let path;
    	let button_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t = text("Add New Item");
    			path = svg_element("path");
    			add_location(title, file$1, 175, 33, 4537);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 176, 12, 4577);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "plus w-6 h-6");
    			add_location(svg, file$1, 170, 10, 4387);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", button_id_value = "add-" + /*idx*/ ctx[0]);
    			attr_dev(button, "aria-label", "Add Item");
    			attr_dev(button, "class", "svelte-1erk6vo");
    			add_location(button, file$1, 169, 8, 4293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, title);
    			append_dev(title, t);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*addRecipient*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idx*/ 1 && button_id_value !== (button_id_value = "add-" + /*idx*/ ctx[0])) {
    				attr_dev(button, "id", button_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(169:6) {#if idx === $count - 1}",
    		ctx
    	});

    	return block;
    }

    // (185:6) {#if $count > 1}
    function create_if_block_1$1(ctx) {
    	let button;
    	let svg;
    	let title;
    	let t;
    	let path;
    	let button_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			title = svg_element("title");
    			t = text("Delete This Item");
    			path = svg_element("path");
    			add_location(title, file$1, 195, 30, 5162);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 196, 12, 5206);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "x w-6 h-6");
    			add_location(svg, file$1, 190, 10, 5015);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", button_id_value = "delete-" + /*idx*/ ctx[0]);
    			attr_dev(button, "aria-label", "Delete Item");
    			attr_dev(button, "class", "svelte-1erk6vo");
    			add_location(button, file$1, 185, 8, 4867);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, title);
    			append_dev(title, t);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*deleteRecipient*/ ctx[7](/*idx*/ ctx[0]))) /*deleteRecipient*/ ctx[7](/*idx*/ ctx[0]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*idx*/ 1 && button_id_value !== (button_id_value = "delete-" + /*idx*/ ctx[0])) {
    				attr_dev(button, "id", button_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(185:6) {#if $count > 1}",
    		ctx
    	});

    	return block;
    }

    // (211:4) {:else}
    function create_else_block$1(ctx) {
    	let button;
    	let t0;
    	let button_id_value;
    	let t1;
    	let div;
    	let t2;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Hide Preview");
    			t1 = space();
    			div = element("div");
    			t2 = text(/*currentTemplate*/ ctx[3]);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", button_id_value = "expand-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-1erk6vo");
    			add_location(button, file$1, 211, 6, 5827);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview svelte-1erk6vo");
    			add_location(div, file$1, 212, 6, 5920);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*togglePreview*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idx*/ 1 && button_id_value !== (button_id_value = "expand-" + /*idx*/ ctx[0])) {
    				attr_dev(button, "id", button_id_value);
    			}

    			if (dirty & /*currentTemplate*/ 8) set_data_dev(t2, /*currentTemplate*/ ctx[3]);

    			if (dirty & /*idx*/ 1 && div_id_value !== (div_id_value = "template-" + /*idx*/ ctx[0])) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(211:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (206:4) {#if !toggleDisplay}
    function create_if_block$1(ctx) {
    	let button;
    	let t0;
    	let button_id_value;
    	let t1;
    	let div;
    	let t2;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t0 = text("Preview Request");
    			t1 = space();
    			div = element("div");
    			t2 = text(/*currentTemplate*/ ctx[3]);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "id", button_id_value = "expand-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-1erk6vo");
    			add_location(button, file$1, 206, 6, 5615);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview hidden svelte-1erk6vo");
    			add_location(div, file$1, 207, 6, 5711);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*togglePreview*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idx*/ 1 && button_id_value !== (button_id_value = "expand-" + /*idx*/ ctx[0])) {
    				attr_dev(button, "id", button_id_value);
    			}

    			if (dirty & /*currentTemplate*/ 8) set_data_dev(t2, /*currentTemplate*/ ctx[3]);

    			if (dirty & /*idx*/ 1 && div_id_value !== (div_id_value = "template-" + /*idx*/ ctx[0])) {
    				attr_dev(div, "id", div_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(206:4) {#if !toggleDisplay}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div7;
    	let div0;
    	let recipientfield0;
    	let t0;
    	let recipientfield1;
    	let t1;
    	let div1;
    	let recipientfield2;
    	let t2;
    	let recipientfield3;
    	let t3;
    	let promise;
    	let t4;
    	let div2;
    	let recipientfield4;
    	let t5;
    	let recipientfield5;
    	let t6;
    	let recipientfield6;
    	let t7;
    	let div5;
    	let div3;
    	let t8;
    	let div4;
    	let t9;
    	let div6;
    	let div7_id_value;
    	let current;

    	recipientfield0 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "recipientFirstName"
    			},
    			$$inline: true
    		});

    	recipientfield1 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "recipientLastName"
    			},
    			$$inline: true
    		});

    	recipientfield2 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyName",
    				required: true
    			},
    			$$inline: true
    		});

    	recipientfield3 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "foiaEmail",
    				fieldType: "email",
    				required: true
    			},
    			$$inline: true
    		});

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 16,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*states*/ ctx[1], info);

    	recipientfield4 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyStreetAddress"
    			},
    			$$inline: true
    		});

    	recipientfield5 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyZip"
    			},
    			$$inline: true
    		});

    	recipientfield6 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyMunicipality"
    			},
    			$$inline: true
    		});

    	let if_block0 = /*idx*/ ctx[0] === /*$count*/ ctx[4] - 1 && create_if_block_2$1(ctx);
    	let if_block1 = /*$count*/ ctx[4] > 1 && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (!/*toggleDisplay*/ ctx[2]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			create_component(recipientfield0.$$.fragment);
    			t0 = space();
    			create_component(recipientfield1.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(recipientfield2.$$.fragment);
    			t2 = space();
    			create_component(recipientfield3.$$.fragment);
    			t3 = space();
    			info.block.c();
    			t4 = space();
    			div2 = element("div");
    			create_component(recipientfield4.$$.fragment);
    			t5 = space();
    			create_component(recipientfield5.$$.fragment);
    			t6 = space();
    			create_component(recipientfield6.$$.fragment);
    			t7 = space();
    			div5 = element("div");
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t8 = space();
    			div4 = element("div");
    			if (if_block1) if_block1.c();
    			t9 = space();
    			div6 = element("div");
    			if_block2.c();
    			attr_dev(div0, "class", "recipient__person");
    			add_location(div0, file$1, 141, 2, 3432);
    			attr_dev(div1, "class", "agency__general svelte-1erk6vo");
    			add_location(div1, file$1, 145, 2, 3592);
    			attr_dev(div2, "class", "agency__street svelte-1erk6vo");
    			add_location(div2, file$1, 161, 2, 3992);
    			attr_dev(div3, "class", "add__item");
    			add_location(div3, file$1, 167, 4, 4230);
    			attr_dev(div4, "class", "delete__item");
    			add_location(div4, file$1, 183, 4, 4809);
    			attr_dev(div5, "class", "new__items svelte-1erk6vo");
    			add_location(div5, file$1, 166, 2, 4201);
    			attr_dev(div6, "class", "expand__preview svelte-1erk6vo");
    			add_location(div6, file$1, 204, 2, 5554);
    			attr_dev(div7, "class", "recipient__item svelte-1erk6vo");
    			attr_dev(div7, "id", div7_id_value = "recipient-" + /*idx*/ ctx[0]);
    			add_location(div7, file$1, 140, 0, 3379);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			mount_component(recipientfield0, div0, null);
    			append_dev(div0, t0);
    			mount_component(recipientfield1, div0, null);
    			append_dev(div7, t1);
    			append_dev(div7, div1);
    			mount_component(recipientfield2, div1, null);
    			append_dev(div1, t2);
    			mount_component(recipientfield3, div1, null);
    			append_dev(div1, t3);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			append_dev(div7, t4);
    			append_dev(div7, div2);
    			mount_component(recipientfield4, div2, null);
    			append_dev(div2, t5);
    			mount_component(recipientfield5, div2, null);
    			append_dev(div2, t6);
    			mount_component(recipientfield6, div2, null);
    			append_dev(div7, t7);
    			append_dev(div7, div5);
    			append_dev(div5, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div5, t8);
    			append_dev(div5, div4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			if_block2.m(div6, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			const recipientfield0_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield0_changes.idx = /*idx*/ ctx[0];
    			recipientfield0.$set(recipientfield0_changes);
    			const recipientfield1_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield1_changes.idx = /*idx*/ ctx[0];
    			recipientfield1.$set(recipientfield1_changes);
    			const recipientfield2_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield2_changes.idx = /*idx*/ ctx[0];
    			recipientfield2.$set(recipientfield2_changes);
    			const recipientfield3_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield3_changes.idx = /*idx*/ ctx[0];
    			recipientfield3.$set(recipientfield3_changes);
    			info.ctx = ctx;

    			if (dirty & /*states*/ 2 && promise !== (promise = /*states*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[16] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const recipientfield4_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield4_changes.idx = /*idx*/ ctx[0];
    			recipientfield4.$set(recipientfield4_changes);
    			const recipientfield5_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield5_changes.idx = /*idx*/ ctx[0];
    			recipientfield5.$set(recipientfield5_changes);
    			const recipientfield6_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield6_changes.idx = /*idx*/ ctx[0];
    			recipientfield6.$set(recipientfield6_changes);

    			if (/*idx*/ ctx[0] === /*$count*/ ctx[4] - 1) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(div3, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$count*/ ctx[4] > 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					if_block1.m(div4, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div6, null);
    				}
    			}

    			if (!current || dirty & /*idx*/ 1 && div7_id_value !== (div7_id_value = "recipient-" + /*idx*/ ctx[0])) {
    				attr_dev(div7, "id", div7_id_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipientfield0.$$.fragment, local);
    			transition_in(recipientfield1.$$.fragment, local);
    			transition_in(recipientfield2.$$.fragment, local);
    			transition_in(recipientfield3.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(recipientfield4.$$.fragment, local);
    			transition_in(recipientfield5.$$.fragment, local);
    			transition_in(recipientfield6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipientfield0.$$.fragment, local);
    			transition_out(recipientfield1.$$.fragment, local);
    			transition_out(recipientfield2.$$.fragment, local);
    			transition_out(recipientfield3.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(recipientfield4.$$.fragment, local);
    			transition_out(recipientfield5.$$.fragment, local);
    			transition_out(recipientfield6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(recipientfield0);
    			destroy_component(recipientfield1);
    			destroy_component(recipientfield2);
    			destroy_component(recipientfield3);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(recipientfield4);
    			destroy_component(recipientfield5);
    			destroy_component(recipientfield6);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getTemplateInfo(recipientItem, requestItem) {
    	let templateData = {};

    	for (const field of Object.keys(recipientItem)) {
    		templateData[field] = recipientItem[field].value;
    	}

    	for (const field of Object.keys(requestItem)) {
    		templateData[field] = requestItem[field].value;
    	}

    	const recipientName = `${templateData["recipientFirstName"]} ${templateData["recipientLastName"]}`;

    	templateData["recipientName"] = recipientName.trim() === ""
    	? "Public Records Officer"
    	: recipientName.trim();

    	return templateData;
    }

    function fillTemplate(jsonData, templateData) {
    	let lastIdx = 0;
    	let templateText = "";

    	for (let tag of templateData.template) {
    		templateText += templateData.boilerplate.slice(lastIdx, tag.position);
    		const jsonItem = jsonData[tag.field];

    		templateText += jsonItem === undefined
    		? templateData[tag.field]
    		: jsonItem;

    		lastIdx = tag.position;
    	}

    	templateText += templateData.boilerplate.slice(lastIdx, templateData.boilerplate.length);
    	return templateText;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $recipients;
    	let $request;
    	let $count;
    	validate_store(recipients, "recipients");
    	component_subscribe($$self, recipients, $$value => $$invalidate(10, $recipients = $$value));
    	validate_store(request, "request");
    	component_subscribe($$self, request, $$value => $$invalidate(12, $request = $$value));
    	validate_store(count, "count");
    	component_subscribe($$self, count, $$value => $$invalidate(4, $count = $$value));
    	let { idx = 0 } = $$props;
    	let toggleDisplay = false;
    	let startUrl = "/api/current-user/";
    	let { states } = $$props;
    	let templateJson;

    	async function previewSubmission(submissionState) {
    		const templateURL = startUrl + "template/" + submissionState;

    		const resp = await fetch(templateURL).then(response => response.json()).catch(err => {
    			console.error(err);
    		});

    		$$invalidate(8, templateJson = resp);
    	}

    	async function togglePreview(event) {
    		$$invalidate(2, toggleDisplay = !toggleDisplay);
    	} // if (toggleDisplay) {
    	//   previewSubmission(event)

    	// }
    	function addRecipient() {
    		recipients.addItem();
    		sources.addItem();
    		errors.addItem();
    	}

    	function deleteRecipient() {
    		recipients.deleteItem(idx);
    		sources.deleteItem(idx);
    		errors.deleteItem(idx);
    	}

    	const writable_props = ["idx", "states"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Recipient> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Recipient", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("states" in $$props) $$invalidate(1, states = $$props.states);
    	};

    	$$self.$capture_state = () => ({
    		recipients,
    		count,
    		request,
    		sources,
    		errors,
    		RecipientField,
    		idx,
    		toggleDisplay,
    		startUrl,
    		states,
    		templateJson,
    		getTemplateInfo,
    		fillTemplate,
    		previewSubmission,
    		togglePreview,
    		addRecipient,
    		deleteRecipient,
    		currentRecipient,
    		$recipients,
    		templateInfo,
    		$request,
    		currentTemplate,
    		selectedState,
    		$count
    	});

    	$$self.$inject_state = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("toggleDisplay" in $$props) $$invalidate(2, toggleDisplay = $$props.toggleDisplay);
    		if ("startUrl" in $$props) startUrl = $$props.startUrl;
    		if ("states" in $$props) $$invalidate(1, states = $$props.states);
    		if ("templateJson" in $$props) $$invalidate(8, templateJson = $$props.templateJson);
    		if ("currentRecipient" in $$props) $$invalidate(9, currentRecipient = $$props.currentRecipient);
    		if ("templateInfo" in $$props) $$invalidate(11, templateInfo = $$props.templateInfo);
    		if ("currentTemplate" in $$props) $$invalidate(3, currentTemplate = $$props.currentTemplate);
    		if ("selectedState" in $$props) $$invalidate(13, selectedState = $$props.selectedState);
    	};

    	let currentRecipient;
    	let templateInfo;
    	let currentTemplate;
    	let selectedState;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$recipients, idx*/ 1025) {
    			 $$invalidate(9, currentRecipient = $recipients[idx]);
    		}

    		if ($$self.$$.dirty & /*currentRecipient, $request*/ 4608) {
    			 $$invalidate(11, templateInfo = getTemplateInfo(currentRecipient, $request));
    		}

    		if ($$self.$$.dirty & /*templateJson, templateInfo*/ 2304) {
    			 $$invalidate(3, currentTemplate = templateJson === undefined
    			? ""
    			: fillTemplate(templateInfo, templateJson));
    		}

    		if ($$self.$$.dirty & /*currentRecipient*/ 512) {
    			// tie this variable to the *value* of the state to avoid unnecessary XHR requests
    			 $$invalidate(13, selectedState = currentRecipient.agencyState.value);
    		}

    		if ($$self.$$.dirty & /*toggleDisplay, selectedState*/ 8196) {
    			 if (toggleDisplay) {
    				previewSubmission(selectedState || "US");
    			}
    		}
    	};

    	return [
    		idx,
    		states,
    		toggleDisplay,
    		currentTemplate,
    		$count,
    		togglePreview,
    		addRecipient,
    		deleteRecipient
    	];
    }

    class Recipient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { idx: 0, states: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Recipient",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*states*/ ctx[1] === undefined && !("states" in props)) {
    			console_1$1.warn("<Recipient> was created without expected prop 'states'");
    		}
    	}

    	get idx() {
    		throw new Error("<Recipient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set idx(value) {
    		throw new Error("<Recipient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get states() {
    		throw new Error("<Recipient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set states(value) {
    		throw new Error("<Recipient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Request.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/Request.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (88:6) {#if subjectErrors}
    function create_if_block_3$1(ctx) {
    	let div;
    	let each_value_3 = /*subjectErrors*/ ctx[0];
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "request__errors");
    			add_location(div, file$2, 88, 4, 1777);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subjectErrors*/ 1) {
    				each_value_3 = /*subjectErrors*/ ctx[0];
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(88:6) {#if subjectErrors}",
    		ctx
    	});

    	return block;
    }

    // (90:6) {#each subjectErrors as err}
    function create_each_block_3$1(ctx) {
    	let div;
    	let t_value = /*err*/ ctx[12] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "request__error form__error__item svelte-1txkxl8");
    			add_location(div, file$2, 90, 6, 1848);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*subjectErrors*/ 1 && t_value !== (t_value = /*err*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(90:6) {#each subjectErrors as err}",
    		ctx
    	});

    	return block;
    }

    // (106:6) {#if recordsErrors}
    function create_if_block_2$2(ctx) {
    	let div;
    	let each_value_2 = /*recordsErrors*/ ctx[1];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "request__errors");
    			add_location(div, file$2, 106, 4, 2238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*recordsErrors*/ 2) {
    				each_value_2 = /*recordsErrors*/ ctx[1];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(106:6) {#if recordsErrors}",
    		ctx
    	});

    	return block;
    }

    // (108:6) {#each recordsErrors as err}
    function create_each_block_2$1(ctx) {
    	let div;
    	let t_value = /*err*/ ctx[12] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "request__error form__error__item svelte-1txkxl8");
    			add_location(div, file$2, 108, 6, 2309);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*recordsErrors*/ 2 && t_value !== (t_value = /*err*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(108:6) {#each recordsErrors as err}",
    		ctx
    	});

    	return block;
    }

    // (121:4) {#if feeWaiverErrors}
    function create_if_block_1$2(ctx) {
    	let div;
    	let each_value_1 = /*feeWaiverErrors*/ ctx[3];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "request__errors");
    			add_location(div, file$2, 121, 4, 2708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*feeWaiverErrors*/ 8) {
    				each_value_1 = /*feeWaiverErrors*/ ctx[3];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(121:4) {#if feeWaiverErrors}",
    		ctx
    	});

    	return block;
    }

    // (123:6) {#each feeWaiverErrors as err}
    function create_each_block_1$1(ctx) {
    	let div;
    	let t_value = /*err*/ ctx[12] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "request__error form__error__item svelte-1txkxl8");
    			add_location(div, file$2, 123, 6, 2781);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*feeWaiverErrors*/ 8 && t_value !== (t_value = /*err*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(123:6) {#each feeWaiverErrors as err}",
    		ctx
    	});

    	return block;
    }

    // (135:4) {#if expeditedErrors}
    function create_if_block$2(ctx) {
    	let div;
    	let each_value = /*expeditedErrors*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "request__errors");
    			add_location(div, file$2, 135, 4, 3180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expeditedErrors*/ 4) {
    				each_value = /*expeditedErrors*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(135:4) {#if expeditedErrors}",
    		ctx
    	});

    	return block;
    }

    // (137:6) {#each expeditedErrors as err}
    function create_each_block$1(ctx) {
    	let div;
    	let t_value = /*err*/ ctx[12] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "request__error form__error__item svelte-1txkxl8");
    			add_location(div, file$2, 137, 6, 3253);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*expeditedErrors*/ 4 && t_value !== (t_value = /*err*/ ctx[12] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(137:6) {#each expeditedErrors as err}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let div0;
    	let label0;
    	let t0;
    	let span0;
    	let t1;
    	let t2;
    	let input;
    	let t3;
    	let div1;
    	let label1;
    	let t4;
    	let span1;
    	let t5;
    	let t6;
    	let textarea0;
    	let t7;
    	let div2;
    	let label2;
    	let t8;
    	let span2;
    	let t9;
    	let t10;
    	let textarea1;
    	let t11;
    	let div3;
    	let label3;
    	let t12;
    	let span3;
    	let t13;
    	let t14;
    	let textarea2;
    	let mounted;
    	let dispose;
    	let if_block0 = /*subjectErrors*/ ctx[0] && create_if_block_3$1(ctx);
    	let if_block1 = /*recordsErrors*/ ctx[1] && create_if_block_2$2(ctx);
    	let if_block2 = /*feeWaiverErrors*/ ctx[3] && create_if_block_1$2(ctx);
    	let if_block3 = /*expeditedErrors*/ ctx[2] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Subject\n      ");
    			span0 = element("span");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t4 = text("Records Sought\n      ");
    			span1 = element("span");
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			textarea0 = element("textarea");
    			t7 = space();
    			div2 = element("div");
    			label2 = element("label");
    			t8 = text("Fee Waiver Justification");
    			span2 = element("span");
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			textarea1 = element("textarea");
    			t11 = space();
    			div3 = element("div");
    			label3 = element("label");
    			t12 = text("Justification for Expedited Processing");
    			span3 = element("span");
    			t13 = space();
    			if (if_block3) if_block3.c();
    			t14 = space();
    			textarea2 = element("textarea");
    			attr_dev(span0, "class", "required");
    			add_location(span0, file$2, 86, 6, 1721);
    			attr_dev(label0, "for", "id_subject-line");
    			attr_dev(label0, "class", "svelte-1txkxl8");
    			add_location(label0, file$2, 84, 4, 1671);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "id_subject-line");
    			attr_dev(input, "name", "subject");
    			attr_dev(input, "class", "svelte-1txkxl8");
    			add_location(input, file$2, 95, 4, 1958);
    			attr_dev(div0, "class", "subject__line");
    			add_location(div0, file$2, 83, 2, 1639);
    			attr_dev(span1, "class", "required");
    			add_location(span1, file$2, 104, 6, 2182);
    			attr_dev(label1, "for", "id_requestedRecords");
    			attr_dev(label1, "class", "svelte-1txkxl8");
    			add_location(label1, file$2, 102, 4, 2121);
    			attr_dev(textarea0, "id", "id_requestedRecords");
    			attr_dev(textarea0, "name", "requestedRecords");
    			attr_dev(textarea0, "class", "svelte-1txkxl8");
    			add_location(textarea0, file$2, 113, 4, 2419);
    			attr_dev(div1, "class", "records");
    			add_location(div1, file$2, 101, 2, 2095);
    			attr_dev(span2, "class", "optional svelte-1txkxl8");
    			add_location(span2, file$2, 119, 54, 2644);
    			attr_dev(label2, "for", "id_feeWaiver");
    			attr_dev(label2, "class", "svelte-1txkxl8");
    			add_location(label2, file$2, 119, 4, 2594);
    			attr_dev(textarea1, "id", "id_feeWaiver");
    			attr_dev(textarea1, "name", "feeWaiver");
    			attr_dev(textarea1, "class", "svelte-1txkxl8");
    			add_location(textarea1, file$2, 127, 4, 2878);
    			attr_dev(div2, "class", "fee-waiver");
    			add_location(div2, file$2, 118, 2, 2565);
    			attr_dev(span3, "class", "optional svelte-1txkxl8");
    			add_location(span3, file$2, 133, 78, 3116);
    			attr_dev(label3, "for", "id_expeditedProcessing");
    			attr_dev(label3, "class", "svelte-1txkxl8");
    			add_location(label3, file$2, 133, 4, 3042);
    			attr_dev(textarea2, "id", "id_expeditedProcessing");
    			attr_dev(textarea2, "name", "expeditedProcessing");
    			attr_dev(textarea2, "class", "svelte-1txkxl8");
    			add_location(textarea2, file$2, 141, 4, 3350);
    			attr_dev(div3, "class", "expedited-processing");
    			add_location(div3, file$2, 132, 2, 3003);
    			attr_dev(div4, "id", "request");
    			attr_dev(div4, "class", "request__container svelte-1txkxl8");
    			add_location(div4, file$2, 82, 0, 1591);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(label0, t0);
    			append_dev(label0, span0);
    			append_dev(label0, t1);
    			if (if_block0) if_block0.m(label0, null);
    			append_dev(div0, t2);
    			append_dev(div0, input);
    			append_dev(div4, t3);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t4);
    			append_dev(label1, span1);
    			append_dev(label1, t5);
    			if (if_block1) if_block1.m(label1, null);
    			append_dev(div1, t6);
    			append_dev(div1, textarea0);
    			append_dev(div4, t7);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(label2, t8);
    			append_dev(label2, span2);
    			append_dev(div2, t9);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t10);
    			append_dev(div2, textarea1);
    			append_dev(div4, t11);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(label3, t12);
    			append_dev(label3, span3);
    			append_dev(div3, t13);
    			if (if_block3) if_block3.m(div3, null);
    			append_dev(div3, t14);
    			append_dev(div3, textarea2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_handler*/ ctx[6], false, false, false),
    					listen_dev(textarea0, "input", /*input_handler_1*/ ctx[7], false, false, false),
    					listen_dev(textarea1, "input", /*input_handler_2*/ ctx[8], false, false, false),
    					listen_dev(textarea2, "input", /*input_handler_3*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*subjectErrors*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3$1(ctx);
    					if_block0.c();
    					if_block0.m(label0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*recordsErrors*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					if_block1.m(label1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*feeWaiverErrors*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$2(ctx);
    					if_block2.c();
    					if_block2.m(div2, t10);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*expeditedErrors*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(div3, t14);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function adjustHeight(event) {
    	const elem = event.target;

    	// change the height of element if it overflows
    	if (elem.clientHeight < elem.scrollHeight) {
    		elem.style.height = elem.scrollHeight + 20 + "px";
    	}
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $errors;
    	validate_store(errors, "errors");
    	component_subscribe($$self, errors, $$value => $$invalidate(11, $errors = $$value));

    	function handleInput(event, field) {
    		request.update(n => {
    			n[field].value = event.target.value;
    			return n;
    		});
    	}

    	function textAreaInput(event, field) {
    		handleInput(event, field);
    		adjustHeight(event);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Request> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Request", $$slots, []);
    	const input_handler = e => handleInput(e, "subject");
    	const input_handler_1 = e => textAreaInput(e, "requestedRecords");
    	const input_handler_2 = e => textAreaInput(e, "feeWaiver");
    	const input_handler_3 = e => textAreaInput(e, "expeditedProcessing");

    	$$self.$capture_state = () => ({
    		request,
    		errors,
    		adjustHeight,
    		handleInput,
    		textAreaInput,
    		requestErrors,
    		$errors,
    		subjectErrors,
    		recordsErrors,
    		expeditedErrors,
    		feeWaiverErrors
    	});

    	$$self.$inject_state = $$props => {
    		if ("requestErrors" in $$props) $$invalidate(10, requestErrors = $$props.requestErrors);
    		if ("subjectErrors" in $$props) $$invalidate(0, subjectErrors = $$props.subjectErrors);
    		if ("recordsErrors" in $$props) $$invalidate(1, recordsErrors = $$props.recordsErrors);
    		if ("expeditedErrors" in $$props) $$invalidate(2, expeditedErrors = $$props.expeditedErrors);
    		if ("feeWaiverErrors" in $$props) $$invalidate(3, feeWaiverErrors = $$props.feeWaiverErrors);
    	};

    	let requestErrors;
    	let subjectErrors;
    	let recordsErrors;
    	let expeditedErrors;
    	let feeWaiverErrors;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$errors*/ 2048) {
    			 $$invalidate(10, requestErrors = $errors.requestErrors);
    		}

    		if ($$self.$$.dirty & /*requestErrors*/ 1024) {
    			 $$invalidate(0, subjectErrors = requestErrors.subject);
    		}

    		if ($$self.$$.dirty & /*requestErrors*/ 1024) {
    			 $$invalidate(1, recordsErrors = requestErrors.requestedRecords);
    		}

    		if ($$self.$$.dirty & /*requestErrors*/ 1024) {
    			 $$invalidate(2, expeditedErrors = requestErrors.expeditedProcessing);
    		}

    		if ($$self.$$.dirty & /*requestErrors*/ 1024) {
    			 $$invalidate(3, feeWaiverErrors = requestErrors.feeWaiver);
    		}
    	};

    	return [
    		subjectErrors,
    		recordsErrors,
    		expeditedErrors,
    		feeWaiverErrors,
    		handleInput,
    		textAreaInput,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		input_handler_3
    	];
    }

    class Request extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Request",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */

    const { Error: Error_1, Object: Object_1$2, console: console_1$2 } = globals;
    const file$3 = "src/App.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (162:8) {#if uploadData !== undefined}
    function create_if_block$3(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 11,
    		error: 12
    	};

    	handle_promise(promise = /*uploadData*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;
    			dirty & /*uploadData*/ 1 && promise !== (promise = /*uploadData*/ ctx[0]) && handle_promise(promise, info);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(162:8) {#if uploadData !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (167:10) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Could not process file. Make sure it is a .csv file with the\n              correct fields.";
    			add_location(p, file$3, 167, 12, 4346);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(167:10) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (165:10) {:then result}
    function create_then_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Finished";
    			add_location(p, file$3, 165, 12, 4293);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(165:10) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (163:29)              <p>Loading</p>           {:then result}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading";
    			add_location(p, file$3, 163, 12, 4241);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(163:29)              <p>Loading</p>           {:then result}",
    		ctx
    	});

    	return block;
    }

    // (176:4) {#each $recipients as _recipient, idx}
    function create_each_block$2(ctx) {
    	let recipient;
    	let current;

    	recipient = new Recipient({
    			props: {
    				states: /*states*/ ctx[2],
    				idx: /*idx*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(recipient.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(recipient, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(recipient.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipient.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(recipient, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(176:4) {#each $recipients as _recipient, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let form;
    	let input0;
    	let t0;
    	let div7;
    	let div0;
    	let h20;
    	let t2;
    	let request_1;
    	let t3;
    	let div3;
    	let h21;
    	let t5;
    	let p;
    	let t7;
    	let div2;
    	let label;
    	let t9;
    	let input1;
    	let t10;
    	let div1;
    	let t11;
    	let t12;
    	let div6;
    	let div4;
    	let input2;
    	let t13;
    	let div5;
    	let input3;
    	let current;
    	let mounted;
    	let dispose;
    	request_1 = new Request({ $$inline: true });
    	let if_block = /*uploadData*/ ctx[0] !== undefined && create_if_block$3(ctx);
    	let each_value = /*$recipients*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			form = element("form");
    			input0 = element("input");
    			t0 = space();
    			div7 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Information about the Request";
    			t2 = space();
    			create_component(request_1.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Information about the Recipients";
    			t5 = space();
    			p = element("p");
    			p.textContent = "You can manually add the agencies or you can upload a CSV.";
    			t7 = space();
    			div2 = element("div");
    			label = element("label");
    			label.textContent = "Upload a CSV file";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t11 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t12 = space();
    			div6 = element("div");
    			div4 = element("div");
    			input2 = element("input");
    			t13 = space();
    			div5 = element("div");
    			input3 = element("input");
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "csrfmiddlewaretoken");
    			input0.value = /*csrfToken*/ ctx[3];
    			add_location(input0, file$3, 144, 2, 3537);
    			attr_dev(h20, "class", "svelte-1uebm17");
    			add_location(h20, file$3, 147, 6, 3679);
    			attr_dev(div0, "class", "section__container svelte-1uebm17");
    			add_location(div0, file$3, 146, 4, 3640);
    			attr_dev(h21, "class", "svelte-1uebm17");
    			add_location(h21, file$3, 151, 6, 3790);
    			attr_dev(p, "class", "svelte-1uebm17");
    			add_location(p, file$3, 152, 6, 3838);
    			attr_dev(label, "for", "csv_upload");
    			add_location(label, file$3, 154, 8, 3950);
    			attr_dev(input1, "type", "file");
    			attr_dev(input1, "id", "csv_upload");
    			attr_dev(input1, "accept", ".csv");
    			attr_dev(input1, "class", "svelte-1uebm17");
    			add_location(input1, file$3, 155, 8, 4008);
    			attr_dev(div1, "class", "upload__info");
    			add_location(div1, file$3, 160, 8, 4133);
    			attr_dev(div2, "class", "upload__container svelte-1uebm17");
    			add_location(div2, file$3, 153, 6, 3910);
    			attr_dev(div3, "class", "section__container svelte-1uebm17");
    			add_location(div3, file$3, 150, 4, 3751);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "name", "send");
    			attr_dev(input2, "id", "id_send-requests");
    			input2.value = "Send Requests";
    			attr_dev(input2, "class", "svelte-1uebm17");
    			add_location(input2, file$3, 181, 6, 4699);
    			attr_dev(div4, "class", "submit__item svelte-1uebm17");
    			add_location(div4, file$3, 180, 4, 4666);
    			attr_dev(input3, "type", "submit");
    			attr_dev(input3, "name", "save");
    			attr_dev(input3, "id", "id_save-requests");
    			input3.value = "Save Requests";
    			attr_dev(input3, "class", "svelte-1uebm17");
    			add_location(input3, file$3, 188, 6, 4859);
    			attr_dev(div5, "class", "submit__item svelte-1uebm17");
    			add_location(div5, file$3, 187, 4, 4826);
    			attr_dev(div6, "class", "submit__container svelte-1uebm17");
    			add_location(div6, file$3, 179, 2, 4630);
    			attr_dev(div7, "class", "form__container svelte-1uebm17");
    			add_location(div7, file$3, 145, 2, 3606);
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "action", "/");
    			add_location(form, file$3, 143, 0, 3455);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, input0);
    			append_dev(form, t0);
    			append_dev(form, div7);
    			append_dev(div7, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t2);
    			mount_component(request_1, div0, null);
    			append_dev(div7, t3);
    			append_dev(div7, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t5);
    			append_dev(div3, p);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, label);
    			append_dev(div2, t9);
    			append_dev(div2, input1);
    			append_dev(div2, t10);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div3, t11);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, div4);
    			append_dev(div4, input2);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, input3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input1, "change", /*handleUpload*/ ctx[4], false, false, false),
    					listen_dev(form, "submit", prevent_default(/*handleFormSubmission*/ ctx[5]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*uploadData*/ ctx[0] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*states, $recipients*/ 6) {
    				each_value = /*$recipients*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div3, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(request_1.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(request_1.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			destroy_component(request_1);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $recipients;
    	let $request;
    	let $count;
    	validate_store(recipients, "recipients");
    	component_subscribe($$self, recipients, $$value => $$invalidate(1, $recipients = $$value));
    	validate_store(request, "request");
    	component_subscribe($$self, request, $$value => $$invalidate(6, $request = $$value));
    	validate_store(count, "count");
    	component_subscribe($$self, count, $$value => $$invalidate(7, $count = $$value));

    	let states = fetch("/api/current-user/states").then(response => response.json()).then(data => data.states).catch(e => {
    		console.error(e);
    	});

    	let uploadData;
    	const csrfToken = js_cookie.get("csrftoken");

    	async function handleUpload(event) {
    		let file = event.target.files[0];
    		let idx = $recipients.length - 1;

    		// from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
    		const res = new Promise((resolve, reject) => {
    				papaparse_min.parse(file, {
    					header: true,
    					skipEmptyLines: true,
    					step(results) {
    						if (Object.keys(results.data).every(d => Object.keys(start).includes(d))) {
    							if (!Object.entries($recipients[idx]).every(d => d[1].value === start[d[0]].value)) {
    								idx += 1;
    								recipients.addItem();
    								sources.addItem();
    								errors.addItem();
    							}
    						} else {
    							reject(new Error("invalid field"));
    						}

    						for (let field of Object.keys(results.data)) {
    							recipients.changeItem($recipients, idx, field, results.data[field]);
    						}
    					},
    					complete() {
    						resolve();
    					},
    					error(err) {
    						reject(err);
    					}
    				});
    			});

    		$$invalidate(0, uploadData = res);
    	}

    	async function handleFormSubmission(e) {
    		const postUrl = `/api/current-user/foia/${e.submitter.name}`;

    		const readableEntry = content => {
    			const output = {};

    			Object.entries(content).forEach(d => {
    				output[d[0]] = d[1].value;
    			});

    			return output;
    		};

    		await fetch(postUrl, {
    			method: "POST",
    			mode: "same-origin",
    			headers: {
    				"X-CSRFToken": csrfToken,
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({
    				requestContent: readableEntry($request),
    				recipientContent: $recipients.map(d => readableEntry(d)),
    				numItems: $count
    			})
    		}).then(response => response.json()).then(results => {
    			if (results.status === "error") {
    				errors.changeAll({
    					requestErrors: results.requestErrors,
    					recipientErrors: results.recipientErrors
    				});
    			} else {
    				e.target.submit();
    			}
    		}).catch(err => {
    			console.error(err);
    		});
    	}

    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		Cookies: js_cookie,
    		Papa,
    		recipients,
    		count,
    		start,
    		sources,
    		request,
    		errors,
    		Recipient,
    		Request,
    		states,
    		uploadData,
    		csrfToken,
    		handleUpload,
    		handleFormSubmission,
    		$recipients,
    		$request,
    		$count
    	});

    	$$self.$inject_state = $$props => {
    		if ("states" in $$props) $$invalidate(2, states = $$props.states);
    		if ("uploadData" in $$props) $$invalidate(0, uploadData = $$props.uploadData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [uploadData, $recipients, states, csrfToken, handleUpload, handleFormSubmission];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
      target: document.getElementById('foia-request-items'),
    });

    return app;

}());
//# sourceMappingURL=foia-request.js.map
