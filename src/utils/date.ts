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

export const formatDate = (date: Date): string => {
    let month = (date.getUTCMonth() + 1).toString()
    let day = date.getUTCDate().toString()
    const year = date.getUTCFullYear()
    if (month.length === 1) {
        month = '0' + month
    }
    if (day.length === 1) {
        day = '0' + day
    }
    return [month, day, year].join('/')
}
