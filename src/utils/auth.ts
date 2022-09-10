import netrc from 'netrc'
import constants from '../constants'
import { StringKeyMap } from '../types'

export function persistSession(email: string, token: string): StringKeyMap {
    let error = null
    try {
        const entries = netrc()
        entries[constants.SPEC_NETRC_ENTRY] = {
            login: email,
            password: token,
        }
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
        token = (entries[constants.SPEC_NETRC_ENTRY] || {}).password || null
    } catch (err) {
        error = err?.message || err
    }
    return { token, error }
}