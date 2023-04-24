import { StringMap } from '../types'

export const chainIds: StringMap = {
    ETHEREUM: '1',
    GOERLI: '5',
    POLYGON: '137',
    MUMBAI: '80001',
}

export const chainIdsSet = new Set(Object.values(chainIds))
