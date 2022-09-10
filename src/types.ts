export type StringKeyMap = { [key: string]: any }

export type StringMap = { [key: string]: string }

export interface SpecApiResponse {
    data?: StringKeyMap,
    error?: string,
    headers?: any
}

export interface LoginResponse {
    sessionToken?: string
    error?: string
    message?: string
}