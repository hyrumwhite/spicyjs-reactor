import { expect, test, vi } from "vitest";
import { reactor, meltdown } from "../src/index";

test("reactor should return a function with a 'value' property", () => {
	const state = { count: 0 };
	const r = reactor(state);
	expect(r.value).toEqual(state);
});

test("setting 'value' property should invoke the stored effect", () => {
	const state = { count: 0 };
	const r = reactor(state);
	let effectInvoked = false;
	r(() => {
		effectInvoked = true;
	});
	r.value = 10;
	expect(effectInvoked).toBe(true);
});

test("reactor with initial state as a function should subscribe to changes from dependencies", () => {
	const firstName = reactor("seth");
	const lastName = reactor("white");
	const r = reactor(() => `${firstName.value} ${lastName.value}`);
	expect(r.value).toEqual(`${firstName.value} ${lastName.value}`);
	firstName.value = "bob";
	expect(r.value).toEqual(`bob ${lastName.value}`);
});

test("computed reactor dependencies should not run effects after destroyed", () => {
	const firstName = reactor("seth");
	const lastName = reactor("white");
	const r = reactor(() => `${firstName.value} ${lastName.value}`);
	const testFn = vi.fn();
	r(testFn);
	firstName.value = "jake";
	r.destroy();
	firstName.value = "jim";
	expect(testFn).toBeCalledTimes(2);
});

test("destroyed reactor should not update its effects", () => {
	const state = { count: 0 };
	const r = reactor(state);
	let effectInvoked = false;
	const testFn = vi.fn();
	r(testFn);
	r.destroy();
	r.value = 10;
	expect(testFn).toBeCalledTimes(1);
});

test("Reactors invoked with no params should create text nodes", () => {
	const r = reactor(0);
	const node = r();
	expect(node).toBeInstanceOf(Text);
});

test("Reactors invoked with an element should update the element's textContent on change", () => {
	const r = reactor("hello");
	const element = document.createElement("div");
	const returnedElement = r(element);
	expect(returnedElement).toBe(element);
	expect(returnedElement.textContent).toBe("hello");
});

test("Reactors invoked with an element and a function should run the function as an effect", () => {
	const r = reactor("hello");
	const element = document.createElement("div");
	const returnedElement = r(element, (el) => (el.className = r.value));
	expect(returnedElement).toBe(element);
	expect(returnedElement.className).toBe("hello");
});

test("Array reactors should not invoke effects when methods are run", () => {
	const r = reactor([1, 2, 3, 4]);
	const effect = r(() => {
		console.log(r.raw.map(() => 1));
	});
});
