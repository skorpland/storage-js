import { FunctionsClient } from '@skorpland/functions-js'
import { AuthChangeEvent } from '@skorpland/auth-js'
import {
  PostgrestClient,
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from '@skorpland/postgrest-js'
import {
  RealtimeChannel,
  RealtimeChannelOptions,
  RealtimeClient,
  RealtimeClientOptions,
} from '@skorpland/realtime-js'
import { StorageClient as PowerbaseStorageClient } from '@skorpland/storage-js'
import {
  DEFAULT_GLOBAL_OPTIONS,
  DEFAULT_DB_OPTIONS,
  DEFAULT_AUTH_OPTIONS,
  DEFAULT_REALTIME_OPTIONS,
} from './lib/constants'
import { fetchWithAuth } from './lib/fetch'
import { stripTrailingSlash, applySettingDefaults } from './lib/helpers'
import { PowerbaseAuthClient } from './lib/PowerbaseAuthClient'
import { Fetch, GenericSchema, PowerbaseClientOptions, PowerbaseAuthClientOptions } from './lib/types'

/**
 * Powerbase Client.
 *
 * An isomorphic Javascript client for interacting with Postgres.
 */
export default class PowerbaseClient<
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
> {
  /**
   * Powerbase Auth allows you to create and manage user sessions for access to data that is secured by access policies.
   */
  auth: PowerbaseAuthClient
  realtime: RealtimeClient

  protected realtimeUrl: string
  protected authUrl: string
  protected storageUrl: string
  protected functionsUrl: string
  protected rest: PostgrestClient<Database, SchemaName, Schema>
  protected storageKey: string
  protected fetch?: Fetch
  protected changedAccessToken?: string
  protected accessToken?: () => Promise<string | null>

  protected headers: Record<string, string>

  /**
   * Create a new client for use in the browser.
   * @param powerbaseUrl The unique Powerbase URL which is supplied when you create a new project in your project dashboard.
   * @param powerbaseKey The unique Powerbase Key which is supplied when you create a new project in your project dashboard.
   * @param options.db.schema You can switch in between schemas. The schema needs to be on the list of exposed schemas inside Powerbase.
   * @param options.auth.autoRefreshToken Set to "true" if you want to automatically refresh the token before expiring.
   * @param options.auth.persistSession Set to "true" if you want to automatically save the user session into local storage.
   * @param options.auth.detectSessionInUrl Set to "true" if you want to automatically detects OAuth grants in the URL and signs in the user.
   * @param options.realtime Options passed along to realtime-js constructor.
   * @param options.global.fetch A custom fetch implementation.
   * @param options.global.headers Any additional headers to send with each network request.
   */
  constructor(
    protected powerbaseUrl: string,
    protected powerbaseKey: string,
    options?: PowerbaseClientOptions<SchemaName>
  ) {
    if (!powerbaseUrl) throw new Error('powerbaseUrl is required.')
    if (!powerbaseKey) throw new Error('powerbaseKey is required.')

    const _powerbaseUrl = stripTrailingSlash(powerbaseUrl)

    this.realtimeUrl = `${_powerbaseUrl}/realtime/v1`.replace(/^http/i, 'ws')
    this.authUrl = `${_powerbaseUrl}/auth/v1`
    this.storageUrl = `${_powerbaseUrl}/storage/v1`
    this.functionsUrl = `${_powerbaseUrl}/functions/v1`

    // default storage key uses the powerbase project ref as a namespace
    const defaultStorageKey = `sb-${new URL(this.authUrl).hostname.split('.')[0]}-auth-token`
    const DEFAULTS = {
      db: DEFAULT_DB_OPTIONS,
      realtime: DEFAULT_REALTIME_OPTIONS,
      auth: { ...DEFAULT_AUTH_OPTIONS, storageKey: defaultStorageKey },
      global: DEFAULT_GLOBAL_OPTIONS,
    }

    const settings = applySettingDefaults(options ?? {}, DEFAULTS)

    this.storageKey = settings.auth.storageKey ?? ''
    this.headers = settings.global.headers ?? {}

    if (!settings.accessToken) {
      this.auth = this._initPowerbaseAuthClient(
        settings.auth ?? {},
        this.headers,
        settings.global.fetch
      )
    } else {
      this.accessToken = settings.accessToken

      this.auth = new Proxy<PowerbaseAuthClient>({} as any, {
        get: (_, prop) => {
          throw new Error(
            `@skorpland/powerbase-js: Powerbase Client is configured with the accessToken option, accessing powerbase.auth.${String(
              prop
            )} is not possible`
          )
        },
      })
    }

    this.fetch = fetchWithAuth(powerbaseKey, this._getAccessToken.bind(this), settings.global.fetch)
    this.realtime = this._initRealtimeClient({
      headers: this.headers,
      accessToken: this._getAccessToken.bind(this),
      ...settings.realtime,
    })
    this.rest = new PostgrestClient(`${_powerbaseUrl}/rest/v1`, {
      headers: this.headers,
      schema: settings.db.schema,
      fetch: this.fetch,
    })

    if (!settings.accessToken) {
      this._listenForAuthEvents()
    }
  }

  /**
   * Powerbase Functions allows you to deploy and invoke edge functions.
   */
  get functions(): FunctionsClient {
    return new FunctionsClient(this.functionsUrl, {
      headers: this.headers,
      customFetch: this.fetch,
    })
  }

  /**
   * Powerbase Storage allows you to manage user-generated content, such as photos or videos.
   */
  get storage(): PowerbaseStorageClient {
    return new PowerbaseStorageClient(this.storageUrl, this.headers, this.fetch)
  }

  // NOTE: signatures must be kept in sync with PostgrestClient.from
  from<
    TableName extends string & keyof Schema['Tables'],
    Table extends Schema['Tables'][TableName]
  >(relation: TableName): PostgrestQueryBuilder<Schema, Table, TableName>
  from<ViewName extends string & keyof Schema['Views'], View extends Schema['Views'][ViewName]>(
    relation: ViewName
  ): PostgrestQueryBuilder<Schema, View, ViewName>
  /**
   * Perform a query on a table or a view.
   *
   * @param relation - The table or view name to query
   */
  from(relation: string): PostgrestQueryBuilder<Schema, any, any> {
    return this.rest.from(relation)
  }

  // NOTE: signatures must be kept in sync with PostgrestClient.schema
  /**
   * Select a schema to query or perform an function (rpc) call.
   *
   * The schema needs to be on the list of exposed schemas inside Powerbase.
   *
   * @param schema - The schema to query
   */
  schema<DynamicSchema extends string & keyof Database>(
    schema: DynamicSchema
  ): PostgrestClient<
    Database,
    DynamicSchema,
    Database[DynamicSchema] extends GenericSchema ? Database[DynamicSchema] : any
  > {
    return this.rest.schema<DynamicSchema>(schema)
  }

  // NOTE: signatures must be kept in sync with PostgrestClient.rpc
  /**
   * Perform a function call.
   *
   * @param fn - The function name to call
   * @param args - The arguments to pass to the function call
   * @param options - Named parameters
   * @param options.head - When set to `true`, `data` will not be returned.
   * Useful if you only need the count.
   * @param options.get - When set to `true`, the function will be called with
   * read-only access mode.
   * @param options.count - Count algorithm to use to count rows returned by the
   * function. Only applicable for [set-returning
   * functions](https://www.postgresql.org/docs/current/functions-srf.html).
   *
   * `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the
   * hood.
   *
   * `"planned"`: Approximated but fast count algorithm. Uses the Postgres
   * statistics under the hood.
   *
   * `"estimated"`: Uses exact count for low numbers and planned count for high
   * numbers.
   */
  rpc<FnName extends string & keyof Schema['Functions'], Fn extends Schema['Functions'][FnName]>(
    fn: FnName,
    args: Fn['Args'] = {},
    options: {
      head?: boolean
      get?: boolean
      count?: 'exact' | 'planned' | 'estimated'
    } = {}
  ): PostgrestFilterBuilder<
    Schema,
    Fn['Returns'] extends any[]
      ? Fn['Returns'][number] extends Record<string, unknown>
        ? Fn['Returns'][number]
        : never
      : never,
    Fn['Returns'],
    FnName,
    null
  > {
    return this.rest.rpc(fn, args, options)
  }

  /**
   * Creates a Realtime channel with Broadcast, Presence, and Postgres Changes.
   *
   * @param {string} name - The name of the Realtime channel.
   * @param {Object} opts - The options to pass to the Realtime channel.
   *
   */
  channel(name: string, opts: RealtimeChannelOptions = { config: {} }): RealtimeChannel {
    return this.realtime.channel(name, opts)
  }

  /**
   * Returns all Realtime channels.
   */
  getChannels(): RealtimeChannel[] {
    return this.realtime.getChannels()
  }

  /**
   * Unsubscribes and removes Realtime channel from Realtime client.
   *
   * @param {RealtimeChannel} channel - The name of the Realtime channel.
   *
   */
  removeChannel(channel: RealtimeChannel): Promise<'ok' | 'timed out' | 'error'> {
    return this.realtime.removeChannel(channel)
  }

  /**
   * Unsubscribes and removes all Realtime channels from Realtime client.
   */
  removeAllChannels(): Promise<('ok' | 'timed out' | 'error')[]> {
    return this.realtime.removeAllChannels()
  }

  private async _getAccessToken() {
    if (this.accessToken) {
      return await this.accessToken()
    }

    const { data } = await this.auth.getSession()

    return data.session?.access_token ?? null
  }

  private _initPowerbaseAuthClient(
    {
      autoRefreshToken,
      persistSession,
      detectSessionInUrl,
      storage,
      storageKey,
      flowType,
      lock,
      debug,
    }: PowerbaseAuthClientOptions,
    headers?: Record<string, string>,
    fetch?: Fetch
  ) {
    const authHeaders = {
      Authorization: `Bearer ${this.powerbaseKey}`,
      apikey: `${this.powerbaseKey}`,
    }
    return new PowerbaseAuthClient({
      url: this.authUrl,
      headers: { ...authHeaders, ...headers },
      storageKey: storageKey,
      autoRefreshToken,
      persistSession,
      detectSessionInUrl,
      storage,
      flowType,
      lock,
      debug,
      fetch,
      // auth checks if there is a custom authorizaiton header using this flag
      // so it knows whether to return an error when getUser is called with no session
      hasCustomAuthorizationHeader: 'Authorization' in this.headers,
    })
  }

  private _initRealtimeClient(options: RealtimeClientOptions) {
    return new RealtimeClient(this.realtimeUrl, {
      ...options,
      params: { ...{ apikey: this.powerbaseKey }, ...options?.params },
    })
  }

  private _listenForAuthEvents() {
    let data = this.auth.onAuthStateChange((event, session) => {
      this._handleTokenChanged(event, 'CLIENT', session?.access_token)
    })
    return data
  }

  private _handleTokenChanged(
    event: AuthChangeEvent,
    source: 'CLIENT' | 'STORAGE',
    token?: string
  ) {
    if (
      (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
      this.changedAccessToken !== token
    ) {
      this.changedAccessToken = token
    } else if (event === 'SIGNED_OUT') {
      this.realtime.setAuth()
      if (source == 'STORAGE') this.auth.signOut()
      this.changedAccessToken = undefined
    }
  }
}
