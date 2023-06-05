export const toDate = (val: any): Date | null => {
    const date = new Date(val)
    const invalid = date.toString().toLowerCase() === 'invalid date'
    return invalid ? null : date
}

export const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}
