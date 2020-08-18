import App from './App.svelte';

const app = new App({
	target: document.getElementById("foia-template"),
	props: {
		buttonItems: {
			"requestedRecords": "Requested Records",
			"recipientName": "Recipient Name",
			"praName": "Public Records Act Name",
			"expeditedProcessing": "Expedited Processing Justification",
			"feeWaiver": "Fee Waiver Justification",
			"maxRespTime": "Maximum Response Time",
			"agencyName": "Agency Name",
			"agencyStreetAddress": "Agency Street Address",
			"agencyFullAddress": "Agency Full Address",
			"agencyMunicipality": "Agency Municipality",
			"agencyState": "Agency State",
			"agencyZip": "Agency ZIP Code",
			"subject": "Subject Line",
			"foiaEmail": "Agency Public Records Email Address"
		}
	}
});

export default app;