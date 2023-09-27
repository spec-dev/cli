import { StringMap } from '../types'

export const chainIds: StringMap = {
    ETHEREUM: '1',
    GOERLI: '5',
    POLYGON: '137',
    MUMBAI: '80001',
    BASE: '8453',
}

export const chainNameForId = {
    [chainIds.ETHEREUM]: 'ethereum',
    [chainIds.GOERLI]: 'goerli',
    [chainIds.POLYGON]: 'polygon',
    [chainIds.MUMBAI]: 'mumbai',
    [chainIds.BASE]: 'base',
}

export const chainIdsSet = new Set(Object.values(chainIds))
