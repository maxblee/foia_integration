<script>
import { each } from "svelte/internal";
    import { recipients, start } from "./store.js";

    export let idx = 0;
    export let fieldKey = "recipientName";
    export let fieldType = "text";
    export let options = [];
    export let required = false;
    let autocompleteSelected;
    let agencies = [];
    // just show top 5 agencies
    $: firstAgencies = agencies.slice(0, 5);

    $: idField = `id_${fieldKey}-${idx}`;
    $: autocompleteField = `autocomplete_${fieldKey}-${idx}`;
    $: nameField = `${fieldKey}-${idx}`;
    $: fieldVal = $recipients[idx][fieldKey].value;
    $: selectVal = (fieldType === "select" && options.length > 0 && fieldVal === "") ? options[0].abbr : fieldVal;

    async function updateAndQuery(event) {
        updateStore(event);
        let agencyUrl;
        if (fieldKey.startsWith("agency") || fieldKey === "foiaEmail") {
            agencyUrl = "/api/current-user/autocomplete/agencies";
        } else {

        }
        const agencyResults = await fetch(`${agencyUrl}?field=${fieldKey}&q=${event.target.value}`)
            .then(response => response.json())
            .then(data => data.results)
            .catch((err) => {console.error(err);});
        agencies = event.target.value === "" ? [] : agencyResults;
    }

    function updateStore(event) {
        const newVal = event.target.value;
        recipients.changeItem($recipients, idx, fieldKey, newVal);
    }

    function autocompleteKeydown(event) {
        switch(event.key) {
            case "ArrowDown":
                if (autocompleteSelected === undefined) {
                    autocompleteSelected = 0;
                } else if (autocompleteSelected < firstAgencies.length - 1) {
                    autocompleteSelected += 1;
                } else {
                    autocompleteSelected = undefined;
                }
                break;
            case "ArrowUp":
                if (autocompleteSelected === undefined) {
                    autocompleteSelected = firstAgencies.length - 1;
                } else if (autocompleteSelected === 0) {
                    autocompleteSelected = undefined;
                } else {
                    autocompleteSelected -= 1;
                }
                break;
            case "Enter":
                if (autocompleteSelected !== undefined) {
                    updateData();
                }
                break;
        }
    }

    function autocompleteClick(event) {
        autocompleteSelected = parseInt(event.target.id.match(/[0-9]$/g));
        updateData();
    }

    function updateData() {
        const selectedItem = firstAgencies[autocompleteSelected];
        for (let inputField of Object.keys(selectedItem)) {
            document.getElementById(`id_${inputField}-${idx}`).value = selectedItem[inputField];
        }
        agencies = [];
        autocompleteSelected = undefined;
    }
</script>

<div class="form__field">
    <label for="{idField}">{start[fieldKey].text}<span class:optional={!required} class:required={required}></span></label>
    {#if fieldType === "select"}
    <select on:blur="{updateStore}" id="{idField}" name="{nameField}" value={selectVal}>
        {#each options as option}
        <option value="{option.abbr}">{option.name}</option>
        {/each}
    </select>
    {:else}
    <div class="text__container">
        {#if firstAgencies.length > 0}
        <div class="sr-only" role="status" aria-live="polite">
            There are {firstAgencies.length} matching agencies. Use the arrow keys to browse.
        </div>
        {/if}
        <input on:keydown="{autocompleteKeydown}" on:input="{updateAndQuery}" list="{autocompleteField}" id="{idField}" name="{nameField}" value={fieldVal} autocomplete="off" aria-autocomplete="list">
        <div class="autocomplete__results">
            <div class="autocomplete__list" role="listbox" tabindex="0">
                {#each firstAgencies as agency, i}
                {#if autocompleteSelected === i}
                <div on:click="{autocompleteClick}" class="autocomplete__item selected" aria-selected="true" id="{`${autocompleteField}-${i}`}" role="option" tabindex="-1">{agency["agencyName"]}</div>
                {:else}
                <div on:click="{autocompleteClick}" class="autocomplete__item" id="{`${autocompleteField}-${i}`}" role="option" tabindex="-1">{agency["agencyName"]}</div>
                {/if}
                {/each}
            </div>
        </div>
    </div>
    {/if}
</div>

<style>
    .form__field {
        width: 33%;
    }

    input, select {
        width: 95%;
        margin-top: 5px;
        border-radius: 7px;
    }

    select {
        background-image: url("../images/down-arrow.svg");
        background-repeat: no-repeat;
        background-position: 100% 50%;
        appearance: none;
        -moz-appearance: none;
        -webkit-appearance: none;
    }

    input:focus, select:focus {
        background-color: rgb(217,217,217);
        border-color: #CE6969;
    } 

    label {
        font-weight: bold;
    }

    :global(span.optional) {
        color: rgb(103,103,103);
        font-weight: normal;
    }

    :global(span.required) {
        color: #CE6969;
    }

    :global(span.optional::after) {
        content: " (Optional)";
    }

    :global(span.required::after) {
        content: " (Required)";
    }

    .selected, .autocomplete__item:hover, .autocomplete__item:focus {
        background-color: rgb(187,187,187);
    }

    .autocomplete__item:hover, .autocomplete__item:focus {
        cursor: pointer;
    }
</style>