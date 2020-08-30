<script>
	import {recipients, count, start} from "./store.js";
	import Recipient from "./Recipient.svelte";
	import Request from "./Request.svelte";
	let states = fetch("/api/current-user/states")
        .then(response => response.json())
        .then(data => data.states)
		.catch(e => {console.error(e);});

	let uploadData;
	$: console.log($recipients);
		
	async function handleUpload(event) {
		let file = event.target.files[0];
		// remove items so you don't get an extra field
		while ($recipients.length !== 0) {
			recipients.deleteItem($recipients.length - 1);
		}
		let idx = $recipients.length -1;
		// from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
		const res = new Promise((resolve, reject) => {
			Papa.parse(file, {
				header:true,
				skipEmptyLines: true,
				step: function(results, _file) {
					idx += 1;
					if (Object.keys(results.data).every(d => Object.keys(start).includes(d))) {
						recipients.addItem();
					} else {
						reject(new Error("invalid field"));
					}
					for (let field of Object.keys(results.data)) {
						recipients.changeItem($recipients, idx, field, results.data[field]);
					}
				},
				complete: function(_results, _file) {
					resolve()
				},
				error: function(err, _file) {
					reject(err)
				}
			})
		});
		uploadData = res;
	}

</script>
<div class="form__container">
	<div class="section__container">
		<h2>Information about the Request</h2>
		<Request/>
	</div>
	<div class="section__container">
		<h2>Information about the Recipients</h2>
		<p>You can manually add the agencies or you can upload a CSV.</p>
		<p>Note: Uploading a CSV will delete all existing data. If you want
			to add agencies that aren't in your CSV file, you should add them
			after uploading the CSV.
		</p>
		<input type="file" id="csv_upload" accept=".csv" on:change={handleUpload}>
		<div class="upload__info">
			{#if uploadData !== undefined}
			{#await uploadData}
				<p>Loading</p>
			{:then result} 
				<p>Finished</p>
			{:catch error}
				<p>Could not process file. Make sure it is a .csv file with the correct fields.</p>
			{/await}
			{/if}
		</div>
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