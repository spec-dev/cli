import netrc from 'netrc'
import { StringKeyMap } from '../types'
import { buildUrl } from '../api/routes'

export function persistSession(email: string, token: string): StringKeyMap {
    let error = null
    try {
        const entries = netrc()
        entries[getNetrcEntryId()] = {
            login: email,
            password: token,
        }
        netrc.save(entries)
    } catch (err) {
        error = err?.message || err
    }
    return { error }
}

export function deleteSession(): StringKeyMap {
    let error = null
    try {
        const entries = netrc()
        delete entries[getNetrcEntryId()]
        netrc.save(entries)
    } catch (err) {
        error = err?.message || err
    }
    return { error }
}

export function getSessionToken(): StringKeyMap {
    let token = null
    let error = null
    try {
        const entries = netrc()
        token = (entries[getNetrcEntryId()] || {}).password || null
    } catch (err) {
        error = err?.message || err
    }
    return { token, error }
}

export function getSessionLogin(): StringKeyMap {
    let login = null
    let error = null
    try {
        const entries = netrc()
        login = (entries[getNetrcEntryId()] || {}).login || null
    } catch (err) {
        error = err?.message || err
    }
    return { login, error }
}

export function getNetrcEntryId(): string {
    const url = new URL(buildUrl(''))
    return url.hostname
}
