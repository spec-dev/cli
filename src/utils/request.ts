import fetch from 'node-fetch'
import { SpecApiResponse, StringKeyMap, StringMap } from '../types'

export async function get(
    url: string,
    args: StringKeyMap,
    headers?: StringMap,
    returnRawResponse?: boolean
): Promise<SpecApiResponse> {
    const params = new URLSearchParams()
    for (let key in args) {
        params.append(key, args[key])
    }

    let resp, err
    try {
        resp = await fetch(`${url}?${params.toString()}`, { headers })
    } catch (err) {
        err = err
    }
    if (err) return { error: err }

    if (returnRawResponse) {
        return { data: resp }
    }

    const { data, error } = await parseJSONResp(resp)
    if (error) return { error }

    return {
        data,
        headers: resp.headers,
    }
}

export async function post(
    url: string,
    payload: StringKeyMap,
    headers?: StringMap
): Promise<SpecApiResponse> {
    let resp, err
    try {
        resp = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
                ...(headers || {}),
            },
        })
    } catch (err) {
        err = err
    }
    if (err) return { error: err }

    const { data, error } = await parseJSONResp(resp)
    if (error) return { error }

    return {
        data,
        headers: resp.headers,
    }
}

async function parseJSONResp(resp: Response): Promise<SpecApiResponse> {
    let data: StringKeyMap = {}
    try {
        data = await resp.json()
    } catch (err) {
        return { error: `Error parsing JSON response: ${err}.` }
    }
    if (data.error) {
        return { error: data.error }
    }
    if (resp.status !== 200) {
        return { error: `Request failed with status ${resp.status}.` }
    }
    return { data }
}
