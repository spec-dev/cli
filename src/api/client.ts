import { routes, buildUrl } from './routes'
import { get, post } from '../utils/request'
import constants from '../constants'
import {
    LinkProjectResponse,
    LoginResponse,
    RegisterContractsResponse,
    GetContractRegistrationJobResponse,
    GetABIResponse,
    StringMap,
} from '../types'

const formatAuthHeader = (sessionToken: string): StringMap => ({
    [constants.USER_AUTH_HEADER_NAME]: sessionToken,
})

async function login(email: string, password: string): Promise<LoginResponse> {
    // Perform login request.
    const { data, headers, error } = await post(buildUrl(routes.LOGIN), { email, password })
    if (error) return { error }

    // Get new session token from response headers.
    const sessionToken = headers.get(constants.USER_AUTH_HEADER_NAME)
    return { sessionToken, message: data.message }
}

async function getProject(
    namespace: string,
    project: string,
    sessionToken: string
): Promise<LinkProjectResponse> {
    // Perform link request.
    const { data, error } = await get(
        buildUrl(routes.GET_PROJECT),
        { namespace, project },
        formatAuthHeader(sessionToken)
    )
    if (error) return { error }

    // Return project info.
    return {
        id: data.id || '',
        name: data.slug || '',
        namespace: data.namespace?.name || '',
        apiKey: data.apiKey,
        metadata: data.metadata || {},
    }
}

async function logs(projectId: string, sessionToken: string, env?: string) {
    const params: any = { id: projectId }
    if (env) {
        params.env = env
    }

    // Perform logs request.
    const { data: resp, error } = await get(
        buildUrl(routes.PROJECT_LOGS),
        params,
        formatAuthHeader(sessionToken),
        true
    )
    if (error) return { error }

    if (resp?.status !== 200) {
        return { error: `Request failed with status ${resp?.status}.` }
    }

    return { data: resp.body }
}

async function getABI(
    sessionToken: string,
    chainId: string,
    group: string
): Promise<GetABIResponse> {
    const { data: resp, error } = await get(
        buildUrl(routes.GET_ABI),
        { chainId, group },
        formatAuthHeader(sessionToken),
        false
    )
    if (error) return { error }

    // format ABI when returned
    return { abi: JSON.stringify(resp.abi, null, 4) }
}

async function registerContracts(
    sessionToken: string,
    chainId: string,
    nsp: string,
    name: string,
    addresses: string[],
    abi: string
): Promise<RegisterContractsResponse> {
    const { data, error } = await post(
        buildUrl(routes.REGISTER_CONTRACTS),
        {
            chainId,
            nsp,
            name,
            instances: addresses.map((address) => ({ address })),
            abi,
        },
        formatAuthHeader(sessionToken)
    )
    return error ? { error } : data
}

async function getContractRegistrationJob(
    sessionToken: string,
    uid: string
): Promise<GetContractRegistrationJobResponse> {
    const { data, error } = await get(
        buildUrl(routes.GET_CONTRACT_REGISTRATION_JOB),
        { uid },
        formatAuthHeader(sessionToken)
    )
    return error ? { error } : data
}

export const client = {
    login,
    getProject,
    logs,
    getABI,
    registerContracts,
    getContractRegistrationJob,
}
