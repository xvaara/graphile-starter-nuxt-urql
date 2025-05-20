import { randomBytes } from 'node:crypto'

export function safeRandomString(length) {
  // Validate input
  if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
    throw new TypeError('Length must be a positive integer')
  }
  // Roughly equivalent to shell `openssl rand -base64 30 | tr '+/' '-_'`
  try {
    return randomBytes(length)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '') // Remove padding characters if needed
  }
  catch (error) {
    throw new Error(`Failed to generate random string: ${error.message}`)
  }
}
