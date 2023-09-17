import { execSync } from 'node:child_process'
import path from 'path'
import constants from '../constants'

export function installPostgraphile() {
    execSync(`npm install -g postgraphile@4.12.8 @graphile-contrib/pg-simplify-inflector@6.1.0`, {
        stdio: 'inherit',
    })
}

export function isPostgraphileInstalled(): boolean {
    try {
        const out = execSync('which postgraphile')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export function startPostgraphile(specConfigDir: string, url: string) {
    const graphQLConfigDir = path.join(specConfigDir, constants.GRAPHQL_DIR_NAME)
    const cmdArgs = [
        '--retry-on-init-fail',
        '--no-setof-functions-contain-nulls',
        '--no-ignore-rbac',
        '--no-ignore-indexes',
        '--legacy-relations',
        'omit',
    ]
    process.env.SPEC_DATABASE_URL = url
    execSync(`postgraphile ${cmdArgs.join(' ')}`, { stdio: 'inherit', cwd: graphQLConfigDir })
}
