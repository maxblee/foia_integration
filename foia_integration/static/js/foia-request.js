
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
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
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
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
        "recipientName": {text: "Recipient Name", value:""},
        "agencyName": {text: "Agency Name", value: ""},
        "foiaEmail": {text: "Public Records Email", value: ""},
        "agencyState": {text: "Agency State", value: ""},
        "agencyStreetAddress": {text: "Agency Street Address", value: ""},
        "agencyMunicipality": {text: "Agency Municipality", value: ""},
        "agencyZip": {text: "Agency ZIP Code", value: ""}
    };
    Object.freeze(init$1);

    function createRecipients() {
        

        const {subscribe, set, update} = writable([Object.assign({}, init$1)]);
        const addItem = () => update(n => [...n, Object.assign({}, init$1)]);
        const deleteItem = (idx) => update(n => [...n.slice(0,idx), ...n.slice(idx+1,n.length)]);
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
                    return obj;
                } else return d;
            });
            return update(_ => morphedItems);
        };

        return {
            subscribe,
            addItem,
            deleteItem,
            changeItem
        };
    }

    const recipients = createRecipients();
    const start = init$1;
    const count = derived(recipients, $recipients => $recipients.length);
    const sources = writable([]);

    /* src/RecipientField.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/RecipientField.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[25] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	return child_ctx;
    }

    // (98:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t;
    	let show_if;
    	let if_block0 = /*firstAgencies*/ ctx[5].length > 0 && create_if_block_3(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (show_if == null || dirty & /*fieldKey*/ 1) show_if = !!(/*fieldKey*/ ctx[0].startsWith("agency") || /*fieldKey*/ ctx[0] === "foiaEmail");
    		if (show_if) return create_if_block_1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if_block1.c();
    			attr_dev(div, "class", "text__container");
    			add_location(div, file, 98, 4, 3725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*firstAgencies*/ ctx[5].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block1) {
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
    		source: "(98:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (92:4) {#if fieldType === "select"}
    function create_if_block(ctx) {
    	let select;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[2];
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

    			attr_dev(select, "id", /*idField*/ ctx[6]);
    			attr_dev(select, "name", /*nameField*/ ctx[8]);
    			attr_dev(select, "class", "svelte-4upspk");
    			add_location(select, file, 92, 4, 3499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectVal*/ ctx[10]);

    			if (!mounted) {
    				dispose = listen_dev(select, "blur", /*updateStore*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 4) {
    				each_value = /*options*/ ctx[2];
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

    			if (dirty & /*idField*/ 64) {
    				attr_dev(select, "id", /*idField*/ ctx[6]);
    			}

    			if (dirty & /*nameField*/ 256) {
    				attr_dev(select, "name", /*nameField*/ ctx[8]);
    			}

    			if (dirty & /*selectVal, options*/ 1028) {
    				select_option(select, /*selectVal*/ ctx[10]);
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
    		source: "(92:4) {#if fieldType === \\\"select\\\"}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {#if firstAgencies.length > 0}
    function create_if_block_3(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*firstAgencies*/ ctx[5].length + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("There are ");
    			t1 = text(t1_value);
    			t2 = text(" matching agencies. Use the arrow keys to browse.");
    			attr_dev(div, "class", "sr-only");
    			attr_dev(div, "role", "status");
    			attr_dev(div, "aria-live", "polite");
    			add_location(div, file, 100, 8, 3802);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 32 && t1_value !== (t1_value = /*firstAgencies*/ ctx[5].length + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(100:8) {#if firstAgencies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (118:8) {:else}
    function create_else_block_2(ctx) {
    	let input;
    	let t;
    	let datalist;
    	let each_value_2 = /*$sources*/ ctx[11];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			datalist = element("datalist");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "list", /*autocompleteField*/ ctx[7]);
    			attr_dev(input, "id", /*idField*/ ctx[6]);
    			attr_dev(input, "name", /*nameField*/ ctx[8]);
    			input.value = /*fieldVal*/ ctx[9];
    			attr_dev(input, "class", "svelte-4upspk");
    			add_location(input, file, 118, 8, 4944);
    			attr_dev(datalist, "id", /*autocompleteField*/ ctx[7]);
    			add_location(datalist, file, 119, 8, 5038);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, datalist, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(datalist, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*autocompleteField*/ 128) {
    				attr_dev(input, "list", /*autocompleteField*/ ctx[7]);
    			}

    			if (dirty & /*idField*/ 64) {
    				attr_dev(input, "id", /*idField*/ ctx[6]);
    			}

    			if (dirty & /*nameField*/ 256) {
    				attr_dev(input, "name", /*nameField*/ ctx[8]);
    			}

    			if (dirty & /*fieldVal*/ 512 && input.value !== /*fieldVal*/ ctx[9]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[9]);
    			}

    			if (dirty & /*$sources*/ 2048) {
    				each_value_2 = /*$sources*/ ctx[11];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(datalist, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty & /*autocompleteField*/ 128) {
    				attr_dev(datalist, "id", /*autocompleteField*/ ctx[7]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(datalist);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(118:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (105:8) {#if fieldKey.startsWith("agency") || fieldKey === "foiaEmail"}
    function create_if_block_1(ctx) {
    	let input;
    	let t;
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*firstAgencies*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			div1 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(input, "id", /*idField*/ ctx[6]);
    			attr_dev(input, "name", /*nameField*/ ctx[8]);
    			input.value = /*fieldVal*/ ctx[9];
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "aria-autocomplete", "list");
    			attr_dev(input, "class", "svelte-4upspk");
    			add_location(input, file, 105, 8, 4060);
    			attr_dev(div0, "class", "autocomplete__list");
    			attr_dev(div0, "role", "listbox");
    			attr_dev(div0, "tabindex", "-1");
    			add_location(div0, file, 107, 12, 4282);
    			attr_dev(div1, "class", "autocomplete__results");
    			add_location(div1, file, 106, 8, 4234);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keydown", /*autocompleteKeydown*/ ctx[14], false, false, false),
    					listen_dev(input, "input", /*updateAndQuery*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idField*/ 64) {
    				attr_dev(input, "id", /*idField*/ ctx[6]);
    			}

    			if (dirty & /*nameField*/ 256) {
    				attr_dev(input, "name", /*nameField*/ ctx[8]);
    			}

    			if (dirty & /*fieldVal*/ 512 && input.value !== /*fieldVal*/ ctx[9]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[9]);
    			}

    			if (dirty & /*autocompleteField, autocompleteClick, firstAgencies, autocompleteSelected*/ 32944) {
    				each_value_1 = /*firstAgencies*/ ctx[5];
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
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(105:8) {#if fieldKey.startsWith(\\\"agency\\\") || fieldKey === \\\"foiaEmail\\\"}",
    		ctx
    	});

    	return block;
    }

    // (121:12) {#each $sources as source}
    function create_each_block_2(ctx) {
    	let option;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			option.__value = option_value_value = /*source*/ ctx[26]["name"];
    			option.value = option.__value;
    			add_location(option, file, 121, 12, 5125);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sources*/ 2048 && option_value_value !== (option_value_value = /*source*/ ctx[26]["name"])) {
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
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(121:12) {#each $sources as source}",
    		ctx
    	});

    	return block;
    }

    // (112:16) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t_value = /*agency*/ ctx[23]["agencyName"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item svelte-4upspk");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[7]}-${/*i*/ ctx[25]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 112, 16, 4685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 32 && t_value !== (t_value = /*agency*/ ctx[23]["agencyName"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 128 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[7]}-${/*i*/ ctx[25]}`)) {
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
    		source: "(112:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (110:16) {#if autocompleteSelected === i}
    function create_if_block_2(ctx) {
    	let div;
    	let t_value = /*agency*/ ctx[23]["agencyName"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item selected svelte-4upspk");
    			attr_dev(div, "aria-selected", "true");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[7]}-${/*i*/ ctx[25]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 110, 16, 4460);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 32 && t_value !== (t_value = /*agency*/ ctx[23]["agencyName"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 128 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[7]}-${/*i*/ ctx[25]}`)) {
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(110:16) {#if autocompleteSelected === i}",
    		ctx
    	});

    	return block;
    }

    // (109:16) {#each firstAgencies as agency, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*autocompleteSelected*/ ctx[4] === /*i*/ ctx[25]) return create_if_block_2;
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
    		source: "(109:16) {#each firstAgencies as agency, i}",
    		ctx
    	});

    	return block;
    }

    // (94:8) {#each options as option}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[20].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[20].abbr;
    			option.value = option.__value;
    			add_location(option, file, 94, 8, 3626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 4 && t_value !== (t_value = /*option*/ ctx[20].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*options*/ 4 && option_value_value !== (option_value_value = /*option*/ ctx[20].abbr)) {
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
    		source: "(94:8) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let label;
    	let t0_value = start[/*fieldKey*/ ctx[0]].text + "";
    	let t0;
    	let span;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*fieldType*/ ctx[1] === "select") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			span = element("span");
    			t1 = space();
    			if_block.c();
    			toggle_class(span, "optional", !/*required*/ ctx[3]);
    			toggle_class(span, "required", /*required*/ ctx[3]);
    			add_location(span, file, 90, 49, 3387);
    			attr_dev(label, "for", /*idField*/ ctx[6]);
    			attr_dev(label, "class", "svelte-4upspk");
    			add_location(label, file, 90, 4, 3342);
    			attr_dev(div, "class", "form__field svelte-4upspk");
    			add_location(div, file, 89, 0, 3312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(div, t1);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*fieldKey*/ 1 && t0_value !== (t0_value = start[/*fieldKey*/ ctx[0]].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*required*/ 8) {
    				toggle_class(span, "optional", !/*required*/ ctx[3]);
    			}

    			if (dirty & /*required*/ 8) {
    				toggle_class(span, "required", /*required*/ ctx[3]);
    			}

    			if (dirty & /*idField*/ 64) {
    				attr_dev(label, "for", /*idField*/ ctx[6]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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
    	let $sources;
    	validate_store(recipients, "recipients");
    	component_subscribe($$self, recipients, $$value => $$invalidate(18, $recipients = $$value));
    	validate_store(sources, "sources");
    	component_subscribe($$self, sources, $$value => $$invalidate(11, $sources = $$value));
    	let { idx = 0 } = $$props;
    	let { fieldKey = "recipientName" } = $$props;
    	let { fieldType = "text" } = $$props;
    	let { options = [] } = $$props;
    	let { required = false } = $$props;
    	let autocompleteSelected;
    	let agencies = [];

    	async function updateAndQuery(event) {
    		updateStore(event);
    		let agencyUrl;

    		if (fieldKey.startsWith("agency") || fieldKey === "foiaEmail") {
    			agencyUrl = "/api/current-user/autocomplete/agencies";

    			const agencyResults = await fetch(`${agencyUrl}?field=${fieldKey}&q=${event.target.value}`).then(response => response.json()).then(data => data.results).catch(err => {
    				console.error(err);
    			});

    			$$invalidate(17, agencies = event.target.value === "" ? [] : agencyResults);
    		}
    	}

    	function updateStore(event) {
    		const newVal = event.target.value;
    		recipients.changeItem($recipients, idx, fieldKey, newVal);
    	}

    	async function autocompleteKeydown(event) {
    		switch (event.key) {
    			case "ArrowDown":
    				if (autocompleteSelected === undefined) {
    					$$invalidate(4, autocompleteSelected = 0);
    				} else if (autocompleteSelected < firstAgencies.length - 1) {
    					$$invalidate(4, autocompleteSelected += 1);
    				} else {
    					$$invalidate(4, autocompleteSelected = undefined);
    				}
    				break;
    			case "ArrowUp":
    				if (autocompleteSelected === undefined) {
    					$$invalidate(4, autocompleteSelected = firstAgencies.length - 1);
    				} else if (autocompleteSelected === 0) {
    					$$invalidate(4, autocompleteSelected = undefined);
    				} else {
    					$$invalidate(4, autocompleteSelected -= 1);
    				}
    				break;
    			case "Enter":
    				if (autocompleteSelected !== undefined) {
    					updateData();
    				}
    				break;
    		}
    	}

    	async function autocompleteClick(event) {
    		$$invalidate(4, autocompleteSelected = parseInt(event.target.id.match(/[0-9]$/g)));
    		updateData();
    	}

    	async function updateData() {
    		const selectedItem = firstAgencies[autocompleteSelected];

    		for (let inputField of Object.keys(selectedItem)) {
    			recipients.changeItem($recipients, idx, inputField, selectedItem[inputField]);
    		}

    		const praEmail = $recipients[idx].foiaEmail.value;

    		const agencySources = await fetch(`/api/current-user/autocomplete/sources?agency=${praEmail}`).then(response => response.json()).then(data => data.results).catch(err => {
    			console.error(err);
    		});

    		sources.update(() => agencySources);
    		$$invalidate(17, agencies = []);
    		$$invalidate(4, autocompleteSelected = undefined);
    	}

    	const writable_props = ["idx", "fieldKey", "fieldType", "options", "required"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<RecipientField> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("RecipientField", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("idx" in $$props) $$invalidate(16, idx = $$props.idx);
    		if ("fieldKey" in $$props) $$invalidate(0, fieldKey = $$props.fieldKey);
    		if ("fieldType" in $$props) $$invalidate(1, fieldType = $$props.fieldType);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("required" in $$props) $$invalidate(3, required = $$props.required);
    	};

    	$$self.$capture_state = () => ({
    		each,
    		recipients,
    		start,
    		sources,
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
    		firstAgencies,
    		idField,
    		autocompleteField,
    		nameField,
    		fieldVal,
    		$recipients,
    		selectVal,
    		$sources
    	});

    	$$self.$inject_state = $$props => {
    		if ("idx" in $$props) $$invalidate(16, idx = $$props.idx);
    		if ("fieldKey" in $$props) $$invalidate(0, fieldKey = $$props.fieldKey);
    		if ("fieldType" in $$props) $$invalidate(1, fieldType = $$props.fieldType);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    		if ("required" in $$props) $$invalidate(3, required = $$props.required);
    		if ("autocompleteSelected" in $$props) $$invalidate(4, autocompleteSelected = $$props.autocompleteSelected);
    		if ("agencies" in $$props) $$invalidate(17, agencies = $$props.agencies);
    		if ("firstAgencies" in $$props) $$invalidate(5, firstAgencies = $$props.firstAgencies);
    		if ("idField" in $$props) $$invalidate(6, idField = $$props.idField);
    		if ("autocompleteField" in $$props) $$invalidate(7, autocompleteField = $$props.autocompleteField);
    		if ("nameField" in $$props) $$invalidate(8, nameField = $$props.nameField);
    		if ("fieldVal" in $$props) $$invalidate(9, fieldVal = $$props.fieldVal);
    		if ("selectVal" in $$props) $$invalidate(10, selectVal = $$props.selectVal);
    	};

    	let firstAgencies;
    	let idField;
    	let autocompleteField;
    	let nameField;
    	let fieldVal;
    	let selectVal;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*agencies*/ 131072) {
    			// just show top 5 agencies
    			 $$invalidate(5, firstAgencies = agencies.slice(0, 5));
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 65537) {
    			 $$invalidate(6, idField = `id_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 65537) {
    			 $$invalidate(7, autocompleteField = `autocomplete_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 65537) {
    			 $$invalidate(8, nameField = `${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*$recipients, idx, fieldKey*/ 327681) {
    			 $$invalidate(9, fieldVal = $recipients[idx][fieldKey].value);
    		}

    		if ($$self.$$.dirty & /*fieldType, options, fieldVal*/ 518) {
    			 $$invalidate(10, selectVal = fieldType === "select" && options.length > 0 && fieldVal === ""
    			? options[0].abbr
    			: fieldVal);
    		}
    	};

    	return [
    		fieldKey,
    		fieldType,
    		options,
    		required,
    		autocompleteSelected,
    		firstAgencies,
    		idField,
    		autocompleteField,
    		nameField,
    		fieldVal,
    		selectVal,
    		$sources,
    		updateAndQuery,
    		updateStore,
    		autocompleteKeydown,
    		autocompleteClick,
    		idx
    	];
    }

    class RecipientField extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			idx: 16,
    			fieldKey: 0,
    			fieldType: 1,
    			options: 2,
    			required: 3
    		});

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

    const { console: console_1$1 } = globals;
    const file$1 = "src/Recipient.svelte";

    // (1:0) <script>     import { recipients, count }
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
    		source: "(1:0) <script>     import { recipients, count }",
    		ctx
    	});

    	return block;
    }

    // (72:36)          <RecipientField idx="{idx}
    function create_then_block(ctx) {
    	let recipientfield;
    	let current;

    	recipientfield = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyState",
    				fieldType: "select",
    				required: true,
    				options: /*options*/ ctx[9]
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
    			if (dirty & /*states*/ 2) recipientfield_changes.options = /*options*/ ctx[9];
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
    		source: "(72:36)          <RecipientField idx=\\\"{idx}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import { recipients, count }
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
    		source: "(1:0) <script>     import { recipients, count }",
    		ctx
    	});

    	return block;
    }

    // (83:12) {#if idx === $count - 1 }
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
    			add_location(title, file$1, 84, 106, 3407);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 84, 133, 3434);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "plus w-6 h-6");
    			add_location(svg, file$1, 84, 16, 3317);
    			attr_dev(button, "id", button_id_value = "add-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-e6m0xt");
    			add_location(button, file$1, 83, 12, 3244);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, title);
    			append_dev(title, t);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", recipients.addItem, false, false, false);
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
    		source: "(83:12) {#if idx === $count - 1 }",
    		ctx
    	});

    	return block;
    }

    // (90:12) {#if $count > 1}
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
    			add_location(title, file$1, 91, 103, 3885);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 91, 134, 3916);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "x w-6 h-6");
    			add_location(svg, file$1, 91, 16, 3798);
    			attr_dev(button, "id", button_id_value = "delete-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-e6m0xt");
    			add_location(button, file$1, 90, 12, 3715);
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
    						if (is_function(recipients.deleteItem(/*idx*/ ctx[0]))) recipients.deleteItem(/*idx*/ ctx[0]).apply(this, arguments);
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
    		source: "(90:12) {#if $count > 1}",
    		ctx
    	});

    	return block;
    }

    // (103:8) {:else}
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
    			t2 = text(/*currentTemplate*/ ctx[2]);
    			attr_dev(button, "id", button_id_value = "expand-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-e6m0xt");
    			add_location(button, file$1, 103, 8, 4526);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview svelte-e6m0xt");
    			add_location(div, file$1, 104, 8, 4609);
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

    			if (dirty & /*currentTemplate*/ 4) set_data_dev(t2, /*currentTemplate*/ ctx[2]);

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
    		source: "(103:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (98:8) {#if !toggleDisplay}
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
    			t2 = text(/*currentTemplate*/ ctx[2]);
    			attr_dev(button, "id", button_id_value = "expand-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-e6m0xt");
    			add_location(button, file$1, 98, 8, 4312);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview hidden svelte-e6m0xt");
    			add_location(div, file$1, 99, 8, 4398);
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

    			if (dirty & /*currentTemplate*/ 4) set_data_dev(t2, /*currentTemplate*/ ctx[2]);

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
    		source: "(98:8) {#if !toggleDisplay}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div7;
    	let div0;
    	let recipientfield0;
    	let t0;
    	let div1;
    	let recipientfield1;
    	let t1;
    	let recipientfield2;
    	let t2;
    	let promise;
    	let t3;
    	let div2;
    	let recipientfield3;
    	let t4;
    	let recipientfield4;
    	let t5;
    	let recipientfield5;
    	let t6;
    	let div5;
    	let div3;
    	let t7;
    	let div4;
    	let t8;
    	let div6;
    	let div7_id_value;
    	let current;

    	recipientfield0 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "recipientName"
    			},
    			$$inline: true
    		});

    	recipientfield1 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyName"
    			},
    			$$inline: true
    		});

    	recipientfield2 = new RecipientField({
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
    		value: 9,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*states*/ ctx[1], info);

    	recipientfield3 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyStreetAddress"
    			},
    			$$inline: true
    		});

    	recipientfield4 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyZip"
    			},
    			$$inline: true
    		});

    	recipientfield5 = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyMunicipality"
    			},
    			$$inline: true
    		});

    	let if_block0 = /*idx*/ ctx[0] === /*$count*/ ctx[4] - 1 && create_if_block_2$1(ctx);
    	let if_block1 = /*$count*/ ctx[4] > 1 && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (!/*toggleDisplay*/ ctx[3]) return create_if_block$1;
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
    			div1 = element("div");
    			create_component(recipientfield1.$$.fragment);
    			t1 = space();
    			create_component(recipientfield2.$$.fragment);
    			t2 = space();
    			info.block.c();
    			t3 = space();
    			div2 = element("div");
    			create_component(recipientfield3.$$.fragment);
    			t4 = space();
    			create_component(recipientfield4.$$.fragment);
    			t5 = space();
    			create_component(recipientfield5.$$.fragment);
    			t6 = space();
    			div5 = element("div");
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t7 = space();
    			div4 = element("div");
    			if (if_block1) if_block1.c();
    			t8 = space();
    			div6 = element("div");
    			if_block2.c();
    			attr_dev(div0, "class", "recipient__person");
    			add_location(div0, file$1, 65, 4, 2415);
    			attr_dev(div1, "class", "agency__general svelte-e6m0xt");
    			add_location(div1, file$1, 68, 4, 2526);
    			attr_dev(div2, "class", "agency__street svelte-e6m0xt");
    			add_location(div2, file$1, 75, 4, 2894);
    			attr_dev(div3, "class", "add__item");
    			add_location(div3, file$1, 81, 8, 3170);
    			attr_dev(div4, "class", "delete__item");
    			add_location(div4, file$1, 88, 8, 3647);
    			attr_dev(div5, "class", "new__items svelte-e6m0xt");
    			add_location(div5, file$1, 80, 4, 3137);
    			attr_dev(div6, "class", "expand__preview");
    			add_location(div6, file$1, 96, 4, 4245);
    			attr_dev(div7, "class", "recipient__item svelte-e6m0xt");
    			attr_dev(div7, "id", div7_id_value = "recipient-" + /*idx*/ ctx[0]);
    			add_location(div7, file$1, 64, 0, 2360);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			mount_component(recipientfield0, div0, null);
    			append_dev(div7, t0);
    			append_dev(div7, div1);
    			mount_component(recipientfield1, div1, null);
    			append_dev(div1, t1);
    			mount_component(recipientfield2, div1, null);
    			append_dev(div1, t2);
    			info.block.m(div1, info.anchor = null);
    			info.mount = () => div1;
    			info.anchor = null;
    			append_dev(div7, t3);
    			append_dev(div7, div2);
    			mount_component(recipientfield3, div2, null);
    			append_dev(div2, t4);
    			mount_component(recipientfield4, div2, null);
    			append_dev(div2, t5);
    			mount_component(recipientfield5, div2, null);
    			append_dev(div7, t6);
    			append_dev(div7, div5);
    			append_dev(div5, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			if (if_block1) if_block1.m(div4, null);
    			append_dev(div7, t8);
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
    			info.ctx = ctx;

    			if (dirty & /*states*/ 2 && promise !== (promise = /*states*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[9] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}

    			const recipientfield3_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield3_changes.idx = /*idx*/ ctx[0];
    			recipientfield3.$set(recipientfield3_changes);
    			const recipientfield4_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield4_changes.idx = /*idx*/ ctx[0];
    			recipientfield4.$set(recipientfield4_changes);
    			const recipientfield5_changes = {};
    			if (dirty & /*idx*/ 1) recipientfield5_changes.idx = /*idx*/ ctx[0];
    			recipientfield5.$set(recipientfield5_changes);

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
    			transition_in(info.block);
    			transition_in(recipientfield3.$$.fragment, local);
    			transition_in(recipientfield4.$$.fragment, local);
    			transition_in(recipientfield5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(recipientfield0.$$.fragment, local);
    			transition_out(recipientfield1.$$.fragment, local);
    			transition_out(recipientfield2.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(recipientfield3.$$.fragment, local);
    			transition_out(recipientfield4.$$.fragment, local);
    			transition_out(recipientfield5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			destroy_component(recipientfield0);
    			destroy_component(recipientfield1);
    			destroy_component(recipientfield2);
    			info.block.d();
    			info.token = null;
    			info = null;
    			destroy_component(recipientfield3);
    			destroy_component(recipientfield4);
    			destroy_component(recipientfield5);
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
    	let $count;
    	validate_store(count, "count");
    	component_subscribe($$self, count, $$value => $$invalidate(4, $count = $$value));
    	let { idx = 0 } = $$props;
    	let currentTemplate = "";
    	let toggleDisplay = false;
    	let startUrl = "/api/current-user/";
    	let { states } = $$props;

    	function getTemplateInfo() {
    		let templateData = {};
    		const selected = document.getElementById(`recipient-${idx}`);
    		const generalText = document.getElementById("request").getElementsByTagName("textarea");
    		const generalSubject = document.getElementById("request").getElementsByTagName("input");
    		const recipText = selected.getElementsByTagName("input");
    		const recipSelect = selected.getElementsByTagName("select");
    		const allTags = [...generalText, ...generalSubject, ...recipText, ...recipSelect];

    		for (let elem of allTags) {
    			const elemKey = elem.id.replace("id_", "").replace(`-${idx}`, "");
    			templateData[elemKey] = elem.value;
    		}

    		return templateData;
    	}

    	async function previewSubmission(event) {
    		const currentState = document.getElementById(`id_agencyState-${idx}`).value;
    		const templateURL = startUrl + "template/" + currentState;
    		const recipientData = getTemplateInfo();

    		let response = await fetch(templateURL).then(response => response.json()).then(templateData => {
    			return fillTemplate(recipientData, templateData);
    		}).catch(err => {
    			console.error(err);
    		});

    		$$invalidate(2, currentTemplate = response);
    	}

    	async function togglePreview(event) {
    		$$invalidate(3, toggleDisplay = !toggleDisplay);

    		if (toggleDisplay) {
    			previewSubmission();
    		}
    	}

    	const writable_props = ["idx", "states"];

    	Object.keys($$props).forEach(key => {
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
    		RecipientField,
    		idx,
    		currentTemplate,
    		toggleDisplay,
    		startUrl,
    		states,
    		getTemplateInfo,
    		fillTemplate,
    		previewSubmission,
    		togglePreview,
    		$count
    	});

    	$$self.$inject_state = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("currentTemplate" in $$props) $$invalidate(2, currentTemplate = $$props.currentTemplate);
    		if ("toggleDisplay" in $$props) $$invalidate(3, toggleDisplay = $$props.toggleDisplay);
    		if ("startUrl" in $$props) startUrl = $$props.startUrl;
    		if ("states" in $$props) $$invalidate(1, states = $$props.states);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [idx, states, currentTemplate, toggleDisplay, $count, togglePreview];
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

    function create_fragment$2(ctx) {
    	let div4;
    	let div0;
    	let label0;
    	let t0;
    	let span0;
    	let t1;
    	let input;
    	let t2;
    	let div1;
    	let label1;
    	let t3;
    	let span1;
    	let t4;
    	let textarea0;
    	let t5;
    	let div2;
    	let label2;
    	let t6;
    	let span2;
    	let t7;
    	let textarea1;
    	let t8;
    	let div3;
    	let label3;
    	let t9;
    	let span3;
    	let t10;
    	let textarea2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			t0 = text("Subject");
    			span0 = element("span");
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			t3 = text("Records Sought");
    			span1 = element("span");
    			t4 = space();
    			textarea0 = element("textarea");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			t6 = text("Fee Waiver Justification");
    			span2 = element("span");
    			t7 = space();
    			textarea1 = element("textarea");
    			t8 = space();
    			div3 = element("div");
    			label3 = element("label");
    			t9 = text("Justification for Expedited Processing");
    			span3 = element("span");
    			t10 = space();
    			textarea2 = element("textarea");
    			attr_dev(span0, "class", "required");
    			add_location(span0, file$2, 19, 44, 476);
    			attr_dev(label0, "for", "id_subject-line");
    			attr_dev(label0, "class", "svelte-1bcrtop");
    			add_location(label0, file$2, 19, 8, 440);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "id_subject");
    			attr_dev(input, "name", "subject");
    			attr_dev(input, "class", "svelte-1bcrtop");
    			add_location(input, file$2, 20, 8, 523);
    			attr_dev(div0, "class", "subject__line");
    			add_location(div0, file$2, 18, 1, 404);
    			attr_dev(span1, "class", "required");
    			add_location(span1, file$2, 23, 55, 689);
    			attr_dev(label1, "for", "id_requestedRecords");
    			attr_dev(label1, "class", "svelte-1bcrtop");
    			add_location(label1, file$2, 23, 8, 642);
    			attr_dev(textarea0, "id", "id_requestedRecords");
    			attr_dev(textarea0, "name", "requestedRecords");
    			attr_dev(textarea0, "class", "svelte-1bcrtop");
    			add_location(textarea0, file$2, 24, 8, 736);
    			attr_dev(div1, "class", "records");
    			add_location(div1, file$2, 22, 4, 612);
    			attr_dev(span2, "class", "optional svelte-1bcrtop");
    			add_location(span2, file$2, 27, 58, 963);
    			attr_dev(label2, "for", "id_feeWaiver");
    			attr_dev(label2, "class", "svelte-1bcrtop");
    			add_location(label2, file$2, 27, 8, 913);
    			attr_dev(textarea1, "id", "id_feeWaiver");
    			attr_dev(textarea1, "name", "feeWaiver");
    			attr_dev(textarea1, "class", "svelte-1bcrtop");
    			add_location(textarea1, file$2, 28, 8, 1010);
    			attr_dev(div2, "class", "fee-waiver");
    			add_location(div2, file$2, 26, 4, 880);
    			attr_dev(span3, "class", "optional svelte-1bcrtop");
    			add_location(span3, file$2, 31, 82, 1250);
    			attr_dev(label3, "for", "id_expeditedProcessing");
    			attr_dev(label3, "class", "svelte-1bcrtop");
    			add_location(label3, file$2, 31, 8, 1176);
    			attr_dev(textarea2, "id", "id_expeditedProcessing");
    			attr_dev(textarea2, "name", "expeditedProcessing");
    			attr_dev(textarea2, "class", "svelte-1bcrtop");
    			add_location(textarea2, file$2, 32, 8, 1297);
    			attr_dev(div3, "class", "expedited-processing");
    			add_location(div3, file$2, 30, 4, 1133);
    			attr_dev(div4, "id", "request");
    			attr_dev(div4, "class", "request__container svelte-1bcrtop");
    			add_location(div4, file$2, 17, 0, 357);
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
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*subject*/ ctx[0]);
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t3);
    			append_dev(label1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, textarea0);
    			set_input_value(textarea0, /*requestedRecords*/ ctx[1]);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(label2, t6);
    			append_dev(label2, span2);
    			append_dev(div2, t7);
    			append_dev(div2, textarea1);
    			set_input_value(textarea1, /*feeWaiver*/ ctx[3]);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(label3, t9);
    			append_dev(label3, span3);
    			append_dev(div3, t10);
    			append_dev(div3, textarea2);
    			set_input_value(textarea2, /*expeditedProcessing*/ ctx[2]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    					listen_dev(textarea0, "input", adjustHeight, false, false, false),
    					listen_dev(textarea0, "input", /*textarea0_input_handler*/ ctx[5]),
    					listen_dev(textarea1, "input", adjustHeight, false, false, false),
    					listen_dev(textarea1, "input", /*textarea1_input_handler*/ ctx[6]),
    					listen_dev(textarea2, "input", adjustHeight, false, false, false),
    					listen_dev(textarea2, "input", /*textarea2_input_handler*/ ctx[7])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*subject*/ 1 && input.value !== /*subject*/ ctx[0]) {
    				set_input_value(input, /*subject*/ ctx[0]);
    			}

    			if (dirty & /*requestedRecords*/ 2) {
    				set_input_value(textarea0, /*requestedRecords*/ ctx[1]);
    			}

    			if (dirty & /*feeWaiver*/ 8) {
    				set_input_value(textarea1, /*feeWaiver*/ ctx[3]);
    			}

    			if (dirty & /*expeditedProcessing*/ 4) {
    				set_input_value(textarea2, /*expeditedProcessing*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
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
    	let subject = "";
    	let requestedRecords = "";
    	let expeditedProcessing = "";
    	let feeWaiver = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Request> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Request", $$slots, []);

    	function input_input_handler() {
    		subject = this.value;
    		$$invalidate(0, subject);
    	}

    	function textarea0_input_handler() {
    		requestedRecords = this.value;
    		$$invalidate(1, requestedRecords);
    	}

    	function textarea1_input_handler() {
    		feeWaiver = this.value;
    		$$invalidate(3, feeWaiver);
    	}

    	function textarea2_input_handler() {
    		expeditedProcessing = this.value;
    		$$invalidate(2, expeditedProcessing);
    	}

    	$$self.$capture_state = () => ({
    		subject,
    		requestedRecords,
    		expeditedProcessing,
    		feeWaiver,
    		adjustHeight
    	});

    	$$self.$inject_state = $$props => {
    		if ("subject" in $$props) $$invalidate(0, subject = $$props.subject);
    		if ("requestedRecords" in $$props) $$invalidate(1, requestedRecords = $$props.requestedRecords);
    		if ("expeditedProcessing" in $$props) $$invalidate(2, expeditedProcessing = $$props.expeditedProcessing);
    		if ("feeWaiver" in $$props) $$invalidate(3, feeWaiver = $$props.feeWaiver);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		subject,
    		requestedRecords,
    		expeditedProcessing,
    		feeWaiver,
    		input_input_handler,
    		textarea0_input_handler,
    		textarea1_input_handler,
    		textarea2_input_handler
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

    const { Error: Error_1, Object: Object_1$1, console: console_1$2 } = globals;
    const file$3 = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (62:3) {#if uploadData !== undefined}
    function create_if_block$2(ctx) {
    	let await_block_anchor;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 8,
    		error: 9
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(62:3) {#if uploadData !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (67:3) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Could not process file. Make sure it is a .csv file with the correct fields.";
    			add_location(p, file$3, 67, 4, 2056);
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
    		source: "(67:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (65:3) {:then result}
    function create_then_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Finished";
    			add_location(p, file$3, 65, 4, 2018);
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
    		source: "(65:3) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (63:22)      <p>Loading</p>    {:then result}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading";
    			add_location(p, file$3, 63, 4, 1980);
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
    		source: "(63:22)      <p>Loading</p>    {:then result}",
    		ctx
    	});

    	return block;
    }

    // (72:2) {#each $recipients as _recipient, idx}
    function create_each_block$1(ctx) {
    	let recipient;
    	let current;

    	recipient = new Recipient({
    			props: {
    				states: /*states*/ ctx[3],
    				idx: /*idx*/ ctx[7]
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(72:2) {#each $recipients as _recipient, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div0;
    	let h20;
    	let t1;
    	let request;
    	let t2;
    	let div2;
    	let h21;
    	let t4;
    	let p0;
    	let t6;
    	let p1;
    	let t8;
    	let input0;
    	let t9;
    	let div1;
    	let t10;
    	let t11;
    	let input1;
    	let current;
    	let mounted;
    	let dispose;
    	request = new Request({ $$inline: true });
    	let if_block = /*uploadData*/ ctx[0] !== undefined && create_if_block$2(ctx);
    	let each_value = /*$recipients*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Information about the Request";
    			t1 = space();
    			create_component(request.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Information about the Recipients";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "You can manually add the agencies or you can upload a CSV.";
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Note: Uploading a CSV will delete all existing data. If you want\n\t\t\tto add agencies that aren't in your CSV file, you should add them\n\t\t\tafter uploading the CSV.";
    			t8 = space();
    			input0 = element("input");
    			t9 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t10 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t11 = space();
    			input1 = element("input");
    			attr_dev(h20, "class", "svelte-d6e61i");
    			add_location(h20, file$3, 49, 2, 1433);
    			attr_dev(div0, "class", "section__container svelte-d6e61i");
    			add_location(div0, file$3, 48, 1, 1398);
    			attr_dev(h21, "class", "svelte-d6e61i");
    			add_location(h21, file$3, 53, 2, 1529);
    			add_location(p0, file$3, 54, 2, 1573);
    			add_location(p1, file$3, 55, 2, 1641);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "csv_upload");
    			attr_dev(input0, "accept", ".csv");
    			add_location(input0, file$3, 59, 2, 1815);
    			attr_dev(div1, "class", "upload__info");
    			add_location(div1, file$3, 60, 2, 1892);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "num-items");
    			input1.value = /*$count*/ ctx[2];
    			add_location(input1, file$3, 74, 2, 2267);
    			attr_dev(div2, "class", "section__container svelte-d6e61i");
    			add_location(div2, file$3, 52, 1, 1494);
    			attr_dev(div3, "class", "form__container svelte-d6e61i");
    			add_location(div3, file$3, 47, 0, 1367);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			mount_component(request, div0, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, h21);
    			append_dev(div2, t4);
    			append_dev(div2, p0);
    			append_dev(div2, t6);
    			append_dev(div2, p1);
    			append_dev(div2, t8);
    			append_dev(div2, input0);
    			append_dev(div2, t9);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div2, t10);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div2, t11);
    			append_dev(div2, input1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(input0, "change", /*handleUpload*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*uploadData*/ ctx[0] !== undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*states, $recipients*/ 10) {
    				each_value = /*$recipients*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div2, t11);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*$count*/ 4) {
    				prop_dev(input1, "value", /*$count*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(request.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(request.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(request);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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
    	let $count;
    	validate_store(recipients, "recipients");
    	component_subscribe($$self, recipients, $$value => $$invalidate(1, $recipients = $$value));
    	validate_store(count, "count");
    	component_subscribe($$self, count, $$value => $$invalidate(2, $count = $$value));

    	let states = fetch("/api/current-user/states").then(response => response.json()).then(data => data.states).catch(e => {
    		console.error(e);
    	});

    	let uploadData;

    	async function handleUpload(event) {
    		let file = event.target.files[0];

    		// remove items so you don't get an extra field
    		while ($recipients.length !== 0) {
    			recipients.deleteItem($recipients.length - 1);
    		}

    		let idx = $recipients.length - 1;

    		// from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
    		const res = new Promise((resolve, reject) => {
    				Papa.parse(file, {
    					header: true,
    					skipEmptyLines: true,
    					step(results, _file) {
    						idx += 1;

    						if (Object.keys(results.data).every(d => Object.keys(start).includes(d))) {
    							recipients.addItem();
    						} else {
    							reject(new Error("invalid field"));
    						}

    						for (let field of Object.keys(results.data)) {
    							recipients.changeItem($recipients, idx, field, results.data[field]);
    						}
    					},
    					complete(_results, _file) {
    						resolve();
    					},
    					error(err, _file) {
    						reject(err);
    					}
    				});
    			});

    		$$invalidate(0, uploadData = res);
    	}

    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		recipients,
    		count,
    		start,
    		Recipient,
    		Request,
    		states,
    		uploadData,
    		handleUpload,
    		$recipients,
    		$count
    	});

    	$$self.$inject_state = $$props => {
    		if ("states" in $$props) $$invalidate(3, states = $$props.states);
    		if ("uploadData" in $$props) $$invalidate(0, uploadData = $$props.uploadData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$recipients*/ 2) {
    			 console.log($recipients);
    		}
    	};

    	return [uploadData, $recipients, $count, states, handleUpload];
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
    	target: document.getElementById("foia-request-items")
    });

    return app;

}());
//# sourceMappingURL=foia-request.js.map
