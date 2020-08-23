import App from './App.svelte';

const app = new App({
	target: document.getElementById("foia-request-items"),
	props: {
		states: [
			{abbr: "AK", name: "Alaska"},
			{abbr: "CA", name: "California"}
		]
	}
});

export default app;