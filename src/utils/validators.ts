import fs from 'fs'
import path from 'path'

export function isValidPath(p): boolean {
    try {
        fs.accessSync(path.resolve(p))
        return true
    } catch (err) {
        return false
    }
}

export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidContractGroup(group: string): boolean {
    const comps = (group || '').split('.').filter((v) => !!v)
    return comps.length === 2
}

export function couldBeEventName(value: string): boolean {
    let nameSection = value || ''
    if (nameSection.includes('@')) {
        nameSection = nameSection.split('@')[0]
    }
    const nameSectionComps = nameSection.split('.').filter((v) => !!v)
    return nameSectionComps.length >= 2
}
