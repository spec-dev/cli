import constants from '../constants'

const prefix = {
    USER: 'user',
    PROJECT: 'project',
    DEPLOYMENT: 'deployment',
}

export const routes = {
    LOGIN: [constants.SPEC_API_ORIGIN, prefix.USER, 'login'].join('/'),
    LINK_PROJECT: [constants.SPEC_API_ORIGIN, prefix.PROJECT, 'with-key'].join('/'),
    CREATE_DEPLOYMENT: [constants.SPEC_API_ORIGIN, prefix.DEPLOYMENT].join('/'),
}
