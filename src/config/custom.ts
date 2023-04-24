import constants from '../constants'
import path from 'path'
import { execSync } from 'node:child_process'
import { fileExists } from '../utils/file'
import { log } from '../logger'
import { StringKeyMap } from '../types'

export function installCustomPackages(): StringKeyMap {
    let error = null

    // Install custom event handlers.
    if (fileExists(constants.SPEC_HANDLERS_DIR)) {
        log(`Installing custom handlers...`)
        error = npmInstall(path.join(constants.SPEC_CONFIG_DIR_NAME, constants.HANDLERS_DIR_NAME))
    }
    if (error) return { error }

    // Install custom hooks.
    if (fileExists(constants.SPEC_HOOKS_DIR)) {
        log(`Installing custom hooks...`)
        error = npmInstall(path.join(constants.SPEC_CONFIG_DIR_NAME, constants.HOOKS_DIR_NAME))
    }

    return { error }
}

export function npmInstall(pkg: string): string | null {
    let error = null
    try {
        execSync(`npm install ${pkg}`)
    } catch (err) {
        error = `Error installing ${pkg}: ${JSON.stringify(err)}`
    }
    return error
}
