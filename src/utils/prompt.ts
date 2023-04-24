import { StringKeyMap } from '../types'
import qoa from 'qoa'

const EMAIL_PROMPT = {
    type: 'input',
    query: 'Email:',
    handle: 'email',
}

const PASSWORD_PROMPT = {
    type: 'secure',
    query: 'Password:',
    handle: 'password',
}

const NAMESPACE_PROMPT = {
    type: 'input',
    query: 'Namespace:',
    handle: 'namespace',
}

const NAME_PROMPT = {
    type: 'input',
    query: 'Name:',
    handle: 'name',
}

const CHAIN_IDS_PROMPT = {
    type: 'input',
    query: 'Chain ids (1, 137, ...):',
    handle: 'chainIds',
}

const DISPLAY_NAME_PROMPT = {
    type: 'input',
    query: 'Display Name (optional):',
    handle: 'displayName',
}

const DESCRIPTION_PROMPT = {
    type: 'input',
    query: 'Description (optional):',
    handle: 'description',
}

const INPUT_EVENTS_PROMPT = {
    type: 'input',
    query: 'Input Events (optional):',
    handle: 'inputEvents',
}

const INPUT_CALLS_PROMPT = {
    type: 'input',
    query: 'Input Contract Calls (optional):',
    handle: 'inputCalls',
}

export async function promptEmailPassword(): Promise<StringKeyMap> {
    let email = ''
    while (!email) {
        email = (await qoa.prompt([EMAIL_PROMPT])).email
    }

    let password = ''
    while (!password) {
        password = (await qoa.prompt([PASSWORD_PROMPT])).password
    }

    return { email, password }
}

export async function promptNewLiveObjectDetails(
    namespace?: string,
    name?: string
): Promise<StringKeyMap> {
    // Required
    while (!namespace) {
        namespace = (await qoa.prompt([NAMESPACE_PROMPT])).namespace
    }

    // Required
    while (!name) {
        name = (await qoa.prompt([NAME_PROMPT])).name
    }

    // Required
    let chainIds = ''
    while (!chainIds) {
        chainIds = (await qoa.prompt([CHAIN_IDS_PROMPT])).chainIds
    }

    // Optional
    const displayName = (await qoa.prompt([DISPLAY_NAME_PROMPT])).displayName
    const description = (await qoa.prompt([DESCRIPTION_PROMPT])).description
    const inputEvents = (await qoa.prompt([INPUT_EVENTS_PROMPT])).inputEvents
    const inputCalls = (await qoa.prompt([INPUT_CALLS_PROMPT])).inputCalls

    return {
        namespace,
        name,
        chainIds,
        displayName,
        description,
        inputEvents,
        inputCalls,
    }
}
