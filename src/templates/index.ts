import { StringKeyMap } from '../types'
import {
    upsertReadme,
    upsertGitignore,
    upsertVsCodeSettings,
    upsertDenoConfig,
    upsertDenoImports,
    upsertLiveObject,
} from './liveObjectTemplate'
import { upsertPostgraphilerc } from './postgraphilercTemplate'

export function createLiveObjectTemplate(
    namespace: string,
    name: string,
    displayName?: string,
    description?: string
): StringKeyMap {
    const cwd = process.cwd()
    upsertReadme(cwd)
    upsertGitignore(cwd)
    upsertVsCodeSettings(cwd)
    upsertDenoConfig(cwd)
    upsertDenoImports(cwd)
    return upsertLiveObject(cwd, namespace, name, displayName, description)
}

export function createPostgraphileTemplate(specProjectConfigDir: string) {
    return upsertPostgraphilerc(specProjectConfigDir)
}
