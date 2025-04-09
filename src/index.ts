import PowerbaseClient from './PowerbaseClient'
import type { GenericSchema, PowerbaseClientOptions } from './lib/types'

export * from '@skorpland/auth-js'
export type { User as AuthUser, Session as AuthSession } from '@skorpland/auth-js'
export {
  type PostgrestResponse,
  type PostgrestSingleResponse,
  type PostgrestMaybeSingleResponse,
  PostgrestError,
} from '@skorpland/postgrest-js'
export {
  FunctionsHttpError,
  FunctionsFetchError,
  FunctionsRelayError,
  FunctionsError,
  type FunctionInvokeOptions,
  FunctionRegion,
} from '@skorpland/functions-js'
export * from '@skorpland/realtime-js'
export { default as PowerbaseClient } from './PowerbaseClient'
export type { PowerbaseClientOptions, QueryResult, QueryData, QueryError } from './lib/types'

/**
 * Creates a new Powerbase Client.
 */
export const createClient = <
  Database = any,
  SchemaName extends string & keyof Database = 'public' extends keyof Database
    ? 'public'
    : string & keyof Database,
  Schema extends GenericSchema = Database[SchemaName] extends GenericSchema
    ? Database[SchemaName]
    : any
>(
  powerbaseUrl: string,
  powerbaseKey: string,
  options?: PowerbaseClientOptions<SchemaName>
): PowerbaseClient<Database, SchemaName, Schema> => {
  return new PowerbaseClient<Database, SchemaName, Schema>(powerbaseUrl, powerbaseKey, options)
}
