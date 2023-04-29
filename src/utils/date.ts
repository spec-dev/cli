export const addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date)
    newDate.setDate(date.getUTCDate() + days)
    return newDate
}

export const subtractDays = (date: Date, days: number): Date => {
    const newDate = new Date(date)
    newDate.setDate(date.getUTCDate() - days)
    return newDate
}
