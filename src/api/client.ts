import { routes, buildUrl } from './routes'
import { get, post } from '../utils/request'
import constants from '../constants'
import { log, logSuccess } from '../logger'
import { LinkProjectResponse, LoginResponse, StringMap } from '../types'

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

async function registerContract(
    sessionToken: string,
    nsp: string,
    chainId: string,
    address: string,
    contractName: string,
    contractDesc: string,
    abi: string
) {
    const { data, error: registerContractError } = await post(
        buildUrl(routes.REGISTER_CONTRACT),
        {
            nsp,
            chainId,
            contracts: [
                {
                    name: contractName,
                    desc: contractDesc,
                    instances: [
                        {
                            address,
                            name: contractName,
                            desc: '',
                            abi,
                        },
                    ],
                },
            ]
        },
        formatAuthHeader(sessionToken)
    )
    if (registerContractError) return { registerContractError }
    const { uid } = data

    let status
    do {
        const { data, error } = await post(
            buildUrl(routes.REGISTER_CONTRACT_PROGRESS),
            { uid },
            formatAuthHeader(sessionToken)
        )
        if (error) return { error }
        const { status: curStatus, cursor, failed, error: registerContractProgressError } = data
        status = curStatus
        log(`Current status: ${status} ${cursor}`)
        if (status !== 'complete') {
            await sleep(1000)
        }
    } while (status !== 'complete')
    logSuccess('Contract registered successfully')

    return { error: null }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export const client = {
    login,
    getProject,
    logs,
    registerContract,
}
