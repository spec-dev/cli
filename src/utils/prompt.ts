import { StringKeyMap } from '../types'
import qoa from 'qoa'
import chalk from 'chalk'
import prompts from 'prompts'
import { formatEventVersions, getEventVersions } from '../services/eventVersionServices'

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
    query: `${chalk.cyanBright('*')} Namespace:`,
    handle: 'namespace',
}

const NAME_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Name:`,
    handle: 'name',
}

const CHAIN_IDS_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Chain ids ${chalk.gray(`(e.g. "1, 5, 137"):`)}`,
    handle: 'chainIds',
}

const CHAIN_ID_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Chain id ${chalk.gray(`(e.g. "1"):`)}`,
    handle: 'chainId',
}

const DISPLAY_NAME_PROMPT = {
    type: 'input',
    query: `${chalk.gray('?')} Display name ${chalk.gray('(optional):')}`,
    handle: 'displayName',
}

const DESCRIPTION_PROMPT = {
    type: 'input',
    query: `${chalk.gray('?')} Description ${chalk.gray('(optional):')}`,
    handle: 'description',
}

const CONTRACT_GROUP_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Group name ${chalk.gray(`(e.g. "gitcoin.GovernorAlpha"):`)}`,
    handle: 'group',
}

const ABI_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Path to ABI ${chalk.gray(`(e.g. "./abis/Contract.json"):`)}`,
    handle: 'abi',
}

const OPTIONAL_ABI_PROMPT = {
    type: 'input',
    query: `${chalk.gray('?')} Path to ABI ${chalk.gray('(optional if group already exists):')}`,
    handle: 'abi',
}

const CONTRACT_ADDRESSES_PROMPT = {
    type: 'input',
    query: `${chalk.cyanBright('*')} Contract addresses ${chalk.gray(`(e.g. "0xabc, 0x123"):`)}`,
    handle: 'addresses',
}

const IS_FACTORY_PROMPT = {
    type: 'confirm',
    name: 'value',
    message: 'Factory contract? ',
    accept: 'Y',
    deny: 'n',
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

    return {
        namespace,
        name,
        chainIds,
        displayName,
        description,
    }
}

export async function promptCreateContractGroupDetails(
    group?: string,
    chainIds?: string,
    abi?: string,
    isFactory?: boolean
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

    // Required
    while (isFactory === null) {
        isFactory = (await prompts(IS_FACTORY_PROMPT)).value
    }

    return { group, chainIds, abi, isFactory }
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

export async function getFactoryEvent(contractGroup: string): Promise<StringKeyMap[]> {
    let factoryEventId
    let addressProperty
    let cachedResults
    let useInitialInput = true

    factoryEventId = (
        await prompts({
            type: 'autocomplete',
            name: 'searchId',
            message: 'Search for factory event: ',
            choices: ['', '', '', '', '', ''],
            fallback: ' ',
            suggest: async (input, choices) => {
                let results = useInitialInput
                    ? await getEventVersions(contractGroup)
                    : await getEventVersions(input)
                useInitialInput = false
                if (!results.length) {
                    return []
                }
                cachedResults = results
                const displayResults = await formatEventVersions(results)
                return displayResults
            },
        })
    ).searchId

    if (!factoryEventId) return []

    const factoryEvent = cachedResults.find((result) => result.searchId === factoryEventId)
    const properties = factoryEvent.addressProperties.map((prop) => {
        return {
            title: prop,
            value: prop,
        }
    })

    if (!properties.length) return [factoryEventId]

    addressProperty = (
        await prompts({
            type: 'select',
            message: 'Which property is the contract address?',
            name: 'property',
            symbol: '>',
            fallback: 'No properties available',
            choices: properties,
        })
    ).property

    return [factoryEventId, addressProperty]
}
