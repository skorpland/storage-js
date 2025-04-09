import { PowerbaseAuthClient } from '../src/lib/PowerbaseAuthClient'
import PowerbaseClient from '../src/PowerbaseClient'
import { DEFAULT_HEADERS } from '../src/lib/constants'

const DEFAULT_OPTIONS = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: DEFAULT_HEADERS,
  },
  db: {
    schema: 'public',
  },
}
const settings = { ...DEFAULT_OPTIONS }

const authSettings = { ...settings.global, ...settings.auth }

test('it should create a new instance of the class', () => {
  const authClient = new PowerbaseAuthClient(authSettings)
  expect(authClient).toBeInstanceOf(PowerbaseAuthClient)
})

test('_initPowerbaseAuthClient should overwrite authHeaders if headers are provided', () => {
  const authClient = new PowerbaseClient('https://example.powerbase.club', 'powerbaseKey')[
    '_initPowerbaseAuthClient'
  ](authSettings, {
    Authorization: 'Bearer custom-auth-header',
  })
  expect(authClient['headers']['Authorization']).toBe('Bearer custom-auth-header')
  expect(authClient['headers']['apikey']).toBe('powerbaseKey')
})
