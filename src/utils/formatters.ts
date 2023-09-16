import { AnyMap, StringKeyMap } from '../types'

export function removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '')
}

export function repoPathToComponents(path: string): string[] | null {
    const splitPath = path.split('/')
    return splitPath.length === 2 ? splitPath : null
}

export function toMap(obj): AnyMap {
    const newObj = {}
    for (let key in obj) {
        newObj[key] = obj[key]
    }
    return newObj
}

export const toNamespacedVersion = (nsp: string, name: string, version: string) =>
    `${nsp}.${name}@${version}`

export const unique = (arr: any[]): any[] => Array.from(new Set(arr))

export const capitalize = (val: string): string => {
    const firstLetter = val[0].toUpperCase()
    return `${firstLetter}${val.slice(1)}`
}

export const toNumber = (val: any): number | null => {
    const num = parseInt(val)
    return Number.isNaN(num) ? null : num
}

export const toDate = (val: any): Date | null => {
    const date = new Date(val)
    const invalid = date.toString().toLowerCase() === 'invalid date'
    return invalid ? null : date
}

export const asPostgresUrl = (connParams: StringKeyMap): string => {
    const { user, password, host, port, name } = connParams
    return `postgres://${user}:${password}@${host}:${port}/${name}`
}
