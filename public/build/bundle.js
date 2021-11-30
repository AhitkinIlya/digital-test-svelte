
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
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
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
            set_current_component(null);
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Container.svelte generated by Svelte v3.44.2 */

    const file$2 = "src\\components\\Container.svelte";

    function create_fragment$2(ctx) {
    	let div5;
    	let div0;
    	let t1;
    	let div4;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = "Кликни по любому квадрату";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "square-text svelte-1mahn3u");
    			add_location(div0, file$2, 38, 4, 628);
    			attr_dev(div1, "class", "square svelte-1mahn3u");
    			attr_dev(div1, "id", "one");
    			set_style(div1, "background-color", /*colors*/ ctx[1][0]);
    			set_style(div1, "opacity", /*whichBlock*/ ctx[0] == 'one' ? 0 : 1);
    			add_location(div1, file$2, 40, 8, 721);
    			attr_dev(div2, "class", "square svelte-1mahn3u");
    			attr_dev(div2, "id", "two");
    			set_style(div2, "background-color", /*colors*/ ctx[1][1]);
    			set_style(div2, "opacity", /*whichBlock*/ ctx[0] == 'two' ? 0 : 1);
    			add_location(div2, file$2, 41, 8, 863);
    			attr_dev(div3, "class", "square svelte-1mahn3u");
    			attr_dev(div3, "id", "three");
    			set_style(div3, "background-color", /*colors*/ ctx[1][2]);
    			set_style(div3, "opacity", /*whichBlock*/ ctx[0] == 'three' ? 0 : 1);
    			add_location(div3, file$2, 42, 8, 1005);
    			attr_dev(div4, "class", "squares svelte-1mahn3u");
    			add_location(div4, file$2, 39, 4, 690);
    			attr_dev(div5, "class", "container-blocks svelte-1mahn3u");
    			add_location(div5, file$2, 37, 0, 592);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t1);
    			append_dev(div5, div4);
    			append_dev(div4, div1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*onCLick*/ ctx[2], false, false, false),
    					listen_dev(div2, "click", /*onCLick*/ ctx[2], false, false, false),
    					listen_dev(div3, "click", /*onCLick*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*whichBlock*/ 1) {
    				set_style(div1, "opacity", /*whichBlock*/ ctx[0] == 'one' ? 0 : 1);
    			}

    			if (dirty & /*whichBlock*/ 1) {
    				set_style(div2, "opacity", /*whichBlock*/ ctx[0] == 'two' ? 0 : 1);
    			}

    			if (dirty & /*whichBlock*/ 1) {
    				set_style(div3, "opacity", /*whichBlock*/ ctx[0] == 'three' ? 0 : 1);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Container', slots, []);
    	const colors = ['red', 'blue', 'green'];
    	let whichBlock = null;

    	function onCLick(e) {
    		$$invalidate(0, whichBlock = e.target.id);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Container> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ colors, whichBlock, onCLick });

    	$$self.$inject_state = $$props => {
    		if ('whichBlock' in $$props) $$invalidate(0, whichBlock = $$props.whichBlock);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [whichBlock, colors, onCLick];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Block.svelte generated by Svelte v3.44.2 */

    const file$1 = "src\\components\\Block.svelte";

    function create_fragment$1(ctx) {
    	let div11;
    	let div9;
    	let div4;
    	let div0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let t3;
    	let div3;
    	let t4;
    	let div8;
    	let div5;
    	let t6;
    	let div7;
    	let div6;
    	let t7;
    	let div10;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div11 = element("div");
    			div9 = element("div");
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Выбери цвет для квадрата:";
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div3 = element("div");
    			t4 = space();
    			div8 = element("div");
    			div5 = element("div");
    			div5.textContent = "Выбери прозрачность квадрата:";
    			t6 = space();
    			div7 = element("div");
    			div6 = element("div");
    			t7 = space();
    			div10 = element("div");
    			attr_dev(div0, "class", "text-color svelte-895ru2");
    			add_location(div0, file$1, 41, 12, 933);
    			attr_dev(div1, "class", "red svelte-895ru2");
    			attr_dev(div1, "id", "red");
    			add_location(div1, file$1, 42, 12, 1002);
    			attr_dev(div2, "class", "green svelte-895ru2");
    			attr_dev(div2, "id", "green");
    			add_location(div2, file$1, 43, 12, 1067);
    			attr_dev(div3, "class", "blue svelte-895ru2");
    			attr_dev(div3, "id", "blue");
    			add_location(div3, file$1, 44, 12, 1136);
    			attr_dev(div4, "class", "colors-block svelte-895ru2");
    			add_location(div4, file$1, 40, 8, 893);
    			attr_dev(div5, "class", "text-opacity svelte-895ru2");
    			add_location(div5, file$1, 47, 12, 1256);
    			attr_dev(div6, "class", "value svelte-895ru2");
    			set_style(div6, "left", /*positionSlider*/ ctx[2] + "px");
    			add_location(div6, file$1, 49, 16, 1370);
    			attr_dev(div7, "class", "opacity svelte-895ru2");
    			add_location(div7, file$1, 48, 12, 1331);
    			attr_dev(div8, "class", "opacity-block svelte-895ru2");
    			add_location(div8, file$1, 46, 8, 1215);
    			attr_dev(div9, "class", "option svelte-895ru2");
    			add_location(div9, file$1, 39, 4, 863);
    			attr_dev(div10, "class", "square svelte-895ru2");
    			set_style(div10, "background-color", /*color*/ ctx[1]);
    			set_style(div10, "opacity", /*opacity*/ ctx[0]);
    			add_location(div10, file$1, 53, 4, 1579);
    			attr_dev(div11, "class", "container svelte-895ru2");
    			add_location(div11, file$1, 38, 0, 834);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div9);
    			append_dev(div9, div4);
    			append_dev(div4, div0);
    			append_dev(div4, t1);
    			append_dev(div4, div1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div9, t4);
    			append_dev(div9, div8);
    			append_dev(div8, div5);
    			append_dev(div8, t6);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div11, t7);
    			append_dev(div11, div10);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*onClick*/ ctx[3], false, false, false),
    					listen_dev(div2, "click", /*onClick*/ ctx[3], false, false, false),
    					listen_dev(div3, "click", /*onClick*/ ctx[3], false, false, false),
    					listen_dev(div6, "mousedown", /*mouseDown*/ ctx[4], false, false, false),
    					listen_dev(div6, "mouseup", /*mouseUp*/ ctx[5], false, false, false),
    					listen_dev(div6, "mousemove", /*mouseMove*/ ctx[7], false, false, false),
    					listen_dev(div6, "mouseleave", /*mouseLeave*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*positionSlider*/ 4) {
    				set_style(div6, "left", /*positionSlider*/ ctx[2] + "px");
    			}

    			if (dirty & /*color*/ 2) {
    				set_style(div10, "background-color", /*color*/ ctx[1]);
    			}

    			if (dirty & /*opacity*/ 1) {
    				set_style(div10, "opacity", /*opacity*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div11);
    			mounted = false;
    			run_all(dispose);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Block', slots, []);
    	let opacity = 1;
    	let color = 'red';
    	let startXCoord = null;
    	let isMouseDown = false;
    	let positionSlider = 0;

    	function onClick(e) {
    		$$invalidate(1, color = e.target.id);
    	}

    	function mouseDown(e) {
    		isMouseDown = true;
    	}

    	function mouseUp() {
    		isMouseDown = false;
    	}

    	function mouseLeave() {
    		isMouseDown = false;
    	}

    	function mouseMove(e) {
    		if (isMouseDown) {
    			if (!startXCoord) {
    				startXCoord = e.clientX;
    				return;
    			}

    			if (e.clientX - startXCoord > 100 || e.clientX - startXCoord < 0) {
    				return;
    			}

    			$$invalidate(2, positionSlider = e.clientX - startXCoord);
    			$$invalidate(0, opacity = (100 - positionSlider) / 100);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Block> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		opacity,
    		color,
    		startXCoord,
    		isMouseDown,
    		positionSlider,
    		onClick,
    		mouseDown,
    		mouseUp,
    		mouseLeave,
    		mouseMove
    	});

    	$$self.$inject_state = $$props => {
    		if ('opacity' in $$props) $$invalidate(0, opacity = $$props.opacity);
    		if ('color' in $$props) $$invalidate(1, color = $$props.color);
    		if ('startXCoord' in $$props) startXCoord = $$props.startXCoord;
    		if ('isMouseDown' in $$props) isMouseDown = $$props.isMouseDown;
    		if ('positionSlider' in $$props) $$invalidate(2, positionSlider = $$props.positionSlider);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		opacity,
    		color,
    		positionSlider,
    		onClick,
    		mouseDown,
    		mouseUp,
    		mouseLeave,
    		mouseMove
    	];
    }

    class Block extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Block",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let div;
    	let block;
    	let t0;
    	let br;
    	let t1;
    	let container;
    	let current;
    	block = new Block({ $$inline: true });
    	container = new Container({ $$inline: true });

    	const block_1 = {
    		c: function create() {
    			div = element("div");
    			create_component(block.$$.fragment);
    			t0 = space();
    			br = element("br");
    			t1 = space();
    			create_component(container.$$.fragment);
    			add_location(br, file, 7, 2, 161);
    			attr_dev(div, "class", "container svelte-16si2ww");
    			add_location(div, file, 5, 1, 123);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(block, div, null);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    			mount_component(container, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(block.$$.fragment, local);
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(block.$$.fragment, local);
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(block);
    			destroy_component(container);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block: block_1,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block_1;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Container, Block });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
