import constants from '../constants'
import { removeTrailingSlash } from '../utils/formatters'

const prefix = {
    USER: 'user',
    PROJECT: 'project',
    DEPLOYMENT: 'deployment',
    CONTRACT_INSTANCE: 'contract-instance',
}

export const routes = {
    LOGIN: [prefix.USER, 'login'].join('/'),
    GET_PROJECT: [prefix.PROJECT, 'with-key'].join('/'),
    CREATE_DEPLOYMENT: [prefix.DEPLOYMENT].join('/'),
    PROJECT_LOGS: [prefix.PROJECT, 'logs'].join('/'),
    REGISTER_CONTRACT: [prefix.CONTRACT_INSTANCE, 'register'].join('/'),
}

export const buildUrl = (route: string) => {
    return [removeTrailingSlash(constants.SPEC_API_ORIGIN), route].join('/')
}
