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
