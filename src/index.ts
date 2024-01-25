type Effect = HTMLElement | Text | (() => void);
type Reactor<T> = {
	value: T;
	removeEffect: (effect: Effect) => void;
	destroy: () => void;
};
/*
 *Idea here is to have a proxy that auto updates elements and text nodes with an optional function that will execute
 *
 */

const executeEffects = <T>(proxy: { value: any }, effects: Effect[]) => {
	for (let i = 0; i < effects.length; i++) {
		const effect = effects[i];
		if (typeof effect === "function") {
			effect(proxy.value);
		} else if (effect instanceof HTMLElement) {
			effect.textContent = proxy.value.toString();
		} else if (effect instanceof Text) {
			effect.nodeValue = proxy.value.toString();
		}
	}
};
const collectionProxy = <T extends object>(obj: T, effects: Effect[]) => {
	const proxy = new Proxy(obj, {
		get(target, key) {
			if (typeof target[key] === "function") {
				return (item) => {
					Reflect.apply(value, target, [item]);
					executeEffects({ value: obj }, effects);
				};
			}
			return Reflect.get(target, key);
		},
		set(target, key, value) {
			Reflect.set(target, key, value); // Use reflection to set the value
			executeEffects({ value: obj }, effects);
			return true;
		},
	});
	return proxy as unknown as ((effect: Effect) => void) & { value: T };
};

let updateFunctionProxy = (<T>(proxy: { value: T }, value: T) => {}) | null;
let activeProxy = null as null | Reactor<T>;
const proxyUpdateMap = new WeakMap<Reactor<T>, () => void>();
const proxyDependencyMap = new WeakMap<Reactor<T>, WeakSet<Reactor<T>>>();

const reactor = <T>(initialState: T) => {
	const effects = [];
	const initialStateType = typeof initialState;
	const isInitialStateFunction = initialStateType === "function";
	let state =
		initialStateType === "object" && initialState !== null
			? collectionProxy(initialState, effects)
			: isInitialStateFunction
			? null
			: initialState;

	const registerEffect = <T extends Effect>(effect?: Effect) => {
		if (typeof effect === "undefined") {
			effect = document.createTextNode("");
		}
		effects.push(effect);
		return effect;
	};
	const getHandler = {
		value(target: typeof registerEffect) {
			if (updateFunctionProxy) {
				target(updateFunctionProxy);
			}
			return state;
		},
		removeEffect() {
			return (effect: Effect) => {
				const index = effects.indexOf(effect);
				if (index > -1) {
					effects.splice(index, 1);
				}
			};
		},
		destroy() {
			return () => effects.splice(0, effects.length);
		},
	};
	const proxy = new Proxy(registerEffect, {
		get(target, key) {
			if (key in getHandler) {
				return getHandler[key](target);
			}
		},
		set(target, key, value) {
			state = value;
			executeEffects(proxy, effects);
			return true;
		},
		apply(target, thisArg, args) {
			const value = target.apply(thisArg, args);
			executeEffects(proxy, effects);
			return value;
		},
	});
	if (isInitialStateFunction) {
		updateFunctionProxy = () => (proxy.value = initialState());
		activeProxy = proxy;
		updateFunctionProxy();
		updateFunctionProxy = null;
		activeProxy = null;
	}
	return proxy as unknown as typeof registerEffect & Reactor<T>;
};

export default reactor;
