import path from 'path'
import constants from '../constants'
import { fileExists, createFileWithContents, createDir } from '../utils/file'

const rcFileName = '.postgraphilerc.js'

const rcDefaultContents = `module.exports = {
    options: {
        connection: process.env.SPEC_DATABASE_URL,
        host: process.env.SPEC_GRAPH_HOST || 'localhost',
        port: process.env.SPEC_GRAPH_PORT || 5555,
        graphql: '/graphql',
        schema: ['public'],
        watch: true,
        defaultRole: 'spec',
        skipPlugins: 'graphile-build:NodePlugin',
        appendPlugins: [
            '@graphile-contrib/pg-simplify-inflector',
        ],
        simpleCollections: 'only',
        dynamicJson: true,
        ignoreIndexes: false,
        extendedErrors: ['errcode'],
        enableQueryBatching: true,
        graphileBuildOptions: {
            pgOmitListSuffix: true,
        },
    },
}`

export function upsertPostgraphilerc(specProjectConfigDir: string) {
    const rcFilePath = path.join(specProjectConfigDir, constants.GRAPHQL_DIR_NAME, rcFileName)
    upsertGraphQLConfigDir(specProjectConfigDir)
    fileExists(rcFilePath) || createFileWithContents(rcFilePath, rcDefaultContents)
}

export function upsertGraphQLConfigDir(specProjectConfigDir: string) {
    const graphQLConfigDir = path.join(specProjectConfigDir, constants.GRAPHQL_DIR_NAME)
    fileExists(graphQLConfigDir) || createDir(graphQLConfigDir)
}

export function doesPostgraphilercExist(specProjectConfigDir: string): boolean {
    return fileExists(path.join(specProjectConfigDir, constants.GRAPHQL_DIR_NAME, rcFileName))
}
