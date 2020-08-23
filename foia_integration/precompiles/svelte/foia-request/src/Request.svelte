<script>

    let subject = "";
    let requestedRecords = "";
    let expeditedProcessing = "";
    let feeWaiver = "";

    function adjustHeight(event) {
		const elem = event.target;
		// change the height of element if it overflows
		if (elem.clientHeight < elem.scrollHeight) {
			elem.style.height = elem.scrollHeight + 20 + "px";
		} 
	}

</script>

<div class="request__container">
	<div class="subject__line">
        <label for="id_subject-line">Subject<span class="required"></span></label>
        <input bind:value="{subject}" type="text" id="id_subject" name="subject">
    </div>
    <div class="records">
        <label for="id_requestedRecords">Records Sought<span class="required"></span></label>
        <textarea on:input="{adjustHeight}" bind:value="{requestedRecords}" id="id_requestedRecords" name="requestedRecords"></textarea>
    </div>
    <div class="fee-waiver">
        <label for="id_feeWaiver">Fee Waiver Justification<span class="optional"></span></label>
        <textarea on:input="{adjustHeight}" bind:value="{feeWaiver}" id="id_feeWaiver" name="feeWaiver"></textarea>
    </div>
    <div class="expedited-processing">
        <label for="id_expeditedProcessing">Justification for Expedited Processing<span class="optional"></span></label>
        <textarea on:input="{adjustHeight}" bind:value="{expeditedProcessing}" id="id_expeditedProcessing" name="expeditedProcessing"></textarea>
    </div>
</div>

<style>
    .request__container {
        padding: 10px;
        margin-bottom: 10px;
        background-color: #CFC9D4;
        border-radius: 5px;
    }

    textarea {
        resize: none;
        overflow: hidden;
        box-sizing: border-box;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        width: 80%;
    }

    input, textarea {
        border-radius: 5px;
        text-align: left;
        font-size: 1.2rem;
    }

    input:focus, textarea:focus {
        border-color: #9900ff;
        background-color: rgb(217,217,217);
    }

    label {
        color: black;
        font-weight: bold;
        margin-bottom: 2px;
        font-size: 1.2rem;
    }

    span.optional {
        color: rgb(103,103,103);
        font-weight: normal;
    }

    input {
        width: 50%;
    }
</style>