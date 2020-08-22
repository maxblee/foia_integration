<script>
    export let states;
    export let idx = 0;
</script>

    <div class="agency__item field__long">
        <label class="optional__field" for="recipient-name-{idx}">Recipient Name<span></span></label>
        <input type="text" id="recipient-name-{idx}">
    </div>
    <div class="agency__info">
        <div class="agency__item field__long">
            <label class="required__field" for="agency-name-{idx}">Agency Name<span></span></label>
            <input type="text" id="agency-name-{idx}">
        </div>
        <div class="agency__item field__long">
            <label class="required__field" for="agency-email-{idx}">Agency Email<span></span></label>
            <input type="email" id="agency-email-{idx}">
        </div>
        <div class="agency__item">
            <label class="required__field" for="agency-state-{idx}">Agency State<span></span></label>
            <select id="agency-state-{idx}">
                {#each states as state}
                <option value="{state.abbr}">{state.name}</option>
                {/each}
            </select>
        </div>
    </div>
    <div class="agency__address">
        <div class="agency__item field__long">
            <label class="optional__field" for="agency-streetadd-{idx}">Agency Street Address<span></span></label>
            <input id="agency-streetadd-{idx}" type="text">
        </div>
        <div class="agency__item">
            <label class="optional__field field__short" for="agency-zip-{idx}">ZIP Code<span></span></label>
            <input type="text" id="agency-zip-{idx}">
        </div>
        <div class="agency__item field__long">
            <label class="optional__field" for="agency-municipality-{idx}">Municipality<span></span></label>
            <input type="text" id="agency-municipality-{idx}">
        </div>
        <div class="agency__item">
            <label class="optional__field" for="agency-county-{idx}">County<span></span></label>
            <input type="text" id="agency-county-{idx}">
        </div> 
    </div>

<style>

.agency__info, .agency__address {
    display: flex;
    justify-content: space-between;
}

.agency__item {
    padding: 2px;
}

.agency__item > label {
    padding: 2px;
}

.required__field {
    font-weight: bold;
}
.required__field > span {
    color: red;
}
.required__field > span::after {
    content: " (Required)";
}
.optional__field > span {
	color: rgb(103,103,103);
}
.optional__field > span::after {
	content: " (Optional)";
}

input[type=text], input[type=email] {
    border: 2px solid #C27400;
    border-radius: 4px;
}
</style>