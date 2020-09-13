
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
        "recipientFirstName": {text: "Recipient First Name", value:""},
        "recipientLastName": {text: "Recipient Last Name", value:""},
        "agencyName": {text: "Agency Name", value: ""},
        "foiaEmail": {text: "Public Records Email", value: ""},
        "agencyState": {text: "Agency State", value: ""},
        "agencyStreetAddress": {text: "Agency Street Address", value: ""},
        "agencyMunicipality": {text: "Agency Municipality", value: ""},
        "agencyZip": {text: "Agency ZIP Code", value: ""}
    };
    Object.freeze(init$1);

    function createSources() {
        const {subscribe, set, update} = writable([[]]);
        const addItem = () => update(n => [...n, []]);
        const deleteItem = (idx) => {
            return update(n => [...n.slice(0, idx), ...n.slice(idx+1, n.length)]);
        };
        const newSources = (idx, sources) => {
            return update(n => {
                n[idx] = sources;
                return n;
            })
        };
        return {
            subscribe,
            addItem,
            deleteItem,
            newSources
        };
    }

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
    const sources = createSources();
    const request = writable({
        subject: {text: "subject", value: ""},
        requestedRecords: {text: "Requested Records", value:""},
        expeditedProcessing: {text: "Expedited Processing Justification", value:""},
        feeWaiver: {text: "Fee Waiver Justification", value: ""}
    });

    /* src/RecipientField.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/RecipientField.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	child_ctx[28] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    // (110:4) {:else}
    function create_else_block(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*firstAgencies*/ ctx[7].length > 0 && create_if_block_4(ctx);

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
    			add_location(div, file, 110, 4, 4254);
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
    					if_block0 = create_if_block_4(ctx);
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
    		source: "(110:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (104:4) {#if fieldType === "select"}
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
    			attr_dev(select, "class", "svelte-1dw38tw");
    			add_location(select, file, 104, 4, 4028);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			select_option(select, /*selectVal*/ ctx[12]);

    			if (!mounted) {
    				dispose = listen_dev(select, "blur", /*updateStore*/ ctx[15], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 8) {
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

    			if (dirty & /*idField*/ 256) {
    				attr_dev(select, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty & /*nameField*/ 1024) {
    				attr_dev(select, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty & /*selectVal, options*/ 4104) {
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
    		source: "(104:4) {#if fieldType === \\\"select\\\"}",
    		ctx
    	});

    	return block;
    }

    // (112:8) {#if firstAgencies.length > 0}
    function create_if_block_4(ctx) {
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
    			t2 = text(" matching agencies. Use the arrow keys to browse.");
    			attr_dev(div, "class", "sr-only");
    			attr_dev(div, "role", "status");
    			attr_dev(div, "aria-live", "polite");
    			add_location(div, file, 112, 8, 4331);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 128 && t1_value !== (t1_value = /*firstAgencies*/ ctx[7].length + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(112:8) {#if firstAgencies.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (130:8) {:else}
    function create_else_block_2(ctx) {
    	let input;
    	let t;
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*$sources*/ ctx[13][/*idx*/ ctx[0]];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
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

    			attr_dev(input, "id", /*idField*/ ctx[8]);
    			attr_dev(input, "name", /*nameField*/ ctx[10]);
    			input.value = /*fieldVal*/ ctx[11];
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "aria-autocomplete", "list");
    			attr_dev(input, "class", "svelte-1dw38tw");
    			add_location(input, file, 130, 8, 5429);
    			attr_dev(div0, "class", "autocomplete__list");
    			attr_dev(div0, "role", "listbox");
    			attr_dev(div0, "tabindex", "-1");
    			add_location(div0, file, 132, 12, 5651);
    			attr_dev(div1, "class", "autocomplete__results");
    			add_location(div1, file, 131, 8, 5603);
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
    					listen_dev(input, "keydown", /*autocompleteKeydown*/ ctx[16], false, false, false),
    					listen_dev(input, "input", /*updateAndQuery*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idField*/ 256) {
    				attr_dev(input, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty & /*nameField*/ 1024) {
    				attr_dev(input, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty & /*fieldVal*/ 2048 && input.value !== /*fieldVal*/ ctx[11]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[11]);
    			}

    			if (dirty & /*autocompleteField, autocompleteClick, $sources, idx, autocompleteSelected*/ 139809) {
    				each_value_2 = /*$sources*/ ctx[13][/*idx*/ ctx[0]];
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
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(130:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:8) {#if isAgencyField}
    function create_if_block_1(ctx) {
    	let input;
    	let t;
    	let div1;
    	let div0;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*firstAgencies*/ ctx[7];
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

    			attr_dev(input, "id", /*idField*/ ctx[8]);
    			attr_dev(input, "name", /*nameField*/ ctx[10]);
    			input.value = /*fieldVal*/ ctx[11];
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "aria-autocomplete", "list");
    			attr_dev(input, "class", "svelte-1dw38tw");
    			add_location(input, file, 117, 8, 4545);
    			attr_dev(div0, "class", "autocomplete__list");
    			attr_dev(div0, "role", "listbox");
    			attr_dev(div0, "tabindex", "-1");
    			add_location(div0, file, 119, 12, 4767);
    			attr_dev(div1, "class", "autocomplete__results");
    			add_location(div1, file, 118, 8, 4719);
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
    					listen_dev(input, "keydown", /*autocompleteKeydown*/ ctx[16], false, false, false),
    					listen_dev(input, "input", /*updateAndQuery*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*idField*/ 256) {
    				attr_dev(input, "id", /*idField*/ ctx[8]);
    			}

    			if (dirty & /*nameField*/ 1024) {
    				attr_dev(input, "name", /*nameField*/ ctx[10]);
    			}

    			if (dirty & /*fieldVal*/ 2048 && input.value !== /*fieldVal*/ ctx[11]) {
    				prop_dev(input, "value", /*fieldVal*/ ctx[11]);
    			}

    			if (dirty & /*autocompleteField, autocompleteClick, firstAgencies, autocompleteSelected*/ 131744) {
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
    		source: "(117:8) {#if isAgencyField}",
    		ctx
    	});

    	return block;
    }

    // (137:16) {:else}
    function create_else_block_3(ctx) {
    	let div;
    	let t_value = /*source*/ ctx[29]["name"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item svelte-1dw38tw");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 137, 16, 6048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sources, idx*/ 8193 && t_value !== (t_value = /*source*/ ctx[29]["name"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`)) {
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
    		source: "(137:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (135:16) {#if autocompleteSelected === i}
    function create_if_block_3(ctx) {
    	let div;
    	let t_value = /*source*/ ctx[29]["name"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item selected svelte-1dw38tw");
    			attr_dev(div, "aria-selected", "true");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 135, 16, 5829);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sources, idx*/ 8193 && t_value !== (t_value = /*source*/ ctx[29]["name"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`)) {
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
    		source: "(135:16) {#if autocompleteSelected === i}",
    		ctx
    	});

    	return block;
    }

    // (134:16) {#each $sources[idx] as source, i}
    function create_each_block_2(ctx) {
    	let if_block_anchor;

    	function select_block_type_3(ctx, dirty) {
    		if (/*autocompleteSelected*/ ctx[5] === /*i*/ ctx[28]) return create_if_block_3;
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
    		source: "(134:16) {#each $sources[idx] as source, i}",
    		ctx
    	});

    	return block;
    }

    // (124:16) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t_value = /*agency*/ ctx[26]["agencyName"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item svelte-1dw38tw");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 124, 16, 5170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 128 && t_value !== (t_value = /*agency*/ ctx[26]["agencyName"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`)) {
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
    		source: "(124:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (122:16) {#if autocompleteSelected === i}
    function create_if_block_2(ctx) {
    	let div;
    	let t_value = /*agency*/ ctx[26]["agencyName"] + "";
    	let t;
    	let div_id_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "autocomplete__item selected svelte-1dw38tw");
    			attr_dev(div, "aria-selected", "true");
    			attr_dev(div, "id", div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`);
    			attr_dev(div, "role", "option");
    			attr_dev(div, "tabindex", "-1");
    			add_location(div, file, 122, 16, 4945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*autocompleteClick*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*firstAgencies*/ 128 && t_value !== (t_value = /*agency*/ ctx[26]["agencyName"] + "")) set_data_dev(t, t_value);

    			if (dirty & /*autocompleteField*/ 512 && div_id_value !== (div_id_value = `${/*autocompleteField*/ ctx[9]}-${/*i*/ ctx[28]}`)) {
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
    		source: "(122:16) {#if autocompleteSelected === i}",
    		ctx
    	});

    	return block;
    }

    // (121:16) {#each firstAgencies as agency, i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*autocompleteSelected*/ ctx[5] === /*i*/ ctx[28]) return create_if_block_2;
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
    		source: "(121:16) {#each firstAgencies as agency, i}",
    		ctx
    	});

    	return block;
    }

    // (106:8) {#each options as option}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*option*/ ctx[23].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*option*/ ctx[23].abbr;
    			option.value = option.__value;
    			add_location(option, file, 106, 8, 4155);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 8 && t_value !== (t_value = /*option*/ ctx[23].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*options*/ 8 && option_value_value !== (option_value_value = /*option*/ ctx[23].abbr)) {
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
    		source: "(106:8) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let label;
    	let t0_value = start[/*fieldKey*/ ctx[1]].text + "";
    	let t0;
    	let span;
    	let t1;

    	function select_block_type(ctx, dirty) {
    		if (/*fieldType*/ ctx[2] === "select") return create_if_block;
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
    			toggle_class(span, "optional", !/*required*/ ctx[4]);
    			toggle_class(span, "required", /*required*/ ctx[4]);
    			add_location(span, file, 102, 49, 3916);
    			attr_dev(label, "for", /*idField*/ ctx[8]);
    			attr_dev(label, "class", "svelte-1dw38tw");
    			add_location(label, file, 102, 4, 3871);
    			attr_dev(div, "class", "form__field svelte-1dw38tw");
    			add_location(div, file, 101, 0, 3841);
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
    			if (dirty & /*fieldKey*/ 2 && t0_value !== (t0_value = start[/*fieldKey*/ ctx[1]].text + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*required*/ 16) {
    				toggle_class(span, "optional", !/*required*/ ctx[4]);
    			}

    			if (dirty & /*required*/ 16) {
    				toggle_class(span, "required", /*required*/ ctx[4]);
    			}

    			if (dirty & /*idField*/ 256) {
    				attr_dev(label, "for", /*idField*/ ctx[8]);
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
    	component_subscribe($$self, recipients, $$value => $$invalidate(19, $recipients = $$value));
    	validate_store(sources, "sources");
    	component_subscribe($$self, sources, $$value => $$invalidate(13, $sources = $$value));
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

    			$$invalidate(18, agencies = event.target.value === "" ? [] : agencyResults);
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
    		$$invalidate(18, agencies = []);
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
    		$sources
    	});

    	$$self.$inject_state = $$props => {
    		if ("idx" in $$props) $$invalidate(0, idx = $$props.idx);
    		if ("fieldKey" in $$props) $$invalidate(1, fieldKey = $$props.fieldKey);
    		if ("fieldType" in $$props) $$invalidate(2, fieldType = $$props.fieldType);
    		if ("options" in $$props) $$invalidate(3, options = $$props.options);
    		if ("required" in $$props) $$invalidate(4, required = $$props.required);
    		if ("autocompleteSelected" in $$props) $$invalidate(5, autocompleteSelected = $$props.autocompleteSelected);
    		if ("agencies" in $$props) $$invalidate(18, agencies = $$props.agencies);
    		if ("isAgencyField" in $$props) $$invalidate(6, isAgencyField = $$props.isAgencyField);
    		if ("firstAgencies" in $$props) $$invalidate(7, firstAgencies = $$props.firstAgencies);
    		if ("idField" in $$props) $$invalidate(8, idField = $$props.idField);
    		if ("autocompleteField" in $$props) $$invalidate(9, autocompleteField = $$props.autocompleteField);
    		if ("nameField" in $$props) $$invalidate(10, nameField = $$props.nameField);
    		if ("fieldVal" in $$props) $$invalidate(11, fieldVal = $$props.fieldVal);
    		if ("selectVal" in $$props) $$invalidate(12, selectVal = $$props.selectVal);
    	};

    	let isAgencyField;
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
    		if ($$self.$$.dirty & /*fieldKey*/ 2) {
    			// just show top 5 agencies
    			 $$invalidate(6, isAgencyField = fieldKey.startsWith("agency") || fieldKey === "foiaEmail");
    		}

    		if ($$self.$$.dirty & /*agencies*/ 262144) {
    			 $$invalidate(7, firstAgencies = agencies.slice(0, 5));
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 3) {
    			 $$invalidate(8, idField = `id_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 3) {
    			 $$invalidate(9, autocompleteField = `autocomplete_${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*fieldKey, idx*/ 3) {
    			 $$invalidate(10, nameField = `${fieldKey}-${idx}`);
    		}

    		if ($$self.$$.dirty & /*$recipients, idx, fieldKey*/ 524291) {
    			 $$invalidate(11, fieldVal = $recipients[idx][fieldKey].value);
    		}

    		if ($$self.$$.dirty & /*fieldType, options, fieldVal*/ 2060) {
    			 $$invalidate(12, selectVal = fieldType === "select" && options.length > 0 && fieldVal === ""
    			? options[0].abbr
    			: fieldVal);
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

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			idx: 0,
    			fieldKey: 1,
    			fieldType: 2,
    			options: 3,
    			required: 4
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

    const { Object: Object_1$1, console: console_1$1 } = globals;
    const file$1 = "src/Recipient.svelte";

    // (1:0) <script>     import { recipients, count, request, sources }
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
    		source: "(1:0) <script>     import { recipients, count, request, sources }",
    		ctx
    	});

    	return block;
    }

    // (79:36)          <RecipientField idx="{idx}
    function create_then_block(ctx) {
    	let recipientfield;
    	let current;

    	recipientfield = new RecipientField({
    			props: {
    				idx: /*idx*/ ctx[0],
    				fieldKey: "agencyState",
    				fieldType: "select",
    				required: true,
    				options: /*options*/ ctx[13]
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
    			if (dirty & /*states*/ 2) recipientfield_changes.options = /*options*/ ctx[13];
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
    		source: "(79:36)          <RecipientField idx=\\\"{idx}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>     import { recipients, count, request, sources }
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
    		source: "(1:0) <script>     import { recipients, count, request, sources }",
    		ctx
    	});

    	return block;
    }

    // (90:12) {#if idx === $count - 1 }
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
    			add_location(title, file$1, 91, 106, 3486);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 91, 133, 3513);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "plus w-6 h-6");
    			add_location(svg, file$1, 91, 16, 3396);
    			attr_dev(button, "id", button_id_value = "add-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-643hy8");
    			add_location(button, file$1, 90, 12, 3329);
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
    		source: "(90:12) {#if idx === $count - 1 }",
    		ctx
    	});

    	return block;
    }

    // (97:12) {#if $count > 1}
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
    			add_location(title, file$1, 98, 103, 3958);
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$1, 98, 134, 3989);
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "width", "25px");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "class", "x w-6 h-6");
    			add_location(svg, file$1, 98, 16, 3871);
    			attr_dev(button, "id", button_id_value = "delete-" + /*idx*/ ctx[0]);
    			attr_dev(button, "class", "svelte-643hy8");
    			add_location(button, file$1, 97, 12, 3794);
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
    		source: "(97:12) {#if $count > 1}",
    		ctx
    	});

    	return block;
    }

    // (110:8) {:else}
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
    			attr_dev(button, "class", "svelte-643hy8");
    			add_location(button, file$1, 110, 8, 4599);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview svelte-643hy8");
    			add_location(div, file$1, 111, 8, 4682);
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
    		source: "(110:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (105:8) {#if !toggleDisplay}
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
    			attr_dev(button, "class", "svelte-643hy8");
    			add_location(button, file$1, 105, 8, 4385);
    			attr_dev(div, "id", div_id_value = "template-" + /*idx*/ ctx[0]);
    			attr_dev(div, "class", "template__preview hidden svelte-643hy8");
    			add_location(div, file$1, 106, 8, 4471);
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
    		source: "(105:8) {#if !toggleDisplay}",
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
    				fieldKey: "agencyName"
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
    		value: 13,
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
    			add_location(div0, file$1, 71, 4, 2430);
    			attr_dev(div1, "class", "agency__general svelte-643hy8");
    			add_location(div1, file$1, 75, 4, 2611);
    			attr_dev(div2, "class", "agency__street svelte-643hy8");
    			add_location(div2, file$1, 82, 4, 2979);
    			attr_dev(div3, "class", "add__item");
    			add_location(div3, file$1, 88, 8, 3255);
    			attr_dev(div4, "class", "delete__item");
    			add_location(div4, file$1, 95, 8, 3726);
    			attr_dev(div5, "class", "new__items svelte-643hy8");
    			add_location(div5, file$1, 87, 4, 3222);
    			attr_dev(div6, "class", "expand__preview svelte-643hy8");
    			add_location(div6, file$1, 103, 4, 4318);
    			attr_dev(div7, "class", "recipient__item svelte-643hy8");
    			attr_dev(div7, "id", div7_id_value = "recipient-" + /*idx*/ ctx[0]);
    			add_location(div7, file$1, 70, 0, 2375);
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
    				child_ctx[13] = info.resolved;
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
    	component_subscribe($$self, recipients, $$value => $$invalidate(8, $recipients = $$value));
    	validate_store(request, "request");
    	component_subscribe($$self, request, $$value => $$invalidate(9, $request = $$value));
    	validate_store(count, "count");
    	component_subscribe($$self, count, $$value => $$invalidate(4, $count = $$value));
    	let { idx = 0 } = $$props;
    	let currentTemplate = "";
    	let toggleDisplay = false;
    	let startUrl = "/api/current-user/";
    	let { states } = $$props;

    	function getTemplateInfo() {
    		let templateData = {};

    		for (const field of Object.keys($recipients[idx])) {
    			templateData[field] = $recipients[idx][field].value;
    		}

    		for (const field of Object.keys($request)) {
    			templateData[field] = $request[field].value;
    		}

    		const recipientName = `${templateData["recipientFirstName"]} ${templateData["recipientLastName"]}`;

    		templateData["recipientName"] = recipientName.trim() === ""
    		? "Public Records Officer"
    		: recipientName.trim();

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

    	function addRecipient() {
    		recipients.addItem();
    		sources.addItem();
    	}

    	function deleteRecipient() {
    		recipients.deleteItem(idx);
    		sources.deleteItem(idx);
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
    		addRecipient,
    		deleteRecipient,
    		$recipients,
    		$request,
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

    	return [
    		idx,
    		states,
    		currentTemplate,
    		toggleDisplay,
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
    			add_location(span0, file$2, 28, 44, 687);
    			attr_dev(label0, "for", "id_subject-line");
    			attr_dev(label0, "class", "svelte-1enplz5");
    			add_location(label0, file$2, 28, 8, 651);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "id_subject");
    			attr_dev(input, "name", "subject");
    			attr_dev(input, "class", "svelte-1enplz5");
    			add_location(input, file$2, 29, 8, 734);
    			attr_dev(div0, "class", "subject__line");
    			add_location(div0, file$2, 27, 1, 615);
    			attr_dev(span1, "class", "required");
    			add_location(span1, file$2, 32, 55, 921);
    			attr_dev(label1, "for", "id_requestedRecords");
    			attr_dev(label1, "class", "svelte-1enplz5");
    			add_location(label1, file$2, 32, 8, 874);
    			attr_dev(textarea0, "id", "id_requestedRecords");
    			attr_dev(textarea0, "name", "requestedRecords");
    			attr_dev(textarea0, "class", "svelte-1enplz5");
    			add_location(textarea0, file$2, 33, 8, 968);
    			attr_dev(div1, "class", "records");
    			add_location(div1, file$2, 31, 4, 844);
    			attr_dev(span2, "class", "optional svelte-1enplz5");
    			add_location(span2, file$2, 36, 58, 1192);
    			attr_dev(label2, "for", "id_feeWaiver");
    			attr_dev(label2, "class", "svelte-1enplz5");
    			add_location(label2, file$2, 36, 8, 1142);
    			attr_dev(textarea1, "id", "id_feeWaiver");
    			attr_dev(textarea1, "name", "feeWaiver");
    			attr_dev(textarea1, "class", "svelte-1enplz5");
    			add_location(textarea1, file$2, 37, 8, 1239);
    			attr_dev(div2, "class", "fee-waiver");
    			add_location(div2, file$2, 35, 4, 1109);
    			attr_dev(span3, "class", "optional svelte-1enplz5");
    			add_location(span3, file$2, 40, 82, 1476);
    			attr_dev(label3, "for", "id_expeditedProcessing");
    			attr_dev(label3, "class", "svelte-1enplz5");
    			add_location(label3, file$2, 40, 8, 1402);
    			attr_dev(textarea2, "id", "id_expeditedProcessing");
    			attr_dev(textarea2, "name", "expeditedProcessing");
    			attr_dev(textarea2, "class", "svelte-1enplz5");
    			add_location(textarea2, file$2, 41, 8, 1523);
    			attr_dev(div3, "class", "expedited-processing");
    			add_location(div3, file$2, 39, 4, 1359);
    			attr_dev(div4, "id", "request");
    			attr_dev(div4, "class", "request__container svelte-1enplz5");
    			add_location(div4, file$2, 26, 0, 568);
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
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(label1, t3);
    			append_dev(label1, span1);
    			append_dev(div1, t4);
    			append_dev(div1, textarea0);
    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(label2, t6);
    			append_dev(label2, span2);
    			append_dev(div2, t7);
    			append_dev(div2, textarea1);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(label3, t9);
    			append_dev(label3, span3);
    			append_dev(div3, t10);
    			append_dev(div3, textarea2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_handler*/ ctx[2], false, false, false),
    					listen_dev(textarea0, "input", /*input_handler_1*/ ctx[3], false, false, false),
    					listen_dev(textarea1, "input", /*input_handler_2*/ ctx[4], false, false, false),
    					listen_dev(textarea2, "input", /*input_handler_3*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
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
    		adjustHeight,
    		handleInput,
    		textAreaInput
    	});

    	return [
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

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (57:3) {#if uploadData !== undefined}
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
    		source: "(57:3) {#if uploadData !== undefined}",
    		ctx
    	});

    	return block;
    }

    // (62:3) {:catch error}
    function create_catch_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Could not process file. Make sure it is a .csv file with the correct fields.";
    			add_location(p, file$3, 62, 4, 1866);
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
    		source: "(62:3) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (60:3) {:then result}
    function create_then_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Finished";
    			add_location(p, file$3, 60, 4, 1828);
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
    		source: "(60:3) {:then result}",
    		ctx
    	});

    	return block;
    }

    // (58:22)      <p>Loading</p>    {:then result}
    function create_pending_block$1(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading";
    			add_location(p, file$3, 58, 4, 1790);
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
    		source: "(58:22)      <p>Loading</p>    {:then result}",
    		ctx
    	});

    	return block;
    }

    // (68:2) {#each $recipients as _recipient, idx}
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
    		source: "(68:2) {#each $recipients as _recipient, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div8;
    	let div0;
    	let h20;
    	let t1;
    	let request;
    	let t2;
    	let div3;
    	let h21;
    	let t4;
    	let p;
    	let t6;
    	let div2;
    	let input0;
    	let t7;
    	let div1;
    	let t8;
    	let t9;
    	let input1;
    	let t10;
    	let div7;
    	let div4;
    	let input2;
    	let t11;
    	let div5;
    	let input3;
    	let t12;
    	let div6;
    	let input4;
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
    			div8 = element("div");
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Information about the Request";
    			t1 = space();
    			create_component(request.$$.fragment);
    			t2 = space();
    			div3 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Information about the Recipients";
    			t4 = space();
    			p = element("p");
    			p.textContent = "You can manually add the agencies or you can upload a CSV.";
    			t6 = space();
    			div2 = element("div");
    			input0 = element("input");
    			t7 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			div7 = element("div");
    			div4 = element("div");
    			input2 = element("input");
    			t11 = space();
    			div5 = element("div");
    			input3 = element("input");
    			t12 = space();
    			div6 = element("div");
    			input4 = element("input");
    			attr_dev(h20, "class", "svelte-12pq4cw");
    			add_location(h20, file$3, 47, 2, 1381);
    			attr_dev(div0, "class", "section__container svelte-12pq4cw");
    			add_location(div0, file$3, 46, 1, 1346);
    			attr_dev(h21, "class", "svelte-12pq4cw");
    			add_location(h21, file$3, 51, 2, 1477);
    			attr_dev(p, "class", "svelte-12pq4cw");
    			add_location(p, file$3, 52, 2, 1521);
    			attr_dev(input0, "type", "file");
    			attr_dev(input0, "id", "csv_upload");
    			attr_dev(input0, "accept", ".csv");
    			attr_dev(input0, "class", "svelte-12pq4cw");
    			add_location(input0, file$3, 54, 3, 1624);
    			attr_dev(div1, "class", "upload__info");
    			add_location(div1, file$3, 55, 3, 1702);
    			attr_dev(div2, "class", "upload__container svelte-12pq4cw");
    			add_location(div2, file$3, 53, 2, 1589);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "num-items");
    			input1.value = /*$count*/ ctx[2];
    			add_location(input1, file$3, 70, 2, 2087);
    			attr_dev(div3, "class", "section__container svelte-12pq4cw");
    			add_location(div3, file$3, 50, 1, 1442);
    			attr_dev(input2, "type", "submit");
    			attr_dev(input2, "name", "send-requests");
    			attr_dev(input2, "id", "id_send-requests");
    			input2.value = "Send Requests";
    			attr_dev(input2, "class", "svelte-12pq4cw");
    			add_location(input2, file$3, 74, 3, 2216);
    			attr_dev(div4, "class", "submit__item svelte-12pq4cw");
    			add_location(div4, file$3, 73, 2, 2186);
    			attr_dev(input3, "type", "submit");
    			attr_dev(input3, "name", "schedule-requests");
    			attr_dev(input3, "id", "id_schedule-requests");
    			input3.value = "Schedule Requests";
    			attr_dev(input3, "class", "svelte-12pq4cw");
    			add_location(input3, file$3, 77, 3, 2344);
    			attr_dev(div5, "class", "submit__item svelte-12pq4cw");
    			add_location(div5, file$3, 76, 2, 2314);
    			attr_dev(input4, "type", "submit");
    			attr_dev(input4, "name", "save-requests");
    			attr_dev(input4, "id", "id_save-requests");
    			input4.value = "Save Requests";
    			attr_dev(input4, "class", "svelte-12pq4cw");
    			add_location(input4, file$3, 80, 3, 2484);
    			attr_dev(div6, "class", "submit__item svelte-12pq4cw");
    			add_location(div6, file$3, 79, 2, 2454);
    			attr_dev(div7, "class", "submit__container svelte-12pq4cw");
    			add_location(div7, file$3, 72, 1, 2152);
    			attr_dev(div8, "class", "form__container svelte-12pq4cw");
    			add_location(div8, file$3, 45, 0, 1315);
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div0);
    			append_dev(div0, h20);
    			append_dev(div0, t1);
    			mount_component(request, div0, null);
    			append_dev(div8, t2);
    			append_dev(div8, div3);
    			append_dev(div3, h21);
    			append_dev(div3, t4);
    			append_dev(div3, p);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, input0);
    			append_dev(div2, t7);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div3, t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div3, null);
    			}

    			append_dev(div3, t9);
    			append_dev(div3, input1);
    			append_dev(div8, t10);
    			append_dev(div8, div7);
    			append_dev(div7, div4);
    			append_dev(div4, input2);
    			append_dev(div7, t11);
    			append_dev(div7, div5);
    			append_dev(div5, input3);
    			append_dev(div7, t12);
    			append_dev(div7, div6);
    			append_dev(div6, input4);
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
    						each_blocks[i].m(div3, t9);
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
    			if (detaching) detach_dev(div8);
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
    		let idx = $recipients.length - 1;

    		// from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
    		const res = new Promise((resolve, reject) => {
    				Papa.parse(file, {
    					header: true,
    					skipEmptyLines: true,
    					step(results, _file) {
    						if (Object.keys(results.data).every(d => Object.keys(start).includes(d))) {
    							if (!Object.values($recipients[idx]).every(d => d.value === "")) {
    								idx += 1;
    								recipients.addItem();
    								sources.addItem();
    							}
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

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		recipients,
    		count,
    		start,
    		sources,
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
