import { writable, derived } from "svelte/store";

const init = {
    "recipientName": {text: "Recipient Name", value:""},
    "agencyName": {text: "Agency Name", value: ""},
    "foiaEmail": {text: "Public Records Email", value: ""},
    "agencyState": {text: "Agency State", value: ""},
    "agencySteetAddress": {text: "Agency Street Address", value: ""},
    "agencyMunicipality": {text: "Agency Municipality", value: ""},
    "agencyZip": {text: "Agency ZIP Code", value: ""}
};
Object.freeze(init);

function createRecipients() {
    

    const {subscribe, set, update} = writable([Object.assign({}, init)]);
    const addItem = () => update(n => [...n, Object.assign({}, init)]);
    const deleteItem = (idx) => update(n => [...n.slice(0,idx), ...n.slice(idx+1,n.length)]);
    const changeItem = (current, idx, fieldKey, newVal) => {
        let morphedItems = current.map((d, i) => {
            if (i === idx) {
                // create new object so it doesn't alter existing data
                let obj = {};
                for (const key of Object.keys(init)) {
                    obj[key] = Object.create(d[key]);
                    if (key === fieldKey) {
                        obj[key].value = newVal;
                    }
                }
                return obj;
            } else return d;
        });
        return update(_ => morphedItems);
    }

    return {
        subscribe,
        addItem,
        deleteItem,
        changeItem
    };
}

export const recipients = createRecipients();
export const start = init;
export const count = derived(recipients, $recipients => $recipients.length);