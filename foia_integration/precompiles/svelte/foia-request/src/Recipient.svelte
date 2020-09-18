<script>
  import { recipients, count, request, sources, errors } from './store.js'
  import RecipientField from './RecipientField.svelte'

  export let idx = 0

  let toggleDisplay = false

  let startUrl = '/api/current-user/'
  export let states

  let templateJson
  $: currentRecipient = $recipients[idx]
  $: templateInfo = getTemplateInfo(currentRecipient, $request)
  $: currentTemplate = templateJson === undefined ? "" : fillTemplate(templateInfo, templateJson)
  // tie this variable to the *value* of the state to avoid unnecessary XHR requests
  $: selectedState = currentRecipient.agencyState.value
  $: if (toggleDisplay) {
    previewSubmission(selectedState || "US")
  }

  function getTemplateInfo(recipientItem, requestItem) {
    let templateData = {}
    for (const field of Object.keys(recipientItem)) {
      templateData[field] = recipientItem[field].value
    }
    for (const field of Object.keys(requestItem)) {
      templateData[field] = requestItem[field].value
    }
    const recipientName = `${templateData['recipientFirstName']} ${templateData['recipientLastName']}`
    templateData['recipientName'] =
      recipientName.trim() === ''
        ? 'Public Records Officer'
        : recipientName.trim()
    return templateData
  }

  function fillTemplate(jsonData, templateData) {
    let lastIdx = 0
    let templateText = ''
    for (let tag of templateData.template) {
      templateText += templateData.boilerplate.slice(lastIdx, tag.position)
      const jsonItem = jsonData[tag.field]
      templateText +=
        jsonItem === undefined ? templateData[tag.field] : jsonItem
      lastIdx = tag.position
    }
    templateText += templateData.boilerplate.slice(
      lastIdx,
      templateData.boilerplate.length
    )
    return templateText
  }

  async function previewSubmission(submissionState) {
    const templateURL = startUrl + 'template/' + submissionState
    const resp = await fetch(templateURL)
      .then((response) => response.json())
      .catch((err) => {
        console.error(err)
      })
    templateJson = resp
  }

  async function togglePreview(event) {
    toggleDisplay = !toggleDisplay
    // if (toggleDisplay) {
    //   previewSubmission(event)
    // }
  }

  function addRecipient() {
    recipients.addItem()
    sources.addItem()
    errors.addItem()
  }

  function deleteRecipient() {
    recipients.deleteItem(idx)
    sources.deleteItem(idx)
    errors.deleteItem(idx)
  }
</script>

<style>
  .recipient__item {
    border: 1px dashed rgb(207, 207, 207);
    border-radius: 5px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    color: black;
  }

  .agency__general,
  .agency__street {
    display: flex;
  }

  .new__items {
    display: flex;
    justify-content: space-between;
  }

  button {
    border-radius: 1px;
    border: none;
    cursor: pointer;
    background-color: rgba(255, 202, 122, 1);
    margin: 10px;
    padding: 1px;
  }

  button:hover,
  button:focus {
    background-color: #c27400;
    color: white;
    border-color: transparent;
  }

  .expand__preview button {
    padding: 5px;
  }

  .template__preview {
    white-space: pre-wrap;
    width: 85%;
    margin: auto;
    padding: 5%;
    padding-top: 5px;
    padding-bottom: 5px;
    border-top: 1px solid black;
  }

  .hidden {
    display: none;
  }
</style>

<div class="recipient__item" id="recipient-{idx}">
  <div class="recipient__person">
    <RecipientField {idx} fieldKey="recipientFirstName" />
    <RecipientField {idx} fieldKey="recipientLastName" />
  </div>
  <div class="agency__general">
    <RecipientField {idx} fieldKey="agencyName" required={true}/>
    <RecipientField
      {idx}
      fieldKey="foiaEmail"
      fieldType="email"
      required={true} />
    {#await states then options}
      <RecipientField
        {idx}
        fieldKey="agencyState"
        fieldType="select"
        required={true}
        {options} />
    {/await}
  </div>
  <div class="agency__street">
    <RecipientField {idx} fieldKey="agencyStreetAddress" />
    <RecipientField {idx} fieldKey="agencyZip" />
    <RecipientField {idx} fieldKey="agencyMunicipality" />
  </div>
  <div class="new__items">
    <div class="add__item">
      {#if idx === $count - 1}
        <button type="button" id="add-{idx}" on:click={addRecipient} aria-label="Add Item">
          <svg
            role="img"
            width="25px"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="plus w-6 h-6"><title>Add New Item</title>
            <path
              fill-rule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clip-rule="evenodd" /></svg>
        </button>
      {/if}
    </div>
    <div class="delete__item">
      {#if $count > 1}
        <button
          type="button"
          id="delete-{idx}"
          on:click={deleteRecipient(idx)}
          aria-label="Delete Item">
          <svg
            role="img"
            width="25px"
            viewBox="0 0 20 20"
            fill="currentColor"
            class="x w-6 h-6"><title>Delete This Item</title>
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd" /></svg>
        </button>
      {/if}
    </div>
  </div>
  <div class="expand__preview">
    {#if !toggleDisplay}
      <button type="button" id="expand-{idx}" on:click={togglePreview}>Preview Request</button>
      <div id="template-{idx}" class="template__preview hidden">
        {currentTemplate}
      </div>
    {:else}
      <button type="button" id="expand-{idx}" on:click={togglePreview}>Hide Preview</button>
      <div id="template-{idx}" class="template__preview">{currentTemplate}</div>
    {/if}
  </div>
</div>
