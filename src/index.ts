type RegisterEffect = {
	(): Text;
	<T extends Effect>(effect: T): T;
};
type Accessor<T> = {
	value: T;
	removeEffect: (effect: Effect) => void;
	destroy: () => void;
};
type Effect = HTMLElement | Text | (() => void);
type Reactor<T> = Accessor<T> & RegisterEffect;

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
const collectionProxy = <T extends object>(obj: T, effects: Set<Effect>) => {
	const proxy = new Proxy(obj, {
		get(target, key) {
			if (typeof target[key] === "function") {
				return (item) => {
					const returnValue = Reflect.apply(target[key], target, [item]);
					executeEffects({ value: obj }, effects);
					return returnValue;
				};
			}
			return Reflect.get(target, key);
		},
		set(target, key, value) {
			Reflect.set(target, key, value);
			executeEffects({ value: obj }, effects);
			return true;
		},
	});
	return proxy as unknown as ((effect: Effect) => void) & { value: T };
};

let activeEffectFn: (() => void) | null = null;
let activeProxy = null as null | Reactor<T>;
const proxyUpdateMap = new WeakMap<Reactor<T>, () => void>();
const proxyAncestorMap = new Map<Reactor<T>, Set<Reactor<T>>>();

export const reactor = <T>(initialState: T) => {
	const effects = new Set<Effect>();
	const initialStateType = typeof initialState;
	const isInitialStateFunction = initialStateType === "function";
	let state =
		initialStateType === "object" && initialState !== null
			? collectionProxy(initialState, effects)
			: isInitialStateFunction
			? null
			: initialState;

	const registerEffect: RegisterEffect = (effect: any) => {
		if (!effect) {
			effect = document.createTextNode("");
		}
		effects.add(effect);
		return effect;
	};

	const getHandler = {
		_isReactor: true,
		value(target: typeof registerEffect) {
			if (activeEffectFn) {
				proxyAncestorMap.get(activeProxy).add(target);
				target(activeEffectFn);
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
		get(target, key, receiver) {
			if (typeof key === "string" && key in getHandler) {
				return getHandler[key](target);
			}
			return Reflect.get(target, key, receiver);
		},
		set(target, key, value, receiver) {
			if (key === "value") {
				state = value;
				executeEffects(proxy, effects);
				return true;
			} else {
				return Reflect.set(target, key, value, receiver);
			}
		},
		apply(target, thisArg, args: [effect: Effect]) {
			const value = target.apply(thisArg, args);
			executeEffects(proxy, effects);
			return value;
		},
	}) as unknown as Reactor<T>;
	if (isInitialStateFunction) {
		activeEffectFn = () => (proxy.value = (initialState as Function)());
		activeProxy = proxy;
		proxyAncestorMap.set(proxy, new Set());
		proxyUpdateMap.set(proxy, activeEffectFn);
		activeEffectFn();
		activeEffectFn = null;
		activeProxy = null;
	}
	return proxy;
};
export const meltdown = (...reactors: Reactor<any>[]) => {
	for (const reactor of reactors) {
		reactor.destroy();
	}
};
