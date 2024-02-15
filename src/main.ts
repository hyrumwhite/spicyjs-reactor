import { reactor } from "./index";

const span = document.createElement("span");
document.body.appendChild(span);

const firstName = reactor("John");
const lastName = reactor("Doe");
const fullName = reactor(() => `${firstName.value} ${lastName.value}`);

const count = reactor(0);
const thing = count(span);
const button = document.createElement("button");

const thingy = reactor([1, 2]);
const item = thingy(button);
const text = thingy();
document.body.append("asdf", thingy());
const updateThingyButton = document.createElement("button");
updateThingyButton.textContent = "Update Thingy";
updateThingyButton.addEventListener("click", () => {
	thingy.value.pop();
});
document.body.append(updateThingyButton);
// document.body.appendChild(button);
// button.addEventListener("click", () => {
// 	count.value++;
// });
// button.append(fullName());

// const input = document.createElement("input");
// document.body.appendChild(input);
// input.value = firstName.value;
// input.addEventListener("input", () => {
// 	firstName.value = input.value;
// });
