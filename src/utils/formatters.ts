import { AnyMap } from '../types'

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
