<script>
    import { recipients, start } from "./store.js";

    export let idx = 0;
    export let fieldKey = "recipientName";
    export let fieldType = "text";
    export let options = [];
    export let required = false;

    $: idField = `id_${fieldKey}-${idx}`;
    $: nameField = `${fieldKey}-${idx}`;
    $: fieldVal = $recipients[idx][fieldKey].value;
    $: selectVal = (fieldType === "select" && options.length > 0 && fieldVal === "") ? options[0].abbr : fieldVal;

    function updateStore(event) {
        const newVal = event.target.value;
        recipients.changeItem($recipients, idx, fieldKey, newVal);
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
    <input on:input="{updateStore}" type="{fieldType}" id="{idField}" name="{nameField}" value={fieldVal}>
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
        background-image: url("./down-arrow.svg");
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
</style>