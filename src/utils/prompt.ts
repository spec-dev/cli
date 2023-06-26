import { StringKeyMap } from '../types'
import qoa from 'qoa'
import chalk from 'chalk'

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
    query: `Chain ids ${chalk.gray(`(e.g. "1, 5, 137"):`)}`,
    handle: 'chainIds',
}

const CHAIN_ID_PROMPT = {
    type: 'input',
    query: `Chain id ${chalk.gray(`(e.g. "1"):`)}`,
    handle: 'chainId',
}

const DISPLAY_NAME_PROMPT = {
    type: 'input',
    query: `Display Name (optional):`,
    handle: 'displayName',
}

const DESCRIPTION_PROMPT = {
    type: 'input',
    query: `Description (optional):`,
    handle: 'description',
}

const INPUT_EVENTS_PROMPT = {
    type: 'input',
    query: `Input Events (optional):`,
    handle: 'inputEvents',
}

const INPUT_CALLS_PROMPT = {
    type: 'input',
    query: `Input Contract Calls (optional):`,
    handle: 'inputCalls',
}

const CONTRACT_GROUP_PROMPT = {
    type: 'input',
    query: `Group name ${chalk.gray(`(e.g. "gitcoin.GovernorAlpha"):`)}`,
    handle: 'group',
}

const ABI_PROMPT = {
    type: 'input',
    query: `Path to ABI ${chalk.gray(`(e.g. "./abis/Contract.json"):`)}`,
    handle: 'abi',
}

const OPTIONAL_ABI_PROMPT = {
    type: 'input',
    query: `Path to ABI ${chalk.gray('(Optional if group already exists):')}`,
    handle: 'abi',
}

const CONTRACT_ADDRESSES_PROMPT = {
    type: 'input',
    query: `Contract addresses ${chalk.gray(`(e.g. "0xabc, 0x123"):`)}`,
    handle: 'addresses',
}

function stripWrappedQuotes(val: string): string {
    if (!val) return val
    if (val[0] === '"') {
        val = val.slice(1)
    }
    if (val[val.length - 1] === '"') {
        val = val.slice(0, val.length - 1)
    }
    return val
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
        chainIds = stripWrappedQuotes((await qoa.prompt([CHAIN_IDS_PROMPT])).chainIds)
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

export async function promptCreateContractGroupDetails(
    group?: string,
    chainIds?: string,
    abi?: string
): Promise<StringKeyMap> {
    // Required
    while (!group) {
        group = stripWrappedQuotes((await qoa.prompt([CONTRACT_GROUP_PROMPT])).group)
    }

    // Required
    while (!chainIds) {
        chainIds = stripWrappedQuotes((await qoa.prompt([CHAIN_IDS_PROMPT])).chainIds)
    }

    // Required
    while (!abi) {
        abi = stripWrappedQuotes((await qoa.prompt([ABI_PROMPT])).abi)
    }

    return { group, chainIds, abi }
}

export async function promptAddContractsDetails(
    addresses: string,
    chainId?: string,
    group?: string,
    abi?: string
): Promise<StringKeyMap> {
    // Required
    while (!chainId) {
        chainId = stripWrappedQuotes((await qoa.prompt([CHAIN_ID_PROMPT])).chainId)
    }

    // Required
    while (!addresses) {
        addresses = stripWrappedQuotes((await qoa.prompt([CONTRACT_ADDRESSES_PROMPT])).addresses)
    }

    // Required
    while (!group) {
        group = stripWrappedQuotes((await qoa.prompt([CONTRACT_GROUP_PROMPT])).group)
    }

    // Optional
    abi = stripWrappedQuotes((await qoa.prompt([OPTIONAL_ABI_PROMPT])).abi)

    return { addresses, chainId, group, abi }
}
