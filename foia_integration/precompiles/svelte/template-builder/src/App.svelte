<script>
import { each, onMount } from "svelte/internal";

	export let buttonItems;
	let outputJson = {
		extras: []
	};
	// this refers to all of the boilerplate (ie everything that isn't in one of the buttons)
	let parsedText = "";

	function handleTextChange(event) {
	}

	function updateJsonText() {
		if (outputJson.extras.length === 0) {
			parsedText = document.getElementById("target").value;
		} else {
			const lastElem = outputJson.extras[outputJson.length - 1];
			// the parsed text is all of the text minus the text that's in the buttons
			// so if we add the button element lengths to the last position, we get the index
			// within the textarea text where our new text starts
			const sumElemLengths = outputJson.extras.map(d => d.text.length)
				.reduce((a, b) => a + b, 0);
			const newTextStartIdx = sumElemLengths + parsedText.length;
			parsedText += document.getElementById("target").value.slice(newTextStartIdx);
		}
	}

	function addItem(event) {
		updateJsonText();
		const elemText = event.target.textContent;
		document.getElementById("target").value += elemText;
		outputJson.extras.push({
			field: event.target.getAttribute("data-field"),
			position: parsedText.length,
			text: event.target.textContent
		});
		outputJson.text = parsedText;
	}
</script>

<div class="button__container">
{#each Object.keys(buttonItems) as button}
<button data-field={button} class="button__item" on:click={addItem}>{buttonItems[button]}</button>
{/each}
</div>
<div class="form__area">
	<textarea id="target" rows="25" cols="100" on:input={handleTextChange}></textarea>
</div>
<div class="submit__container"></div>

<style>
	textarea {
		outline: none;
		resize: none;
		overflow: auto;
		font-size: 1.5rem;
	}

	.button__container {
		min-height: 200px;
	}
</style>