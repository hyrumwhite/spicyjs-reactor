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

const executeEffects = <T>(proxy: { value: any }, effects: Set<Effect>) => {
	for (const effect of effects) {
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
const proxyAncestorMap = new Map<Reactor<T>, Set<Reactor<T>>>();

const reactor = <T>(initialState: T) => {
	const effects = new Set<Effect>();
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
		effects.add(effect);
		return effect;
	};
	const getHandler = {
		_isReactor: true,
		value(target: typeof registerEffect) {
			if (updateFunctionProxy) {
				proxyAncestorMap.get(activeProxy).add(target);
				target(updateFunctionProxy);
			}
			return state;
		},
		removeEffect() {
			return (effect: Effect) => effects.delete(effect);
		},
		destroy() {
			return () => {
				for (const ancestor of proxyAncestorMap.get(proxy)) {
					ancestor.removeEffect(proxyUpdateMap.get(proxy));
				}
				proxyAncestorMap.delete(proxy);
				proxyUpdateMap.delete(proxy);
				effects.clear();
			};
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
		proxyAncestorMap.set(proxy, new Set());
		proxyUpdateMap.set(proxy, updateFunctionProxy);
		updateFunctionProxy();
		updateFunctionProxy = null;
		activeProxy = null;
	}
	return proxy as unknown as typeof registerEffect & Reactor<T>;
};
export const meltdown = (...reactors: Reactor<any>[]) => {
	for (const reactor of reactors) {
		reactor.destroy();
	}
};
export default reactor;
