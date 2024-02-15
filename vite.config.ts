import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "/home/seth/git/spicyjs-reactor/src/index.ts",
			name: "spicyJSReactor",
			//make sure filename is 'index'
			fileName: "index",
		},
		rollupOptions: {
			external: [],
			output: {
				globals: {},
			},
		},
	},
});
