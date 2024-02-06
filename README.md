# SpicyJS

Package is still under construction. The API won't change but tests will be added, types will be made more robust, etc.

SpicyJS is a lightweight, buildless JavaScript library that takes the pain out of creating and updating elements.

## Why

Vanilla JS is very attractive. If done correctly, its the fastest and lightest JS option. But, default apis for creating, modifying, and updating elements are clunky and difficult to read through. SpicyJS is a lightweight way to spice up VanillaJS without going too far off the deep end. The core and reactivity libraries are ~1kb each, and if you're like me, you'd probably end up creating something similar anyway in your Vanilla journey.

Note: if you find you need a more standard or complex approach, I highly recommend Preact, though it's more of a full on dessert than a dash of spice in your Vanilla :)

## Installation

```bash
npm i @spicyjs/reactor;
```

Reactivity is Proxy based. You create a reactor by invoking the reactor function, similar to a Vue ref. The resulting variable is a function with a value property.

If invoked as a function, a side effect is added. A side effect may be a text node, an HTMLElement, or a function.

```ts
type Reactor = (initialState: string | bool | number | (() => void)) => ((
	effect: HTMLElement | Text | (() => void)
) => effect) & {
	value: typeof initialState | ReturnType<typeof initialState>;
};
```

```ts
import spicy from "@spicyjs/core";
import { reactor } from "@spicyjs/reactor";

const { div, button, span, input, label } = spicy;

const count = reactor(0);
const increment = () => count.value++;

export const counter = () =>
	div(span(count()), button("increment", { click: increment }));

const firstName = reactor("");
const lastName = reactor("");
const fullName = reactor(() => `${firstName.value} ${lastName.value}`);

//register side effect
const effect = fullName(() => console.log("full name updated!"));

// cleanup
// fullname.removeEffect(effect);
// OR
// fullName.destroy();
// lastName.destroy(); //etc
// OR
// import { meltdown } from @spicyjs/reactor;
// meltdown(firstName, lastName, fullName);

export const fullNameGenerator = () =>
	div(
		span(fullName()),
		label({ for: "firstname" }, "First Name"),
		input({
			id: "firstname",
			input: ($event) => (firstName.value = $event.target.value),
		}),
		label({ for: "lastname" }, "Last Name"),
		input({
			id: "lastname",
			input: ($event) => (lastName.value = $event.target.value),
		})
	);
```
