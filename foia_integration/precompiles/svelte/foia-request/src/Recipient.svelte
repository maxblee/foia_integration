<script>
    import { recipients, count } from "./store.js";
    import RecipientField from "./RecipientField.svelte";
    
    export let states = [];
    export let idx = 0;
</script>

<div class="recipient__item">
    <div class="recipient__person">
        <RecipientField idx="{idx}" fieldKey="recipientName" />
    </div>
    <div class="agency__general">
        <RecipientField idx="{idx}" fieldKey="agencyName" />
        <RecipientField idx="{idx}" fieldKey="foiaEmail" fieldType="email" required={true}/>
        <RecipientField idx="{idx}" fieldKey="agencyState" fieldType="select" required={true} options={states} />
    </div>
    <div class="agency__street">
        <RecipientField idx="{idx}" fieldKey="agencySteetAddress" />
        <RecipientField idx="{idx}" fieldKey="agencyZip" />
        <RecipientField idx="{idx}" fieldKey="agencyMunicipality" />
    </div>
    <div class="new__items">
        <div class="add__item">
            {#if idx === $count - 1 }
            <button  id="add-{idx}" on:click="{recipients.addItem}">
                <svg role="img" width="25px" viewBox="0 0 20 20" fill="currentColor" class="plus w-6 h-6"><title>Add New Item</title><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
            </button>
            {/if}
        </div>
        <div class="delete__item">
            {#if $count > 1}
            <button id="delete-{idx}" on:click="{recipients.deleteItem(idx)}">
                <svg role="img" width="25px" viewBox="0 0 20 20" fill="currentColor" class="x w-6 h-6"><title>Delete This Item</title><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
            {/if}
        </div>
    </div>
</div>

<style>
    .recipient__item {
        border: 1px dashed rgb(207,207,207);
        border-radius: 5px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
        background-color: rgba(255,202,122,1);
        color: black;
    }

    .agency__general, .agency__street {
        display: flex;
    }

    .new__items {
        display: flex;
        justify-content: space-between;
    }

    button {
        border-radius: 25px;
        border: 2px solid black;
        cursor: pointer;
        background-color: rgba(255,202,122,1);
    }

    button:hover, button:focus {
        background-color: #C27400;
        color: white;
        border-color: transparent   ;
    }
</style>