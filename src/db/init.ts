import fetch from 'cross-fetch'
import constants from '../constants'
import { tmpdir, createFileWithContents } from '../utils/file'
import path from 'path'
import { StringKeyMap } from '../types'

export async function fetchDbInitFile(): Promise<StringKeyMap> {
    // Fetch remote db init file.
    let resp
    try {
        resp = await fetch(constants.DB_INIT_PATH)
    } catch (error) {
        return { error }
    }
    if (resp?.status !== 200) {
        return { error: `Failed to fetch db init file. Got status ${resp?.status}` }
    }

    // Parse contents.
    let body
    try {
        body = await resp.text()
    } catch (err) {
        return { error: err }
    }
    if (!body) {
        return { error: `Failed to fetch db init file. Got empty response.` }
    }

    // Save to tmp directory.
    const tmpPath = path.join(tmpdir(), constants.DB_INIT_TMP_FILE_NAME)
    try {
        createFileWithContents(tmpPath, body)
    } catch (err) {
        return { error: `Failed to save db init file to tmp directory: ${err}` }
    }

    return { data: tmpPath }
}
