import { execSync } from 'node:child_process'

export function npmInstall(pkg: string): string | null {
    let error = null
    try {
        execSync(`npm install ${pkg}`)
    } catch (err) {
        error = `Error installing ${pkg}: ${JSON.stringify(err)}`
    }
    return error
}
