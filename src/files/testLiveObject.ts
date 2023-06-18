import * as path from 'https://deno.land/std/path/mod.ts'
import { serve } from 'https://deno.land/std@0.150.0/http/server.ts'
import { router } from 'https://crux.land/router@0.0.5'
import chalk from 'https://deno.land/x/chalk_deno@v4.1.1-deno/source/index.js'
import { Pool } from 'https://deno.land/x/postgres@v0.14.0/mod.ts'
import {
    Queue,
    StringKeyMap,
    Event,
    Call,
    LiveObject,
    TableSpec,
    ColumnSpec,
    BigInt,
} from 'https://esm.sh/@spec.dev/core@0.0.87'
import { createEventClient, SpecEventClient } from 'https://esm.sh/@spec.dev/event-client@0.0.16'
import {
    buildSelectQuery,
    buildUpsertQuery,
    QueryPayload,
    ident,
    literal,
} from 'https://esm.sh/@spec.dev/qb@0.0.2'
import short from 'https://esm.sh/short-uuid@4.2.0'

const chainNamespaces = {
    ETHEREUM: 'eth',
    GOERLI: 'goerli',
    POLYGON: 'polygon',
    MUMBAI: 'mumbai',
}

const chainIds = {
    ETHEREUM: '1',
    GOERLI: '5',
    POLYGON: '137',
    MUMBAI: '80001',
}

const nspForChainId = {
    [chainIds.ETHEREUM]: chainNamespaces.ETHEREUM,
    [chainIds.GOERLI]: chainNamespaces.GOERLI,
    [chainIds.POLYGON]: chainNamespaces.POLYGON,
    [chainIds.MUMBAI]: chainNamespaces.MUMBAI,
}

const codes = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
}

const routes = {
    GENERATE_TEST_INPUTS: 'live-object-version/generate-test-inputs',
    RESOLVE_EVENT_VERSIONS: 'event-versions/resolve',
    RESOLVE_CALL_VERSIONS: 'call-versions/resolve',
}

const REQUEST_TIMEOUT = 30000
const AUTH_HEADER_NAME = 'Spec-Auth-Token'

const MAX_TX_ENTRIES = 10

const CONTRACTS_EVENT_NSP = 'contracts'

const liveObjectFileNames = {
    SPEC: 'spec.ts',
    MANIFEST: 'manifest.json',
}

// Integer Types
const INT = 'int'
const SMALLINT = 'smallint'
const INTEGER = 'integer'
const BIGINT = 'bigint'
const INT2 = 'int2'
const INT4 = 'int4'
const INT8 = 'int8'

// Arbitrary Precision Numbers
const DECIMAL = 'decimal'
const NUMERIC = 'numeric'

// Floating-Point Types
const REAL = 'real'
const DOUBLE_PRECISION = 'double precision'
const FLOAT4 = 'float4'
const FLOAT8 = 'float8'

// Boolean Type
const BOOL = 'bool'
const BOOLEAN = 'boolean'

// Character Types
const CHAR = 'char'
const CHARACTER = 'character'
const VARCHAR = 'varchar'
const CHARACTER_VARYING = 'character varying'
const TEXT = 'text'

// Date/Time Types
const DATE = 'date'
const TIME = 'time'
const TIME_WITHOUT_TIME_ZONE = 'time without time zone'
const TIME_WITH_TIME_ZONE = 'time with time zone'
const TIMETZ = 'timetz'
const TIMESTAMP = 'timestamp'
const TIMESTAMP_WITHOUT_TIME_ZONE = 'timestamp without time zone'
const TIMESTAMP_WITH_TIME_ZONE = 'timestamp with time zone'
const TIMESTAMPTZ = 'timestamptz'

function narrowColType(t: string): string {
    t = t || ''

    // int2
    if ([SMALLINT, INT2].includes(t)) {
        return INT2
    }
    // int4
    if ([INTEGER, INT, INT4].includes(t)) {
        return INT4
    }
    // int8
    if ([BIGINT, INT8].includes(t)) {
        return INT8
    }
    // numeric
    if (!!t.match(new RegExp(`(${NUMERIC}|${DECIMAL})`, 'gi'))) {
        return NUMERIC
    }
    // float4
    if (!!t.match(new RegExp(`(${REAL}|${FLOAT4})`, 'gi'))) {
        return FLOAT4
    }
    // float8
    if (!!t.match(new RegExp(`(${DOUBLE_PRECISION}|${FLOAT8})`, 'gi'))) {
        return FLOAT8
    }
    // boolean
    if ([BOOL, BOOLEAN].includes(t)) {
        return BOOLEAN
    }
    // varchar
    if (!!t.match(new RegExp(`(${CHARACTER_VARYING}|${VARCHAR})`, 'gi'))) {
        return VARCHAR
    }
    // char
    if (!!t.match(new RegExp(`(${CHARACTER}|${CHAR})`, 'gi'))) {
        return CHAR
    }
    // text
    if (t === TEXT) {
        return TEXT
    }
    // json
    if (t === 'json') {
        return 'json'
    }
    // jsonb
    if (t === 'jsonb') {
        return 'jsonb'
    }
    // date
    if (t === DATE) {
        return DATE
    }
    // timestamptz
    if (!!t.match(new RegExp(`(${TIMESTAMP_WITH_TIME_ZONE}|${TIMESTAMPTZ})`, 'gi'))) {
        return TIMESTAMPTZ
    }
    // timestamp
    if (!!t.match(new RegExp(`(${TIMESTAMP_WITHOUT_TIME_ZONE}|${TIMESTAMP})`, 'gi'))) {
        return TIMESTAMP
    }
    // timetz
    if (!!t.match(new RegExp(`(${TIME_WITH_TIME_ZONE}|${TIMETZ})`, 'gi'))) {
        return TIMETZ
    }
    // time
    if (!!t.match(new RegExp(`(${TIME_WITHOUT_TIME_ZONE}|${TIME})`, 'gi'))) {
        return TIME
    }
    // Anything else
    return t
}

const pool = new Pool(Deno.args[1], 10, true)

const random = (): string => (Math.random() * 1000000).toFixed(0)

const newConstraintName = (prefix: string): string => `${prefix}_${short.generate().toLowerCase()}`

const unique = (arr: any[]): any[] => Array.from(new Set(arr))

const typeIdent = (type: string): string => {
    return type.endsWith('[]') ? `${ident(type.slice(0, -2))}[]` : ident(type)
}

const identPath = (value: string): string =>
    value
        .split('.')
        .map((v) => ident(v))
        .join('.')

function stringify(value: any, ...args): string | null {
    try {
        return JSON.stringify(value, ...args)
    } catch (err) {
        return value
    }
}

function parse(value: any, fallback: any = {}): any {
    try {
        return JSON.parse(value)
    } catch (err) {
        return fallback
    }
}

function padToLength(val: string, len: number): string {
    while (val.length < len) {
        val += ' '
    }
    return val
}

async function getPoolConnection() {
    let conn
    try {
        conn = await pool.connect()
    } catch (err) {
        conn && conn.release()
        throw `Getting pool connection failed: ${stringify(err)}`
    }
    return conn
}

function resp(data, code = codes.SUCCESS): Response {
    return new Response(stringify(data), {
        status: code,
        headers: { 'Content-Type': 'application/json' },
    })
}

function isNull(val: any): boolean {
    return val === null || val === 'null'
}

function toNumber(val: any): number | null {
    const num = parseInt(val)
    return Number.isNaN(num) ? null : num
}

function parseOptions(): StringKeyMap {
    const values = Deno.args.slice(3) || []
    const options = {
        recent: values[0] === 'true',
        from: isNull(values[1]) ? null : values[1],
        fromBlock: isNull(values[2]) ? null : toNumber(values[2]),
        to: isNull(values[3]) ? null : values[3],
        toBlock: isNull(values[4]) ? null : toNumber(values[4]),
        chainIds: isNull(values[5])
            ? null
            : values[5]
                  .split(',')
                  .map((v) => v.trim())
                  .filter((v) => !!v),
        allTime: values[6] === 'true',
        keepData: values[7] === 'true',
        port: isNull(values[8]) ? null : toNumber(values[8]),
        apiKey: isNull(values[9]) ? null : values[9],
    }

    if (
        !options.recent &&
        !options.from &&
        options.fromBlock === null &&
        !options.to &&
        options.toBlock === null &&
        !options.allTime &&
        !options.keepData
    ) {
        options.keepData = true
    }
    return options
}

async function getLiveObjectSpecs(): Promise<StringKeyMap[]> {
    const liveObjects = []
    const parentFolderPaths = unique(
        (Deno.args[0] || '').split(',').map((f) => path.join(Deno.cwd(), f.trim()))
    )
    for (const parentFolderPath of parentFolderPaths) {
        await getLiveObjectsInGivenPath(parentFolderPath, liveObjects)
    }
    if (!liveObjects.length) {
        console.log(`No Live Objects found inside ${Deno.args[0]}.`)
    }
    const uniqueLiveObjectPaths = new Set()
    const uniqueLiveObjects = []
    for (const liveObject of liveObjects) {
        if (uniqueLiveObjectPaths.has(liveObject.specFilePath)) continue
        uniqueLiveObjects.push(liveObject)
        uniqueLiveObjectPaths.add(liveObject.specFilePath)
    }
    return uniqueLiveObjects
}

async function getLiveObjectsInGivenPath(folder: string, liveObjects: StringKeyMap[]) {
    const folderName = folder.split('/').pop()
    const entries = []
    for await (const entry of Deno.readDir(folder)) {
        entries.push(entry)
    }

    const isLiveObject =
        entries.find((f) => f.isFile && f.name === liveObjectFileNames.SPEC) &&
        entries.find((f) => f.isFile && f.name === liveObjectFileNames.MANIFEST)
    if (isLiveObject) {
        liveObjects.push({
            name: folderName,
            specFilePath: path.join(folder, liveObjectFileNames.SPEC),
        })
    }

    for (const entry of entries) {
        if (entry.isDirectory && !entry.isSymlink) {
            await getLiveObjectsInGivenPath(path.join(folder, entry.name), liveObjects)
        }
    }
}

async function buildLiveObjectsMap(
    liveObjects: StringKeyMap[],
    apiKey: string
): Promise<StringKeyMap | null> {
    const liveObjectsMap = {}
    for (const { name, specFilePath } of liveObjects) {
        const LiveObjectClass = await importLiveObject(specFilePath)
        const liveObjectInstance = new LiveObjectClass()
        const chainNsps = await getLiveObjectChainNamespaces(specFilePath)

        const inputEventNames = await resolveInputsForLiveObject(
            liveObjectInstance._eventHandlers,
            chainNsps,
            routes.RESOLVE_EVENT_VERSIONS,
            'event',
            apiKey
        )
        if (inputEventNames === null) return null

        const inputCallNames = await resolveInputsForLiveObject(
            liveObjectInstance._callHandlers,
            chainNsps,
            routes.RESOLVE_CALL_VERSIONS,
            'contract function call',
            apiKey
        )
        if (inputCallNames === null) return null

        liveObjectsMap[specFilePath] = {
            name,
            specFilePath,
            LiveObjectClass,
            liveObjectInstance,
            inputEventNames,
            inputCallNames,
        }
    }
    return liveObjectsMap
}

async function importLiveObject(specFilePath: string) {
    try {
        const module = await import(specFilePath)
        return module?.default || null
    } catch (err) {
        console.error(`Failed to import Live Object at path ${specFilePath}`, err)
        throw err
    }
}

async function readTextFile(path: string): Promise<string> {
    const decoder = new TextDecoder('utf-8')
    const data = await Deno.readFile(path)
    return decoder.decode(data)
}

async function readJsonFile(path: string): Promise<StringKeyMap | StringKeyMap[]> {
    return parse(await readTextFile(path))
}

async function readManifest(liveObjectSpecPath: string): Promise<StringKeyMap> {
    let splitSpecConfigDirPath = liveObjectSpecPath.split('/')
    splitSpecConfigDirPath.pop()
    return await readJsonFile(`${splitSpecConfigDirPath.join('/')}/${liveObjectFileNames.MANIFEST}`)
}

function createInputEventsMap(liveObjectsMap: StringKeyMap): StringKeyMap {
    const inputEventsMap = {}
    for (const specFilePath in liveObjectsMap) {
        const { inputEventNames } = liveObjectsMap[specFilePath]
        for (const eventName of inputEventNames) {
            if (!inputEventsMap.hasOwnProperty(eventName)) {
                inputEventsMap[eventName] = []
            }
            inputEventsMap[eventName].push(specFilePath)
        }
    }
    return inputEventsMap
}

function createInputCallsMap(liveObjectsMap: StringKeyMap): StringKeyMap {
    const inputCallsMap = {}
    for (const specFilePath in liveObjectsMap) {
        const { inputCallNames } = liveObjectsMap[specFilePath]
        for (const callName of inputCallNames) {
            if (!inputCallsMap.hasOwnProperty(callName)) {
                inputCallsMap[callName] = []
            }
            inputCallsMap[callName].push(specFilePath)
        }
    }
    return inputCallsMap
}

function newEventClient(apiKey: string): SpecEventClient {
    return createEventClient({
        signedAuthToken: apiKey,
        onConnect: () => console.log('Listening for new input events...'),
    })
}

function getQueryPayload(payload: StringKeyMap): [StringKeyMap, boolean] {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return [payload, false]
    }
    try {
        const query = buildQueryFromPayload(payload)
        return query ? [query, true] : [payload, false]
    } catch (err) {
        return [payload, false]
    }
}

function getTxPayload(payload: StringKeyMap[]): [StringKeyMap[], boolean] {
    if (!payload) return [payload, false]
    payload = payload || []
    payload = Array.isArray(payload) ? payload : [payload]

    if (!payload.length) {
        return [payload, false]
    }

    if (payload.length > MAX_TX_ENTRIES) {
        console.error(`Tx got more than max allowed entries`, payload.length)
        return [payload, false]
    }

    const queries = []
    for (const entry of payload) {
        const [query, isValid] = getQueryPayload(entry)
        if (!isValid) return [payload, false]
        queries.push(query)
    }
    return [queries, true]
}

function buildQueryFromPayload(payload: StringKeyMap): QueryPayload | null {
    payload = payload || {}
    const table = payload.table
    if (!table) return null

    // SELECT
    if (payload.hasOwnProperty('filters')) {
        return buildSelectQuery(table, payload.filters, payload.options)
    }

    // UPSERT
    if (
        payload.data &&
        payload.hasOwnProperty('conflictColumns') &&
        payload.hasOwnProperty('updateColumns')
    ) {
        return buildUpsertQuery(
            table,
            payload.data,
            payload.conflictColumns || [],
            payload.updateColumns || [],
            payload.returning
        )
    }

    return null
}

async function getLiveObjectChainNamespaces(specFilePath: string): Promise<string[]> {
    const { chains } = (await readManifest(specFilePath)) || {}
    return chains.map((id) => nspForChainId[id]).filter((v) => !!v)
}

async function resolveInputsForLiveObject(
    registeredHandlers: StringKeyMap,
    chainNsps: string[],
    route: string,
    subject: string,
    apiKey: string
): Promise<string[] | null> {
    const inputNames = []
    for (const givenName in registeredHandlers) {
        let fullName = givenName

        // Add a missing "contracts." prefix if missing.
        if (givenName.split('.').length === 3) {
            fullName = `${CONTRACTS_EVENT_NSP}.${fullName}`
        }

        // Subscribe to inputs on all chains the live object
        // is associated with if chain is not specified.
        if (fullName.startsWith(`${CONTRACTS_EVENT_NSP}.`)) {
            for (const nsp of chainNsps) {
                inputNames.push([nsp, fullName].join('.'))
            }
        } else {
            inputNames.push(fullName)
        }
    }
    if (!inputNames.length) return []

    const { data: inputVersionsMap, error } = await resolveInputVersions(inputNames, route, apiKey)
    if (error) {
        console.error(chalk.yellow(error))
        return null
    }

    for (const fullName of inputNames) {
        if (!inputVersionsMap[fullName]) {
            console.error(
                chalk.yellow(`No registered ${subject} on Spec was found for "${fullName}"`)
            )
            return null
        }
    }

    return Object.values(inputVersionsMap)
}

async function resolveInputVersions(
    inputs: string[],
    route: string,
    apiKey: string
): Promise<StringKeyMap> {
    const origin = Deno.args[2]
    const url = path.join(origin, route)

    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT)

    const headers = {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: apiKey,
    }

    let resp, error
    try {
        resp = await fetch(url, {
            method: 'POST',
            body: stringify({ inputs }),
            headers,
            signal: abortController.signal,
        })
    } catch (err) {
        error = `Unexpected error resolving input versions ${inputs.join(', ')}: ${stringify(err)}`
    }
    clearTimeout(timer)
    if (error) return { error }

    let data: any = {}
    try {
        data = (await resp.json()) || {}
    } catch (err) {
        error = `Error parsing JSON response: ${err}`
    }

    if (!error && data?.error) {
        error = data.error
    }

    return { data, error }
}

async function getColumnsWithAttrs(schemaName: string, tableName: string): Promise<ColumnSpec[]> {
    const query = {
        sql: `select column_name as name, data_type as type, is_nullable as nullable, column_default as "default" from information_schema.columns where table_schema = $1 and table_name in ($2, $3)`,
        bindings: [schemaName, tableName, `"${tableName}"`],
    }

    let rows = []
    try {
        rows = await performQuery(query)
    } catch (err) {
        throw `Error getting column types for ${schemaName}.${tableName}: ${stringify(err)}`
    }

    return rows.map((row) => ({
        name: row.name,
        type: row.type,
        default: row.default,
        notNull: row.nullable === 'NO',
    }))
}

async function getTableCount(tablePath: string): Promise<number> {
    const query = {
        sql: `select count(*) from ${identPath(tablePath)}`,
        bindings: [],
    }
    let rows = []
    try {
        rows = await performQuery(query)
    } catch (err) {
        throw `Error getting table count for ${tablePath}: ${stringify(err)}`
    }

    return parseInt(rows[0]?.count)
}

async function upsertSchema(schemaName: string) {
    if (await doesSchemaExist(schemaName)) return
    const query = {
        sql: `create schema if not exists ${ident(schemaName)}`,
        bindings: [],
    }
    try {
        console.log(chalk.magenta(`Creating schema "${schemaName}"`))
        await performQuery(query)
    } catch (err) {
        throw `Error upserting schema ${ident(schemaName)}: ${stringify(err)}`
    }
}

async function doesSchemaExist(name: string): Promise<boolean> {
    const query = {
        sql: `select count(*) from information_schema.schemata where schema_name = $1`,
        bindings: [name],
    }
    let rows = []
    try {
        rows = await performQuery(query)
    } catch (err) {
        throw `Error checking if schema exists (${name}): ${stringify(err)}`
    }
    const count = rows ? Number((rows[0] || {}).count || 0) : 0
    return count > 0
}

async function doesTableExist(schemaName: string, tableName: string): Promise<boolean> {
    const query = {
        sql: `select count(*) from pg_tables where schemaname = $1 and tablename in ($2, $3)`,
        bindings: [schemaName, tableName, `"${tableName}"`],
    }
    let rows = []
    try {
        rows = await performQuery(query)
    } catch (err) {
        throw `Error checking if table exists (${schemaName}.${tableName}): ${stringify(err)}`
    }
    const count = rows ? Number((rows[0] || {}).count || 0) : 0
    return count > 0
}

export async function getConstraints(schemaName: string, tableName: string): Promise<StringKeyMap> {
    const constraints = await performQuery({
        sql: `select
                pg_get_constraintdef(c.oid) AS constraint,
                contype,
                conname
            from pg_constraint c 
            join pg_namespace n 
                ON n.oid = c.connamespace 
            where contype IN ('p', 'u')
            and n.nspname = $1
            and conrelid::regclass::text in ($2, $3, $4, $5, $6)`,
        bindings: [
            schemaName,
            tableName,
            `"${tableName}"`,
            `${schemaName}.${tableName}`,
            `"${schemaName}"."${tableName}"`,
            `${schemaName}."${tableName}"`,
        ],
    })

    const pkConstraint = constraints.find((c) => c.contype === 'p') || {}
    const uniqueConstraints = constraints.filter((c) => c.contype === 'u')
    const uniqueConstraintNames = new Set<string>(uniqueConstraints.map((c) => c.conname))

    const rawIndexes = await performQuery({
        sql: `select
                indexname as conname,
                indexdef as constraint
            from pg_indexes 
            where schemaname = $1 
            and tablename in ($2, $3)`,
        bindings: [schemaName, tableName, `"${tableName}"`],
    })

    const indexes = []
    for (const rawIndex of rawIndexes) {
        if (rawIndex.conname === pkConstraint.conname) continue
        const isUnique = rawIndex.constraint.toLowerCase().includes('unique index')
        if (!isUnique) {
            indexes.push(rawIndex)
            continue
        }
        if (!uniqueConstraintNames.has(rawIndex.conname)) {
            uniqueConstraints.push(rawIndex)
        }
    }

    const parseConstraint = (c) => ({
        name: c.conname,
        columns: parseColNamesFromConstraint(c.constraint),
    })

    return {
        indexBy: indexes.map(parseConstraint).filter((c) => !!c.columns),
        uniqueBy: uniqueConstraints.map(parseConstraint).filter((c) => !!c.columns),
        pkColumnNames: parseColNamesFromConstraint(pkConstraint?.constraint),
    }
}

function parseColNamesFromConstraint(raw: string): StringKeyMap | null {
    const matches = (raw || '').match(/\(([-a-zA-Z0-9_, ]+)\)/i)
    if (!matches || matches.length !== 2) return null
    const colNames = matches[1]
        .split(',')
        .map((col) => col.trim())
        .sort()
    return colNames
}

function buildTableSql(schemaName: string, tableName: string, columns: ColumnSpec[]): string {
    const columnStatements = columns.map((c) => buildColumnSql(c))
    return `create table ${ident(schemaName)}.${ident(tableName)} (${columnStatements.join(', ')})`
}

function buildColumnSql(column: ColumnSpec): string {
    // Serial
    if (column.isSerial) {
        return `${ident(column.name)} serial`
    }

    // Name & Type
    const comps = [ident(column.name), typeIdent(column.type)]

    // Not null.
    if (column.notNull || column.isPrimaryKey) {
        comps.push('not null')
    }

    // Default value.
    const defaultValue = column.default
    if (defaultValue) {
        const defaultClause = defaultValue.includes('(')
            ? `default ${defaultValue}`
            : `default ${literal(defaultValue)}`
        comps.push(defaultClause)
    }

    return comps.join(' ')
}

function buildPrimaryKeySql(schemaName: string, tableName: string, columnNames: string[]): string {
    const constraintName = newConstraintName('pk')
    return [
        `alter table ${ident(schemaName)}.${ident(tableName)}`,
        `add constraint ${ident(constraintName)}`,
        `primary key (${columnNames.map(ident).join(', ')})`,
    ].join(' ')
}

function buildIndexSql(
    schemaName: string,
    tableName: string,
    columnNames: string[],
    unique: boolean = false
): string {
    const indexName = newConstraintName('idx')
    const command = unique ? `create unique index` : `create index`
    return `${command} ${ident(indexName)} on ${ident(schemaName)}.${ident(
        tableName
    )} (${columnNames.map(ident).join(', ')})`
}

async function buildTableSpec(schemaName: string, tableName: string): Promise<TableSpec> {
    const { indexBy, uniqueBy, pkColumnNames } = await getConstraints(schemaName, tableName)
    const columns = (await getColumnsWithAttrs(schemaName, tableName)).filter(
        (c) => !pkColumnNames.includes(c.name)
    )
    return {
        schemaName,
        tableName,
        columns,
        uniqueBy,
        indexBy,
    }
}

async function createTableFromSpec(tableSpec: TableSpec) {
    const { schemaName, tableName } = tableSpec
    const columns = tableSpec.columns || []
    const uniqueBy = tableSpec.uniqueBy || []
    const indexBy = tableSpec.indexBy || []
    const hasIdColumn = columns.find((c) => c.name === 'id')
    const pkColumnName = hasIdColumn ? '_id' : 'id'

    // Force-set the primary unique constraint columns to not-null.
    const primaryUniqueColGroup = uniqueBy[0] || []
    const primaryUniqueColGroupSet = new Set(primaryUniqueColGroup)
    columns.forEach((column) => {
        if (primaryUniqueColGroupSet.has(column.name)) {
            column.notNull = true
        }
    })

    // Create new table.
    const createTableSql = buildTableSql(schemaName, tableName, [
        { name: pkColumnName, isSerial: true },
        ...columns,
    ])

    // Add primary keys.
    const addPrimaryKeySql = buildPrimaryKeySql(schemaName, tableName, [pkColumnName])

    // Add unique constraints.
    const uniqueIndexSqlStatements = uniqueBy
        .filter((v) => !!v.length)
        .map((columnNames) => buildIndexSql(schemaName, tableName, columnNames, true))

    // Add other indexes.
    const indexSqlStatements = indexBy
        .filter((v) => !!v.length)
        .map((columnNames) => buildIndexSql(schemaName, tableName, columnNames))

    const txStatements = [
        createTableSql,
        addPrimaryKeySql,
        ...uniqueIndexSqlStatements,
        ...indexSqlStatements,
    ].map((sql) => ({ sql, bindings: [] }))

    try {
        await performTx(txStatements)
    } catch (err) {
        throw `Error creating table ${schemaName}.${tableName}: ${stringify(err)}`
    }
}

async function dropTable(schemaName: string, tableName: string) {
    try {
        await performQuery({
            sql: `drop table ${ident(schemaName)}.${ident(tableName)}`,
            bindings: [],
        })
    } catch (err) {
        throw `Error dropping table ${schemaName}.${tableName}: ${stringify(err)}`
    }
}

async function replaceTable(tableSpec: TableSpec) {
    await dropTable(tableSpec.schemaName, tableSpec.tableName)
    await createTableFromSpec(tableSpec)
}

function mapColumnSpecs(columns: ColumnSpec[]): { [key: string]: ColumnSpec } {
    const map = {}
    for (const columnSpec of columns) {
        const id = [columnSpec.name, narrowColType(columnSpec.type)].join(':')
        map[id] = columnSpec
    }
    return map
}

function mapIndexes(indexes: StringKeyMap[]): StringKeyMap {
    const map = {}
    for (const index of indexes) {
        const id = index.columns.sort().join(':')
        map[id] = index
    }
    return map
}

function diffIndexes(currentIndexMap: StringKeyMap, newIndexMap: StringKeyMap): StringKeyMap {
    const indexesAdded = []
    for (const id in newIndexMap) {
        if (!currentIndexMap[id]) {
            indexesAdded.push(newIndexMap[id])
        }
    }
    const indexesRemoved = []
    for (const id in currentIndexMap) {
        if (!newIndexMap[id]) {
            indexesRemoved.push(currentIndexMap[id])
        }
    }
    return {
        added: indexesAdded,
        removed: indexesRemoved,
    }
}

function determineTableChanges(currentTableSpec: TableSpec, newTableSpec: TableSpec): StringKeyMap {
    // Column diffs.
    const currentColumnsMap = mapColumnSpecs(currentTableSpec.columns || [])
    const newColumnsMap = mapColumnSpecs(newTableSpec.columns || [])

    const columnsAdded = []
    const defaultsChanged = []
    const notNullChanged = []
    for (const columnId in newColumnsMap) {
        const newColumnSpec = newColumnsMap[columnId]
        const currentColumnSpec = currentColumnsMap[columnId]
        // New column.
        if (!currentColumnSpec) {
            columnsAdded.push(newColumnSpec)
            continue
        }
        // Defaults changed.
        if (newColumnSpec.default !== currentColumnSpec.default) {
            defaultsChanged.push({
                name: newColumnSpec.name,
                currentValue: currentColumnSpec.default,
                newValue: newColumnSpec.default,
            })
        }
        // Not null changed.
        if (newColumnSpec.notNull !== currentColumnSpec.notNull) {
            notNullChanged.push({
                name: newColumnSpec.name,
                currentValue: currentColumnSpec.notNull,
                newValue: newColumnSpec.notNull,
            })
        }
    }

    // Columns to remove.
    const columnsRemoved = []
    for (const columnId in currentColumnsMap) {
        const currentColumnSpec = currentColumnsMap[columnId]
        const newColumnSpec = newColumnsMap[columnId]
        if (!newColumnSpec) {
            columnsRemoved.push(currentColumnSpec)
            continue
        }
    }

    // Unique by diffs.
    const currentUniqueByMap = mapIndexes(currentTableSpec.uniqueBy || [])
    const newUniqueByMap = mapIndexes(
        (newTableSpec.uniqueBy || []).map((columns) => ({ name: null, columns }))
    )
    const uniqueByDiffs = diffIndexes(currentUniqueByMap, newUniqueByMap)

    // Index by diffs.
    const currentIndexByMap = mapIndexes(currentTableSpec.indexBy || [])
    const newIndexByMap = mapIndexes(
        (newTableSpec.indexBy || []).map((columns) => ({ name: null, columns }))
    )
    const indexByDiffs = diffIndexes(currentIndexByMap, newIndexByMap)

    return {
        columnsAdded,
        columnsRemoved,
        defaultsChanged,
        notNullChanged,
        uniqueByDiffs,
        indexByDiffs,
    }
}

async function performTableChanges(newTableSpec: TableSpec, diffs: StringKeyMap) {
    const { schemaName, tableName } = newTableSpec
    const {
        columnsAdded,
        columnsRemoved,
        defaultsChanged,
        notNullChanged,
        uniqueByDiffs,
        indexByDiffs,
    } = diffs

    // Just replace the table entirely if both adding and removing columns.
    if (columnsAdded.length && columnsRemoved.length) {
        console.log(chalk.magenta(`Replacing table "${schemaName}"."${tableName}"`))
        await replaceTable(newTableSpec)
        return
    }

    const txStatements = []

    // Add columns.
    txStatements.push(
        ...columnsAdded.map((columnSpec) => {
            console.log(chalk.magenta(`Adding column "${columnSpec.name}"`))
            return `alter table ${ident(schemaName)}.${ident(
                tableName
            )} add column ${buildColumnSql(columnSpec)}`
        })
    )

    // Remove columns.
    txStatements.push(
        ...columnsRemoved.map(({ name }) => {
            console.log(chalk.magenta(`Removing column "${name}"`))
            return `alter table ${ident(schemaName)}.${ident(tableName)} drop column ${ident(name)}`
        })
    )

    // Alter column defaults.
    txStatements.push(
        ...defaultsChanged.map(({ name, newValue }) => {
            let suffix
            if (newValue === null) {
                suffix = 'drop default'
                console.log(chalk.magenta(`Removing default value for column "${name}"`))
            } else {
                console.log(
                    chalk.magenta(`Setting default value for column "${name}" to ${newValue}`)
                )
                suffix = newValue.includes('(')
                    ? `set default ${newValue}`
                    : `set default ${literal(newValue)}`
            }
            return `alter table ${ident(schemaName)}.${ident(tableName)} alter column ${ident(
                name
            )} ${suffix}`
        })
    )

    // Alter column nullability.
    txStatements.push(
        ...notNullChanged.map(({ name, newValue }) => {
            let suffix
            if (newValue) {
                suffix = 'set not null'
                console.log(chalk.magenta(`Adding NOT NULL to column "${name}"`))
            } else {
                console.log(chalk.magenta(`Removing NOT NULL from column "${name}"`))
                suffix = 'drop not null'
            }
            return `alter table ${ident(schemaName)}.${ident(tableName)} alter column ${ident(
                name
            )} ${suffix}`
        })
    )

    // Remove indexes (both unique and not).
    const indexesToRemove = [...uniqueByDiffs.removed, ...indexByDiffs.removed]
    txStatements.push(
        ...indexesToRemove.map(({ name, columns }) => {
            console.log(
                chalk.magenta(
                    `Removing index from columns (${columns.map((n) => `"${n}"`).join(', ')})`
                )
            )
            return `drop index ${ident(schemaName)}.${ident(name)}`
        })
    )

    // Add unique indexes.
    txStatements.push(
        ...uniqueByDiffs.added.map(({ columns }) => {
            console.log(
                chalk.magenta(
                    `Adding unique index to columns (${columns.map((n) => `"${n}"`).join(', ')})`
                )
            )
            return buildIndexSql(schemaName, tableName, columns, true)
        })
    )

    // Add regular indexes.
    txStatements.push(
        ...indexByDiffs.added.map(({ columns }) => {
            console.log(
                chalk.magenta(
                    `Adding index to columns (${columns.map((n) => `"${n}"`).join(', ')})`
                )
            )
            return buildIndexSql(schemaName, tableName, columns)
        })
    )

    try {
        await performTx(txStatements.map((sql) => ({ sql, bindings: [] })))
    } catch (err) {
        throw `Error migrating table ${schemaName}.${tableName}: ${stringify(err)}`
    }
}

async function upsertLiveObjectTable(liveObject: LiveObject): Promise<string> {
    // Get the new table spec for this Live Object.
    const newTableSpec = await liveObject.tableSpec()
    const { schemaName, tableName } = newTableSpec
    const tablePath = [schemaName, tableName].join('.')

    // Force-set the primary unique constraint columns to not-null.
    const primaryUniqueColGroupSet = new Set(newTableSpec.uniqueBy[0] || [])
    newTableSpec.columns.forEach((column) => {
        if (primaryUniqueColGroupSet.has(column.name)) {
            column.notNull = true
        }
    })

    // Filter any empty index specs.
    newTableSpec.uniqueBy = newTableSpec.uniqueBy.filter((group) => !!group.length)
    newTableSpec.indexBy = newTableSpec.indexBy.filter((group) => !!group.length)

    // Upsert the table's schema.
    await upsertSchema(schemaName)

    // Create the table from scratch if it doesn't yet exist.
    if (!(await doesTableExist(schemaName, tableName))) {
        console.log(chalk.magenta(`Creating new table "${schemaName}"."${tableName}"`))
        await createTableFromSpec(newTableSpec)
        return tablePath
    }

    // Create a table spec from the current version of the table so we can
    // check for diffs between its current schema and the newly desired one.
    const currentTableSpec = await buildTableSpec(schemaName, tableName)
    const diffs = determineTableChanges(currentTableSpec, newTableSpec)
    await performTableChanges(newTableSpec, diffs)

    return tablePath
}

async function clearTables(tables: string[]) {
    const schema = tables[0].split('.')[0]
    console.log(
        chalk.gray(
            `Clearing ${tables.length} table${
                tables.length === 1 ? '' : 's'
            } in the "${schema}" schema...`
        )
    )

    const txStatements = tables.map((table) => ({
        sql: `delete from ${identPath(table)}`,
        bindings: [],
    }))

    try {
        await performTx(txStatements)
    } catch (err) {
        throw `Error clearing tables ${tables.join(', ')}: ${stringify(err)}`
    }
}

function subscribeToEventsAndCalls(
    apiKey: string,
    inputEventsMap: StringKeyMap,
    inputCallsMap: StringKeyMap,
    liveObjectsMap: StringKeyMap
) {
    const eventClient = newEventClient(apiKey)

    // Subsribe to all input events.
    const uniqueInputEvents = Object.keys(inputEventsMap)
    for (const eventName of uniqueInputEvents) {
        eventClient.onEvent(eventName, (event: Event) => {
            const { chainId, blockNumber } = event.origin
            console.log(
                `\n${chalk.gray(`[${chainId}:${blockNumber}]`)} ${chalk.green(
                    `Handling ${event.name}...`
                )}`
            )

            for (const specFilePath of inputEventsMap[event.name] || []) {
                const liveObject = liveObjectsMap[specFilePath]
                if (!liveObject) continue
                handleInput(event, liveObject.name, liveObject.LiveObjectClass, 'handleEvent')
            }
        })
        console.log(chalk.green(`Subscribed to event ${eventName}`))
    }

    // Subsribe to all input calls.
    const uniqueInputCalls = Object.keys(inputCallsMap)
    for (const callName of uniqueInputCalls) {
        eventClient.onCall(callName, (call: Call) => {
            const { chainId, blockNumber } = call.origin
            console.log(
                `\n${chalk.gray(`[${chainId}:${blockNumber}]`)} ${chalk.green(
                    `Handling ${call.name}...`
                )}`
            )

            for (const specFilePath of inputCallsMap[call.name] || []) {
                const liveObject = liveObjectsMap[specFilePath]
                if (!liveObject) continue
                handleInput(call, liveObject.name, liveObject.LiveObjectClass, 'handleCall')
            }
        })
        console.log(chalk.green(`Subscribed to call ${callName}`))
    }
}

async function handleInput(
    input: Event | Call,
    liveObjectName: string,
    TargetLiveObject: LiveObject,
    handler: string,
    log: boolean = true
) {
    input.origin.blockNumber = BigInt.from(input.origin.blockNumber)
    const logPrefix = chalk.gray(`${liveObjectName} |`)

    // Create the Live Object with queues to capture
    // published events and any newly registered contracts.
    const publishedEventQueue = new Queue()
    const contractRegistrationQueue = new Queue()
    const liveObject = new TargetLiveObject(publishedEventQueue, contractRegistrationQueue)

    // Handle the event or call and auto-save.
    try {
        if (await liveObject[handler](input)) {
            await liveObject.save()
        }
    } catch (err) {
        console.error(`${logPrefix} Error handling ${input.name}`, err, input)
        return { name: null, count: 0, registeredContracts: [] }
    }

    // New contracts to register to certain groups via a factory pattern.
    const registeredContracts = liveObject._newContractInstances || []
    const logNewContractResults = () => {
        if (!log || !registeredContracts.length) return
        console.log(
            `\n${logPrefix} ${chalk.yellowBright(
                `${registeredContracts.length} new contract${
                    registeredContracts.length > 1 ? 's' : ''
                } registered:`
            )}`
        )
        registeredContracts.map(({ address, group, chainId }) => {
            console.log(
                `${chalk.gray('--')} ${address} ${chalk.gray('|')} ${chalk.yellowBright(
                    group
                )} ${chalk.gray('|')} ${chainId}`
            )
        })
    }

    // Live object events to be published due to the logic in the handler.
    const liveObjectEvents = liveObject._publishedEvents || []
    const numResponseEvents = liveObjectEvents.length
    if (!numResponseEvents) {
        log && console.log(`${logPrefix} No changes to publish.`)
        logNewContractResults()
        return { name: null, count: 0, registeredContracts }
    }
    if (!log) {
        return { name: liveObjectEvents[0]?.name, count: numResponseEvents, registeredContracts }
    }
    console.log(
        `${logPrefix} ${chalk.cyanBright(
            `${numResponseEvents} output event${numResponseEvents > 1 ? 's' : ''} curated:`
        )}`
    )
    console.log(numResponseEvents > 1 ? liveObjectEvents : liveObjectEvents[0])
    logNewContractResults()
}

function mapColumnNamesToPgResult(result): StringKeyMap[] {
    return (result.rows || []).map((values) => {
        const record = {}
        result.rowDescription.columns.forEach((col, i) => {
            let value = values[i]
            if (typeof value === 'bigint') {
                value = value.toString()
            }
            record[col.name] = value
        })
        return record
    })
}

async function performQuery(query: QueryPayload, silent: boolean = true): Promise<StringKeyMap[]> {
    const { sql, bindings } = query
    const conn = await getPoolConnection()
    const tx = conn.createTransaction(`query_${random()}`)

    let result
    try {
        await tx.begin()
        silent || console.info(sql, bindings)
        result = await tx.queryArray({ text: sql, args: bindings })
        await tx.commit()
    } catch (err) {
        throw `Query failed: ${err.message}`
    } finally {
        conn.release()
    }
    if (!result) {
        throw 'Empty query result'
    }

    return mapColumnNamesToPgResult(result)
}

export async function performTx(queries: QueryPayload[], silent: boolean = true) {
    const conn = await getPoolConnection()
    const tx = conn.createTransaction(`tx_${random()}`)

    let results = []
    try {
        await tx.begin()
        results = await Promise.all(
            queries.map(({ sql, bindings }) => {
                silent || console.info(sql, bindings)
                return tx.queryArray({ text: sql, args: bindings })
            })
        )
        await tx.commit()
    } catch (err) {
        throw `Query failed: ${err.message}`
    } finally {
        conn.release()
    }

    const responses = []
    for (let i = 0; i < results.length; i++) {
        const result = results[i]
        if (!result) {
            throw 'Empty query result'
        }
        responses.push(mapColumnNamesToPgResult(result))
    }

    return responses
}

async function onQueryRoute(req: Request) {
    // Parse JSON payload.
    let payload
    try {
        payload = await req.json()
    } catch (err) {
        const error = `Error parsing request body as JSON`
        console.error(error, err)
        return resp({ error }, codes.BAD_REQUEST)
    }

    // Convert payload into a runnable query.
    const [query, isValid] = getQueryPayload(payload)
    if (!isValid) {
        const error = `Invalid query payload: ${stringify(query)}`
        console.error(error)
        return resp({ error }, codes.BAD_REQUEST)
    }

    // Run query and return JSON array of results.
    let records = []
    try {
        records = await performQuery(query as QueryPayload)
    } catch (err) {
        const error = `Error performing query ${stringify(query)}`
        console.error(error, err)
        return resp({ error }, codes.INTERNAL_SERVER_ERROR)
    }

    return resp(records)
}

async function onTxRoute(req: Request) {
    // Parse JSON payload.
    let payload
    try {
        payload = await req.json()
    } catch (err) {
        const error = `Error parsing request body as JSON`
        console.error(error, err)
        return resp({ error }, codes.BAD_REQUEST)
    }

    // Convert payload into a list of queries to run inside a transaction.
    const [queries, isValid] = getTxPayload(payload)
    if (!isValid) {
        const error = `Invalid tx payload: ${stringify(queries)}`
        console.error(error)
        return resp({ error }, codes.BAD_REQUEST)
    }

    // Perform all given queries in a single transaction & return JSON array of results.
    let results = []
    try {
        results = await performTx(queries as QueryPayload[])
    } catch (err) {
        const error = `Error performing transactions ${stringify(queries)}`
        console.error(error, err)
        return resp({ error }, codes.INTERNAL_SERVER_ERROR)
    }
    return resp(results)
}

let hasFetched = false
async function fetchTestData(payload: StringKeyMap, apiKey: string): Promise<StringKeyMap> {
    const origin = Deno.args[2]
    const url = path.join(origin, routes.GENERATE_TEST_INPUTS)
    const abortController = new AbortController()
    const timer = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT)

    const headers = {
        'Content-Type': 'application/json',
        [AUTH_HEADER_NAME]: apiKey,
    }

    console.log(
        chalk.gray(`\n- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - \n`)
    )

    if (hasFetched) {
        console.log(`Fetching next batch @ ${chalk.magenta(payload.cursor)}`)
    } else {
        const at = payload.cursor || payload.from
        console.log(`Fetching batch inputs${at ? ` @ ${chalk.magenta(at)}` : ''}`)
        hasFetched = true
    }

    let resp, error
    try {
        resp = await fetch(url, {
            method: 'POST',
            body: stringify(payload),
            headers,
            signal: abortController.signal,
        })
    } catch (err) {
        error = `Unexpected error fetching test data: ${stringify(err)}`
    }
    if (!error && resp?.status !== 200) {
        error = `Fetching test data failed: got response code ${resp?.status}`
    }
    clearTimeout(timer)

    let data = {}
    try {
        data = (await resp.json()) || {}
    } catch (err) {
        error = `Error parsing JSON response: ${err}`
    }

    return { data, error }
}

function buildStreamTestDataPayload(
    inputEventsMap: StringKeyMap,
    inputCallsMap: StringKeyMap,
    options: StringKeyMap,
    cursor?: string,
    streamId?: string
): StringKeyMap {
    return {
        inputs: {
            events: Object.keys(inputEventsMap),
            calls: Object.keys(inputCallsMap),
        },
        cursor: cursor || null,
        chainIds: options.chainIds || [],
        from: options.from,
        fromBlock: options.fromBlock,
        to: options.to,
        toBlock: options.toBlock,
        recent: options.recent,
        allTime: options.allTime,
        streamId,
    }
}

async function processTestDataInputs(
    inputs: StringKeyMap[],
    inputEventsMap: StringKeyMap,
    inputCallsMap: StringKeyMap,
    liveObjectsMap: StringKeyMap
): Promise<StringKeyMap> {
    const inputsBreakdown = {}
    const numInputs = inputs.length
    if (!numInputs) return inputsBreakdown

    if (numInputs) {
        console.log(chalk.green(`\nProcessing ${numInputs} inputs:`))
    } else {
        console.log(`\nNo inputs this batch.`)
        return inputsBreakdown
    }

    for (const input of inputs) {
        inputsBreakdown[input.name] = (inputsBreakdown[input.name] || 0) + 1
    }

    const maxInputNameLength = Math.max(...Object.keys(inputsBreakdown).map((n) => n.length))
    for (const name in inputsBreakdown) {
        console.log(
            `${chalk.gray('--')} ${padToLength(name, maxInputNameLength)}  ${chalk.green(
                inputsBreakdown[name].toLocaleString()
            )}`
        )
    }

    let numOutputEvents = 0
    const newContracts = []
    const outputsBreakdown = {}
    for (const input of inputs) {
        const isCall = input?.hasOwnProperty('inputs')
        const inputsMap = isCall ? inputCallsMap : inputEventsMap
        const handler = isCall ? 'handleCall' : 'handleEvent'

        for (const specFilePath of inputsMap[input.name] || []) {
            const liveObject = liveObjectsMap[specFilePath]
            if (!liveObject) continue
            const {
                name: outputEventName,
                count,
                registeredContracts,
            } = await handleInput(
                input,
                liveObject.name,
                liveObject.LiveObjectClass,
                handler,
                false
            )
            if (outputEventName) {
                outputsBreakdown[outputEventName] = (outputsBreakdown[outputEventName] || 0) + count
            }
            numOutputEvents += count
            newContracts.push(...registeredContracts)
        }
    }

    console.log(
        chalk.cyanBright(
            numOutputEvents === 0
                ? `\nNo output events curated.`
                : `\nCurated ${numOutputEvents} output event${numOutputEvents === 1 ? '' : 's'}:`
        )
    )

    const maxOutputNameLength = Math.max(...Object.keys(outputsBreakdown).map((n) => n.length))
    for (const name in outputsBreakdown) {
        console.log(
            `${chalk.gray('--')} ${padToLength(name, maxOutputNameLength)}  ${chalk.cyanBright(
                outputsBreakdown[name].toLocaleString()
            )}`
        )
    }

    if (newContracts.length) {
        console.log(
            chalk.yellowBright(
                `\nRegistered ${newContracts.length} new contract${
                    newContracts.length === 1 ? '' : 's'
                }:`
            )
        )
        newContracts.forEach(({ address, group, chainId }) => {
            console.log(
                `${chalk.gray('--')} ${address} ${chalk.gray('|')} ${chalk.yellowBright(
                    group
                )} ${chalk.gray('|')} ${chainId}`
            )
        })
    }

    return { inputsBreakdown, outputsBreakdown }
}

async function streamTestData(
    inputEventsMap: StringKeyMap,
    inputCallsMap: StringKeyMap,
    liveObjectsMap: StringKeyMap,
    liveObjectTableForName: StringKeyMap,
    options: StringKeyMap,
    subscribeToInputs: Function | null,
    aggregateInputsBreakdown: StringKeyMap = {},
    aggregateOutputsBreakdown: StringKeyMap = {},
    cursor?: string,
    streamId?: string
) {
    const { data, error } = await fetchTestData(
        buildStreamTestDataPayload(inputEventsMap, inputCallsMap, options, cursor, streamId),
        options.apiKey
    )
    if (error) {
        console.error(chalk.red(error))
        return
    }

    const { inputsBreakdown, outputsBreakdown } = await processTestDataInputs(
        data.inputs || [],
        inputEventsMap,
        inputCallsMap,
        liveObjectsMap
    )
    for (const name in inputsBreakdown) {
        aggregateInputsBreakdown[name] =
            (aggregateInputsBreakdown[name] || 0) + inputsBreakdown[name]
    }
    for (const name in outputsBreakdown) {
        aggregateOutputsBreakdown[name] =
            (aggregateOutputsBreakdown[name] || 0) + outputsBreakdown[name]
    }

    if (data.cursor) {
        return streamTestData(
            inputEventsMap,
            inputCallsMap,
            liveObjectsMap,
            liveObjectTableForName,
            options,
            subscribeToInputs,
            aggregateInputsBreakdown,
            aggregateOutputsBreakdown,
            data.cursor,
            data.streamId
        )
    }

    console.log(`\n================================================================\n`)

    console.log(chalk.green(`Final inputs breakdown:`))
    const maxInputNameLength = Math.max(
        ...Object.keys(aggregateInputsBreakdown).map((n) => n.length)
    )
    for (const name in aggregateInputsBreakdown) {
        console.log(
            `${chalk.gray('--')} ${padToLength(name, maxInputNameLength)}  ${chalk.green(
                aggregateInputsBreakdown[name].toLocaleString()
            )}`
        )
    }

    console.log(chalk.cyanBright(`\nFinal outputs breakdown:`))
    const maxOutputNameLength = Math.max(
        ...Object.keys(aggregateOutputsBreakdown).map((n) => n.length)
    )
    for (const name in aggregateOutputsBreakdown) {
        console.log(
            `${chalk.gray('--')} ${padToLength(name, maxOutputNameLength)}  ${chalk.cyanBright(
                aggregateOutputsBreakdown[name].toLocaleString()
            )}`
        )
    }

    const tableCountPromises = []
    const liveObjectNames = []
    for (const liveObjectName in liveObjectTableForName) {
        liveObjectNames.push(liveObjectName)
        const tablePath = liveObjectTableForName[liveObjectName]
        tableCountPromises.push(getTableCount(tablePath))
    }
    const tableCounts = await Promise.all(tableCountPromises)

    console.log(chalk.magenta(`\nFinal records count:`))
    const maxLiveObjectNameLength = Math.max(...liveObjectNames.map((n) => n.length))

    for (let i = 0; i < liveObjectNames.length; i++) {
        const liveObjectName = liveObjectNames[i]
        const tableCount = tableCounts[i]
        console.log(
            `${chalk.gray('--')} ${padToLength(
                liveObjectName,
                maxLiveObjectNameLength
            )}  ${chalk.magenta(tableCount.toLocaleString())}`
        )
    }

    console.log(`\n================================================================\n`)

    subscribeToInputs && subscribeToInputs()
}

async function run() {
    const options = parseOptions()

    // Get all Live Object specs inside the given parent folders.
    const liveObjects = await getLiveObjectSpecs()
    if (!liveObjects.length) return

    // Import Live Objects and map them by path.
    const liveObjectsMap = await buildLiveObjectsMap(liveObjects, options.apiKey)
    if (liveObjectsMap === null) return

    // Map all input events & calls to the Live Objects that depend on them.
    const inputEventsMap = createInputEventsMap(liveObjectsMap)
    const inputCallsMap = createInputCallsMap(liveObjectsMap)

    // Upsert each Live Object's postgres table.
    const tables = []
    const liveObjectTableForName = {}
    for (const key in liveObjectsMap) {
        const tablePath = await upsertLiveObjectTable(liveObjectsMap[key].liveObjectInstance)
        tables.push(tablePath)
        liveObjectTableForName[liveObjectsMap[key].name] = tablePath
    }

    // Project API key needs to exist to pull test data from the event network.
    const apiKey = options.apiKey
    if (!apiKey) {
        console.log(
            `No api key found for the current project.\n` +
                `Try running the "spec use project <namespace>/<project>" command.`
        )
        return
    }

    // Subscribe to all input events & calls.
    let subscribeToInputs
    if (Object.keys(inputEventsMap).length || Object.keys(inputCallsMap).length) {
        subscribeToInputs = () =>
            subscribeToEventsAndCalls(apiKey, inputEventsMap, inputCallsMap, liveObjectsMap)
    } else {
        console.log(chalk.yellow('No input events or calls to subscribe to.'))
    }

    // Reset live table data before each test unless specified.
    options.keepData || (await clearTables(tables))

    serve(
        router({
            'POST@/query': onQueryRoute,
            'POST@/tx': onTxRoute,
        }),
        {
            port: options.port || 8000,
            onListen({ port }) {
                console.log(`Shared Tables API listening on port ${port}...`)
                const shouldFetchHistoricalTestData =
                    options.from ||
                    options.fromBlock ||
                    options.to ||
                    options.toBlock ||
                    options.recent ||
                    options.allTime

                shouldFetchHistoricalTestData
                    ? streamTestData(
                          inputEventsMap,
                          inputCallsMap,
                          liveObjectsMap,
                          liveObjectTableForName,
                          options,
                          subscribeToInputs
                      )
                    : subscribeToInputs()
            },
        }
    )
}

run()
