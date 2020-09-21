<script>
  import { recipients, start, sources, errors } from './store.js'

  export let idx = 0
  export let fieldKey = 'recipientFirstName'
  export let fieldType = 'text'
  export let options = []
  export let required = false
  let autocompleteSelected
  let agencies = []
  // just show top 5 agencies
  $: isAgencyField = fieldKey.startsWith('agency') || fieldKey === 'foiaEmail'
  $: firstAgencies = agencies.slice(0, 5)

  $: idField = `id_${fieldKey}-${idx}`
  $: autocompleteField = `autocomplete_${fieldKey}-${idx}`
  $: nameField = `${fieldKey}-${idx}`
  $: fieldVal = $recipients[idx][fieldKey].value
  $: selectVal =
    fieldType === 'select' && options.length > 0 && fieldVal === ''
      ? options[0].abbr
      : fieldVal
  $: errorInfo = $errors.recipientErrors[idx][fieldKey]

  async function updateAndQuery(event) {
    updateStore(event)
    if (isAgencyField) {
      let agencyUrl = '/api/current-user/autocomplete/agencies'
      const agencyResults = await fetch(
        `${agencyUrl}?field=${fieldKey}&q=${event.target.value}`
      )
        .then((response) => response.json())
        .then((data) => data.results)
        .catch((err) => {
          console.error(err)
        })
      agencies = event.target.value === '' ? [] : agencyResults
    }
  }

  function updateStore(event) {
    const newVal = event.target.value
    recipients.changeItem($recipients, idx, fieldKey, newVal)
  }

  async function autocompleteKeydown(event) {
    switch (event.code) {
      case 'ArrowDown':
        if (autocompleteSelected === undefined) {
          autocompleteSelected = 0
        } else if (autocompleteSelected < firstAgencies.length - 1) {
          autocompleteSelected += 1
        } else {
          autocompleteSelected = undefined
        }
        break
      case 'ArrowUp':
        if (autocompleteSelected === undefined) {
          autocompleteSelected = firstAgencies.length - 1
        } else if (autocompleteSelected === 0) {
          autocompleteSelected = undefined
        } else {
          autocompleteSelected -= 1
        }
        break
      case 'Enter':
        // ordinarily this is a bad idea https://www.tjvantoll.com/2013/01/01/enter-should-submit-forms-stop-messing-with-that/
        // but here it's necessary to allow predictable keyboard use of the autocomplete
        event.preventDefault()
        if (autocompleteSelected !== undefined) {
          updateData()
        }
        break
    }
  }

  async function autocompleteClick(event) {
    autocompleteSelected = parseInt(event.target.id.match(/[0-9]$/g))
    updateData()
  }

  async function updateData() {
    if (isAgencyField) updateRecipient()
    else updateSource()
  }

  async function updateRecipient() {
    const selectedItem = firstAgencies[autocompleteSelected]
    for (let inputField of Object.keys(selectedItem)) {
      recipients.changeItem(
        $recipients,
        idx,
        inputField,
        selectedItem[inputField]
      )
    }
    const praEmail = $recipients[idx].foiaEmail.value
    const agencySources = await fetch(
      `/api/current-user/autocomplete/sources?agency=${praEmail}`
    )
      .then((response) => response.json())
      .then((data) => data.results)
      .catch((err) => {
        console.error(err)
      })
    sources.newSources(idx, agencySources)
    agencies = []
    autocompleteSelected = undefined
  }

  function updateSource() {
    const selectedItem = $sources[idx][autocompleteSelected]
    recipients.changeItem(
      $recipients,
      idx,
      'recipientFirstName',
      selectedItem.firstName
    )
    recipients.changeItem(
      $recipients,
      idx,
      'recipientLastName',
      selectedItem.lastName
    )
    // reset source list
    sources.newSources(idx, [])
    autocompleteSelected = undefined
  }
</script>

<style>
  .form__field {
    width: 33%;
  }

  input,
  select {
    width: 95%;
    margin-top: 5px;
    border: 1px solid rgb(217, 217, 217);
    padding: 5px;
    font-size: 1rem;
  }

  select {
    background-image: url('../images/down-arrow.svg');
    background-repeat: no-repeat;
    background-position: 100% 50%;
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
  }

  input:focus,
  select:focus {
    background-color: rgb(217, 217, 217);
    border-color: #ce6969;
  }

  label {
    display: block;
    padding-top: 6px;
  }

  .recipient__error {
    font-size: 1.2rem;
    text-align: left;
  }

  :global(span.optional) {
    color: rgb(103, 103, 103);
    font-weight: normal;
  }

  :global(span.required) {
    color: #ce6969;
  }

  :global(span.optional::after) {
    content: ' (Optional)';
  }

  :global(span.required::after) {
    content: ' (Required)';
  }

  .selected,
  .autocomplete__item:hover,
  .autocomplete__item:focus {
    background-color: rgb(187, 187, 187);
  }

  .autocomplete__item:hover,
  .autocomplete__item:focus {
    cursor: pointer;
  }

  .autocomplete__results {
    width: 95%;
    padding: 5px;
    border: 1px solid rgb(187, 187, 187);
  }
</style>

<div class="form__field">
  <label for={idField}>
    {start[fieldKey].text}
    <span class:optional={!required} class:required />
    {#if errorInfo}
      <div class="recipient__errors">
        {#each errorInfo as err}
          <div class="recipient__error form__error__item">{err}</div>
        {/each}
      </div>
    {/if}
  </label>
  {#if fieldType === 'select'}
    <select
      on:blur={updateStore}
      id={idField}
      name={nameField}
      value={selectVal}>
      {#each options as option}
        <option value={option.abbr}>{option.name}</option>
      {/each}
    </select>
  {:else}
    <div class="text__container">
      {#if firstAgencies.length > 0}
        <div class="sr-only" role="status" aria-live="polite">
          There are {firstAgencies.length} matching agencies. Use the arrow keys
          to browse.
        </div>
      {/if}
      {#if isAgencyField}
        <input
          on:keydown={autocompleteKeydown}
          on:input={updateAndQuery}
          id={idField}
          name={nameField}
          value={fieldVal}
          autocomplete="off"
          aria-autocomplete="list" />
        {#if firstAgencies.length > 0}
          <div class="autocomplete__results">
            <div class="autocomplete__list" role="listbox" tabindex="-1">
              {#each firstAgencies as agency, i}
                {#if autocompleteSelected === i}
                  <div
                    on:click={autocompleteClick}
                    class="autocomplete__item selected"
                    aria-selected="true"
                    id={`${autocompleteField}-${i}`}
                    role="option"
                    tabindex="-1">
                    {agency['agencyName']}
                  </div>
                {:else}
                  <div
                    on:click={autocompleteClick}
                    class="autocomplete__item"
                    id={`${autocompleteField}-${i}`}
                    role="option"
                    tabindex="-1">
                    {agency['agencyName']}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <input
          on:keydown={autocompleteKeydown}
          on:input={updateAndQuery}
          id={idField}
          name={nameField}
          value={fieldVal}
          autocomplete="off"
          aria-autocomplete="list" />
        {#if $sources[idx].length > 0}
          <div class="autocomplete__results">
            <div class="autocomplete__list" role="listbox" tabindex="-1">
              {#each $sources[idx] as source, i}
                {#if autocompleteSelected === i}
                  <div
                    on:click={autocompleteClick}
                    class="autocomplete__item selected"
                    aria-selected="true"
                    id={`${autocompleteField}-${i}`}
                    role="option"
                    tabindex="-1">
                    {source['name']}
                  </div>
                {:else}
                  <div
                    on:click={autocompleteClick}
                    class="autocomplete__item"
                    id={`${autocompleteField}-${i}`}
                    role="option"
                    tabindex="-1">
                    {source['name']}
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>
