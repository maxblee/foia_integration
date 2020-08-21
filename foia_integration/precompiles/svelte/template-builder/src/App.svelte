<script>
import { each, onMount, text } from "svelte/internal";

	export let buttonItems;
	let nodes = [];

	function handleTextInputChange(event) {
		adjustHeight(event);
		updateInput();
	}

	function adjustHeight(event) {
		const elem = event.target;
		// change the height of element if it overflows
		if (elem.clientHeight < elem.scrollHeight) {
			elem.style.height = elem.scrollHeight + 20 + "px";
		} 
	}

	function updateInput() {
		const regex = /\{\{([\w\s]+)\}\}/g;
		const elemText = document.getElementById("template-input").value;
		let newNodes = [];
		let lastIdx = 0;
		let field;
		while (field = regex.exec(elemText)) {
			const beforeText = field.input.slice(lastIdx, field.index);
			newNodes.push({type: "text", content: beforeText});
			newNodes.push({type: "plugin", content: field[1]});
			lastIdx = field.index + field[0].length;
		}
		newNodes.push({type: "text", content: elemText.slice(lastIdx)});
		nodes = newNodes;
	}

	function addItem(event) {
		const elemText = event.target.innerText;
		document.getElementById("template-input").value += `{{${elemText}}}`;
		updateInput();
	}
</script>

<div class="presentation__area">
	{#each nodes as textNode}
		{#if textNode.type === "text"}
		{textNode.content}
		{:else}
		<span class="template__highlight">{textNode.content}</span>
		{/if}
	{/each}
</div>
<div class="button__container">
{#each Object.keys(buttonItems) as button}
<button type="button" data-field={button} class="button__item" on:click={addItem}>{buttonItems[button]}</button>
{/each}
</div>
<div class="form__area">
	<textarea name="template-text" aria-label="Write your template here" id="template-input" on:input={handleTextInputChange}></textarea>
</div>
<div class="submit__container">
	<input type="submit" value="Submit Template">
</div>

<style>
	* {
		margin: auto;
	}

	#template-input {
		box-sizing: border-box;
		-webkit-box-sizing: border-box;
		-moz-box-sizing: border-box;
		text-align: left;
		font-size: 1.2rem;
		width: 80%;
		resize: none;
		margin-top: 1rem;
		min-height: 200px;
		overflow: hidden;
		display: block;
		margin-left: auto;
		margin-bottom: 1rem;
	}

	.template__highlight {
		background-color: #ffca7a;
		border-radius: 5px;
		padding: 3px;
	}

	.presentation__area {
		min-height: 100px;
		white-space: pre-line;
		font-size: 1.3rem;
		border-bottom: 2px solid rgb(187,187,187);
		padding: 5px;
		width: 80%;
	}

	.button__container {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		margin: 5px
	}

	.button__item {
		font-size: 1.2rem;
		padding: 3px;
		border: none;
		margin: 2px;
		background-color: #ffca7a;
		transition: background-color 2s, color 2s;
		border-radius: 5px;
	}

	.button__item:hover, .button__item:focus {
		background-color: #C27400;
		cursor: pointer;
		color: #FAFAFA;
	}

	.submit__container {
		/* display: flex; */
		text-align: center;
		margin-bottom: 15px;
	}
	input {
		font-size: 1.2rem;
	}
</style>