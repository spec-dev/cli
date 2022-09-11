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
