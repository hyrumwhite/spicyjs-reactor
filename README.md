# SpicyJS

SpicyJS is a buildless microframework with a VanillaJS mental model that consists of a few tiny packages:

- @spicyjs/core: a JS library that takes the pain out of creating, updating, and attaching listeners to elements. (~1kb uncompressed)
- @spicyjs/reactor: a Reactive library that binds data to nodes (~1kb before gzip uncompressed)
- @spicyjs/router: a lightweight router for SPA's (~2kb before gzip uncompressed)

## Why

Reactiviy allows for fast, low boilerplate DOM updates. A reactivity system helps to avoid bad practices like using DOM as state. Spicy reactivity is proxy based and only targets the DOM elements you specify. There is no virtual DOM, queue flush or render flow. Changes are propagated immediately to the DOM.

## Installation

```bash
npm i @spicyjs/reactor;
```

Reactivity is Proxy based. You create a reactor by invoking the reactor function, similar to a Vue ref. The resulting variable is a function with a value property.

If invoked as a function, a side effect is added. A side effect may be a text node, an HTMLElement, or a function.

Note that objects and arrays require some special handling if accessed within their own effects.

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

//Objects should be accessed inside their own effects with 'raw', do not update objects inside their own effects
const people = reactor(["steve", "jeff", "ronald"]);
people(() => {
	const items = people.raw.map((person) => li(person));
	//etc
});

//register side effect
const effect = fullName(() => console.log("full name updated!"));

// cleanup
// fullname.removeEffect(effect);
// OR
// fullName.destroy();
// lastName.destroy(); //etc

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

As noted in the example, to keep the package size small, object methods have not been enumerated and checked against inside reactors. Accessing array methods inside an effect will trigger a call stack exceeded error. To access objects inside their own effects, refer to them with `.raw`.

Full type:

```ts
type Reactor = (initialState: string | bool | number | (() => void)) => ((
	effect: HTMLElement | Text | (() => void)
) => effect) & {
	value: typeof initialState | ReturnType<typeof initialState>;
};
```
