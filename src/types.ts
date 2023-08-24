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

export interface GetABIResponse {
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

export interface GetPublishLiveObjectVersionJobResponse {
    uid?: string
    nsp?: string
    name?: string
    version?: string
    status?: PublishLiveObjectVersionJobStatus
    cursor?: string
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

export enum ContractRegistrationJobStatus {
    Created = 'created',
    Decoding = 'decoding',
    Indexing = 'indexing',
    Complete = 'complete',
}

export enum PublishLiveObjectVersionJobStatus {
    Created = 'created',
    Migrating = 'migrating',
    Publishing = 'publishing',
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
    version: string
}
