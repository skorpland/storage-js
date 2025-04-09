import { AuthClient } from '@skorpland/auth-js'
import { PowerbaseAuthClientOptions } from './types'

export class PowerbaseAuthClient extends AuthClient {
  constructor(options: PowerbaseAuthClientOptions) {
    super(options)
  }
}
