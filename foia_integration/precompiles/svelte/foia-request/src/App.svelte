<script>
  import Cookies from "js-cookie"
  import * as Papa from "papaparse"
  import { recipients, count, start, sources, request, errors } from './store.js'
  import Recipient from './Recipient.svelte'
  import Request from './Request.svelte'

  let states = fetch('/api/current-user/states')
    .then((response) => response.json())
    .then((data) => data.states)
    .catch((e) => {
      console.error(e)
    })

  let uploadData
  const csrfToken = Cookies.get("csrftoken")

  async function handleUpload(event) {
    let file = event.target.files[0]
    let idx = $recipients.length - 1
    // from https://stackoverflow.com/questions/56427009/how-to-return-papa-parsed-csv-via-promise-async-await
    const res = new Promise((resolve, reject) => {

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        step: function (results) {
          if (
            Object.keys(results.data).every((d) =>
              Object.keys(start).includes(d)
            )
          ) {
            if (!Object.entries($recipients[idx]).every((d) => d[1].value === start[d[0]].value)) {
              idx += 1
              recipients.addItem()
              sources.addItem()
              errors.addItem()
            }
          } else {
            reject(new Error('invalid field'))
          }
          for (let field of Object.keys(results.data)) {
            recipients.changeItem($recipients, idx, field, results.data[field])
          }
        },
        complete: function () {
          resolve()
        },
        error: function (err) {
          reject(err)
        },
      })
    })
    uploadData = res
  }

  async function handleFormSubmission(e) {
    const postUrl = `/api/current-user/foia/${e.submitter.name}`;
    const readableEntry = (content) => {
      const output = {}
      Object.entries(content)
        .forEach((d) => {output[d[0]] = d[1].value})
      return output
    }
    await fetch(postUrl, {
      method: "POST",
      mode: "same-origin",
      headers: {
        "X-CSRFToken": csrfToken,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        requestContent: readableEntry($request),
        recipientContent: $recipients.map((d) => readableEntry(d)),
        numItems: $count
      })
    }).then((response) => response.json())
    .then((results) => {
      if (results.status === "error") {
        errors.changeAll({requestErrors: results.requestErrors, recipientErrors: results.recipientErrors})
      } else {
        e.target.submit()
      }
    })
    .catch((err) => {console.error(err);})
  }
</script>

<style>
  .form__container {
    max-width: 95%;
    margin: auto;
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
      width: 80%;
    }
  }

  .upload__container {
    display: flex;
    justify-content: center;
    padding: 10px;
    font-size: 1.2rem;
    flex-direction: column;
    align-items: center;
  }
  .upload__container > input {
    font-size: 1.2rem;
    padding: 5px;
  }

  .section__container > p {
    margin: 0;
    text-align: center;
  }

  .submit__container {
    display: flex;
    justify-content: space-around;
    margin-bottom: 1.4rem;
  }
  
  .submit__item {
    padding: 5px;
  }

  .submit__item > input {
    font-size: 1.1rem;
  }
</style>

<form method="POST" action="/" on:submit|preventDefault={handleFormSubmission}>
  <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken}>
  <div class="form__container">
    <div class="section__container">
      <h2>Information about the Request</h2>
      <Request />
    </div>
    <div class="section__container">
      <h2>Information about the Recipients</h2>
      <p>You can manually add the agencies or you can upload a CSV.</p>
      <div class="upload__container">
        <label for="csv_upload">Upload a CSV file</label>
        <input
          type="file"
          id="csv_upload"
          accept=".csv"
          on:change={handleUpload} />
        <div class="upload__info">
        {#if uploadData !== undefined}
          {#await uploadData}
            <p>Loading</p>
          {:then result}
            <p>Finished</p>
          {:catch error}
            <p>
              Could not process file. Make sure it is a .csv file with the
              correct fields.
            </p>
          {/await}
        {/if}
      </div>
    </div>
    {#each $recipients as _recipient, idx}
      <Recipient {states} {idx} />
    {/each}
  </div>
  <div class="submit__container">
    <div class="submit__item">
      <input
        type="submit"
        name="send"
        id="id_send-requests"
        value="Send Requests" />
    </div>
    <div class="submit__item">
      <input
        type="submit"
        name="save"
        id="id_save-requests"
        value="Save Requests" />
    </div>
  </div>
</div>
</form>