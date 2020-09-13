<script>
	import {recipients, count, start, sources} from "./store.js";
	import Recipient from "./Recipient.svelte";
	import Request from "./Request.svelte";
	let states = fetch("/api/current-user/states")
        .then(response => response.json())
        .then(data => data.states)
		.catch(e => {console.error(e);});

	let uploadData;
		
	async function handleUpload(event) {
		let file = event.target.files[0];
		let idx = $recipients.length -1;
		// from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
		const res = new Promise((resolve, reject) => {
			Papa.parse(file, {
				header:true,
				skipEmptyLines: true,
				step: function(results, _file) {
					if (Object.keys(results.data).every(d => Object.keys(start).includes(d))) {
						if (!Object.values($recipients[idx]).every(d => d.value === "")) {
							idx += 1;
							recipients.addItem();
							sources.addItem();
						}
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
		<div class="upload__container">
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
		</div>
		{#each $recipients as _recipient, idx}
			<Recipient states={states} idx="{idx}"/>
		{/each}
		<input type="hidden" name="num-items" value="{$count}">
	</div>
	<div class="submit__container">
		<div class="submit__item">
			<input type="submit" name="send-requests" id="id_send-requests" value="Send Requests">
		</div>
		<div class="submit__item">
			<input type="submit" name="schedule-requests" id="id_schedule-requests" value="Schedule Requests">
		</div>
		<div class="submit__item">
			<input type="submit" name="save-requests" id="id_save-requests" value="Save Requests">
		</div>
	</div>
</div>


<style>
	.form__container {
		max-width: 95%;
		margin:auto;
	}

	.section__container {
		padding: 5px;
		margin-bottom: 5px;
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

	.upload__container {
		display: flex;
		justify-content: center;
		padding: 10px;
		font-size: 1.2rem;
	}
	.upload__container > input {
		font-size: 1.2rem;
	}
	.submit__container {
		display: flex;
		justify-content: end;
		margin-bottom: 1.4rem;
	}
	.submit__item {
		padding: 5px;
	}

	.submit__item > input {
		font-size: 1.1rem;
	}
	
	.section__container > p {
		margin: 0;
		text-align: center;
	}
</style>