import { StringKeyMap } from '../types'
import {
    upsertReadme,
    upsertGitignore,
    upsertVsCodeSettings,
    upsertDenoConfig,
    upsertDenoImports,
    upsertLiveObject,
} from './liveObjectTemplate'

export function createLiveObjectTemplate(
    namespace: string,
    name: string,
    chains: string[],
    displayName?: string,
    description?: string,
    inputEvents?: string[],
    inputCalls?: string[]
): StringKeyMap {
    const cwd = process.cwd()
    upsertReadme(cwd)
    upsertGitignore(cwd)
    upsertVsCodeSettings(cwd)
    upsertDenoConfig(cwd)
    upsertDenoImports(cwd)
    return upsertLiveObject(
        cwd,
        namespace,
        name,
        chains,
        displayName,
        description,
        inputEvents,
        inputCalls
    )
}
