<script>

    import {request} from "./store.js";

    function adjustHeight(event) {
		const elem = event.target;
		// change the height of element if it overflows
		if (elem.clientHeight < elem.scrollHeight) {
			elem.style.height = elem.scrollHeight + 20 + "px";
		} 
    }
    
    function handleInput(event, field) {
        request.update(n => {
            n[field].value = event.target.value;
            return n;
        });
    }

    function textAreaInput(event, field) {
        handleInput(event, field);
        adjustHeight(event);
    }

</script>

<div id="request" class="request__container">
	<div class="subject__line">
        <label for="id_subject-line">Subject<span class="required"></span></label>
        <input on:input={(e) => handleInput(e, 'subject')} type="text" id="id_subject" name="subject">
    </div>
    <div class="records">
        <label for="id_requestedRecords">Records Sought<span class="required"></span></label>
        <textarea on:input={(e) => textAreaInput(e, 'requestedRecords')} id="id_requestedRecords" name="requestedRecords"></textarea>
    </div>
    <div class="fee-waiver">
        <label for="id_feeWaiver">Fee Waiver Justification<span class="optional"></span></label>
        <textarea on:input={(e) => textAreaInput(e, 'feeWaiver')} id="id_feeWaiver" name="feeWaiver"></textarea>
    </div>
    <div class="expedited-processing">
        <label for="id_expeditedProcessing">Justification for Expedited Processing<span class="optional"></span></label>
        <textarea on:input={(e) => textAreaInput(e, 'expeditedProcessing')} id="id_expeditedProcessing" name="expeditedProcessing"></textarea>
    </div>
</div>

<style>
    .request__container {
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        border: 1px dashed rgb(207,207,207);
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
        text-align: left;
        font-size: 1.2rem;
    }

    input:focus, textarea:focus {
        background-color: rgb(217,217,217);
        border: 1px solid #CE6969;
    }

    label {
        color: black;
        margin-bottom: 2px;
        font-size: 1.2rem;
        display: block;
        padding-top: 6px;
    }

    span.optional {
        color: rgb(103,103,103);
        font-weight: normal;
    }

    input {
        width: 50%;
    }
</style>