type RegisterEffect = {
	(): Text;
	<T extends Effect>(effect: T, effectHandler?: (effect: T) => void): T;
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
			effect();
		} else if (effect instanceof HTMLElement) {
			effect.textContent = proxy.value.toString();
		} else if (effect instanceof Text) {
			effect.nodeValue = proxy.value.toString();
		}
	}
};
const collectionProxy = <T extends object>(obj: T, effects: Set<Effect>): T => {
	const proxy = new Proxy(obj, {
		get(target, key) {
			//@ts-ignore
			if (key in target && typeof target[key] === "function") {
				return (...args: unknown[]) => {
					//@ts-ignore
					const returnValue = Reflect.apply(target[key], target, args);
					executeEffects({ value: obj }, effects);
					return returnValue;
				};
			}
			const returnValue = Reflect.get(target, key);
			return typeof returnValue === "object" && returnValue !== null
				? collectionProxy(returnValue, effects)
				: returnValue;
		},
		set(target, key, value) {
			Reflect.set(target, key, value);
			executeEffects({ value: obj }, effects);
			return true;
		},
	});
	return proxy as unknown as T;
};

let activeEffectFn: (() => void) | null = null;
let activeProxy = null as null | Reactor<unknown>;
const proxyUpdateMap = new WeakMap<Reactor<unknown>, () => void>();
const proxyAncestorMap = new Map<Reactor<unknown>, Set<Reactor<unknown>>>();

export const reactor = <T>(initialState: T) => {
	const effects = new Set<Effect>();
	const initialStateType = typeof initialState;
	const isInitialStateFunction = initialStateType === "function";
	let state =
		initialStateType === "object" && initialState !== null && initialState
			? collectionProxy(initialState, effects)
			: isInitialStateFunction
			? null
			: initialState;

	const registerEffect: RegisterEffect = (
		effect?: any,
		effectHandler?: any
	) => {
		if (!effect) {
			effect = document.createTextNode("");
		}
		effects.add(
			typeof effectHandler === "function" ? () => effectHandler(effect) : effect
		);
		return effect;
	};

	const getHandler = {
		_isReactor: true,
		value(target: RegisterEffect) {
			if (activeEffectFn) {
				if (activeProxy) {
					const ancestors = proxyAncestorMap.get(activeProxy);
					if (ancestors) {
						ancestors.add(proxy);
					}
				}
				target(activeEffectFn);
			}
			return state;
		},
		removeEffect() {
			return (effect: Effect) => effects.delete(effect);
		},
		destroy() {
			return () => {
				const ancestors = proxyAncestorMap.get(proxy) || [];
				for (const ancestor of ancestors) {
					const effect = proxyUpdateMap.get(proxy);
					if (effect) {
						ancestor.removeEffect(effect);
					}
				}
				proxyAncestorMap.delete(proxy);
				proxyUpdateMap.delete(proxy);
				effects.clear();
			};
		},
	};
	type GetHandlerKey = keyof typeof getHandler;
	const proxy = new Proxy(registerEffect, {
		get(target, key, receiver) {
			if (typeof key === "string" && key in getHandler) {
				const handler = getHandler[key as GetHandlerKey];
				if (typeof handler === "function") {
					return handler(target);
				}
				return getHandler[key as GetHandlerKey];
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
