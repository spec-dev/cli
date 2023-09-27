import { createFileWithContents, fileExists, createDir } from '../utils/file'
import path from 'path'
import { logWarning } from '../logger'
import { StringKeyMap } from '../types'
import { toNamespacedVersion } from '../utils/formatters'

const DEFAULT_VERSION = '0.0.1'

const dirs = {
    VSCODE: '.vscode',
}

const files = {
    GITIGNORE: '.gitignore',
    VSCODE_SETTINGS: 'settings.json',
    DENO_CONFIG: 'deno.json',
    DENO_IMPORTS: 'imports.json',
    README: 'README.md',
    SPEC: 'spec.ts',
    MANIFEST: 'manifest.json',
}

const gitIgnoreContents = `node_modules/
**/node_modules/
*.env
deno.lock`

const vsCodeSettingsContents = `{
    "deno.enable": true,
    "deno.importMap": "./imports.json",
    "editor.defaultFormatter": "denoland.vscode-deno"
}`

const denoConfigContents = `{
    "compilerOptions": {
        "strictPropertyInitialization": false,
        "strict": false
    }
}`

const denoImportsContents = `{
    "imports": {
        "@spec.dev/core": "https://esm.sh/@spec.dev/core@0.0.128"
    }
}`

const readmeContents = `TODO`

const manifestFileContents = (
    namespace: string,
    name: string,
    version: string,
    chains: string[],
    displayName?: string,
    description?: string
): string =>
    JSON.stringify(
        {
            namespace,
            name,
            version,
            displayName: displayName || '',
            description: description || '',
            chains: chains.map((id) => parseInt(id)),
        },
        null,
        4
    )

const specFileContents = (name: string, description?: string): string => {
    const imports = ['Spec', 'LiveObject', 'Property', 'Event', 'OnEvent', 'Address']
    let contents = `import { ${imports.join(', ')} } from '@spec.dev/core'

/**
 * ${description || 'TODO: ...'}
 */
@Spec({ 
    uniqueBy: ['someProperty', 'chainId'] 
})
class ${name} extends LiveObject {
    // ...
    @Property()
    someProperty: Address

    // ==== Event Handlers ===================
    
    @OnEvent('namespace.ContractName.EventName')
    onSomeEvent(event: Event) {
        this.someProperty = event.data.someProperty
    }
}

export default ${name}`

    return contents
}

const fileContents = {
    GITIGNORE: gitIgnoreContents,
    VSCODE_SETTINGS: vsCodeSettingsContents,
    DENO_CONFIG: denoConfigContents,
    DENO_IMPORTS: denoImportsContents,
    README: readmeContents,
    manifest: manifestFileContents,
    spec: specFileContents,
}

function upsertFile(cwd: string, id: string) {
    const filePath = path.join(cwd, files[id])
    fileExists(filePath) || createFileWithContents(filePath, fileContents[id])
}

export function upsertReadme(cwd: string) {
    upsertFile(cwd, 'README')
}

export function upsertGitignore(cwd: string) {
    upsertFile(cwd, 'GITIGNORE')
}

export function upsertVsCodeSettings(cwd: string) {
    const vsCodeFolderPath = path.join(cwd, dirs.VSCODE)
    const vsCodeSettingsPath = path.join(vsCodeFolderPath, files.VSCODE_SETTINGS)
    fileExists(vsCodeFolderPath) || createDir(vsCodeFolderPath)
    fileExists(vsCodeSettingsPath) ||
        createFileWithContents(vsCodeSettingsPath, fileContents.VSCODE_SETTINGS)
}

export function upsertDenoConfig(cwd: string) {
    upsertFile(cwd, 'DENO_CONFIG')
}

export function upsertDenoImports(cwd: string) {
    upsertFile(cwd, 'DENO_IMPORTS')
}

export function upsertLiveObject(
    cwd: string,
    namespace: string,
    name: string,
    chains: string[],
    displayName?: string,
    description?: string
): StringKeyMap {
    const liveObjectId = toNamespacedVersion(namespace, name, DEFAULT_VERSION)
    const liveObjectFolderPath = path.join(cwd, name)

    // Ensure Live Object doesn't already exist.
    if (fileExists(liveObjectFolderPath)) {
        logWarning(`Live Object already exists in folder "./${name}"`)
        return { liveObjectId, success: false }
    }

    // Create folder with the Live Object's name.
    createDir(liveObjectFolderPath)

    // Create "manifest.json" file.
    createFileWithContents(
        path.join(liveObjectFolderPath, files.MANIFEST),
        fileContents.manifest(namespace, name, DEFAULT_VERSION, chains, displayName, description)
    )

    // Create "spec.ts" file.
    createFileWithContents(
        path.join(liveObjectFolderPath, files.SPEC),
        fileContents.spec(name, description)
    )

    return { liveObjectId, success: true }
}
