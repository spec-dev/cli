import { routes } from './routes'
import { get, post } from '../utils/request'
import constants from '../constants'
import { LoginResponse } from '../types'

async function login(email: string, password: string): Promise<LoginResponse | null> {
    // Perform login request.
    const { data, headers, error } = await post(routes.LOGIN, { email, password })
    if (error) return { error }

    // Get new session token from response headers.
    const sessionToken = headers.get(constants.USER_AUTH_HEADER_NAME)
    return { sessionToken, message: data.message }
}

async function linkProject(projectId: string) {

}

async function deploy(projectId: string) {

}

export const client = {
    login,
    linkProject,
    deploy,
}