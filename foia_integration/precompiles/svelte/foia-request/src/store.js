import { writable, derived } from 'svelte/store'

const init = {
  recipientFirstName: { text: 'Recipient First Name', value: '' },
  recipientLastName: { text: 'Recipient Last Name', value: '' },
  agencyName: { text: 'Agency Name', value: '' },
  foiaEmail: { text: 'Public Records Email', value: '' },
  // the us is the first option in the select, so this allows ppl to not actively select us
  agencyState: { text: 'Agency State', value: 'US' },
  agencyStreetAddress: { text: 'Agency Street Address', value: '' },
  agencyMunicipality: { text: 'Agency Municipality', value: '' },
  agencyZip: { text: 'Agency ZIP Code', value: '' },
}
Object.freeze(init)

const errorInit = {
  requestErrors: {},
  recipientErrors: [{}]
}

function createSources() {
  const { subscribe, update } = writable([[]])
  const addItem = () => update((n) => [...n, []])
  const deleteItem = (idx) => {
    return update((n) => [...n.slice(0, idx), ...n.slice(idx + 1, n.length)])
  }
  const newSources = (idx, sources) => {
    return update((n) => {
      n[idx] = sources
      return n
    })
  }
  return {
    subscribe,
    addItem,
    deleteItem,
    newSources,
  }
}

function createErrorDict() {
  const { subscribe, update } = writable(Object.assign({}, errorInit))
  const addItem = () => update((n) => {
    return {
      requestErrors: n.requestErrors,
      recipientErrors: [...n.recipientErrors, {}]
    }
  })
  const deleteItem = (idx) => update((n) => {
    const recip = n.recipientErrors
    return {
      requestErrors: n.requestErrors,
      recipientErrors: [...recip.slice(0, idx), ...recip.slice(idx + 1, recip.length)]
    }
  })
  const changeAll = (errorData) => update(() => errorData)
  return {
    subscribe,
    addItem,
    deleteItem,
    changeAll
  }
}

function createRecipients() {
  const { subscribe, update } = writable([Object.assign({}, init)])
  const addItem = () => update((n) => [...n, Object.assign({}, init)])
  const deleteItem = (idx) =>
    update((n) => [...n.slice(0, idx), ...n.slice(idx + 1, n.length)])
  const changeItem = (current, idx, fieldKey, newVal) => {
    let morphedItems = current.map((d, i) => {
      if (i === idx) {
        // create new object so it doesn't alter existing data
        let obj = {}
        for (const key of Object.keys(init)) {
          obj[key] = Object.create(d[key])
          if (key === fieldKey) {
            obj[key].value = newVal
          }
        }
        return obj
      } else return d
    })
    return update(() => morphedItems)
  }

  return {
    subscribe,
    addItem,
    deleteItem,
    changeItem,
  }
}

export const recipients = createRecipients()
export const start = init
export const count = derived(recipients, ($recipients) => $recipients.length)
export const sources = createSources()
export const errors = createErrorDict()
export const request = writable({
  subject: { text: 'subject', value: '' },
  requestedRecords: { text: 'Requested Records', value: '' },
  expeditedProcessing: {
    text: 'Expedited Processing Justification',
    value: '',
  },
  feeWaiver: { text: 'Fee Waiver Justification', value: '' },
})
