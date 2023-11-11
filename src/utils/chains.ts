import { StringMap } from '../types'

export const chainIds: StringMap = {
    ETHEREUM: '1',
    GOERLI: '5',
    POLYGON: '137',
    MUMBAI: '80001',
    BASE: '8453',
    OPTIMISM: '10',
    ARBITRUM: '42161',
    PGN: '424',
    CELO: '42220',
    LINEA: '59144',
}

export const chainNameForId = {
    [chainIds.ETHEREUM]: 'ethereum',
    [chainIds.GOERLI]: 'goerli',
    [chainIds.POLYGON]: 'polygon',
    [chainIds.MUMBAI]: 'mumbai',
    [chainIds.BASE]: 'base',
    [chainIds.OPTIMISM]: 'optimism',
    [chainIds.ARBITRUM]: 'arbitrum',
    [chainIds.PGN]: 'pgn',
    [chainIds.CELO]: 'celo',
    [chainIds.LINEA]: 'linea',
}

export const chainIdsSet = new Set(Object.values(chainIds))
