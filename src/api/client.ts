import { routes, buildUrl } from './routes'
import { get, post } from '../utils/request'
import constants from '../constants'
import {
    LinkProjectResponse,
    LoginResponse,
    RegisterContractsResponse,
    GetContractRegistrationJobResponse,
    GetAbiResponse,
    CreateContractGroupResponse,
    GetContractGroupResponse,
    GetContractGroupEventsResponse,
    ResolveEventVersionCursorsResponse,
    ResolveEventVersionDataAfterResponse,
    GetPublishLiveObjectVersionJobResponse,
    GetLiveObjectVersionResponse,
    StringMap,
    StringKeyMap,
    LiveObjectVersion,
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

async function logs(projectId: string, sessionToken: string, tail: number, env?: string) {
    const params: any = { id: projectId, tail: tail }
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

async function getAbi(group: string): Promise<GetAbiResponse> {
    const { data: resp, error } = await get(buildUrl(routes.GET_ABI), { group }, {}, false)
    return error ? { error } : { abi: resp.abi ? JSON.stringify(resp.abi, null, 4) : '' }
}

async function registerContracts(
    sessionToken: string,
    chainId: string,
    nsp: string,
    name: string,
    addresses: string[],
    abi: StringKeyMap[]
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

async function createContractGroup(
    sessionToken: string,
    nsp: string,
    name: string,
    isFactoryGroup: boolean,
    abi: StringKeyMap[]
): Promise<CreateContractGroupResponse> {
    const { error } = await post(
        buildUrl(routes.CREATE_CONTRACT_GROUP),
        {
            nsp,
            name,
            isFactoryGroup,
            abi,
        },
        formatAuthHeader(sessionToken)
    )
    return { error }
}

async function getContractGroup(group: string): Promise<GetContractGroupResponse> {
    const { error, data } = await get(buildUrl(routes.GET_CONTRACT_GROUP), {
        group,
    })
    return error ? { error } : { instances: data?.instances || {} }
}

async function getContractGroupEvents(group: string): Promise<GetContractGroupEventsResponse> {
    const { error, data } = await get(buildUrl(routes.GET_CONTRACT_GROUP_EVENTS), {
        group,
    })
    return error ? { error } : { events: data?.events || [] }
}

async function resolveEventVersionCursors(
    givenName: string
): Promise<ResolveEventVersionCursorsResponse> {
    const { error, data } = await post(buildUrl(routes.RESOLVE_EVENT_VERSION_CURSORS), {
        givenName,
    })
    return error ? { error } : { cursors: data?.cursors || [], latestEvent: data?.latestEvent }
}

async function getEventVersionDataAfter(
    cursors: StringKeyMap
): Promise<ResolveEventVersionDataAfterResponse> {
    const { error, data } = await post(buildUrl(routes.GET_EVENT_VERSION_DATA_AFTER), { cursors })
    return error ? { error } : { events: data?.events || {} }
}

async function getLiveObjectVersion(id: string): Promise<GetLiveObjectVersionResponse> {
    const { error, data } = await get(buildUrl(routes.GET_LIVE_OBJECT_VERSION), { id })
    return error ? { error } : { lov: data as LiveObjectVersion }
}

async function publishLiveObjectVersion(
    nsp: string,
    name: string,
    version: string,
    folder: string,
    sessionToken: string
): Promise<StringMap> {
    const { data, error } = await post(
        buildUrl(routes.PUBLISH_LIVE_OBJECT_VERSION),
        {
            nsp,
            name,
            version,
            folder,
        },
        formatAuthHeader(sessionToken)
    )
    return error ? { error } : data
}

async function getPublishLiveObjectVersionJob(
    sessionToken: string,
    uid: string
): Promise<GetPublishLiveObjectVersionJobResponse> {
    const { data, error } = await get(
        buildUrl(routes.GET_PUBLISH_LIVE_OBJECT_VERSION_JOB),
        { uid },
        formatAuthHeader(sessionToken)
    )
    return error ? { error } : data
}

export const client = {
    login,
    getProject,
    logs,
    getAbi,
    registerContracts,
    getContractRegistrationJob,
    createContractGroup,
    getContractGroup,
    getContractGroupEvents,
    resolveEventVersionCursors,
    getEventVersionDataAfter,
    getLiveObjectVersion,
    publishLiveObjectVersion,
    getPublishLiveObjectVersionJob,
}
