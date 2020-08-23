<script>
	import {recipients, count, start} from "./store.js";
	import Recipient from "./Recipient.svelte";
	import Request from "./Request.svelte";
	export let states = [];

</script>
<div class="form__container">
	<div class="section__container">
		<h2>Information about the Request</h2>
		<Request/>
	</div>
	<div class="section__container">
		<h2>Information about the Recipients</h2>
		{#each $recipients as _recipient, idx}
			<Recipient states={states} idx="{idx}"/>
		{/each}
		<input type="hidden" name="num-items" value="{$count}">
	</div>
</div>


<style>
	.form__container {
		max-width: 95%;
		margin:auto;
	}

	.section__container {
		border: 1px solid rgb(170,170,170);
		border-radius: 2px;
		padding: 5px;
		margin-bottom: 5px;
		background-color: rgb(240,240,240);
		font-size: 1.2rem;
	}

	h2 {
		text-align: center;
	}

	@media screen and (min-width: 600px) {
        .form__container {
            width: 65%;
        }
    }
</style>