import uuid4 from 'uuid4'

export function newPassword(): string {
    return uuid4().replace(/-/g, '')
}
