import { routes } from './routes'
import { get, post } from '../utils/request'
import constants from '../constants'
import { LinkProjectResponse, LoginResponse, StringMap } from '../types'

const formatAuthHeader = (sessionToken: string): StringMap => ({
    [constants.USER_AUTH_HEADER_NAME]: sessionToken,
})

async function login(email: string, password: string): Promise<LoginResponse> {
    // Perform login request.
    const { data, headers, error } = await post(routes.LOGIN, { email, password })
    if (error) return { error }

    // Get new session token from response headers.
    const sessionToken = headers.get(constants.USER_AUTH_HEADER_NAME)
    return { sessionToken, message: data.message }
}

async function linkProject(
    org: string,
    project: string,
    sessionToken: string
): Promise<LinkProjectResponse> {
    // Perform link request.
    const { data, error } = await get(
        routes.LINK_PROJECT,
        { org, project },
        formatAuthHeader(sessionToken)
    )
    if (error) return { error }

    // Return project info.
    return {
        id: data.id || '',
        name: data.slug || '',
        org: data.org?.slug || '',
        apiKey: data.apiKey,
    }
}

async function logs(projectId: string, sessionToken: string) {
    // Perform logs request.
    const { data: resp, error } = await get(
        routes.PROJECT_LOGS,
        { id: projectId },
        formatAuthHeader(sessionToken),
        true
    )
    if (error) return { error }

    if (resp?.status !== 200) {
        return { error: `Request failed with status ${resp?.status}.` }
    }

    return { data: resp.body }
}

async function deploy(projectId: string) {}

export const client = {
    login,
    linkProject,
    logs,
    deploy,
}
