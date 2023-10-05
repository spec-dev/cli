export type StringKeyMap = { [key: string]: any }

export type StringMap = { [key: string]: string }

export type AnyMap = { [key: string | number]: any }

export interface SpecApiResponse {
    data?: StringKeyMap
    error?: string
    headers?: any
}

export interface LoginResponse {
    sessionToken?: string
    error?: string
    message?: string
}

export interface LinkProjectResponse {
    id?: string
    name?: string
    namespace?: string
    apiKey?: string
    metadata?: StringKeyMap
    error?: string
}

export interface GetAbiResponse {
    abi?: string
    error?: string
    message?: string
}
export interface RegisterContractsResponse {
    uid?: string
    error?: string
}

export interface GetContractRegistrationJobResponse {
    uid?: string
    nsp?: string
    contractName?: string
    addresses?: string[]
    chainId?: string
    status?: ContractRegistrationJobStatus
    cursors?: StringKeyMap
    failed?: boolean
    error?: string
    createdAt?: string
    updatedAt?: string
}

export interface CreateContractGroupResponse {
    error?: string
}

export interface GetContractGroupResponse {
    error?: string
    instances?: StringKeyMap
}

export interface GetContractGroupEventsResponse {
    error?: string
    events?: StringKeyMap[]
}

export interface ResolveEventVersionCursorsResponse {
    error?: string
    cursors?: StringKeyMap[]
    latestEvent?: StringKeyMap
}

export interface ResolveEventVersionDataAfterResponse {
    error?: string
    events?: StringKeyMap
}

export interface GetLiveObjectVersionResponse {
    error?: string
    lov?: LiveObjectVersion
}

export enum ContractRegistrationJobStatus {
    Created = 'created',
    Decoding = 'decoding',
    Indexing = 'indexing',
    Complete = 'complete',
}

export interface Log {
    message: string
    level: LogLevel
    timestamp: string
}

export enum LogLevel {
    Info = 'info',
    Warn = 'warn',
    Error = 'error',
}

export interface Migration {
    name: string
    version: number
}

export interface LiveObjectVersion {
    id: string
    name: string
    properties: LiveObjectVersionProperty[]
    primaryTimestampProperty: string
    uniqueBy: string[]
    createdAt: string
}

export interface LiveObjectVersionProperty {
    name: string
    type: string
    desc: string
}
