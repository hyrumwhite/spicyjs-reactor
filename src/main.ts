import { reactor } from "./index";

const span = document.createElement("span");
document.body.appendChild(span);

const firstName = reactor("John");
const lastName = reactor("Doe");
const fullName = reactor(() => `${firstName.value} ${lastName.value}`);
document.body.append(fullName());
const count = reactor(0);
const thing = count(span);
const button = document.createElement("button");

const thingy = reactor([{ checked: false }]);
setInterval(() => {
	// thingy.value = !thingy.value;
	thingy.value[0].checked = !thingy.value[0].checked;
}, 2000);
// thingy(() => {
// 	console.log(thingy.value);
// });
// thingy.value[0].checked = true;
const item = thingy(button, (el) => {
	el.textContent = thingy.value[0].checked ? "true" : "false";
	el.style.background = thingy.value[0].checked ? "red" : "blue";
});
document.body.append(button);
// const text = thingy();
// const test = thingy(() => "asdf");
// document.body.append(
// 	thingy(() => {
// 		console.trace();
// 		const color = document.createElement("div");
// 		if (thingy.value[0].checked) {
// 			color.textContent = "checked";
// 			color.style.background = "red";
// 		} else {
// 			color.textContent = "not checked";
// 			color.style.background = "blue";
// 		}
// 		return color;
// 	})
// );
// document.body.append("asdf", thingy());
// const updateThingyButton = document.createElement("button");
// updateThingyButton.textContent = "Update Thingy";
// updateThingyButton.addEventListener("click", () => {
// 	thingy.value.pop();
// });
// document.body.append(updateThingyButton);
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
