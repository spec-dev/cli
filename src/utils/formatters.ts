import { AnyMap, StringKeyMap } from '../types'
import humps from 'humps'
import constants from '../constants'

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

export const camelToSnake = (val: string): string => {
    return humps.decamelize(removeAcronymFromCamel(val))
}

export const removeAcronymFromCamel = (val: string): string => {
    val = val || ''

    let formattedVal = ''
    for (let i = 0; i < val.length; i++) {
        const [prevChar, char, nextChar] = [val[i - 1], val[i], val[i + 1]]
        const [prevCharIsUpperCase, charIsUpperCase, nextCharIsUpperCase] = [
            prevChar && prevChar === prevChar.toUpperCase(),
            char && char === char.toUpperCase(),
            nextChar && nextChar === nextChar.toUpperCase(),
        ]

        if (
            prevCharIsUpperCase &&
            charIsUpperCase &&
            (nextCharIsUpperCase || i === val.length - 1)
        ) {
            formattedVal += char.toLowerCase()
        } else {
            formattedVal += char
        }
    }

    return formattedVal
}

export const fromNamespacedVersion = (
    namespacedVersion: string
): {
    nsp: string
    name: string
    version: string
} => {
    const atSplit = (namespacedVersion || '').split('@')
    if (atSplit.length !== 2) {
        return { nsp: '', name: '', version: '' }
    }

    const [nspName, version] = atSplit
    const dotSplit = (nspName || '').split('.')
    if (dotSplit.length < 2) {
        return { nsp: '', name: '', version: '' }
    }

    const name = dotSplit.pop()
    const nsp = dotSplit.join('.')

    return { nsp, name, version }
}

export const toNamespaceSlug = (value: string): string => {
    return value
        .replace(/[']/g, '')
        .replace(/[^A-Za-z0-9-_.]/g, '-')
        .toLowerCase()
}

export const toSpecNamespaceUrl = (nsp: string) => [constants.SPEC_ORIGIN, nsp].join('/')

export const toLiveTableUrl = (nsp: string, uid: string): string =>
    `https://spec.dev/${nsp}/live-table/${uid}`

export const toContractGroupsUrl = (nsp: string): string =>
    `https://spec.dev/${nsp}/contract-groups`
