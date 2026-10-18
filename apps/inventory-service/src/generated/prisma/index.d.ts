
/**
 * Client
**/

import * as runtime from './runtime/client.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model OutboxEvent
 * 
 */
export type OutboxEvent = $Result.DefaultSelection<Prisma.$OutboxEventPayload>
/**
 * Model CheckoutEvent
 * 
 */
export type CheckoutEvent = $Result.DefaultSelection<Prisma.$CheckoutEventPayload>
/**
 * Model Inventory
 * 
 */
export type Inventory = $Result.DefaultSelection<Prisma.$InventoryPayload>
/**
 * Model InventoryOperation
 * 
 */
export type InventoryOperation = $Result.DefaultSelection<Prisma.$InventoryOperationPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more OutboxEvents
 * const outboxEvents = await prisma.outboxEvent.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient({
   *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
   * })
   * // Fetch zero or more OutboxEvents
   * const outboxEvents = await prisma.outboxEvent.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://pris.ly/d/client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://pris.ly/d/raw-queries).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/orm/prisma-client/queries/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>

  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.outboxEvent`: Exposes CRUD operations for the **OutboxEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more OutboxEvents
    * const outboxEvents = await prisma.outboxEvent.findMany()
    * ```
    */
  get outboxEvent(): Prisma.OutboxEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.checkoutEvent`: Exposes CRUD operations for the **CheckoutEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CheckoutEvents
    * const checkoutEvents = await prisma.checkoutEvent.findMany()
    * ```
    */
  get checkoutEvent(): Prisma.CheckoutEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inventory`: Exposes CRUD operations for the **Inventory** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Inventories
    * const inventories = await prisma.inventory.findMany()
    * ```
    */
  get inventory(): Prisma.InventoryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inventoryOperation`: Exposes CRUD operations for the **InventoryOperation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more InventoryOperations
    * const inventoryOperations = await prisma.inventoryOperation.findMany()
    * ```
    */
  get inventoryOperation(): Prisma.InventoryOperationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 7.8.0
   * Query Engine version: 3c6e192761c0362d496ed980de936e2f3cebcd3a
   */
  export type PrismaVersion = {
    client: string
    engine: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    OutboxEvent: 'OutboxEvent',
    CheckoutEvent: 'CheckoutEvent',
    Inventory: 'Inventory',
    InventoryOperation: 'InventoryOperation'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]



  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "outboxEvent" | "checkoutEvent" | "inventory" | "inventoryOperation"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      OutboxEvent: {
        payload: Prisma.$OutboxEventPayload<ExtArgs>
        fields: Prisma.OutboxEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.OutboxEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.OutboxEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          findFirst: {
            args: Prisma.OutboxEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.OutboxEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          findMany: {
            args: Prisma.OutboxEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>[]
          }
          create: {
            args: Prisma.OutboxEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          createMany: {
            args: Prisma.OutboxEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.OutboxEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>[]
          }
          delete: {
            args: Prisma.OutboxEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          update: {
            args: Prisma.OutboxEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          deleteMany: {
            args: Prisma.OutboxEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.OutboxEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.OutboxEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>[]
          }
          upsert: {
            args: Prisma.OutboxEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$OutboxEventPayload>
          }
          aggregate: {
            args: Prisma.OutboxEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateOutboxEvent>
          }
          groupBy: {
            args: Prisma.OutboxEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<OutboxEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.OutboxEventCountArgs<ExtArgs>
            result: $Utils.Optional<OutboxEventCountAggregateOutputType> | number
          }
        }
      }
      CheckoutEvent: {
        payload: Prisma.$CheckoutEventPayload<ExtArgs>
        fields: Prisma.CheckoutEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CheckoutEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CheckoutEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          findFirst: {
            args: Prisma.CheckoutEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CheckoutEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          findMany: {
            args: Prisma.CheckoutEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>[]
          }
          create: {
            args: Prisma.CheckoutEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          createMany: {
            args: Prisma.CheckoutEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CheckoutEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>[]
          }
          delete: {
            args: Prisma.CheckoutEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          update: {
            args: Prisma.CheckoutEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          deleteMany: {
            args: Prisma.CheckoutEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CheckoutEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CheckoutEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>[]
          }
          upsert: {
            args: Prisma.CheckoutEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CheckoutEventPayload>
          }
          aggregate: {
            args: Prisma.CheckoutEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCheckoutEvent>
          }
          groupBy: {
            args: Prisma.CheckoutEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<CheckoutEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.CheckoutEventCountArgs<ExtArgs>
            result: $Utils.Optional<CheckoutEventCountAggregateOutputType> | number
          }
        }
      }
      Inventory: {
        payload: Prisma.$InventoryPayload<ExtArgs>
        fields: Prisma.InventoryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          findFirst: {
            args: Prisma.InventoryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          findMany: {
            args: Prisma.InventoryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>[]
          }
          create: {
            args: Prisma.InventoryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          createMany: {
            args: Prisma.InventoryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>[]
          }
          delete: {
            args: Prisma.InventoryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          update: {
            args: Prisma.InventoryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          deleteMany: {
            args: Prisma.InventoryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InventoryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>[]
          }
          upsert: {
            args: Prisma.InventoryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryPayload>
          }
          aggregate: {
            args: Prisma.InventoryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventory>
          }
          groupBy: {
            args: Prisma.InventoryGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryCountAggregateOutputType> | number
          }
        }
      }
      InventoryOperation: {
        payload: Prisma.$InventoryOperationPayload<ExtArgs>
        fields: Prisma.InventoryOperationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InventoryOperationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InventoryOperationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          findFirst: {
            args: Prisma.InventoryOperationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InventoryOperationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          findMany: {
            args: Prisma.InventoryOperationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>[]
          }
          create: {
            args: Prisma.InventoryOperationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          createMany: {
            args: Prisma.InventoryOperationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InventoryOperationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>[]
          }
          delete: {
            args: Prisma.InventoryOperationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          update: {
            args: Prisma.InventoryOperationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          deleteMany: {
            args: Prisma.InventoryOperationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InventoryOperationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InventoryOperationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>[]
          }
          upsert: {
            args: Prisma.InventoryOperationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InventoryOperationPayload>
          }
          aggregate: {
            args: Prisma.InventoryOperationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInventoryOperation>
          }
          groupBy: {
            args: Prisma.InventoryOperationGroupByArgs<ExtArgs>
            result: $Utils.Optional<InventoryOperationGroupByOutputType>[]
          }
          count: {
            args: Prisma.InventoryOperationCountArgs<ExtArgs>
            result: $Utils.Optional<InventoryOperationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://pris.ly/d/logging).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory
    /**
     * Prisma Accelerate URL allowing the client to connect through Accelerate instead of a direct database.
     */
    accelerateUrl?: string
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
    /**
     * SQL commenter plugins that add metadata to SQL queries as comments.
     * Comments follow the sqlcommenter format: https://google.github.io/sqlcommenter/
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   adapter,
     *   comments: [
     *     traceContext(),
     *     queryInsights(),
     *   ],
     * })
     * ```
     */
    comments?: runtime.SqlCommenterPlugin[]
  }
  export type GlobalOmitConfig = {
    outboxEvent?: OutboxEventOmit
    checkoutEvent?: CheckoutEventOmit
    inventory?: InventoryOmit
    inventoryOperation?: InventoryOperationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type InventoryCountOutputType
   */

  export type InventoryCountOutputType = {
    operations: number
  }

  export type InventoryCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    operations?: boolean | InventoryCountOutputTypeCountOperationsArgs
  }

  // Custom InputTypes
  /**
   * InventoryCountOutputType without action
   */
  export type InventoryCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryCountOutputType
     */
    select?: InventoryCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * InventoryCountOutputType without action
   */
  export type InventoryCountOutputTypeCountOperationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryOperationWhereInput
  }


  /**
   * Models
   */

  /**
   * Model OutboxEvent
   */

  export type AggregateOutboxEvent = {
    _count: OutboxEventCountAggregateOutputType | null
    _avg: OutboxEventAvgAggregateOutputType | null
    _sum: OutboxEventSumAggregateOutputType | null
    _min: OutboxEventMinAggregateOutputType | null
    _max: OutboxEventMaxAggregateOutputType | null
  }

  export type OutboxEventAvgAggregateOutputType = {
    attempts: number | null
  }

  export type OutboxEventSumAggregateOutputType = {
    attempts: number | null
  }

  export type OutboxEventMinAggregateOutputType = {
    id: string | null
    eventId: string | null
    deduplicationKey: string | null
    payload: string | null
    createdAt: Date | null
    publishedAt: Date | null
    attempts: number | null
    lastError: string | null
    nextAttemptAt: Date | null
  }

  export type OutboxEventMaxAggregateOutputType = {
    id: string | null
    eventId: string | null
    deduplicationKey: string | null
    payload: string | null
    createdAt: Date | null
    publishedAt: Date | null
    attempts: number | null
    lastError: string | null
    nextAttemptAt: Date | null
  }

  export type OutboxEventCountAggregateOutputType = {
    id: number
    eventId: number
    deduplicationKey: number
    payload: number
    createdAt: number
    publishedAt: number
    attempts: number
    lastError: number
    nextAttemptAt: number
    _all: number
  }


  export type OutboxEventAvgAggregateInputType = {
    attempts?: true
  }

  export type OutboxEventSumAggregateInputType = {
    attempts?: true
  }

  export type OutboxEventMinAggregateInputType = {
    id?: true
    eventId?: true
    deduplicationKey?: true
    payload?: true
    createdAt?: true
    publishedAt?: true
    attempts?: true
    lastError?: true
    nextAttemptAt?: true
  }

  export type OutboxEventMaxAggregateInputType = {
    id?: true
    eventId?: true
    deduplicationKey?: true
    payload?: true
    createdAt?: true
    publishedAt?: true
    attempts?: true
    lastError?: true
    nextAttemptAt?: true
  }

  export type OutboxEventCountAggregateInputType = {
    id?: true
    eventId?: true
    deduplicationKey?: true
    payload?: true
    createdAt?: true
    publishedAt?: true
    attempts?: true
    lastError?: true
    nextAttemptAt?: true
    _all?: true
  }

  export type OutboxEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OutboxEvent to aggregate.
     */
    where?: OutboxEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OutboxEvents to fetch.
     */
    orderBy?: OutboxEventOrderByWithRelationInput | OutboxEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: OutboxEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OutboxEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OutboxEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned OutboxEvents
    **/
    _count?: true | OutboxEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: OutboxEventAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: OutboxEventSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: OutboxEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: OutboxEventMaxAggregateInputType
  }

  export type GetOutboxEventAggregateType<T extends OutboxEventAggregateArgs> = {
        [P in keyof T & keyof AggregateOutboxEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateOutboxEvent[P]>
      : GetScalarType<T[P], AggregateOutboxEvent[P]>
  }




  export type OutboxEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: OutboxEventWhereInput
    orderBy?: OutboxEventOrderByWithAggregationInput | OutboxEventOrderByWithAggregationInput[]
    by: OutboxEventScalarFieldEnum[] | OutboxEventScalarFieldEnum
    having?: OutboxEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: OutboxEventCountAggregateInputType | true
    _avg?: OutboxEventAvgAggregateInputType
    _sum?: OutboxEventSumAggregateInputType
    _min?: OutboxEventMinAggregateInputType
    _max?: OutboxEventMaxAggregateInputType
  }

  export type OutboxEventGroupByOutputType = {
    id: string
    eventId: string
    deduplicationKey: string
    payload: string
    createdAt: Date
    publishedAt: Date | null
    attempts: number
    lastError: string | null
    nextAttemptAt: Date
    _count: OutboxEventCountAggregateOutputType | null
    _avg: OutboxEventAvgAggregateOutputType | null
    _sum: OutboxEventSumAggregateOutputType | null
    _min: OutboxEventMinAggregateOutputType | null
    _max: OutboxEventMaxAggregateOutputType | null
  }

  type GetOutboxEventGroupByPayload<T extends OutboxEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<OutboxEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof OutboxEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], OutboxEventGroupByOutputType[P]>
            : GetScalarType<T[P], OutboxEventGroupByOutputType[P]>
        }
      >
    >


  export type OutboxEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    deduplicationKey?: boolean
    payload?: boolean
    createdAt?: boolean
    publishedAt?: boolean
    attempts?: boolean
    lastError?: boolean
    nextAttemptAt?: boolean
  }, ExtArgs["result"]["outboxEvent"]>

  export type OutboxEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    deduplicationKey?: boolean
    payload?: boolean
    createdAt?: boolean
    publishedAt?: boolean
    attempts?: boolean
    lastError?: boolean
    nextAttemptAt?: boolean
  }, ExtArgs["result"]["outboxEvent"]>

  export type OutboxEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventId?: boolean
    deduplicationKey?: boolean
    payload?: boolean
    createdAt?: boolean
    publishedAt?: boolean
    attempts?: boolean
    lastError?: boolean
    nextAttemptAt?: boolean
  }, ExtArgs["result"]["outboxEvent"]>

  export type OutboxEventSelectScalar = {
    id?: boolean
    eventId?: boolean
    deduplicationKey?: boolean
    payload?: boolean
    createdAt?: boolean
    publishedAt?: boolean
    attempts?: boolean
    lastError?: boolean
    nextAttemptAt?: boolean
  }

  export type OutboxEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventId" | "deduplicationKey" | "payload" | "createdAt" | "publishedAt" | "attempts" | "lastError" | "nextAttemptAt", ExtArgs["result"]["outboxEvent"]>

  export type $OutboxEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "OutboxEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventId: string
      deduplicationKey: string
      payload: string
      createdAt: Date
      publishedAt: Date | null
      attempts: number
      lastError: string | null
      nextAttemptAt: Date
    }, ExtArgs["result"]["outboxEvent"]>
    composites: {}
  }

  type OutboxEventGetPayload<S extends boolean | null | undefined | OutboxEventDefaultArgs> = $Result.GetResult<Prisma.$OutboxEventPayload, S>

  type OutboxEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<OutboxEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: OutboxEventCountAggregateInputType | true
    }

  export interface OutboxEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['OutboxEvent'], meta: { name: 'OutboxEvent' } }
    /**
     * Find zero or one OutboxEvent that matches the filter.
     * @param {OutboxEventFindUniqueArgs} args - Arguments to find a OutboxEvent
     * @example
     * // Get one OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends OutboxEventFindUniqueArgs>(args: SelectSubset<T, OutboxEventFindUniqueArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one OutboxEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {OutboxEventFindUniqueOrThrowArgs} args - Arguments to find a OutboxEvent
     * @example
     * // Get one OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends OutboxEventFindUniqueOrThrowArgs>(args: SelectSubset<T, OutboxEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OutboxEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventFindFirstArgs} args - Arguments to find a OutboxEvent
     * @example
     * // Get one OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends OutboxEventFindFirstArgs>(args?: SelectSubset<T, OutboxEventFindFirstArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first OutboxEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventFindFirstOrThrowArgs} args - Arguments to find a OutboxEvent
     * @example
     * // Get one OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends OutboxEventFindFirstOrThrowArgs>(args?: SelectSubset<T, OutboxEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more OutboxEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all OutboxEvents
     * const outboxEvents = await prisma.outboxEvent.findMany()
     * 
     * // Get first 10 OutboxEvents
     * const outboxEvents = await prisma.outboxEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const outboxEventWithIdOnly = await prisma.outboxEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends OutboxEventFindManyArgs>(args?: SelectSubset<T, OutboxEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a OutboxEvent.
     * @param {OutboxEventCreateArgs} args - Arguments to create a OutboxEvent.
     * @example
     * // Create one OutboxEvent
     * const OutboxEvent = await prisma.outboxEvent.create({
     *   data: {
     *     // ... data to create a OutboxEvent
     *   }
     * })
     * 
     */
    create<T extends OutboxEventCreateArgs>(args: SelectSubset<T, OutboxEventCreateArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many OutboxEvents.
     * @param {OutboxEventCreateManyArgs} args - Arguments to create many OutboxEvents.
     * @example
     * // Create many OutboxEvents
     * const outboxEvent = await prisma.outboxEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends OutboxEventCreateManyArgs>(args?: SelectSubset<T, OutboxEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many OutboxEvents and returns the data saved in the database.
     * @param {OutboxEventCreateManyAndReturnArgs} args - Arguments to create many OutboxEvents.
     * @example
     * // Create many OutboxEvents
     * const outboxEvent = await prisma.outboxEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many OutboxEvents and only return the `id`
     * const outboxEventWithIdOnly = await prisma.outboxEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends OutboxEventCreateManyAndReturnArgs>(args?: SelectSubset<T, OutboxEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a OutboxEvent.
     * @param {OutboxEventDeleteArgs} args - Arguments to delete one OutboxEvent.
     * @example
     * // Delete one OutboxEvent
     * const OutboxEvent = await prisma.outboxEvent.delete({
     *   where: {
     *     // ... filter to delete one OutboxEvent
     *   }
     * })
     * 
     */
    delete<T extends OutboxEventDeleteArgs>(args: SelectSubset<T, OutboxEventDeleteArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one OutboxEvent.
     * @param {OutboxEventUpdateArgs} args - Arguments to update one OutboxEvent.
     * @example
     * // Update one OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends OutboxEventUpdateArgs>(args: SelectSubset<T, OutboxEventUpdateArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more OutboxEvents.
     * @param {OutboxEventDeleteManyArgs} args - Arguments to filter OutboxEvents to delete.
     * @example
     * // Delete a few OutboxEvents
     * const { count } = await prisma.outboxEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends OutboxEventDeleteManyArgs>(args?: SelectSubset<T, OutboxEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OutboxEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many OutboxEvents
     * const outboxEvent = await prisma.outboxEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends OutboxEventUpdateManyArgs>(args: SelectSubset<T, OutboxEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more OutboxEvents and returns the data updated in the database.
     * @param {OutboxEventUpdateManyAndReturnArgs} args - Arguments to update many OutboxEvents.
     * @example
     * // Update many OutboxEvents
     * const outboxEvent = await prisma.outboxEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more OutboxEvents and only return the `id`
     * const outboxEventWithIdOnly = await prisma.outboxEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends OutboxEventUpdateManyAndReturnArgs>(args: SelectSubset<T, OutboxEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one OutboxEvent.
     * @param {OutboxEventUpsertArgs} args - Arguments to update or create a OutboxEvent.
     * @example
     * // Update or create a OutboxEvent
     * const outboxEvent = await prisma.outboxEvent.upsert({
     *   create: {
     *     // ... data to create a OutboxEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the OutboxEvent we want to update
     *   }
     * })
     */
    upsert<T extends OutboxEventUpsertArgs>(args: SelectSubset<T, OutboxEventUpsertArgs<ExtArgs>>): Prisma__OutboxEventClient<$Result.GetResult<Prisma.$OutboxEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of OutboxEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventCountArgs} args - Arguments to filter OutboxEvents to count.
     * @example
     * // Count the number of OutboxEvents
     * const count = await prisma.outboxEvent.count({
     *   where: {
     *     // ... the filter for the OutboxEvents we want to count
     *   }
     * })
    **/
    count<T extends OutboxEventCountArgs>(
      args?: Subset<T, OutboxEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], OutboxEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a OutboxEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends OutboxEventAggregateArgs>(args: Subset<T, OutboxEventAggregateArgs>): Prisma.PrismaPromise<GetOutboxEventAggregateType<T>>

    /**
     * Group by OutboxEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {OutboxEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends OutboxEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: OutboxEventGroupByArgs['orderBy'] }
        : { orderBy?: OutboxEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, OutboxEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOutboxEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the OutboxEvent model
   */
  readonly fields: OutboxEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for OutboxEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__OutboxEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the OutboxEvent model
   */
  interface OutboxEventFieldRefs {
    readonly id: FieldRef<"OutboxEvent", 'String'>
    readonly eventId: FieldRef<"OutboxEvent", 'String'>
    readonly deduplicationKey: FieldRef<"OutboxEvent", 'String'>
    readonly payload: FieldRef<"OutboxEvent", 'String'>
    readonly createdAt: FieldRef<"OutboxEvent", 'DateTime'>
    readonly publishedAt: FieldRef<"OutboxEvent", 'DateTime'>
    readonly attempts: FieldRef<"OutboxEvent", 'Int'>
    readonly lastError: FieldRef<"OutboxEvent", 'String'>
    readonly nextAttemptAt: FieldRef<"OutboxEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * OutboxEvent findUnique
   */
  export type OutboxEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter, which OutboxEvent to fetch.
     */
    where: OutboxEventWhereUniqueInput
  }

  /**
   * OutboxEvent findUniqueOrThrow
   */
  export type OutboxEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter, which OutboxEvent to fetch.
     */
    where: OutboxEventWhereUniqueInput
  }

  /**
   * OutboxEvent findFirst
   */
  export type OutboxEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter, which OutboxEvent to fetch.
     */
    where?: OutboxEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OutboxEvents to fetch.
     */
    orderBy?: OutboxEventOrderByWithRelationInput | OutboxEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OutboxEvents.
     */
    cursor?: OutboxEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OutboxEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OutboxEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OutboxEvents.
     */
    distinct?: OutboxEventScalarFieldEnum | OutboxEventScalarFieldEnum[]
  }

  /**
   * OutboxEvent findFirstOrThrow
   */
  export type OutboxEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter, which OutboxEvent to fetch.
     */
    where?: OutboxEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OutboxEvents to fetch.
     */
    orderBy?: OutboxEventOrderByWithRelationInput | OutboxEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for OutboxEvents.
     */
    cursor?: OutboxEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OutboxEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OutboxEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OutboxEvents.
     */
    distinct?: OutboxEventScalarFieldEnum | OutboxEventScalarFieldEnum[]
  }

  /**
   * OutboxEvent findMany
   */
  export type OutboxEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter, which OutboxEvents to fetch.
     */
    where?: OutboxEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of OutboxEvents to fetch.
     */
    orderBy?: OutboxEventOrderByWithRelationInput | OutboxEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing OutboxEvents.
     */
    cursor?: OutboxEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` OutboxEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` OutboxEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of OutboxEvents.
     */
    distinct?: OutboxEventScalarFieldEnum | OutboxEventScalarFieldEnum[]
  }

  /**
   * OutboxEvent create
   */
  export type OutboxEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * The data needed to create a OutboxEvent.
     */
    data: XOR<OutboxEventCreateInput, OutboxEventUncheckedCreateInput>
  }

  /**
   * OutboxEvent createMany
   */
  export type OutboxEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many OutboxEvents.
     */
    data: OutboxEventCreateManyInput | OutboxEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OutboxEvent createManyAndReturn
   */
  export type OutboxEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * The data used to create many OutboxEvents.
     */
    data: OutboxEventCreateManyInput | OutboxEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * OutboxEvent update
   */
  export type OutboxEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * The data needed to update a OutboxEvent.
     */
    data: XOR<OutboxEventUpdateInput, OutboxEventUncheckedUpdateInput>
    /**
     * Choose, which OutboxEvent to update.
     */
    where: OutboxEventWhereUniqueInput
  }

  /**
   * OutboxEvent updateMany
   */
  export type OutboxEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update OutboxEvents.
     */
    data: XOR<OutboxEventUpdateManyMutationInput, OutboxEventUncheckedUpdateManyInput>
    /**
     * Filter which OutboxEvents to update
     */
    where?: OutboxEventWhereInput
    /**
     * Limit how many OutboxEvents to update.
     */
    limit?: number
  }

  /**
   * OutboxEvent updateManyAndReturn
   */
  export type OutboxEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * The data used to update OutboxEvents.
     */
    data: XOR<OutboxEventUpdateManyMutationInput, OutboxEventUncheckedUpdateManyInput>
    /**
     * Filter which OutboxEvents to update
     */
    where?: OutboxEventWhereInput
    /**
     * Limit how many OutboxEvents to update.
     */
    limit?: number
  }

  /**
   * OutboxEvent upsert
   */
  export type OutboxEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * The filter to search for the OutboxEvent to update in case it exists.
     */
    where: OutboxEventWhereUniqueInput
    /**
     * In case the OutboxEvent found by the `where` argument doesn't exist, create a new OutboxEvent with this data.
     */
    create: XOR<OutboxEventCreateInput, OutboxEventUncheckedCreateInput>
    /**
     * In case the OutboxEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<OutboxEventUpdateInput, OutboxEventUncheckedUpdateInput>
  }

  /**
   * OutboxEvent delete
   */
  export type OutboxEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
    /**
     * Filter which OutboxEvent to delete.
     */
    where: OutboxEventWhereUniqueInput
  }

  /**
   * OutboxEvent deleteMany
   */
  export type OutboxEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which OutboxEvents to delete
     */
    where?: OutboxEventWhereInput
    /**
     * Limit how many OutboxEvents to delete.
     */
    limit?: number
  }

  /**
   * OutboxEvent without action
   */
  export type OutboxEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the OutboxEvent
     */
    select?: OutboxEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the OutboxEvent
     */
    omit?: OutboxEventOmit<ExtArgs> | null
  }


  /**
   * Model CheckoutEvent
   */

  export type AggregateCheckoutEvent = {
    _count: CheckoutEventCountAggregateOutputType | null
    _min: CheckoutEventMinAggregateOutputType | null
    _max: CheckoutEventMaxAggregateOutputType | null
  }

  export type CheckoutEventMinAggregateOutputType = {
    eventId: string | null
    eventType: string | null
    processedAt: Date | null
    fingerprint: string | null
    result: string | null
  }

  export type CheckoutEventMaxAggregateOutputType = {
    eventId: string | null
    eventType: string | null
    processedAt: Date | null
    fingerprint: string | null
    result: string | null
  }

  export type CheckoutEventCountAggregateOutputType = {
    eventId: number
    eventType: number
    processedAt: number
    fingerprint: number
    result: number
    _all: number
  }


  export type CheckoutEventMinAggregateInputType = {
    eventId?: true
    eventType?: true
    processedAt?: true
    fingerprint?: true
    result?: true
  }

  export type CheckoutEventMaxAggregateInputType = {
    eventId?: true
    eventType?: true
    processedAt?: true
    fingerprint?: true
    result?: true
  }

  export type CheckoutEventCountAggregateInputType = {
    eventId?: true
    eventType?: true
    processedAt?: true
    fingerprint?: true
    result?: true
    _all?: true
  }

  export type CheckoutEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CheckoutEvent to aggregate.
     */
    where?: CheckoutEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CheckoutEvents to fetch.
     */
    orderBy?: CheckoutEventOrderByWithRelationInput | CheckoutEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CheckoutEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CheckoutEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CheckoutEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CheckoutEvents
    **/
    _count?: true | CheckoutEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CheckoutEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CheckoutEventMaxAggregateInputType
  }

  export type GetCheckoutEventAggregateType<T extends CheckoutEventAggregateArgs> = {
        [P in keyof T & keyof AggregateCheckoutEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCheckoutEvent[P]>
      : GetScalarType<T[P], AggregateCheckoutEvent[P]>
  }




  export type CheckoutEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CheckoutEventWhereInput
    orderBy?: CheckoutEventOrderByWithAggregationInput | CheckoutEventOrderByWithAggregationInput[]
    by: CheckoutEventScalarFieldEnum[] | CheckoutEventScalarFieldEnum
    having?: CheckoutEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CheckoutEventCountAggregateInputType | true
    _min?: CheckoutEventMinAggregateInputType
    _max?: CheckoutEventMaxAggregateInputType
  }

  export type CheckoutEventGroupByOutputType = {
    eventId: string
    eventType: string | null
    processedAt: Date
    fingerprint: string
    result: string | null
    _count: CheckoutEventCountAggregateOutputType | null
    _min: CheckoutEventMinAggregateOutputType | null
    _max: CheckoutEventMaxAggregateOutputType | null
  }

  type GetCheckoutEventGroupByPayload<T extends CheckoutEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CheckoutEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CheckoutEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CheckoutEventGroupByOutputType[P]>
            : GetScalarType<T[P], CheckoutEventGroupByOutputType[P]>
        }
      >
    >


  export type CheckoutEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    eventType?: boolean
    processedAt?: boolean
    fingerprint?: boolean
    result?: boolean
  }, ExtArgs["result"]["checkoutEvent"]>

  export type CheckoutEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    eventType?: boolean
    processedAt?: boolean
    fingerprint?: boolean
    result?: boolean
  }, ExtArgs["result"]["checkoutEvent"]>

  export type CheckoutEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    eventId?: boolean
    eventType?: boolean
    processedAt?: boolean
    fingerprint?: boolean
    result?: boolean
  }, ExtArgs["result"]["checkoutEvent"]>

  export type CheckoutEventSelectScalar = {
    eventId?: boolean
    eventType?: boolean
    processedAt?: boolean
    fingerprint?: boolean
    result?: boolean
  }

  export type CheckoutEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"eventId" | "eventType" | "processedAt" | "fingerprint" | "result", ExtArgs["result"]["checkoutEvent"]>

  export type $CheckoutEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CheckoutEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      eventId: string
      eventType: string | null
      processedAt: Date
      fingerprint: string
      result: string | null
    }, ExtArgs["result"]["checkoutEvent"]>
    composites: {}
  }

  type CheckoutEventGetPayload<S extends boolean | null | undefined | CheckoutEventDefaultArgs> = $Result.GetResult<Prisma.$CheckoutEventPayload, S>

  type CheckoutEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CheckoutEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CheckoutEventCountAggregateInputType | true
    }

  export interface CheckoutEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CheckoutEvent'], meta: { name: 'CheckoutEvent' } }
    /**
     * Find zero or one CheckoutEvent that matches the filter.
     * @param {CheckoutEventFindUniqueArgs} args - Arguments to find a CheckoutEvent
     * @example
     * // Get one CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CheckoutEventFindUniqueArgs>(args: SelectSubset<T, CheckoutEventFindUniqueArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CheckoutEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CheckoutEventFindUniqueOrThrowArgs} args - Arguments to find a CheckoutEvent
     * @example
     * // Get one CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CheckoutEventFindUniqueOrThrowArgs>(args: SelectSubset<T, CheckoutEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CheckoutEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventFindFirstArgs} args - Arguments to find a CheckoutEvent
     * @example
     * // Get one CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CheckoutEventFindFirstArgs>(args?: SelectSubset<T, CheckoutEventFindFirstArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CheckoutEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventFindFirstOrThrowArgs} args - Arguments to find a CheckoutEvent
     * @example
     * // Get one CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CheckoutEventFindFirstOrThrowArgs>(args?: SelectSubset<T, CheckoutEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CheckoutEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CheckoutEvents
     * const checkoutEvents = await prisma.checkoutEvent.findMany()
     * 
     * // Get first 10 CheckoutEvents
     * const checkoutEvents = await prisma.checkoutEvent.findMany({ take: 10 })
     * 
     * // Only select the `eventId`
     * const checkoutEventWithEventIdOnly = await prisma.checkoutEvent.findMany({ select: { eventId: true } })
     * 
     */
    findMany<T extends CheckoutEventFindManyArgs>(args?: SelectSubset<T, CheckoutEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CheckoutEvent.
     * @param {CheckoutEventCreateArgs} args - Arguments to create a CheckoutEvent.
     * @example
     * // Create one CheckoutEvent
     * const CheckoutEvent = await prisma.checkoutEvent.create({
     *   data: {
     *     // ... data to create a CheckoutEvent
     *   }
     * })
     * 
     */
    create<T extends CheckoutEventCreateArgs>(args: SelectSubset<T, CheckoutEventCreateArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CheckoutEvents.
     * @param {CheckoutEventCreateManyArgs} args - Arguments to create many CheckoutEvents.
     * @example
     * // Create many CheckoutEvents
     * const checkoutEvent = await prisma.checkoutEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CheckoutEventCreateManyArgs>(args?: SelectSubset<T, CheckoutEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CheckoutEvents and returns the data saved in the database.
     * @param {CheckoutEventCreateManyAndReturnArgs} args - Arguments to create many CheckoutEvents.
     * @example
     * // Create many CheckoutEvents
     * const checkoutEvent = await prisma.checkoutEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CheckoutEvents and only return the `eventId`
     * const checkoutEventWithEventIdOnly = await prisma.checkoutEvent.createManyAndReturn({
     *   select: { eventId: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CheckoutEventCreateManyAndReturnArgs>(args?: SelectSubset<T, CheckoutEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CheckoutEvent.
     * @param {CheckoutEventDeleteArgs} args - Arguments to delete one CheckoutEvent.
     * @example
     * // Delete one CheckoutEvent
     * const CheckoutEvent = await prisma.checkoutEvent.delete({
     *   where: {
     *     // ... filter to delete one CheckoutEvent
     *   }
     * })
     * 
     */
    delete<T extends CheckoutEventDeleteArgs>(args: SelectSubset<T, CheckoutEventDeleteArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CheckoutEvent.
     * @param {CheckoutEventUpdateArgs} args - Arguments to update one CheckoutEvent.
     * @example
     * // Update one CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CheckoutEventUpdateArgs>(args: SelectSubset<T, CheckoutEventUpdateArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CheckoutEvents.
     * @param {CheckoutEventDeleteManyArgs} args - Arguments to filter CheckoutEvents to delete.
     * @example
     * // Delete a few CheckoutEvents
     * const { count } = await prisma.checkoutEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CheckoutEventDeleteManyArgs>(args?: SelectSubset<T, CheckoutEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CheckoutEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CheckoutEvents
     * const checkoutEvent = await prisma.checkoutEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CheckoutEventUpdateManyArgs>(args: SelectSubset<T, CheckoutEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CheckoutEvents and returns the data updated in the database.
     * @param {CheckoutEventUpdateManyAndReturnArgs} args - Arguments to update many CheckoutEvents.
     * @example
     * // Update many CheckoutEvents
     * const checkoutEvent = await prisma.checkoutEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CheckoutEvents and only return the `eventId`
     * const checkoutEventWithEventIdOnly = await prisma.checkoutEvent.updateManyAndReturn({
     *   select: { eventId: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CheckoutEventUpdateManyAndReturnArgs>(args: SelectSubset<T, CheckoutEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CheckoutEvent.
     * @param {CheckoutEventUpsertArgs} args - Arguments to update or create a CheckoutEvent.
     * @example
     * // Update or create a CheckoutEvent
     * const checkoutEvent = await prisma.checkoutEvent.upsert({
     *   create: {
     *     // ... data to create a CheckoutEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CheckoutEvent we want to update
     *   }
     * })
     */
    upsert<T extends CheckoutEventUpsertArgs>(args: SelectSubset<T, CheckoutEventUpsertArgs<ExtArgs>>): Prisma__CheckoutEventClient<$Result.GetResult<Prisma.$CheckoutEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CheckoutEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventCountArgs} args - Arguments to filter CheckoutEvents to count.
     * @example
     * // Count the number of CheckoutEvents
     * const count = await prisma.checkoutEvent.count({
     *   where: {
     *     // ... the filter for the CheckoutEvents we want to count
     *   }
     * })
    **/
    count<T extends CheckoutEventCountArgs>(
      args?: Subset<T, CheckoutEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CheckoutEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CheckoutEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CheckoutEventAggregateArgs>(args: Subset<T, CheckoutEventAggregateArgs>): Prisma.PrismaPromise<GetCheckoutEventAggregateType<T>>

    /**
     * Group by CheckoutEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CheckoutEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CheckoutEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CheckoutEventGroupByArgs['orderBy'] }
        : { orderBy?: CheckoutEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CheckoutEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCheckoutEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CheckoutEvent model
   */
  readonly fields: CheckoutEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CheckoutEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CheckoutEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CheckoutEvent model
   */
  interface CheckoutEventFieldRefs {
    readonly eventId: FieldRef<"CheckoutEvent", 'String'>
    readonly eventType: FieldRef<"CheckoutEvent", 'String'>
    readonly processedAt: FieldRef<"CheckoutEvent", 'DateTime'>
    readonly fingerprint: FieldRef<"CheckoutEvent", 'String'>
    readonly result: FieldRef<"CheckoutEvent", 'String'>
  }
    

  // Custom InputTypes
  /**
   * CheckoutEvent findUnique
   */
  export type CheckoutEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter, which CheckoutEvent to fetch.
     */
    where: CheckoutEventWhereUniqueInput
  }

  /**
   * CheckoutEvent findUniqueOrThrow
   */
  export type CheckoutEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter, which CheckoutEvent to fetch.
     */
    where: CheckoutEventWhereUniqueInput
  }

  /**
   * CheckoutEvent findFirst
   */
  export type CheckoutEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter, which CheckoutEvent to fetch.
     */
    where?: CheckoutEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CheckoutEvents to fetch.
     */
    orderBy?: CheckoutEventOrderByWithRelationInput | CheckoutEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CheckoutEvents.
     */
    cursor?: CheckoutEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CheckoutEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CheckoutEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CheckoutEvents.
     */
    distinct?: CheckoutEventScalarFieldEnum | CheckoutEventScalarFieldEnum[]
  }

  /**
   * CheckoutEvent findFirstOrThrow
   */
  export type CheckoutEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter, which CheckoutEvent to fetch.
     */
    where?: CheckoutEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CheckoutEvents to fetch.
     */
    orderBy?: CheckoutEventOrderByWithRelationInput | CheckoutEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CheckoutEvents.
     */
    cursor?: CheckoutEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CheckoutEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CheckoutEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CheckoutEvents.
     */
    distinct?: CheckoutEventScalarFieldEnum | CheckoutEventScalarFieldEnum[]
  }

  /**
   * CheckoutEvent findMany
   */
  export type CheckoutEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter, which CheckoutEvents to fetch.
     */
    where?: CheckoutEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CheckoutEvents to fetch.
     */
    orderBy?: CheckoutEventOrderByWithRelationInput | CheckoutEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CheckoutEvents.
     */
    cursor?: CheckoutEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CheckoutEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CheckoutEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CheckoutEvents.
     */
    distinct?: CheckoutEventScalarFieldEnum | CheckoutEventScalarFieldEnum[]
  }

  /**
   * CheckoutEvent create
   */
  export type CheckoutEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * The data needed to create a CheckoutEvent.
     */
    data: XOR<CheckoutEventCreateInput, CheckoutEventUncheckedCreateInput>
  }

  /**
   * CheckoutEvent createMany
   */
  export type CheckoutEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CheckoutEvents.
     */
    data: CheckoutEventCreateManyInput | CheckoutEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CheckoutEvent createManyAndReturn
   */
  export type CheckoutEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * The data used to create many CheckoutEvents.
     */
    data: CheckoutEventCreateManyInput | CheckoutEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CheckoutEvent update
   */
  export type CheckoutEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * The data needed to update a CheckoutEvent.
     */
    data: XOR<CheckoutEventUpdateInput, CheckoutEventUncheckedUpdateInput>
    /**
     * Choose, which CheckoutEvent to update.
     */
    where: CheckoutEventWhereUniqueInput
  }

  /**
   * CheckoutEvent updateMany
   */
  export type CheckoutEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CheckoutEvents.
     */
    data: XOR<CheckoutEventUpdateManyMutationInput, CheckoutEventUncheckedUpdateManyInput>
    /**
     * Filter which CheckoutEvents to update
     */
    where?: CheckoutEventWhereInput
    /**
     * Limit how many CheckoutEvents to update.
     */
    limit?: number
  }

  /**
   * CheckoutEvent updateManyAndReturn
   */
  export type CheckoutEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * The data used to update CheckoutEvents.
     */
    data: XOR<CheckoutEventUpdateManyMutationInput, CheckoutEventUncheckedUpdateManyInput>
    /**
     * Filter which CheckoutEvents to update
     */
    where?: CheckoutEventWhereInput
    /**
     * Limit how many CheckoutEvents to update.
     */
    limit?: number
  }

  /**
   * CheckoutEvent upsert
   */
  export type CheckoutEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * The filter to search for the CheckoutEvent to update in case it exists.
     */
    where: CheckoutEventWhereUniqueInput
    /**
     * In case the CheckoutEvent found by the `where` argument doesn't exist, create a new CheckoutEvent with this data.
     */
    create: XOR<CheckoutEventCreateInput, CheckoutEventUncheckedCreateInput>
    /**
     * In case the CheckoutEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CheckoutEventUpdateInput, CheckoutEventUncheckedUpdateInput>
  }

  /**
   * CheckoutEvent delete
   */
  export type CheckoutEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
    /**
     * Filter which CheckoutEvent to delete.
     */
    where: CheckoutEventWhereUniqueInput
  }

  /**
   * CheckoutEvent deleteMany
   */
  export type CheckoutEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CheckoutEvents to delete
     */
    where?: CheckoutEventWhereInput
    /**
     * Limit how many CheckoutEvents to delete.
     */
    limit?: number
  }

  /**
   * CheckoutEvent without action
   */
  export type CheckoutEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CheckoutEvent
     */
    select?: CheckoutEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CheckoutEvent
     */
    omit?: CheckoutEventOmit<ExtArgs> | null
  }


  /**
   * Model Inventory
   */

  export type AggregateInventory = {
    _count: InventoryCountAggregateOutputType | null
    _avg: InventoryAvgAggregateOutputType | null
    _sum: InventorySumAggregateOutputType | null
    _min: InventoryMinAggregateOutputType | null
    _max: InventoryMaxAggregateOutputType | null
  }

  export type InventoryAvgAggregateOutputType = {
    stock: number | null
    reservedStock: number | null
    lowStockThreshold: number | null
  }

  export type InventorySumAggregateOutputType = {
    stock: number | null
    reservedStock: number | null
    lowStockThreshold: number | null
  }

  export type InventoryMinAggregateOutputType = {
    id: string | null
    productId: string | null
    stock: number | null
    reservedStock: number | null
    lowStockThreshold: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryMaxAggregateOutputType = {
    id: string | null
    productId: string | null
    stock: number | null
    reservedStock: number | null
    lowStockThreshold: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InventoryCountAggregateOutputType = {
    id: number
    productId: number
    stock: number
    reservedStock: number
    lowStockThreshold: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InventoryAvgAggregateInputType = {
    stock?: true
    reservedStock?: true
    lowStockThreshold?: true
  }

  export type InventorySumAggregateInputType = {
    stock?: true
    reservedStock?: true
    lowStockThreshold?: true
  }

  export type InventoryMinAggregateInputType = {
    id?: true
    productId?: true
    stock?: true
    reservedStock?: true
    lowStockThreshold?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InventoryMaxAggregateInputType = {
    id?: true
    productId?: true
    stock?: true
    reservedStock?: true
    lowStockThreshold?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InventoryCountAggregateInputType = {
    id?: true
    productId?: true
    stock?: true
    reservedStock?: true
    lowStockThreshold?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InventoryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inventory to aggregate.
     */
    where?: InventoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inventories to fetch.
     */
    orderBy?: InventoryOrderByWithRelationInput | InventoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inventories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inventories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Inventories
    **/
    _count?: true | InventoryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventorySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryMaxAggregateInputType
  }

  export type GetInventoryAggregateType<T extends InventoryAggregateArgs> = {
        [P in keyof T & keyof AggregateInventory]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventory[P]>
      : GetScalarType<T[P], AggregateInventory[P]>
  }




  export type InventoryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryWhereInput
    orderBy?: InventoryOrderByWithAggregationInput | InventoryOrderByWithAggregationInput[]
    by: InventoryScalarFieldEnum[] | InventoryScalarFieldEnum
    having?: InventoryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryCountAggregateInputType | true
    _avg?: InventoryAvgAggregateInputType
    _sum?: InventorySumAggregateInputType
    _min?: InventoryMinAggregateInputType
    _max?: InventoryMaxAggregateInputType
  }

  export type InventoryGroupByOutputType = {
    id: string
    productId: string
    stock: number
    reservedStock: number
    lowStockThreshold: number
    createdAt: Date
    updatedAt: Date
    _count: InventoryCountAggregateOutputType | null
    _avg: InventoryAvgAggregateOutputType | null
    _sum: InventorySumAggregateOutputType | null
    _min: InventoryMinAggregateOutputType | null
    _max: InventoryMaxAggregateOutputType | null
  }

  type GetInventoryGroupByPayload<T extends InventoryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryGroupByOutputType[P]>
        }
      >
    >


  export type InventorySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    stock?: boolean
    reservedStock?: boolean
    lowStockThreshold?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    operations?: boolean | Inventory$operationsArgs<ExtArgs>
    _count?: boolean | InventoryCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventory"]>

  export type InventorySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    stock?: boolean
    reservedStock?: boolean
    lowStockThreshold?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventory"]>

  export type InventorySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    productId?: boolean
    stock?: boolean
    reservedStock?: boolean
    lowStockThreshold?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inventory"]>

  export type InventorySelectScalar = {
    id?: boolean
    productId?: boolean
    stock?: boolean
    reservedStock?: boolean
    lowStockThreshold?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InventoryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "productId" | "stock" | "reservedStock" | "lowStockThreshold" | "createdAt" | "updatedAt", ExtArgs["result"]["inventory"]>
  export type InventoryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    operations?: boolean | Inventory$operationsArgs<ExtArgs>
    _count?: boolean | InventoryCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type InventoryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type InventoryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $InventoryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Inventory"
    objects: {
      operations: Prisma.$InventoryOperationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      productId: string
      stock: number
      reservedStock: number
      lowStockThreshold: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["inventory"]>
    composites: {}
  }

  type InventoryGetPayload<S extends boolean | null | undefined | InventoryDefaultArgs> = $Result.GetResult<Prisma.$InventoryPayload, S>

  type InventoryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InventoryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InventoryCountAggregateInputType | true
    }

  export interface InventoryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Inventory'], meta: { name: 'Inventory' } }
    /**
     * Find zero or one Inventory that matches the filter.
     * @param {InventoryFindUniqueArgs} args - Arguments to find a Inventory
     * @example
     * // Get one Inventory
     * const inventory = await prisma.inventory.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryFindUniqueArgs>(args: SelectSubset<T, InventoryFindUniqueArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Inventory that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryFindUniqueOrThrowArgs} args - Arguments to find a Inventory
     * @example
     * // Get one Inventory
     * const inventory = await prisma.inventory.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inventory that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryFindFirstArgs} args - Arguments to find a Inventory
     * @example
     * // Get one Inventory
     * const inventory = await prisma.inventory.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryFindFirstArgs>(args?: SelectSubset<T, InventoryFindFirstArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inventory that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryFindFirstOrThrowArgs} args - Arguments to find a Inventory
     * @example
     * // Get one Inventory
     * const inventory = await prisma.inventory.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Inventories that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Inventories
     * const inventories = await prisma.inventory.findMany()
     * 
     * // Get first 10 Inventories
     * const inventories = await prisma.inventory.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryWithIdOnly = await prisma.inventory.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryFindManyArgs>(args?: SelectSubset<T, InventoryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Inventory.
     * @param {InventoryCreateArgs} args - Arguments to create a Inventory.
     * @example
     * // Create one Inventory
     * const Inventory = await prisma.inventory.create({
     *   data: {
     *     // ... data to create a Inventory
     *   }
     * })
     * 
     */
    create<T extends InventoryCreateArgs>(args: SelectSubset<T, InventoryCreateArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Inventories.
     * @param {InventoryCreateManyArgs} args - Arguments to create many Inventories.
     * @example
     * // Create many Inventories
     * const inventory = await prisma.inventory.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryCreateManyArgs>(args?: SelectSubset<T, InventoryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Inventories and returns the data saved in the database.
     * @param {InventoryCreateManyAndReturnArgs} args - Arguments to create many Inventories.
     * @example
     * // Create many Inventories
     * const inventory = await prisma.inventory.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Inventories and only return the `id`
     * const inventoryWithIdOnly = await prisma.inventory.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Inventory.
     * @param {InventoryDeleteArgs} args - Arguments to delete one Inventory.
     * @example
     * // Delete one Inventory
     * const Inventory = await prisma.inventory.delete({
     *   where: {
     *     // ... filter to delete one Inventory
     *   }
     * })
     * 
     */
    delete<T extends InventoryDeleteArgs>(args: SelectSubset<T, InventoryDeleteArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Inventory.
     * @param {InventoryUpdateArgs} args - Arguments to update one Inventory.
     * @example
     * // Update one Inventory
     * const inventory = await prisma.inventory.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryUpdateArgs>(args: SelectSubset<T, InventoryUpdateArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Inventories.
     * @param {InventoryDeleteManyArgs} args - Arguments to filter Inventories to delete.
     * @example
     * // Delete a few Inventories
     * const { count } = await prisma.inventory.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryDeleteManyArgs>(args?: SelectSubset<T, InventoryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inventories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Inventories
     * const inventory = await prisma.inventory.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryUpdateManyArgs>(args: SelectSubset<T, InventoryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inventories and returns the data updated in the database.
     * @param {InventoryUpdateManyAndReturnArgs} args - Arguments to update many Inventories.
     * @example
     * // Update many Inventories
     * const inventory = await prisma.inventory.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Inventories and only return the `id`
     * const inventoryWithIdOnly = await prisma.inventory.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InventoryUpdateManyAndReturnArgs>(args: SelectSubset<T, InventoryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Inventory.
     * @param {InventoryUpsertArgs} args - Arguments to update or create a Inventory.
     * @example
     * // Update or create a Inventory
     * const inventory = await prisma.inventory.upsert({
     *   create: {
     *     // ... data to create a Inventory
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Inventory we want to update
     *   }
     * })
     */
    upsert<T extends InventoryUpsertArgs>(args: SelectSubset<T, InventoryUpsertArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Inventories.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryCountArgs} args - Arguments to filter Inventories to count.
     * @example
     * // Count the number of Inventories
     * const count = await prisma.inventory.count({
     *   where: {
     *     // ... the filter for the Inventories we want to count
     *   }
     * })
    **/
    count<T extends InventoryCountArgs>(
      args?: Subset<T, InventoryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Inventory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InventoryAggregateArgs>(args: Subset<T, InventoryAggregateArgs>): Prisma.PrismaPromise<GetInventoryAggregateType<T>>

    /**
     * Group by Inventory.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InventoryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryGroupByArgs['orderBy'] }
        : { orderBy?: InventoryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InventoryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Inventory model
   */
  readonly fields: InventoryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Inventory.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    operations<T extends Inventory$operationsArgs<ExtArgs> = {}>(args?: Subset<T, Inventory$operationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Inventory model
   */
  interface InventoryFieldRefs {
    readonly id: FieldRef<"Inventory", 'String'>
    readonly productId: FieldRef<"Inventory", 'String'>
    readonly stock: FieldRef<"Inventory", 'Int'>
    readonly reservedStock: FieldRef<"Inventory", 'Int'>
    readonly lowStockThreshold: FieldRef<"Inventory", 'Int'>
    readonly createdAt: FieldRef<"Inventory", 'DateTime'>
    readonly updatedAt: FieldRef<"Inventory", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Inventory findUnique
   */
  export type InventoryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter, which Inventory to fetch.
     */
    where: InventoryWhereUniqueInput
  }

  /**
   * Inventory findUniqueOrThrow
   */
  export type InventoryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter, which Inventory to fetch.
     */
    where: InventoryWhereUniqueInput
  }

  /**
   * Inventory findFirst
   */
  export type InventoryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter, which Inventory to fetch.
     */
    where?: InventoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inventories to fetch.
     */
    orderBy?: InventoryOrderByWithRelationInput | InventoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inventories.
     */
    cursor?: InventoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inventories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inventories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inventories.
     */
    distinct?: InventoryScalarFieldEnum | InventoryScalarFieldEnum[]
  }

  /**
   * Inventory findFirstOrThrow
   */
  export type InventoryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter, which Inventory to fetch.
     */
    where?: InventoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inventories to fetch.
     */
    orderBy?: InventoryOrderByWithRelationInput | InventoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inventories.
     */
    cursor?: InventoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inventories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inventories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inventories.
     */
    distinct?: InventoryScalarFieldEnum | InventoryScalarFieldEnum[]
  }

  /**
   * Inventory findMany
   */
  export type InventoryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter, which Inventories to fetch.
     */
    where?: InventoryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inventories to fetch.
     */
    orderBy?: InventoryOrderByWithRelationInput | InventoryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Inventories.
     */
    cursor?: InventoryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inventories from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inventories.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inventories.
     */
    distinct?: InventoryScalarFieldEnum | InventoryScalarFieldEnum[]
  }

  /**
   * Inventory create
   */
  export type InventoryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * The data needed to create a Inventory.
     */
    data: XOR<InventoryCreateInput, InventoryUncheckedCreateInput>
  }

  /**
   * Inventory createMany
   */
  export type InventoryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Inventories.
     */
    data: InventoryCreateManyInput | InventoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Inventory createManyAndReturn
   */
  export type InventoryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * The data used to create many Inventories.
     */
    data: InventoryCreateManyInput | InventoryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Inventory update
   */
  export type InventoryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * The data needed to update a Inventory.
     */
    data: XOR<InventoryUpdateInput, InventoryUncheckedUpdateInput>
    /**
     * Choose, which Inventory to update.
     */
    where: InventoryWhereUniqueInput
  }

  /**
   * Inventory updateMany
   */
  export type InventoryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Inventories.
     */
    data: XOR<InventoryUpdateManyMutationInput, InventoryUncheckedUpdateManyInput>
    /**
     * Filter which Inventories to update
     */
    where?: InventoryWhereInput
    /**
     * Limit how many Inventories to update.
     */
    limit?: number
  }

  /**
   * Inventory updateManyAndReturn
   */
  export type InventoryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * The data used to update Inventories.
     */
    data: XOR<InventoryUpdateManyMutationInput, InventoryUncheckedUpdateManyInput>
    /**
     * Filter which Inventories to update
     */
    where?: InventoryWhereInput
    /**
     * Limit how many Inventories to update.
     */
    limit?: number
  }

  /**
   * Inventory upsert
   */
  export type InventoryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * The filter to search for the Inventory to update in case it exists.
     */
    where: InventoryWhereUniqueInput
    /**
     * In case the Inventory found by the `where` argument doesn't exist, create a new Inventory with this data.
     */
    create: XOR<InventoryCreateInput, InventoryUncheckedCreateInput>
    /**
     * In case the Inventory was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryUpdateInput, InventoryUncheckedUpdateInput>
  }

  /**
   * Inventory delete
   */
  export type InventoryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
    /**
     * Filter which Inventory to delete.
     */
    where: InventoryWhereUniqueInput
  }

  /**
   * Inventory deleteMany
   */
  export type InventoryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inventories to delete
     */
    where?: InventoryWhereInput
    /**
     * Limit how many Inventories to delete.
     */
    limit?: number
  }

  /**
   * Inventory.operations
   */
  export type Inventory$operationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    where?: InventoryOperationWhereInput
    orderBy?: InventoryOperationOrderByWithRelationInput | InventoryOperationOrderByWithRelationInput[]
    cursor?: InventoryOperationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: InventoryOperationScalarFieldEnum | InventoryOperationScalarFieldEnum[]
  }

  /**
   * Inventory without action
   */
  export type InventoryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inventory
     */
    select?: InventorySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inventory
     */
    omit?: InventoryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryInclude<ExtArgs> | null
  }


  /**
   * Model InventoryOperation
   */

  export type AggregateInventoryOperation = {
    _count: InventoryOperationCountAggregateOutputType | null
    _avg: InventoryOperationAvgAggregateOutputType | null
    _sum: InventoryOperationSumAggregateOutputType | null
    _min: InventoryOperationMinAggregateOutputType | null
    _max: InventoryOperationMaxAggregateOutputType | null
  }

  export type InventoryOperationAvgAggregateOutputType = {
    quantity: number | null
  }

  export type InventoryOperationSumAggregateOutputType = {
    quantity: number | null
  }

  export type InventoryOperationMinAggregateOutputType = {
    id: string | null
    operationId: string | null
    productId: string | null
    type: string | null
    quantity: number | null
    createdAt: Date | null
  }

  export type InventoryOperationMaxAggregateOutputType = {
    id: string | null
    operationId: string | null
    productId: string | null
    type: string | null
    quantity: number | null
    createdAt: Date | null
  }

  export type InventoryOperationCountAggregateOutputType = {
    id: number
    operationId: number
    productId: number
    type: number
    quantity: number
    createdAt: number
    _all: number
  }


  export type InventoryOperationAvgAggregateInputType = {
    quantity?: true
  }

  export type InventoryOperationSumAggregateInputType = {
    quantity?: true
  }

  export type InventoryOperationMinAggregateInputType = {
    id?: true
    operationId?: true
    productId?: true
    type?: true
    quantity?: true
    createdAt?: true
  }

  export type InventoryOperationMaxAggregateInputType = {
    id?: true
    operationId?: true
    productId?: true
    type?: true
    quantity?: true
    createdAt?: true
  }

  export type InventoryOperationCountAggregateInputType = {
    id?: true
    operationId?: true
    productId?: true
    type?: true
    quantity?: true
    createdAt?: true
    _all?: true
  }

  export type InventoryOperationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryOperation to aggregate.
     */
    where?: InventoryOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryOperations to fetch.
     */
    orderBy?: InventoryOperationOrderByWithRelationInput | InventoryOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InventoryOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned InventoryOperations
    **/
    _count?: true | InventoryOperationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InventoryOperationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InventoryOperationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InventoryOperationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InventoryOperationMaxAggregateInputType
  }

  export type GetInventoryOperationAggregateType<T extends InventoryOperationAggregateArgs> = {
        [P in keyof T & keyof AggregateInventoryOperation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryOperation[P]>
      : GetScalarType<T[P], AggregateInventoryOperation[P]>
  }




  export type InventoryOperationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InventoryOperationWhereInput
    orderBy?: InventoryOperationOrderByWithAggregationInput | InventoryOperationOrderByWithAggregationInput[]
    by: InventoryOperationScalarFieldEnum[] | InventoryOperationScalarFieldEnum
    having?: InventoryOperationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InventoryOperationCountAggregateInputType | true
    _avg?: InventoryOperationAvgAggregateInputType
    _sum?: InventoryOperationSumAggregateInputType
    _min?: InventoryOperationMinAggregateInputType
    _max?: InventoryOperationMaxAggregateInputType
  }

  export type InventoryOperationGroupByOutputType = {
    id: string
    operationId: string
    productId: string
    type: string
    quantity: number
    createdAt: Date
    _count: InventoryOperationCountAggregateOutputType | null
    _avg: InventoryOperationAvgAggregateOutputType | null
    _sum: InventoryOperationSumAggregateOutputType | null
    _min: InventoryOperationMinAggregateOutputType | null
    _max: InventoryOperationMaxAggregateOutputType | null
  }

  type GetInventoryOperationGroupByPayload<T extends InventoryOperationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryOperationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InventoryOperationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryOperationGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryOperationGroupByOutputType[P]>
        }
      >
    >


  export type InventoryOperationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    operationId?: boolean
    productId?: boolean
    type?: boolean
    quantity?: boolean
    createdAt?: boolean
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryOperation"]>

  export type InventoryOperationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    operationId?: boolean
    productId?: boolean
    type?: boolean
    quantity?: boolean
    createdAt?: boolean
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryOperation"]>

  export type InventoryOperationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    operationId?: boolean
    productId?: boolean
    type?: boolean
    quantity?: boolean
    createdAt?: boolean
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["inventoryOperation"]>

  export type InventoryOperationSelectScalar = {
    id?: boolean
    operationId?: boolean
    productId?: boolean
    type?: boolean
    quantity?: boolean
    createdAt?: boolean
  }

  export type InventoryOperationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "operationId" | "productId" | "type" | "quantity" | "createdAt", ExtArgs["result"]["inventoryOperation"]>
  export type InventoryOperationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }
  export type InventoryOperationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }
  export type InventoryOperationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    inventory?: boolean | InventoryDefaultArgs<ExtArgs>
  }

  export type $InventoryOperationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "InventoryOperation"
    objects: {
      inventory: Prisma.$InventoryPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      operationId: string
      productId: string
      type: string
      quantity: number
      createdAt: Date
    }, ExtArgs["result"]["inventoryOperation"]>
    composites: {}
  }

  type InventoryOperationGetPayload<S extends boolean | null | undefined | InventoryOperationDefaultArgs> = $Result.GetResult<Prisma.$InventoryOperationPayload, S>

  type InventoryOperationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InventoryOperationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InventoryOperationCountAggregateInputType | true
    }

  export interface InventoryOperationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['InventoryOperation'], meta: { name: 'InventoryOperation' } }
    /**
     * Find zero or one InventoryOperation that matches the filter.
     * @param {InventoryOperationFindUniqueArgs} args - Arguments to find a InventoryOperation
     * @example
     * // Get one InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryOperationFindUniqueArgs>(args: SelectSubset<T, InventoryOperationFindUniqueArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one InventoryOperation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryOperationFindUniqueOrThrowArgs} args - Arguments to find a InventoryOperation
     * @example
     * // Get one InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryOperationFindUniqueOrThrowArgs>(args: SelectSubset<T, InventoryOperationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InventoryOperation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationFindFirstArgs} args - Arguments to find a InventoryOperation
     * @example
     * // Get one InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryOperationFindFirstArgs>(args?: SelectSubset<T, InventoryOperationFindFirstArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first InventoryOperation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationFindFirstOrThrowArgs} args - Arguments to find a InventoryOperation
     * @example
     * // Get one InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryOperationFindFirstOrThrowArgs>(args?: SelectSubset<T, InventoryOperationFindFirstOrThrowArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more InventoryOperations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryOperations
     * const inventoryOperations = await prisma.inventoryOperation.findMany()
     * 
     * // Get first 10 InventoryOperations
     * const inventoryOperations = await prisma.inventoryOperation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inventoryOperationWithIdOnly = await prisma.inventoryOperation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InventoryOperationFindManyArgs>(args?: SelectSubset<T, InventoryOperationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a InventoryOperation.
     * @param {InventoryOperationCreateArgs} args - Arguments to create a InventoryOperation.
     * @example
     * // Create one InventoryOperation
     * const InventoryOperation = await prisma.inventoryOperation.create({
     *   data: {
     *     // ... data to create a InventoryOperation
     *   }
     * })
     * 
     */
    create<T extends InventoryOperationCreateArgs>(args: SelectSubset<T, InventoryOperationCreateArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many InventoryOperations.
     * @param {InventoryOperationCreateManyArgs} args - Arguments to create many InventoryOperations.
     * @example
     * // Create many InventoryOperations
     * const inventoryOperation = await prisma.inventoryOperation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InventoryOperationCreateManyArgs>(args?: SelectSubset<T, InventoryOperationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many InventoryOperations and returns the data saved in the database.
     * @param {InventoryOperationCreateManyAndReturnArgs} args - Arguments to create many InventoryOperations.
     * @example
     * // Create many InventoryOperations
     * const inventoryOperation = await prisma.inventoryOperation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many InventoryOperations and only return the `id`
     * const inventoryOperationWithIdOnly = await prisma.inventoryOperation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InventoryOperationCreateManyAndReturnArgs>(args?: SelectSubset<T, InventoryOperationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a InventoryOperation.
     * @param {InventoryOperationDeleteArgs} args - Arguments to delete one InventoryOperation.
     * @example
     * // Delete one InventoryOperation
     * const InventoryOperation = await prisma.inventoryOperation.delete({
     *   where: {
     *     // ... filter to delete one InventoryOperation
     *   }
     * })
     * 
     */
    delete<T extends InventoryOperationDeleteArgs>(args: SelectSubset<T, InventoryOperationDeleteArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one InventoryOperation.
     * @param {InventoryOperationUpdateArgs} args - Arguments to update one InventoryOperation.
     * @example
     * // Update one InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InventoryOperationUpdateArgs>(args: SelectSubset<T, InventoryOperationUpdateArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more InventoryOperations.
     * @param {InventoryOperationDeleteManyArgs} args - Arguments to filter InventoryOperations to delete.
     * @example
     * // Delete a few InventoryOperations
     * const { count } = await prisma.inventoryOperation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InventoryOperationDeleteManyArgs>(args?: SelectSubset<T, InventoryOperationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryOperations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryOperations
     * const inventoryOperation = await prisma.inventoryOperation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InventoryOperationUpdateManyArgs>(args: SelectSubset<T, InventoryOperationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more InventoryOperations and returns the data updated in the database.
     * @param {InventoryOperationUpdateManyAndReturnArgs} args - Arguments to update many InventoryOperations.
     * @example
     * // Update many InventoryOperations
     * const inventoryOperation = await prisma.inventoryOperation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more InventoryOperations and only return the `id`
     * const inventoryOperationWithIdOnly = await prisma.inventoryOperation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InventoryOperationUpdateManyAndReturnArgs>(args: SelectSubset<T, InventoryOperationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one InventoryOperation.
     * @param {InventoryOperationUpsertArgs} args - Arguments to update or create a InventoryOperation.
     * @example
     * // Update or create a InventoryOperation
     * const inventoryOperation = await prisma.inventoryOperation.upsert({
     *   create: {
     *     // ... data to create a InventoryOperation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryOperation we want to update
     *   }
     * })
     */
    upsert<T extends InventoryOperationUpsertArgs>(args: SelectSubset<T, InventoryOperationUpsertArgs<ExtArgs>>): Prisma__InventoryOperationClient<$Result.GetResult<Prisma.$InventoryOperationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of InventoryOperations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationCountArgs} args - Arguments to filter InventoryOperations to count.
     * @example
     * // Count the number of InventoryOperations
     * const count = await prisma.inventoryOperation.count({
     *   where: {
     *     // ... the filter for the InventoryOperations we want to count
     *   }
     * })
    **/
    count<T extends InventoryOperationCountArgs>(
      args?: Subset<T, InventoryOperationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryOperationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a InventoryOperation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InventoryOperationAggregateArgs>(args: Subset<T, InventoryOperationAggregateArgs>): Prisma.PrismaPromise<GetInventoryOperationAggregateType<T>>

    /**
     * Group by InventoryOperation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryOperationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InventoryOperationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryOperationGroupByArgs['orderBy'] }
        : { orderBy?: InventoryOperationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InventoryOperationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInventoryOperationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the InventoryOperation model
   */
  readonly fields: InventoryOperationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryOperation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryOperationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    inventory<T extends InventoryDefaultArgs<ExtArgs> = {}>(args?: Subset<T, InventoryDefaultArgs<ExtArgs>>): Prisma__InventoryClient<$Result.GetResult<Prisma.$InventoryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the InventoryOperation model
   */
  interface InventoryOperationFieldRefs {
    readonly id: FieldRef<"InventoryOperation", 'String'>
    readonly operationId: FieldRef<"InventoryOperation", 'String'>
    readonly productId: FieldRef<"InventoryOperation", 'String'>
    readonly type: FieldRef<"InventoryOperation", 'String'>
    readonly quantity: FieldRef<"InventoryOperation", 'Int'>
    readonly createdAt: FieldRef<"InventoryOperation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * InventoryOperation findUnique
   */
  export type InventoryOperationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter, which InventoryOperation to fetch.
     */
    where: InventoryOperationWhereUniqueInput
  }

  /**
   * InventoryOperation findUniqueOrThrow
   */
  export type InventoryOperationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter, which InventoryOperation to fetch.
     */
    where: InventoryOperationWhereUniqueInput
  }

  /**
   * InventoryOperation findFirst
   */
  export type InventoryOperationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter, which InventoryOperation to fetch.
     */
    where?: InventoryOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryOperations to fetch.
     */
    orderBy?: InventoryOperationOrderByWithRelationInput | InventoryOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryOperations.
     */
    cursor?: InventoryOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryOperations.
     */
    distinct?: InventoryOperationScalarFieldEnum | InventoryOperationScalarFieldEnum[]
  }

  /**
   * InventoryOperation findFirstOrThrow
   */
  export type InventoryOperationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter, which InventoryOperation to fetch.
     */
    where?: InventoryOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryOperations to fetch.
     */
    orderBy?: InventoryOperationOrderByWithRelationInput | InventoryOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for InventoryOperations.
     */
    cursor?: InventoryOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryOperations.
     */
    distinct?: InventoryOperationScalarFieldEnum | InventoryOperationScalarFieldEnum[]
  }

  /**
   * InventoryOperation findMany
   */
  export type InventoryOperationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter, which InventoryOperations to fetch.
     */
    where?: InventoryOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of InventoryOperations to fetch.
     */
    orderBy?: InventoryOperationOrderByWithRelationInput | InventoryOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing InventoryOperations.
     */
    cursor?: InventoryOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` InventoryOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` InventoryOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of InventoryOperations.
     */
    distinct?: InventoryOperationScalarFieldEnum | InventoryOperationScalarFieldEnum[]
  }

  /**
   * InventoryOperation create
   */
  export type InventoryOperationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * The data needed to create a InventoryOperation.
     */
    data: XOR<InventoryOperationCreateInput, InventoryOperationUncheckedCreateInput>
  }

  /**
   * InventoryOperation createMany
   */
  export type InventoryOperationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many InventoryOperations.
     */
    data: InventoryOperationCreateManyInput | InventoryOperationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * InventoryOperation createManyAndReturn
   */
  export type InventoryOperationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * The data used to create many InventoryOperations.
     */
    data: InventoryOperationCreateManyInput | InventoryOperationCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryOperation update
   */
  export type InventoryOperationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * The data needed to update a InventoryOperation.
     */
    data: XOR<InventoryOperationUpdateInput, InventoryOperationUncheckedUpdateInput>
    /**
     * Choose, which InventoryOperation to update.
     */
    where: InventoryOperationWhereUniqueInput
  }

  /**
   * InventoryOperation updateMany
   */
  export type InventoryOperationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update InventoryOperations.
     */
    data: XOR<InventoryOperationUpdateManyMutationInput, InventoryOperationUncheckedUpdateManyInput>
    /**
     * Filter which InventoryOperations to update
     */
    where?: InventoryOperationWhereInput
    /**
     * Limit how many InventoryOperations to update.
     */
    limit?: number
  }

  /**
   * InventoryOperation updateManyAndReturn
   */
  export type InventoryOperationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * The data used to update InventoryOperations.
     */
    data: XOR<InventoryOperationUpdateManyMutationInput, InventoryOperationUncheckedUpdateManyInput>
    /**
     * Filter which InventoryOperations to update
     */
    where?: InventoryOperationWhereInput
    /**
     * Limit how many InventoryOperations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * InventoryOperation upsert
   */
  export type InventoryOperationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * The filter to search for the InventoryOperation to update in case it exists.
     */
    where: InventoryOperationWhereUniqueInput
    /**
     * In case the InventoryOperation found by the `where` argument doesn't exist, create a new InventoryOperation with this data.
     */
    create: XOR<InventoryOperationCreateInput, InventoryOperationUncheckedCreateInput>
    /**
     * In case the InventoryOperation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryOperationUpdateInput, InventoryOperationUncheckedUpdateInput>
  }

  /**
   * InventoryOperation delete
   */
  export type InventoryOperationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
    /**
     * Filter which InventoryOperation to delete.
     */
    where: InventoryOperationWhereUniqueInput
  }

  /**
   * InventoryOperation deleteMany
   */
  export type InventoryOperationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which InventoryOperations to delete
     */
    where?: InventoryOperationWhereInput
    /**
     * Limit how many InventoryOperations to delete.
     */
    limit?: number
  }

  /**
   * InventoryOperation without action
   */
  export type InventoryOperationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the InventoryOperation
     */
    select?: InventoryOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the InventoryOperation
     */
    omit?: InventoryOperationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryOperationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const OutboxEventScalarFieldEnum: {
    id: 'id',
    eventId: 'eventId',
    deduplicationKey: 'deduplicationKey',
    payload: 'payload',
    createdAt: 'createdAt',
    publishedAt: 'publishedAt',
    attempts: 'attempts',
    lastError: 'lastError',
    nextAttemptAt: 'nextAttemptAt'
  };

  export type OutboxEventScalarFieldEnum = (typeof OutboxEventScalarFieldEnum)[keyof typeof OutboxEventScalarFieldEnum]


  export const CheckoutEventScalarFieldEnum: {
    eventId: 'eventId',
    eventType: 'eventType',
    processedAt: 'processedAt',
    fingerprint: 'fingerprint',
    result: 'result'
  };

  export type CheckoutEventScalarFieldEnum = (typeof CheckoutEventScalarFieldEnum)[keyof typeof CheckoutEventScalarFieldEnum]


  export const InventoryScalarFieldEnum: {
    id: 'id',
    productId: 'productId',
    stock: 'stock',
    reservedStock: 'reservedStock',
    lowStockThreshold: 'lowStockThreshold',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InventoryScalarFieldEnum = (typeof InventoryScalarFieldEnum)[keyof typeof InventoryScalarFieldEnum]


  export const InventoryOperationScalarFieldEnum: {
    id: 'id',
    operationId: 'operationId',
    productId: 'productId',
    type: 'type',
    quantity: 'quantity',
    createdAt: 'createdAt'
  };

  export type InventoryOperationScalarFieldEnum = (typeof InventoryOperationScalarFieldEnum)[keyof typeof InventoryOperationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type OutboxEventWhereInput = {
    AND?: OutboxEventWhereInput | OutboxEventWhereInput[]
    OR?: OutboxEventWhereInput[]
    NOT?: OutboxEventWhereInput | OutboxEventWhereInput[]
    id?: StringFilter<"OutboxEvent"> | string
    eventId?: StringFilter<"OutboxEvent"> | string
    deduplicationKey?: StringFilter<"OutboxEvent"> | string
    payload?: StringFilter<"OutboxEvent"> | string
    createdAt?: DateTimeFilter<"OutboxEvent"> | Date | string
    publishedAt?: DateTimeNullableFilter<"OutboxEvent"> | Date | string | null
    attempts?: IntFilter<"OutboxEvent"> | number
    lastError?: StringNullableFilter<"OutboxEvent"> | string | null
    nextAttemptAt?: DateTimeFilter<"OutboxEvent"> | Date | string
  }

  export type OutboxEventOrderByWithRelationInput = {
    id?: SortOrder
    eventId?: SortOrder
    deduplicationKey?: SortOrder
    payload?: SortOrder
    createdAt?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    attempts?: SortOrder
    lastError?: SortOrderInput | SortOrder
    nextAttemptAt?: SortOrder
  }

  export type OutboxEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    eventId?: string
    deduplicationKey?: string
    AND?: OutboxEventWhereInput | OutboxEventWhereInput[]
    OR?: OutboxEventWhereInput[]
    NOT?: OutboxEventWhereInput | OutboxEventWhereInput[]
    payload?: StringFilter<"OutboxEvent"> | string
    createdAt?: DateTimeFilter<"OutboxEvent"> | Date | string
    publishedAt?: DateTimeNullableFilter<"OutboxEvent"> | Date | string | null
    attempts?: IntFilter<"OutboxEvent"> | number
    lastError?: StringNullableFilter<"OutboxEvent"> | string | null
    nextAttemptAt?: DateTimeFilter<"OutboxEvent"> | Date | string
  }, "id" | "eventId" | "deduplicationKey">

  export type OutboxEventOrderByWithAggregationInput = {
    id?: SortOrder
    eventId?: SortOrder
    deduplicationKey?: SortOrder
    payload?: SortOrder
    createdAt?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    attempts?: SortOrder
    lastError?: SortOrderInput | SortOrder
    nextAttemptAt?: SortOrder
    _count?: OutboxEventCountOrderByAggregateInput
    _avg?: OutboxEventAvgOrderByAggregateInput
    _max?: OutboxEventMaxOrderByAggregateInput
    _min?: OutboxEventMinOrderByAggregateInput
    _sum?: OutboxEventSumOrderByAggregateInput
  }

  export type OutboxEventScalarWhereWithAggregatesInput = {
    AND?: OutboxEventScalarWhereWithAggregatesInput | OutboxEventScalarWhereWithAggregatesInput[]
    OR?: OutboxEventScalarWhereWithAggregatesInput[]
    NOT?: OutboxEventScalarWhereWithAggregatesInput | OutboxEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"OutboxEvent"> | string
    eventId?: StringWithAggregatesFilter<"OutboxEvent"> | string
    deduplicationKey?: StringWithAggregatesFilter<"OutboxEvent"> | string
    payload?: StringWithAggregatesFilter<"OutboxEvent"> | string
    createdAt?: DateTimeWithAggregatesFilter<"OutboxEvent"> | Date | string
    publishedAt?: DateTimeNullableWithAggregatesFilter<"OutboxEvent"> | Date | string | null
    attempts?: IntWithAggregatesFilter<"OutboxEvent"> | number
    lastError?: StringNullableWithAggregatesFilter<"OutboxEvent"> | string | null
    nextAttemptAt?: DateTimeWithAggregatesFilter<"OutboxEvent"> | Date | string
  }

  export type CheckoutEventWhereInput = {
    AND?: CheckoutEventWhereInput | CheckoutEventWhereInput[]
    OR?: CheckoutEventWhereInput[]
    NOT?: CheckoutEventWhereInput | CheckoutEventWhereInput[]
    eventId?: StringFilter<"CheckoutEvent"> | string
    eventType?: StringNullableFilter<"CheckoutEvent"> | string | null
    processedAt?: DateTimeFilter<"CheckoutEvent"> | Date | string
    fingerprint?: StringFilter<"CheckoutEvent"> | string
    result?: StringNullableFilter<"CheckoutEvent"> | string | null
  }

  export type CheckoutEventOrderByWithRelationInput = {
    eventId?: SortOrder
    eventType?: SortOrderInput | SortOrder
    processedAt?: SortOrder
    fingerprint?: SortOrder
    result?: SortOrderInput | SortOrder
  }

  export type CheckoutEventWhereUniqueInput = Prisma.AtLeast<{
    eventId?: string
    AND?: CheckoutEventWhereInput | CheckoutEventWhereInput[]
    OR?: CheckoutEventWhereInput[]
    NOT?: CheckoutEventWhereInput | CheckoutEventWhereInput[]
    eventType?: StringNullableFilter<"CheckoutEvent"> | string | null
    processedAt?: DateTimeFilter<"CheckoutEvent"> | Date | string
    fingerprint?: StringFilter<"CheckoutEvent"> | string
    result?: StringNullableFilter<"CheckoutEvent"> | string | null
  }, "eventId">

  export type CheckoutEventOrderByWithAggregationInput = {
    eventId?: SortOrder
    eventType?: SortOrderInput | SortOrder
    processedAt?: SortOrder
    fingerprint?: SortOrder
    result?: SortOrderInput | SortOrder
    _count?: CheckoutEventCountOrderByAggregateInput
    _max?: CheckoutEventMaxOrderByAggregateInput
    _min?: CheckoutEventMinOrderByAggregateInput
  }

  export type CheckoutEventScalarWhereWithAggregatesInput = {
    AND?: CheckoutEventScalarWhereWithAggregatesInput | CheckoutEventScalarWhereWithAggregatesInput[]
    OR?: CheckoutEventScalarWhereWithAggregatesInput[]
    NOT?: CheckoutEventScalarWhereWithAggregatesInput | CheckoutEventScalarWhereWithAggregatesInput[]
    eventId?: StringWithAggregatesFilter<"CheckoutEvent"> | string
    eventType?: StringNullableWithAggregatesFilter<"CheckoutEvent"> | string | null
    processedAt?: DateTimeWithAggregatesFilter<"CheckoutEvent"> | Date | string
    fingerprint?: StringWithAggregatesFilter<"CheckoutEvent"> | string
    result?: StringNullableWithAggregatesFilter<"CheckoutEvent"> | string | null
  }

  export type InventoryWhereInput = {
    AND?: InventoryWhereInput | InventoryWhereInput[]
    OR?: InventoryWhereInput[]
    NOT?: InventoryWhereInput | InventoryWhereInput[]
    id?: StringFilter<"Inventory"> | string
    productId?: StringFilter<"Inventory"> | string
    stock?: IntFilter<"Inventory"> | number
    reservedStock?: IntFilter<"Inventory"> | number
    lowStockThreshold?: IntFilter<"Inventory"> | number
    createdAt?: DateTimeFilter<"Inventory"> | Date | string
    updatedAt?: DateTimeFilter<"Inventory"> | Date | string
    operations?: InventoryOperationListRelationFilter
  }

  export type InventoryOrderByWithRelationInput = {
    id?: SortOrder
    productId?: SortOrder
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    operations?: InventoryOperationOrderByRelationAggregateInput
  }

  export type InventoryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    productId?: string
    AND?: InventoryWhereInput | InventoryWhereInput[]
    OR?: InventoryWhereInput[]
    NOT?: InventoryWhereInput | InventoryWhereInput[]
    stock?: IntFilter<"Inventory"> | number
    reservedStock?: IntFilter<"Inventory"> | number
    lowStockThreshold?: IntFilter<"Inventory"> | number
    createdAt?: DateTimeFilter<"Inventory"> | Date | string
    updatedAt?: DateTimeFilter<"Inventory"> | Date | string
    operations?: InventoryOperationListRelationFilter
  }, "id" | "productId">

  export type InventoryOrderByWithAggregationInput = {
    id?: SortOrder
    productId?: SortOrder
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InventoryCountOrderByAggregateInput
    _avg?: InventoryAvgOrderByAggregateInput
    _max?: InventoryMaxOrderByAggregateInput
    _min?: InventoryMinOrderByAggregateInput
    _sum?: InventorySumOrderByAggregateInput
  }

  export type InventoryScalarWhereWithAggregatesInput = {
    AND?: InventoryScalarWhereWithAggregatesInput | InventoryScalarWhereWithAggregatesInput[]
    OR?: InventoryScalarWhereWithAggregatesInput[]
    NOT?: InventoryScalarWhereWithAggregatesInput | InventoryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Inventory"> | string
    productId?: StringWithAggregatesFilter<"Inventory"> | string
    stock?: IntWithAggregatesFilter<"Inventory"> | number
    reservedStock?: IntWithAggregatesFilter<"Inventory"> | number
    lowStockThreshold?: IntWithAggregatesFilter<"Inventory"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Inventory"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Inventory"> | Date | string
  }

  export type InventoryOperationWhereInput = {
    AND?: InventoryOperationWhereInput | InventoryOperationWhereInput[]
    OR?: InventoryOperationWhereInput[]
    NOT?: InventoryOperationWhereInput | InventoryOperationWhereInput[]
    id?: StringFilter<"InventoryOperation"> | string
    operationId?: StringFilter<"InventoryOperation"> | string
    productId?: StringFilter<"InventoryOperation"> | string
    type?: StringFilter<"InventoryOperation"> | string
    quantity?: IntFilter<"InventoryOperation"> | number
    createdAt?: DateTimeFilter<"InventoryOperation"> | Date | string
    inventory?: XOR<InventoryScalarRelationFilter, InventoryWhereInput>
  }

  export type InventoryOperationOrderByWithRelationInput = {
    id?: SortOrder
    operationId?: SortOrder
    productId?: SortOrder
    type?: SortOrder
    quantity?: SortOrder
    createdAt?: SortOrder
    inventory?: InventoryOrderByWithRelationInput
  }

  export type InventoryOperationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    operationId?: string
    AND?: InventoryOperationWhereInput | InventoryOperationWhereInput[]
    OR?: InventoryOperationWhereInput[]
    NOT?: InventoryOperationWhereInput | InventoryOperationWhereInput[]
    productId?: StringFilter<"InventoryOperation"> | string
    type?: StringFilter<"InventoryOperation"> | string
    quantity?: IntFilter<"InventoryOperation"> | number
    createdAt?: DateTimeFilter<"InventoryOperation"> | Date | string
    inventory?: XOR<InventoryScalarRelationFilter, InventoryWhereInput>
  }, "id" | "operationId">

  export type InventoryOperationOrderByWithAggregationInput = {
    id?: SortOrder
    operationId?: SortOrder
    productId?: SortOrder
    type?: SortOrder
    quantity?: SortOrder
    createdAt?: SortOrder
    _count?: InventoryOperationCountOrderByAggregateInput
    _avg?: InventoryOperationAvgOrderByAggregateInput
    _max?: InventoryOperationMaxOrderByAggregateInput
    _min?: InventoryOperationMinOrderByAggregateInput
    _sum?: InventoryOperationSumOrderByAggregateInput
  }

  export type InventoryOperationScalarWhereWithAggregatesInput = {
    AND?: InventoryOperationScalarWhereWithAggregatesInput | InventoryOperationScalarWhereWithAggregatesInput[]
    OR?: InventoryOperationScalarWhereWithAggregatesInput[]
    NOT?: InventoryOperationScalarWhereWithAggregatesInput | InventoryOperationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"InventoryOperation"> | string
    operationId?: StringWithAggregatesFilter<"InventoryOperation"> | string
    productId?: StringWithAggregatesFilter<"InventoryOperation"> | string
    type?: StringWithAggregatesFilter<"InventoryOperation"> | string
    quantity?: IntWithAggregatesFilter<"InventoryOperation"> | number
    createdAt?: DateTimeWithAggregatesFilter<"InventoryOperation"> | Date | string
  }

  export type OutboxEventCreateInput = {
    id?: string
    eventId: string
    deduplicationKey: string
    payload: string
    createdAt?: Date | string
    publishedAt?: Date | string | null
    attempts?: number
    lastError?: string | null
    nextAttemptAt?: Date | string
  }

  export type OutboxEventUncheckedCreateInput = {
    id?: string
    eventId: string
    deduplicationKey: string
    payload: string
    createdAt?: Date | string
    publishedAt?: Date | string | null
    attempts?: number
    lastError?: string | null
    nextAttemptAt?: Date | string
  }

  export type OutboxEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    deduplicationKey?: StringFieldUpdateOperationsInput | string
    payload?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OutboxEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    deduplicationKey?: StringFieldUpdateOperationsInput | string
    payload?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OutboxEventCreateManyInput = {
    id?: string
    eventId: string
    deduplicationKey: string
    payload: string
    createdAt?: Date | string
    publishedAt?: Date | string | null
    attempts?: number
    lastError?: string | null
    nextAttemptAt?: Date | string
  }

  export type OutboxEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    deduplicationKey?: StringFieldUpdateOperationsInput | string
    payload?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type OutboxEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventId?: StringFieldUpdateOperationsInput | string
    deduplicationKey?: StringFieldUpdateOperationsInput | string
    payload?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    attempts?: IntFieldUpdateOperationsInput | number
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CheckoutEventCreateInput = {
    eventId: string
    eventType?: string | null
    processedAt?: Date | string
    fingerprint: string
    result?: string | null
  }

  export type CheckoutEventUncheckedCreateInput = {
    eventId: string
    eventType?: string | null
    processedAt?: Date | string
    fingerprint: string
    result?: string | null
  }

  export type CheckoutEventUpdateInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    eventType?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    result?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CheckoutEventUncheckedUpdateInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    eventType?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    result?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CheckoutEventCreateManyInput = {
    eventId: string
    eventType?: string | null
    processedAt?: Date | string
    fingerprint: string
    result?: string | null
  }

  export type CheckoutEventUpdateManyMutationInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    eventType?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    result?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type CheckoutEventUncheckedUpdateManyInput = {
    eventId?: StringFieldUpdateOperationsInput | string
    eventType?: NullableStringFieldUpdateOperationsInput | string | null
    processedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    result?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type InventoryCreateInput = {
    id?: string
    productId: string
    stock?: number
    reservedStock?: number
    lowStockThreshold?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    operations?: InventoryOperationCreateNestedManyWithoutInventoryInput
  }

  export type InventoryUncheckedCreateInput = {
    id?: string
    productId: string
    stock?: number
    reservedStock?: number
    lowStockThreshold?: number
    createdAt?: Date | string
    updatedAt?: Date | string
    operations?: InventoryOperationUncheckedCreateNestedManyWithoutInventoryInput
  }

  export type InventoryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    operations?: InventoryOperationUpdateManyWithoutInventoryNestedInput
  }

  export type InventoryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    operations?: InventoryOperationUncheckedUpdateManyWithoutInventoryNestedInput
  }

  export type InventoryCreateManyInput = {
    id?: string
    productId: string
    stock?: number
    reservedStock?: number
    lowStockThreshold?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InventoryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationCreateInput = {
    id?: string
    operationId: string
    type: string
    quantity: number
    createdAt?: Date | string
    inventory: InventoryCreateNestedOneWithoutOperationsInput
  }

  export type InventoryOperationUncheckedCreateInput = {
    id?: string
    operationId: string
    productId: string
    type: string
    quantity: number
    createdAt?: Date | string
  }

  export type InventoryOperationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    inventory?: InventoryUpdateOneRequiredWithoutOperationsNestedInput
  }

  export type InventoryOperationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationCreateManyInput = {
    id?: string
    operationId: string
    productId: string
    type: string
    quantity: number
    createdAt?: Date | string
  }

  export type InventoryOperationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type OutboxEventCountOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    deduplicationKey?: SortOrder
    payload?: SortOrder
    createdAt?: SortOrder
    publishedAt?: SortOrder
    attempts?: SortOrder
    lastError?: SortOrder
    nextAttemptAt?: SortOrder
  }

  export type OutboxEventAvgOrderByAggregateInput = {
    attempts?: SortOrder
  }

  export type OutboxEventMaxOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    deduplicationKey?: SortOrder
    payload?: SortOrder
    createdAt?: SortOrder
    publishedAt?: SortOrder
    attempts?: SortOrder
    lastError?: SortOrder
    nextAttemptAt?: SortOrder
  }

  export type OutboxEventMinOrderByAggregateInput = {
    id?: SortOrder
    eventId?: SortOrder
    deduplicationKey?: SortOrder
    payload?: SortOrder
    createdAt?: SortOrder
    publishedAt?: SortOrder
    attempts?: SortOrder
    lastError?: SortOrder
    nextAttemptAt?: SortOrder
  }

  export type OutboxEventSumOrderByAggregateInput = {
    attempts?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type CheckoutEventCountOrderByAggregateInput = {
    eventId?: SortOrder
    eventType?: SortOrder
    processedAt?: SortOrder
    fingerprint?: SortOrder
    result?: SortOrder
  }

  export type CheckoutEventMaxOrderByAggregateInput = {
    eventId?: SortOrder
    eventType?: SortOrder
    processedAt?: SortOrder
    fingerprint?: SortOrder
    result?: SortOrder
  }

  export type CheckoutEventMinOrderByAggregateInput = {
    eventId?: SortOrder
    eventType?: SortOrder
    processedAt?: SortOrder
    fingerprint?: SortOrder
    result?: SortOrder
  }

  export type InventoryOperationListRelationFilter = {
    every?: InventoryOperationWhereInput
    some?: InventoryOperationWhereInput
    none?: InventoryOperationWhereInput
  }

  export type InventoryOperationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type InventoryCountOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryAvgOrderByAggregateInput = {
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
  }

  export type InventoryMaxOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventoryMinOrderByAggregateInput = {
    id?: SortOrder
    productId?: SortOrder
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InventorySumOrderByAggregateInput = {
    stock?: SortOrder
    reservedStock?: SortOrder
    lowStockThreshold?: SortOrder
  }

  export type InventoryScalarRelationFilter = {
    is?: InventoryWhereInput
    isNot?: InventoryWhereInput
  }

  export type InventoryOperationCountOrderByAggregateInput = {
    id?: SortOrder
    operationId?: SortOrder
    productId?: SortOrder
    type?: SortOrder
    quantity?: SortOrder
    createdAt?: SortOrder
  }

  export type InventoryOperationAvgOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type InventoryOperationMaxOrderByAggregateInput = {
    id?: SortOrder
    operationId?: SortOrder
    productId?: SortOrder
    type?: SortOrder
    quantity?: SortOrder
    createdAt?: SortOrder
  }

  export type InventoryOperationMinOrderByAggregateInput = {
    id?: SortOrder
    operationId?: SortOrder
    productId?: SortOrder
    type?: SortOrder
    quantity?: SortOrder
    createdAt?: SortOrder
  }

  export type InventoryOperationSumOrderByAggregateInput = {
    quantity?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type InventoryOperationCreateNestedManyWithoutInventoryInput = {
    create?: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput> | InventoryOperationCreateWithoutInventoryInput[] | InventoryOperationUncheckedCreateWithoutInventoryInput[]
    connectOrCreate?: InventoryOperationCreateOrConnectWithoutInventoryInput | InventoryOperationCreateOrConnectWithoutInventoryInput[]
    createMany?: InventoryOperationCreateManyInventoryInputEnvelope
    connect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
  }

  export type InventoryOperationUncheckedCreateNestedManyWithoutInventoryInput = {
    create?: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput> | InventoryOperationCreateWithoutInventoryInput[] | InventoryOperationUncheckedCreateWithoutInventoryInput[]
    connectOrCreate?: InventoryOperationCreateOrConnectWithoutInventoryInput | InventoryOperationCreateOrConnectWithoutInventoryInput[]
    createMany?: InventoryOperationCreateManyInventoryInputEnvelope
    connect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
  }

  export type InventoryOperationUpdateManyWithoutInventoryNestedInput = {
    create?: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput> | InventoryOperationCreateWithoutInventoryInput[] | InventoryOperationUncheckedCreateWithoutInventoryInput[]
    connectOrCreate?: InventoryOperationCreateOrConnectWithoutInventoryInput | InventoryOperationCreateOrConnectWithoutInventoryInput[]
    upsert?: InventoryOperationUpsertWithWhereUniqueWithoutInventoryInput | InventoryOperationUpsertWithWhereUniqueWithoutInventoryInput[]
    createMany?: InventoryOperationCreateManyInventoryInputEnvelope
    set?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    disconnect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    delete?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    connect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    update?: InventoryOperationUpdateWithWhereUniqueWithoutInventoryInput | InventoryOperationUpdateWithWhereUniqueWithoutInventoryInput[]
    updateMany?: InventoryOperationUpdateManyWithWhereWithoutInventoryInput | InventoryOperationUpdateManyWithWhereWithoutInventoryInput[]
    deleteMany?: InventoryOperationScalarWhereInput | InventoryOperationScalarWhereInput[]
  }

  export type InventoryOperationUncheckedUpdateManyWithoutInventoryNestedInput = {
    create?: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput> | InventoryOperationCreateWithoutInventoryInput[] | InventoryOperationUncheckedCreateWithoutInventoryInput[]
    connectOrCreate?: InventoryOperationCreateOrConnectWithoutInventoryInput | InventoryOperationCreateOrConnectWithoutInventoryInput[]
    upsert?: InventoryOperationUpsertWithWhereUniqueWithoutInventoryInput | InventoryOperationUpsertWithWhereUniqueWithoutInventoryInput[]
    createMany?: InventoryOperationCreateManyInventoryInputEnvelope
    set?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    disconnect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    delete?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    connect?: InventoryOperationWhereUniqueInput | InventoryOperationWhereUniqueInput[]
    update?: InventoryOperationUpdateWithWhereUniqueWithoutInventoryInput | InventoryOperationUpdateWithWhereUniqueWithoutInventoryInput[]
    updateMany?: InventoryOperationUpdateManyWithWhereWithoutInventoryInput | InventoryOperationUpdateManyWithWhereWithoutInventoryInput[]
    deleteMany?: InventoryOperationScalarWhereInput | InventoryOperationScalarWhereInput[]
  }

  export type InventoryCreateNestedOneWithoutOperationsInput = {
    create?: XOR<InventoryCreateWithoutOperationsInput, InventoryUncheckedCreateWithoutOperationsInput>
    connectOrCreate?: InventoryCreateOrConnectWithoutOperationsInput
    connect?: InventoryWhereUniqueInput
  }

  export type InventoryUpdateOneRequiredWithoutOperationsNestedInput = {
    create?: XOR<InventoryCreateWithoutOperationsInput, InventoryUncheckedCreateWithoutOperationsInput>
    connectOrCreate?: InventoryCreateOrConnectWithoutOperationsInput
    upsert?: InventoryUpsertWithoutOperationsInput
    connect?: InventoryWhereUniqueInput
    update?: XOR<XOR<InventoryUpdateToOneWithWhereWithoutOperationsInput, InventoryUpdateWithoutOperationsInput>, InventoryUncheckedUpdateWithoutOperationsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type InventoryOperationCreateWithoutInventoryInput = {
    id?: string
    operationId: string
    type: string
    quantity: number
    createdAt?: Date | string
  }

  export type InventoryOperationUncheckedCreateWithoutInventoryInput = {
    id?: string
    operationId: string
    type: string
    quantity: number
    createdAt?: Date | string
  }

  export type InventoryOperationCreateOrConnectWithoutInventoryInput = {
    where: InventoryOperationWhereUniqueInput
    create: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput>
  }

  export type InventoryOperationCreateManyInventoryInputEnvelope = {
    data: InventoryOperationCreateManyInventoryInput | InventoryOperationCreateManyInventoryInput[]
    skipDuplicates?: boolean
  }

  export type InventoryOperationUpsertWithWhereUniqueWithoutInventoryInput = {
    where: InventoryOperationWhereUniqueInput
    update: XOR<InventoryOperationUpdateWithoutInventoryInput, InventoryOperationUncheckedUpdateWithoutInventoryInput>
    create: XOR<InventoryOperationCreateWithoutInventoryInput, InventoryOperationUncheckedCreateWithoutInventoryInput>
  }

  export type InventoryOperationUpdateWithWhereUniqueWithoutInventoryInput = {
    where: InventoryOperationWhereUniqueInput
    data: XOR<InventoryOperationUpdateWithoutInventoryInput, InventoryOperationUncheckedUpdateWithoutInventoryInput>
  }

  export type InventoryOperationUpdateManyWithWhereWithoutInventoryInput = {
    where: InventoryOperationScalarWhereInput
    data: XOR<InventoryOperationUpdateManyMutationInput, InventoryOperationUncheckedUpdateManyWithoutInventoryInput>
  }

  export type InventoryOperationScalarWhereInput = {
    AND?: InventoryOperationScalarWhereInput | InventoryOperationScalarWhereInput[]
    OR?: InventoryOperationScalarWhereInput[]
    NOT?: InventoryOperationScalarWhereInput | InventoryOperationScalarWhereInput[]
    id?: StringFilter<"InventoryOperation"> | string
    operationId?: StringFilter<"InventoryOperation"> | string
    productId?: StringFilter<"InventoryOperation"> | string
    type?: StringFilter<"InventoryOperation"> | string
    quantity?: IntFilter<"InventoryOperation"> | number
    createdAt?: DateTimeFilter<"InventoryOperation"> | Date | string
  }

  export type InventoryCreateWithoutOperationsInput = {
    id?: string
    productId: string
    stock?: number
    reservedStock?: number
    lowStockThreshold?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InventoryUncheckedCreateWithoutOperationsInput = {
    id?: string
    productId: string
    stock?: number
    reservedStock?: number
    lowStockThreshold?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InventoryCreateOrConnectWithoutOperationsInput = {
    where: InventoryWhereUniqueInput
    create: XOR<InventoryCreateWithoutOperationsInput, InventoryUncheckedCreateWithoutOperationsInput>
  }

  export type InventoryUpsertWithoutOperationsInput = {
    update: XOR<InventoryUpdateWithoutOperationsInput, InventoryUncheckedUpdateWithoutOperationsInput>
    create: XOR<InventoryCreateWithoutOperationsInput, InventoryUncheckedCreateWithoutOperationsInput>
    where?: InventoryWhereInput
  }

  export type InventoryUpdateToOneWithWhereWithoutOperationsInput = {
    where?: InventoryWhereInput
    data: XOR<InventoryUpdateWithoutOperationsInput, InventoryUncheckedUpdateWithoutOperationsInput>
  }

  export type InventoryUpdateWithoutOperationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryUncheckedUpdateWithoutOperationsInput = {
    id?: StringFieldUpdateOperationsInput | string
    productId?: StringFieldUpdateOperationsInput | string
    stock?: IntFieldUpdateOperationsInput | number
    reservedStock?: IntFieldUpdateOperationsInput | number
    lowStockThreshold?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationCreateManyInventoryInput = {
    id?: string
    operationId: string
    type: string
    quantity: number
    createdAt?: Date | string
  }

  export type InventoryOperationUpdateWithoutInventoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationUncheckedUpdateWithoutInventoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InventoryOperationUncheckedUpdateManyWithoutInventoryInput = {
    id?: StringFieldUpdateOperationsInput | string
    operationId?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    quantity?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}