<script>
	import Recipient from "./Recipient.svelte";
import App from "../../template-builder/src/App.svelte";

	export let states;

	let indexes = Array(1).fill().map((_, i) => i);
	$: count = indexes.length;

	function handleDelete(event) {
	}
</script>

<div class="presentation__area"></div>
<div class="form__container">
	<div class="form__item__contaner">
		<div class="request__content">
			<h2>Request Content</h2>
		</div>
	</div>
	<div class="form__item__container">
		<div class="recipient__content">
			<h2>Recipient Content</h2>
			<div class="recipient__items">
				{#each indexes as idx}
				<div id="recipient-{idx}" class="recipient__item">
					<Recipient bind:idx={idx} bind:states={states}/>
					<div class="add__items">
						{#if idx === Math.max(...indexes)}
						<button class="add__button" on:click="{e => indexes = [...indexes, indexes.length]}">Add New Recipient</button>
						{/if}
						<button id="delete-{idx}" class="delete__button" on:click={handleDelete}>Delete Recipient</button>
					</div>
				</div>
				{/each}
			</div>
		</div>
	</div>
</div>


<style>
h2 {
	text-align: center;
}

.recipient__item {
    display: flex;
    flex-direction: column;
    width: 70%;
    margin: auto;
    border: 1px solid black;
    padding: 5px;
}

.add__items {
	display: flex;
	justify-content: space-between;
}
</style>