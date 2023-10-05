import constants from '../constants'
import { removeTrailingSlash } from '../utils/formatters'

const prefix = {
    USER: 'user',
    PROJECT: 'project',
    DEPLOYMENT: 'deployment',
    CONTRACT_INSTANCES: 'contract-instances',
    CONTRACT_REGISTRATION_JOB: 'contract-registration-job',
    CONTRACT: 'contract',
    ABI: 'abi',
    EVENT_VERSION: 'event-version',
    LIVE_OBJECT_VERSION: 'live-object-version',
}

export const routes = {
    LOGIN: [prefix.USER, 'login'].join('/'),
    GET_PROJECT: [prefix.PROJECT, 'with-key'].join('/'),
    CREATE_DEPLOYMENT: [prefix.DEPLOYMENT].join('/'),
    PROJECT_LOGS: [prefix.PROJECT, 'logs'].join('/'),
    GET_ABI: prefix.ABI,
    REGISTER_CONTRACTS: [prefix.CONTRACT_INSTANCES, 'register'].join('/'),
    GET_CONTRACT_REGISTRATION_JOB: prefix.CONTRACT_REGISTRATION_JOB,
    CREATE_CONTRACT_GROUP: [prefix.CONTRACT, 'group'].join('/'),
    GET_CONTRACT_GROUP: [prefix.CONTRACT, 'group'].join('/'),
    GET_CONTRACT_GROUP_EVENTS: [prefix.CONTRACT, 'group', 'events'].join('/'),
    RESOLVE_EVENT_VERSION_CURSORS: [prefix.EVENT_VERSION + 's', 'resolve', 'cursors'].join('/'),
    GET_EVENT_VERSION_DATA_AFTER: [prefix.EVENT_VERSION + 's', 'data', 'after'].join('/'),
    GET_LIVE_OBJECT_VERSION: prefix.LIVE_OBJECT_VERSION,
}

export const buildUrl = (route: string) => {
    return [removeTrailingSlash(constants.SPEC_API_ORIGIN), route].join('/')
}
