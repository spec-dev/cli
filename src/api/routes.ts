import { getCurrentEnv } from '../config/global'
import constants from '../constants'
import { SpecEnv } from '../types'
import { removeTrailingSlash } from '../utils/formatters'

const prefix = {
    USER: 'user',
    PROJECT: 'project',
    DEPLOYMENT: 'deployment',
}

export const routes = {
    LOGIN: [prefix.USER, 'login'].join('/'),
    GET_PROJECT: [prefix.PROJECT, 'with-key'].join('/'),
    CREATE_DEPLOYMENT: [prefix.DEPLOYMENT].join('/'),
    PROJECT_LOGS: [prefix.PROJECT, 'logs'].join('/'),
}

export const buildUrl = (route: string) => {
    if (constants.SPEC_API_ORIGIN) {
        return [removeTrailingSlash(constants.SPEC_API_ORIGIN), route].join('/')
    }

    const { data: env } = getCurrentEnv()
    switch (env) {
        case SpecEnv.Dev:
            return [constants.SPEC_DEV_API_0RIGIN, route].join('/')
        default:
            return [constants.SPEC_PROD_API_0RIGIN, route].join('/')
    }
}
