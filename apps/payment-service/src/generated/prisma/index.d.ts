
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
 * Model Payment
 * 
 */
export type Payment = $Result.DefaultSelection<Prisma.$PaymentPayload>
/**
 * Model PaymentIdempotency
 * 
 */
export type PaymentIdempotency = $Result.DefaultSelection<Prisma.$PaymentIdempotencyPayload>
/**
 * Model FakeProviderOperation
 * 
 */
export type FakeProviderOperation = $Result.DefaultSelection<Prisma.$FakeProviderOperationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const PaymentStatus: {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]


export const PaymentProvider: {
  MOCK: 'MOCK'
};

export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider]

}

export type PaymentStatus = $Enums.PaymentStatus

export const PaymentStatus: typeof $Enums.PaymentStatus

export type PaymentProvider = $Enums.PaymentProvider

export const PaymentProvider: typeof $Enums.PaymentProvider

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
   * `prisma.payment`: Exposes CRUD operations for the **Payment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Payments
    * const payments = await prisma.payment.findMany()
    * ```
    */
  get payment(): Prisma.PaymentDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.paymentIdempotency`: Exposes CRUD operations for the **PaymentIdempotency** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PaymentIdempotencies
    * const paymentIdempotencies = await prisma.paymentIdempotency.findMany()
    * ```
    */
  get paymentIdempotency(): Prisma.PaymentIdempotencyDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.fakeProviderOperation`: Exposes CRUD operations for the **FakeProviderOperation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FakeProviderOperations
    * const fakeProviderOperations = await prisma.fakeProviderOperation.findMany()
    * ```
    */
  get fakeProviderOperation(): Prisma.FakeProviderOperationDelegate<ExtArgs, ClientOptions>;
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
    Payment: 'Payment',
    PaymentIdempotency: 'PaymentIdempotency',
    FakeProviderOperation: 'FakeProviderOperation'
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
      modelProps: "outboxEvent" | "checkoutEvent" | "payment" | "paymentIdempotency" | "fakeProviderOperation"
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
      Payment: {
        payload: Prisma.$PaymentPayload<ExtArgs>
        fields: Prisma.PaymentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findFirst: {
            args: Prisma.PaymentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          findMany: {
            args: Prisma.PaymentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          create: {
            args: Prisma.PaymentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          createMany: {
            args: Prisma.PaymentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          delete: {
            args: Prisma.PaymentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          update: {
            args: Prisma.PaymentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          deleteMany: {
            args: Prisma.PaymentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>[]
          }
          upsert: {
            args: Prisma.PaymentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentPayload>
          }
          aggregate: {
            args: Prisma.PaymentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePayment>
          }
          groupBy: {
            args: Prisma.PaymentGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentCountAggregateOutputType> | number
          }
        }
      }
      PaymentIdempotency: {
        payload: Prisma.$PaymentIdempotencyPayload<ExtArgs>
        fields: Prisma.PaymentIdempotencyFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PaymentIdempotencyFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PaymentIdempotencyFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          findFirst: {
            args: Prisma.PaymentIdempotencyFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PaymentIdempotencyFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          findMany: {
            args: Prisma.PaymentIdempotencyFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>[]
          }
          create: {
            args: Prisma.PaymentIdempotencyCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          createMany: {
            args: Prisma.PaymentIdempotencyCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PaymentIdempotencyCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>[]
          }
          delete: {
            args: Prisma.PaymentIdempotencyDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          update: {
            args: Prisma.PaymentIdempotencyUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          deleteMany: {
            args: Prisma.PaymentIdempotencyDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PaymentIdempotencyUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PaymentIdempotencyUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>[]
          }
          upsert: {
            args: Prisma.PaymentIdempotencyUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PaymentIdempotencyPayload>
          }
          aggregate: {
            args: Prisma.PaymentIdempotencyAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePaymentIdempotency>
          }
          groupBy: {
            args: Prisma.PaymentIdempotencyGroupByArgs<ExtArgs>
            result: $Utils.Optional<PaymentIdempotencyGroupByOutputType>[]
          }
          count: {
            args: Prisma.PaymentIdempotencyCountArgs<ExtArgs>
            result: $Utils.Optional<PaymentIdempotencyCountAggregateOutputType> | number
          }
        }
      }
      FakeProviderOperation: {
        payload: Prisma.$FakeProviderOperationPayload<ExtArgs>
        fields: Prisma.FakeProviderOperationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FakeProviderOperationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FakeProviderOperationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          findFirst: {
            args: Prisma.FakeProviderOperationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FakeProviderOperationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          findMany: {
            args: Prisma.FakeProviderOperationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>[]
          }
          create: {
            args: Prisma.FakeProviderOperationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          createMany: {
            args: Prisma.FakeProviderOperationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FakeProviderOperationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>[]
          }
          delete: {
            args: Prisma.FakeProviderOperationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          update: {
            args: Prisma.FakeProviderOperationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          deleteMany: {
            args: Prisma.FakeProviderOperationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FakeProviderOperationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FakeProviderOperationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>[]
          }
          upsert: {
            args: Prisma.FakeProviderOperationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeProviderOperationPayload>
          }
          aggregate: {
            args: Prisma.FakeProviderOperationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFakeProviderOperation>
          }
          groupBy: {
            args: Prisma.FakeProviderOperationGroupByArgs<ExtArgs>
            result: $Utils.Optional<FakeProviderOperationGroupByOutputType>[]
          }
          count: {
            args: Prisma.FakeProviderOperationCountArgs<ExtArgs>
            result: $Utils.Optional<FakeProviderOperationCountAggregateOutputType> | number
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
    payment?: PaymentOmit
    paymentIdempotency?: PaymentIdempotencyOmit
    fakeProviderOperation?: FakeProviderOperationOmit
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
   * Model Payment
   */

  export type AggregatePayment = {
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  export type PaymentAvgAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentSumAggregateOutputType = {
    amount: Decimal | null
  }

  export type PaymentMinAggregateOutputType = {
    id: string | null
    userId: string | null
    orderId: string | null
    amount: Decimal | null
    currency: string | null
    status: $Enums.PaymentStatus | null
    provider: $Enums.PaymentProvider | null
    providerPaymentId: string | null
    progressState: string | null
    pendingOperation: string | null
    failureCode: string | null
    orderConfirmedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    orderId: string | null
    amount: Decimal | null
    currency: string | null
    status: $Enums.PaymentStatus | null
    provider: $Enums.PaymentProvider | null
    providerPaymentId: string | null
    progressState: string | null
    pendingOperation: string | null
    failureCode: string | null
    orderConfirmedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentCountAggregateOutputType = {
    id: number
    userId: number
    orderId: number
    amount: number
    currency: number
    status: number
    provider: number
    providerPaymentId: number
    progressState: number
    pendingOperation: number
    failureCode: number
    orderConfirmedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentAvgAggregateInputType = {
    amount?: true
  }

  export type PaymentSumAggregateInputType = {
    amount?: true
  }

  export type PaymentMinAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    amount?: true
    currency?: true
    status?: true
    provider?: true
    providerPaymentId?: true
    progressState?: true
    pendingOperation?: true
    failureCode?: true
    orderConfirmedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentMaxAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    amount?: true
    currency?: true
    status?: true
    provider?: true
    providerPaymentId?: true
    progressState?: true
    pendingOperation?: true
    failureCode?: true
    orderConfirmedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentCountAggregateInputType = {
    id?: true
    userId?: true
    orderId?: true
    amount?: true
    currency?: true
    status?: true
    provider?: true
    providerPaymentId?: true
    progressState?: true
    pendingOperation?: true
    failureCode?: true
    orderConfirmedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payment to aggregate.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned Payments
    **/
    _count?: true | PaymentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: PaymentAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: PaymentSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: PaymentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: PaymentMaxAggregateInputType
  }

  export type GetPaymentAggregateType<T extends PaymentAggregateArgs> = {
        [P in keyof T & keyof AggregatePayment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePayment[P]>
      : GetScalarType<T[P], AggregatePayment[P]>
  }




  export type PaymentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentWhereInput
    orderBy?: PaymentOrderByWithAggregationInput | PaymentOrderByWithAggregationInput[]
    by: PaymentScalarFieldEnum[] | PaymentScalarFieldEnum
    having?: PaymentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentCountAggregateInputType | true
    _avg?: PaymentAvgAggregateInputType
    _sum?: PaymentSumAggregateInputType
    _min?: PaymentMinAggregateInputType
    _max?: PaymentMaxAggregateInputType
  }

  export type PaymentGroupByOutputType = {
    id: string
    userId: string
    orderId: string
    amount: Decimal
    currency: string
    status: $Enums.PaymentStatus
    provider: $Enums.PaymentProvider
    providerPaymentId: string | null
    progressState: string
    pendingOperation: string | null
    failureCode: string | null
    orderConfirmedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PaymentCountAggregateOutputType | null
    _avg: PaymentAvgAggregateOutputType | null
    _sum: PaymentSumAggregateOutputType | null
    _min: PaymentMinAggregateOutputType | null
    _max: PaymentMaxAggregateOutputType | null
  }

  type GetPaymentGroupByPayload<T extends PaymentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentGroupByOutputType[P]>
        }
      >
    >


  export type PaymentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    provider?: boolean
    providerPaymentId?: boolean
    progressState?: boolean
    pendingOperation?: boolean
    failureCode?: boolean
    orderConfirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    provider?: boolean
    providerPaymentId?: boolean
    progressState?: boolean
    pendingOperation?: boolean
    failureCode?: boolean
    orderConfirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    orderId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    provider?: boolean
    providerPaymentId?: boolean
    progressState?: boolean
    pendingOperation?: boolean
    failureCode?: boolean
    orderConfirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["payment"]>

  export type PaymentSelectScalar = {
    id?: boolean
    userId?: boolean
    orderId?: boolean
    amount?: boolean
    currency?: boolean
    status?: boolean
    provider?: boolean
    providerPaymentId?: boolean
    progressState?: boolean
    pendingOperation?: boolean
    failureCode?: boolean
    orderConfirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "orderId" | "amount" | "currency" | "status" | "provider" | "providerPaymentId" | "progressState" | "pendingOperation" | "failureCode" | "orderConfirmedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["payment"]>

  export type $PaymentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Payment"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      orderId: string
      amount: Prisma.Decimal
      currency: string
      status: $Enums.PaymentStatus
      provider: $Enums.PaymentProvider
      providerPaymentId: string | null
      progressState: string
      pendingOperation: string | null
      failureCode: string | null
      orderConfirmedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["payment"]>
    composites: {}
  }

  type PaymentGetPayload<S extends boolean | null | undefined | PaymentDefaultArgs> = $Result.GetResult<Prisma.$PaymentPayload, S>

  type PaymentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentCountAggregateInputType | true
    }

  export interface PaymentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Payment'], meta: { name: 'Payment' } }
    /**
     * Find zero or one Payment that matches the filter.
     * @param {PaymentFindUniqueArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentFindUniqueArgs>(args: SelectSubset<T, PaymentFindUniqueArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Payment that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentFindUniqueOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentFindFirstArgs>(args?: SelectSubset<T, PaymentFindFirstArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Payment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindFirstOrThrowArgs} args - Arguments to find a Payment
     * @example
     * // Get one Payment
     * const payment = await prisma.payment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Payments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Payments
     * const payments = await prisma.payment.findMany()
     *
     * // Get first 10 Payments
     * const payments = await prisma.payment.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const paymentWithIdOnly = await prisma.payment.findMany({ select: { id: true } })
     *
     */
    findMany<T extends PaymentFindManyArgs>(args?: SelectSubset<T, PaymentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Payment.
     * @param {PaymentCreateArgs} args - Arguments to create a Payment.
     * @example
     * // Create one Payment
     * const Payment = await prisma.payment.create({
     *   data: {
     *     // ... data to create a Payment
     *   }
     * })
     *
     */
    create<T extends PaymentCreateArgs>(args: SelectSubset<T, PaymentCreateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Payments.
     * @param {PaymentCreateManyArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends PaymentCreateManyArgs>(args?: SelectSubset<T, PaymentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Payments and returns the data saved in the database.
     * @param {PaymentCreateManyAndReturnArgs} args - Arguments to create many Payments.
     * @example
     * // Create many Payments
     * const payment = await prisma.payment.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends PaymentCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Payment.
     * @param {PaymentDeleteArgs} args - Arguments to delete one Payment.
     * @example
     * // Delete one Payment
     * const Payment = await prisma.payment.delete({
     *   where: {
     *     // ... filter to delete one Payment
     *   }
     * })
     *
     */
    delete<T extends PaymentDeleteArgs>(args: SelectSubset<T, PaymentDeleteArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Payment.
     * @param {PaymentUpdateArgs} args - Arguments to update one Payment.
     * @example
     * // Update one Payment
     * const payment = await prisma.payment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends PaymentUpdateArgs>(args: SelectSubset<T, PaymentUpdateArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Payments.
     * @param {PaymentDeleteManyArgs} args - Arguments to filter Payments to delete.
     * @example
     * // Delete a few Payments
     * const { count } = await prisma.payment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends PaymentDeleteManyArgs>(args?: SelectSubset<T, PaymentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends PaymentUpdateManyArgs>(args: SelectSubset<T, PaymentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Payments and returns the data updated in the database.
     * @param {PaymentUpdateManyAndReturnArgs} args - Arguments to update many Payments.
     * @example
     * // Update many Payments
     * const payment = await prisma.payment.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more Payments and only return the `id`
     * const paymentWithIdOnly = await prisma.payment.updateManyAndReturn({
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
    updateManyAndReturn<T extends PaymentUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Payment.
     * @param {PaymentUpsertArgs} args - Arguments to update or create a Payment.
     * @example
     * // Update or create a Payment
     * const payment = await prisma.payment.upsert({
     *   create: {
     *     // ... data to create a Payment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Payment we want to update
     *   }
     * })
     */
    upsert<T extends PaymentUpsertArgs>(args: SelectSubset<T, PaymentUpsertArgs<ExtArgs>>): Prisma__PaymentClient<$Result.GetResult<Prisma.$PaymentPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Payments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentCountArgs} args - Arguments to filter Payments to count.
     * @example
     * // Count the number of Payments
     * const count = await prisma.payment.count({
     *   where: {
     *     // ... the filter for the Payments we want to count
     *   }
     * })
    **/
    count<T extends PaymentCountArgs>(
      args?: Subset<T, PaymentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PaymentAggregateArgs>(args: Subset<T, PaymentAggregateArgs>): Prisma.PrismaPromise<GetPaymentAggregateType<T>>

    /**
     * Group by Payment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentGroupByArgs} args - Group by arguments.
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
      T extends PaymentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentGroupByArgs['orderBy'] }
        : { orderBy?: PaymentGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PaymentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Payment model
   */
  readonly fields: PaymentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Payment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the Payment model
   */
  interface PaymentFieldRefs {
    readonly id: FieldRef<"Payment", 'String'>
    readonly userId: FieldRef<"Payment", 'String'>
    readonly orderId: FieldRef<"Payment", 'String'>
    readonly amount: FieldRef<"Payment", 'Decimal'>
    readonly currency: FieldRef<"Payment", 'String'>
    readonly status: FieldRef<"Payment", 'PaymentStatus'>
    readonly provider: FieldRef<"Payment", 'PaymentProvider'>
    readonly providerPaymentId: FieldRef<"Payment", 'String'>
    readonly progressState: FieldRef<"Payment", 'String'>
    readonly pendingOperation: FieldRef<"Payment", 'String'>
    readonly failureCode: FieldRef<"Payment", 'String'>
    readonly orderConfirmedAt: FieldRef<"Payment", 'DateTime'>
    readonly createdAt: FieldRef<"Payment", 'DateTime'>
    readonly updatedAt: FieldRef<"Payment", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * Payment findUnique
   */
  export type PaymentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findUniqueOrThrow
   */
  export type PaymentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment findFirst
   */
  export type PaymentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findFirstOrThrow
   */
  export type PaymentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payment to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment findMany
   */
  export type PaymentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter, which Payments to fetch.
     */
    where?: PaymentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of Payments to fetch.
     */
    orderBy?: PaymentOrderByWithRelationInput | PaymentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing Payments.
     */
    cursor?: PaymentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` Payments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` Payments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of Payments.
     */
    distinct?: PaymentScalarFieldEnum | PaymentScalarFieldEnum[]
  }

  /**
   * Payment create
   */
  export type PaymentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data needed to create a Payment.
     */
    data: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
  }

  /**
   * Payment createMany
   */
  export type PaymentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment createManyAndReturn
   */
  export type PaymentCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to create many Payments.
     */
    data: PaymentCreateManyInput | PaymentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Payment update
   */
  export type PaymentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data needed to update a Payment.
     */
    data: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
    /**
     * Choose, which Payment to update.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment updateMany
   */
  export type PaymentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
  }

  /**
   * Payment updateManyAndReturn
   */
  export type PaymentUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The data used to update Payments.
     */
    data: XOR<PaymentUpdateManyMutationInput, PaymentUncheckedUpdateManyInput>
    /**
     * Filter which Payments to update
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to update.
     */
    limit?: number
  }

  /**
   * Payment upsert
   */
  export type PaymentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * The filter to search for the Payment to update in case it exists.
     */
    where: PaymentWhereUniqueInput
    /**
     * In case the Payment found by the `where` argument doesn't exist, create a new Payment with this data.
     */
    create: XOR<PaymentCreateInput, PaymentUncheckedCreateInput>
    /**
     * In case the Payment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentUpdateInput, PaymentUncheckedUpdateInput>
  }

  /**
   * Payment delete
   */
  export type PaymentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
    /**
     * Filter which Payment to delete.
     */
    where: PaymentWhereUniqueInput
  }

  /**
   * Payment deleteMany
   */
  export type PaymentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Payments to delete
     */
    where?: PaymentWhereInput
    /**
     * Limit how many Payments to delete.
     */
    limit?: number
  }

  /**
   * Payment without action
   */
  export type PaymentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Payment
     */
    select?: PaymentSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Payment
     */
    omit?: PaymentOmit<ExtArgs> | null
  }


  /**
   * Model PaymentIdempotency
   */

  export type AggregatePaymentIdempotency = {
    _count: PaymentIdempotencyCountAggregateOutputType | null
    _min: PaymentIdempotencyMinAggregateOutputType | null
    _max: PaymentIdempotencyMaxAggregateOutputType | null
  }

  export type PaymentIdempotencyMinAggregateOutputType = {
    id: string | null
    userId: string | null
    action: string | null
    idempotencyKey: string | null
    requestFingerprint: string | null
    status: string | null
    paymentId: string | null
    errorMessage: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentIdempotencyMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    action: string | null
    idempotencyKey: string | null
    requestFingerprint: string | null
    status: string | null
    paymentId: string | null
    errorMessage: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PaymentIdempotencyCountAggregateOutputType = {
    id: number
    userId: number
    action: number
    idempotencyKey: number
    requestFingerprint: number
    status: number
    paymentId: number
    responseBody: number
    errorMessage: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PaymentIdempotencyMinAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    idempotencyKey?: true
    requestFingerprint?: true
    status?: true
    paymentId?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentIdempotencyMaxAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    idempotencyKey?: true
    requestFingerprint?: true
    status?: true
    paymentId?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PaymentIdempotencyCountAggregateInputType = {
    id?: true
    userId?: true
    action?: true
    idempotencyKey?: true
    requestFingerprint?: true
    status?: true
    paymentId?: true
    responseBody?: true
    errorMessage?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PaymentIdempotencyAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentIdempotency to aggregate.
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIdempotencies to fetch.
     */
    orderBy?: PaymentIdempotencyOrderByWithRelationInput | PaymentIdempotencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PaymentIdempotencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIdempotencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIdempotencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PaymentIdempotencies
    **/
    _count?: true | PaymentIdempotencyCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PaymentIdempotencyMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PaymentIdempotencyMaxAggregateInputType
  }

  export type GetPaymentIdempotencyAggregateType<T extends PaymentIdempotencyAggregateArgs> = {
        [P in keyof T & keyof AggregatePaymentIdempotency]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePaymentIdempotency[P]>
      : GetScalarType<T[P], AggregatePaymentIdempotency[P]>
  }




  export type PaymentIdempotencyGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PaymentIdempotencyWhereInput
    orderBy?: PaymentIdempotencyOrderByWithAggregationInput | PaymentIdempotencyOrderByWithAggregationInput[]
    by: PaymentIdempotencyScalarFieldEnum[] | PaymentIdempotencyScalarFieldEnum
    having?: PaymentIdempotencyScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PaymentIdempotencyCountAggregateInputType | true
    _min?: PaymentIdempotencyMinAggregateInputType
    _max?: PaymentIdempotencyMaxAggregateInputType
  }

  export type PaymentIdempotencyGroupByOutputType = {
    id: string
    userId: string
    action: string
    idempotencyKey: string
    requestFingerprint: string
    status: string
    paymentId: string | null
    responseBody: JsonValue | null
    errorMessage: string | null
    createdAt: Date
    updatedAt: Date
    _count: PaymentIdempotencyCountAggregateOutputType | null
    _min: PaymentIdempotencyMinAggregateOutputType | null
    _max: PaymentIdempotencyMaxAggregateOutputType | null
  }

  type GetPaymentIdempotencyGroupByPayload<T extends PaymentIdempotencyGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PaymentIdempotencyGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PaymentIdempotencyGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PaymentIdempotencyGroupByOutputType[P]>
            : GetScalarType<T[P], PaymentIdempotencyGroupByOutputType[P]>
        }
      >
    >


  export type PaymentIdempotencySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    status?: boolean
    paymentId?: boolean
    responseBody?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["paymentIdempotency"]>

  export type PaymentIdempotencySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    status?: boolean
    paymentId?: boolean
    responseBody?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["paymentIdempotency"]>

  export type PaymentIdempotencySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    action?: boolean
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    status?: boolean
    paymentId?: boolean
    responseBody?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["paymentIdempotency"]>

  export type PaymentIdempotencySelectScalar = {
    id?: boolean
    userId?: boolean
    action?: boolean
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    status?: boolean
    paymentId?: boolean
    responseBody?: boolean
    errorMessage?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PaymentIdempotencyOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "action" | "idempotencyKey" | "requestFingerprint" | "status" | "paymentId" | "responseBody" | "errorMessage" | "createdAt" | "updatedAt", ExtArgs["result"]["paymentIdempotency"]>

  export type $PaymentIdempotencyPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PaymentIdempotency"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      action: string
      idempotencyKey: string
      requestFingerprint: string
      status: string
      paymentId: string | null
      responseBody: Prisma.JsonValue | null
      errorMessage: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["paymentIdempotency"]>
    composites: {}
  }

  type PaymentIdempotencyGetPayload<S extends boolean | null | undefined | PaymentIdempotencyDefaultArgs> = $Result.GetResult<Prisma.$PaymentIdempotencyPayload, S>

  type PaymentIdempotencyCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PaymentIdempotencyFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PaymentIdempotencyCountAggregateInputType | true
    }

  export interface PaymentIdempotencyDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PaymentIdempotency'], meta: { name: 'PaymentIdempotency' } }
    /**
     * Find zero or one PaymentIdempotency that matches the filter.
     * @param {PaymentIdempotencyFindUniqueArgs} args - Arguments to find a PaymentIdempotency
     * @example
     * // Get one PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PaymentIdempotencyFindUniqueArgs>(args: SelectSubset<T, PaymentIdempotencyFindUniqueArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PaymentIdempotency that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PaymentIdempotencyFindUniqueOrThrowArgs} args - Arguments to find a PaymentIdempotency
     * @example
     * // Get one PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PaymentIdempotencyFindUniqueOrThrowArgs>(args: SelectSubset<T, PaymentIdempotencyFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentIdempotency that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyFindFirstArgs} args - Arguments to find a PaymentIdempotency
     * @example
     * // Get one PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PaymentIdempotencyFindFirstArgs>(args?: SelectSubset<T, PaymentIdempotencyFindFirstArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PaymentIdempotency that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyFindFirstOrThrowArgs} args - Arguments to find a PaymentIdempotency
     * @example
     * // Get one PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PaymentIdempotencyFindFirstOrThrowArgs>(args?: SelectSubset<T, PaymentIdempotencyFindFirstOrThrowArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PaymentIdempotencies that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PaymentIdempotencies
     * const paymentIdempotencies = await prisma.paymentIdempotency.findMany()
     * 
     * // Get first 10 PaymentIdempotencies
     * const paymentIdempotencies = await prisma.paymentIdempotency.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const paymentIdempotencyWithIdOnly = await prisma.paymentIdempotency.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PaymentIdempotencyFindManyArgs>(args?: SelectSubset<T, PaymentIdempotencyFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PaymentIdempotency.
     * @param {PaymentIdempotencyCreateArgs} args - Arguments to create a PaymentIdempotency.
     * @example
     * // Create one PaymentIdempotency
     * const PaymentIdempotency = await prisma.paymentIdempotency.create({
     *   data: {
     *     // ... data to create a PaymentIdempotency
     *   }
     * })
     * 
     */
    create<T extends PaymentIdempotencyCreateArgs>(args: SelectSubset<T, PaymentIdempotencyCreateArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PaymentIdempotencies.
     * @param {PaymentIdempotencyCreateManyArgs} args - Arguments to create many PaymentIdempotencies.
     * @example
     * // Create many PaymentIdempotencies
     * const paymentIdempotency = await prisma.paymentIdempotency.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PaymentIdempotencyCreateManyArgs>(args?: SelectSubset<T, PaymentIdempotencyCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PaymentIdempotencies and returns the data saved in the database.
     * @param {PaymentIdempotencyCreateManyAndReturnArgs} args - Arguments to create many PaymentIdempotencies.
     * @example
     * // Create many PaymentIdempotencies
     * const paymentIdempotency = await prisma.paymentIdempotency.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PaymentIdempotencies and only return the `id`
     * const paymentIdempotencyWithIdOnly = await prisma.paymentIdempotency.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PaymentIdempotencyCreateManyAndReturnArgs>(args?: SelectSubset<T, PaymentIdempotencyCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PaymentIdempotency.
     * @param {PaymentIdempotencyDeleteArgs} args - Arguments to delete one PaymentIdempotency.
     * @example
     * // Delete one PaymentIdempotency
     * const PaymentIdempotency = await prisma.paymentIdempotency.delete({
     *   where: {
     *     // ... filter to delete one PaymentIdempotency
     *   }
     * })
     * 
     */
    delete<T extends PaymentIdempotencyDeleteArgs>(args: SelectSubset<T, PaymentIdempotencyDeleteArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PaymentIdempotency.
     * @param {PaymentIdempotencyUpdateArgs} args - Arguments to update one PaymentIdempotency.
     * @example
     * // Update one PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PaymentIdempotencyUpdateArgs>(args: SelectSubset<T, PaymentIdempotencyUpdateArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PaymentIdempotencies.
     * @param {PaymentIdempotencyDeleteManyArgs} args - Arguments to filter PaymentIdempotencies to delete.
     * @example
     * // Delete a few PaymentIdempotencies
     * const { count } = await prisma.paymentIdempotency.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PaymentIdempotencyDeleteManyArgs>(args?: SelectSubset<T, PaymentIdempotencyDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentIdempotencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PaymentIdempotencies
     * const paymentIdempotency = await prisma.paymentIdempotency.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PaymentIdempotencyUpdateManyArgs>(args: SelectSubset<T, PaymentIdempotencyUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PaymentIdempotencies and returns the data updated in the database.
     * @param {PaymentIdempotencyUpdateManyAndReturnArgs} args - Arguments to update many PaymentIdempotencies.
     * @example
     * // Update many PaymentIdempotencies
     * const paymentIdempotency = await prisma.paymentIdempotency.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PaymentIdempotencies and only return the `id`
     * const paymentIdempotencyWithIdOnly = await prisma.paymentIdempotency.updateManyAndReturn({
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
    updateManyAndReturn<T extends PaymentIdempotencyUpdateManyAndReturnArgs>(args: SelectSubset<T, PaymentIdempotencyUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PaymentIdempotency.
     * @param {PaymentIdempotencyUpsertArgs} args - Arguments to update or create a PaymentIdempotency.
     * @example
     * // Update or create a PaymentIdempotency
     * const paymentIdempotency = await prisma.paymentIdempotency.upsert({
     *   create: {
     *     // ... data to create a PaymentIdempotency
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PaymentIdempotency we want to update
     *   }
     * })
     */
    upsert<T extends PaymentIdempotencyUpsertArgs>(args: SelectSubset<T, PaymentIdempotencyUpsertArgs<ExtArgs>>): Prisma__PaymentIdempotencyClient<$Result.GetResult<Prisma.$PaymentIdempotencyPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PaymentIdempotencies.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyCountArgs} args - Arguments to filter PaymentIdempotencies to count.
     * @example
     * // Count the number of PaymentIdempotencies
     * const count = await prisma.paymentIdempotency.count({
     *   where: {
     *     // ... the filter for the PaymentIdempotencies we want to count
     *   }
     * })
    **/
    count<T extends PaymentIdempotencyCountArgs>(
      args?: Subset<T, PaymentIdempotencyCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PaymentIdempotencyCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PaymentIdempotency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends PaymentIdempotencyAggregateArgs>(args: Subset<T, PaymentIdempotencyAggregateArgs>): Prisma.PrismaPromise<GetPaymentIdempotencyAggregateType<T>>

    /**
     * Group by PaymentIdempotency.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PaymentIdempotencyGroupByArgs} args - Group by arguments.
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
      T extends PaymentIdempotencyGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PaymentIdempotencyGroupByArgs['orderBy'] }
        : { orderBy?: PaymentIdempotencyGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, PaymentIdempotencyGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPaymentIdempotencyGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PaymentIdempotency model
   */
  readonly fields: PaymentIdempotencyFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PaymentIdempotency.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PaymentIdempotencyClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the PaymentIdempotency model
   */
  interface PaymentIdempotencyFieldRefs {
    readonly id: FieldRef<"PaymentIdempotency", 'String'>
    readonly userId: FieldRef<"PaymentIdempotency", 'String'>
    readonly action: FieldRef<"PaymentIdempotency", 'String'>
    readonly idempotencyKey: FieldRef<"PaymentIdempotency", 'String'>
    readonly requestFingerprint: FieldRef<"PaymentIdempotency", 'String'>
    readonly status: FieldRef<"PaymentIdempotency", 'String'>
    readonly paymentId: FieldRef<"PaymentIdempotency", 'String'>
    readonly responseBody: FieldRef<"PaymentIdempotency", 'Json'>
    readonly errorMessage: FieldRef<"PaymentIdempotency", 'String'>
    readonly createdAt: FieldRef<"PaymentIdempotency", 'DateTime'>
    readonly updatedAt: FieldRef<"PaymentIdempotency", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PaymentIdempotency findUnique
   */
  export type PaymentIdempotencyFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter, which PaymentIdempotency to fetch.
     */
    where: PaymentIdempotencyWhereUniqueInput
  }

  /**
   * PaymentIdempotency findUniqueOrThrow
   */
  export type PaymentIdempotencyFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter, which PaymentIdempotency to fetch.
     */
    where: PaymentIdempotencyWhereUniqueInput
  }

  /**
   * PaymentIdempotency findFirst
   */
  export type PaymentIdempotencyFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter, which PaymentIdempotency to fetch.
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIdempotencies to fetch.
     */
    orderBy?: PaymentIdempotencyOrderByWithRelationInput | PaymentIdempotencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentIdempotencies.
     */
    cursor?: PaymentIdempotencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIdempotencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIdempotencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentIdempotencies.
     */
    distinct?: PaymentIdempotencyScalarFieldEnum | PaymentIdempotencyScalarFieldEnum[]
  }

  /**
   * PaymentIdempotency findFirstOrThrow
   */
  export type PaymentIdempotencyFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter, which PaymentIdempotency to fetch.
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIdempotencies to fetch.
     */
    orderBy?: PaymentIdempotencyOrderByWithRelationInput | PaymentIdempotencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PaymentIdempotencies.
     */
    cursor?: PaymentIdempotencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIdempotencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIdempotencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentIdempotencies.
     */
    distinct?: PaymentIdempotencyScalarFieldEnum | PaymentIdempotencyScalarFieldEnum[]
  }

  /**
   * PaymentIdempotency findMany
   */
  export type PaymentIdempotencyFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter, which PaymentIdempotencies to fetch.
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PaymentIdempotencies to fetch.
     */
    orderBy?: PaymentIdempotencyOrderByWithRelationInput | PaymentIdempotencyOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PaymentIdempotencies.
     */
    cursor?: PaymentIdempotencyWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PaymentIdempotencies from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PaymentIdempotencies.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PaymentIdempotencies.
     */
    distinct?: PaymentIdempotencyScalarFieldEnum | PaymentIdempotencyScalarFieldEnum[]
  }

  /**
   * PaymentIdempotency create
   */
  export type PaymentIdempotencyCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * The data needed to create a PaymentIdempotency.
     */
    data: XOR<PaymentIdempotencyCreateInput, PaymentIdempotencyUncheckedCreateInput>
  }

  /**
   * PaymentIdempotency createMany
   */
  export type PaymentIdempotencyCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PaymentIdempotencies.
     */
    data: PaymentIdempotencyCreateManyInput | PaymentIdempotencyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PaymentIdempotency createManyAndReturn
   */
  export type PaymentIdempotencyCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * The data used to create many PaymentIdempotencies.
     */
    data: PaymentIdempotencyCreateManyInput | PaymentIdempotencyCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PaymentIdempotency update
   */
  export type PaymentIdempotencyUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * The data needed to update a PaymentIdempotency.
     */
    data: XOR<PaymentIdempotencyUpdateInput, PaymentIdempotencyUncheckedUpdateInput>
    /**
     * Choose, which PaymentIdempotency to update.
     */
    where: PaymentIdempotencyWhereUniqueInput
  }

  /**
   * PaymentIdempotency updateMany
   */
  export type PaymentIdempotencyUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PaymentIdempotencies.
     */
    data: XOR<PaymentIdempotencyUpdateManyMutationInput, PaymentIdempotencyUncheckedUpdateManyInput>
    /**
     * Filter which PaymentIdempotencies to update
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * Limit how many PaymentIdempotencies to update.
     */
    limit?: number
  }

  /**
   * PaymentIdempotency updateManyAndReturn
   */
  export type PaymentIdempotencyUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * The data used to update PaymentIdempotencies.
     */
    data: XOR<PaymentIdempotencyUpdateManyMutationInput, PaymentIdempotencyUncheckedUpdateManyInput>
    /**
     * Filter which PaymentIdempotencies to update
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * Limit how many PaymentIdempotencies to update.
     */
    limit?: number
  }

  /**
   * PaymentIdempotency upsert
   */
  export type PaymentIdempotencyUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * The filter to search for the PaymentIdempotency to update in case it exists.
     */
    where: PaymentIdempotencyWhereUniqueInput
    /**
     * In case the PaymentIdempotency found by the `where` argument doesn't exist, create a new PaymentIdempotency with this data.
     */
    create: XOR<PaymentIdempotencyCreateInput, PaymentIdempotencyUncheckedCreateInput>
    /**
     * In case the PaymentIdempotency was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PaymentIdempotencyUpdateInput, PaymentIdempotencyUncheckedUpdateInput>
  }

  /**
   * PaymentIdempotency delete
   */
  export type PaymentIdempotencyDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
    /**
     * Filter which PaymentIdempotency to delete.
     */
    where: PaymentIdempotencyWhereUniqueInput
  }

  /**
   * PaymentIdempotency deleteMany
   */
  export type PaymentIdempotencyDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PaymentIdempotencies to delete
     */
    where?: PaymentIdempotencyWhereInput
    /**
     * Limit how many PaymentIdempotencies to delete.
     */
    limit?: number
  }

  /**
   * PaymentIdempotency without action
   */
  export type PaymentIdempotencyDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PaymentIdempotency
     */
    select?: PaymentIdempotencySelect<ExtArgs> | null
    /**
     * Omit specific fields from the PaymentIdempotency
     */
    omit?: PaymentIdempotencyOmit<ExtArgs> | null
  }


  /**
   * Model FakeProviderOperation
   */

  export type AggregateFakeProviderOperation = {
    _count: FakeProviderOperationCountAggregateOutputType | null
    _min: FakeProviderOperationMinAggregateOutputType | null
    _max: FakeProviderOperationMaxAggregateOutputType | null
  }

  export type FakeProviderOperationMinAggregateOutputType = {
    idempotencyKey: string | null
    requestFingerprint: string | null
    result: string | null
    reference: string | null
    createdAt: Date | null
  }

  export type FakeProviderOperationMaxAggregateOutputType = {
    idempotencyKey: string | null
    requestFingerprint: string | null
    result: string | null
    reference: string | null
    createdAt: Date | null
  }

  export type FakeProviderOperationCountAggregateOutputType = {
    idempotencyKey: number
    requestFingerprint: number
    result: number
    reference: number
    createdAt: number
    _all: number
  }


  export type FakeProviderOperationMinAggregateInputType = {
    idempotencyKey?: true
    requestFingerprint?: true
    result?: true
    reference?: true
    createdAt?: true
  }

  export type FakeProviderOperationMaxAggregateInputType = {
    idempotencyKey?: true
    requestFingerprint?: true
    result?: true
    reference?: true
    createdAt?: true
  }

  export type FakeProviderOperationCountAggregateInputType = {
    idempotencyKey?: true
    requestFingerprint?: true
    result?: true
    reference?: true
    createdAt?: true
    _all?: true
  }

  export type FakeProviderOperationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FakeProviderOperation to aggregate.
     */
    where?: FakeProviderOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FakeProviderOperations to fetch.
     */
    orderBy?: FakeProviderOperationOrderByWithRelationInput | FakeProviderOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FakeProviderOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FakeProviderOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FakeProviderOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned FakeProviderOperations
    **/
    _count?: true | FakeProviderOperationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FakeProviderOperationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FakeProviderOperationMaxAggregateInputType
  }

  export type GetFakeProviderOperationAggregateType<T extends FakeProviderOperationAggregateArgs> = {
        [P in keyof T & keyof AggregateFakeProviderOperation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFakeProviderOperation[P]>
      : GetScalarType<T[P], AggregateFakeProviderOperation[P]>
  }




  export type FakeProviderOperationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FakeProviderOperationWhereInput
    orderBy?: FakeProviderOperationOrderByWithAggregationInput | FakeProviderOperationOrderByWithAggregationInput[]
    by: FakeProviderOperationScalarFieldEnum[] | FakeProviderOperationScalarFieldEnum
    having?: FakeProviderOperationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FakeProviderOperationCountAggregateInputType | true
    _min?: FakeProviderOperationMinAggregateInputType
    _max?: FakeProviderOperationMaxAggregateInputType
  }

  export type FakeProviderOperationGroupByOutputType = {
    idempotencyKey: string
    requestFingerprint: string
    result: string
    reference: string
    createdAt: Date
    _count: FakeProviderOperationCountAggregateOutputType | null
    _min: FakeProviderOperationMinAggregateOutputType | null
    _max: FakeProviderOperationMaxAggregateOutputType | null
  }

  type GetFakeProviderOperationGroupByPayload<T extends FakeProviderOperationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FakeProviderOperationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FakeProviderOperationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FakeProviderOperationGroupByOutputType[P]>
            : GetScalarType<T[P], FakeProviderOperationGroupByOutputType[P]>
        }
      >
    >


  export type FakeProviderOperationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    result?: boolean
    reference?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeProviderOperation"]>

  export type FakeProviderOperationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    result?: boolean
    reference?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeProviderOperation"]>

  export type FakeProviderOperationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    result?: boolean
    reference?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeProviderOperation"]>

  export type FakeProviderOperationSelectScalar = {
    idempotencyKey?: boolean
    requestFingerprint?: boolean
    result?: boolean
    reference?: boolean
    createdAt?: boolean
  }

  export type FakeProviderOperationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"idempotencyKey" | "requestFingerprint" | "result" | "reference" | "createdAt", ExtArgs["result"]["fakeProviderOperation"]>

  export type $FakeProviderOperationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FakeProviderOperation"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      idempotencyKey: string
      requestFingerprint: string
      result: string
      reference: string
      createdAt: Date
    }, ExtArgs["result"]["fakeProviderOperation"]>
    composites: {}
  }

  type FakeProviderOperationGetPayload<S extends boolean | null | undefined | FakeProviderOperationDefaultArgs> = $Result.GetResult<Prisma.$FakeProviderOperationPayload, S>

  type FakeProviderOperationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FakeProviderOperationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FakeProviderOperationCountAggregateInputType | true
    }

  export interface FakeProviderOperationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FakeProviderOperation'], meta: { name: 'FakeProviderOperation' } }
    /**
     * Find zero or one FakeProviderOperation that matches the filter.
     * @param {FakeProviderOperationFindUniqueArgs} args - Arguments to find a FakeProviderOperation
     * @example
     * // Get one FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FakeProviderOperationFindUniqueArgs>(args: SelectSubset<T, FakeProviderOperationFindUniqueArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FakeProviderOperation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FakeProviderOperationFindUniqueOrThrowArgs} args - Arguments to find a FakeProviderOperation
     * @example
     * // Get one FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FakeProviderOperationFindUniqueOrThrowArgs>(args: SelectSubset<T, FakeProviderOperationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FakeProviderOperation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationFindFirstArgs} args - Arguments to find a FakeProviderOperation
     * @example
     * // Get one FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FakeProviderOperationFindFirstArgs>(args?: SelectSubset<T, FakeProviderOperationFindFirstArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FakeProviderOperation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationFindFirstOrThrowArgs} args - Arguments to find a FakeProviderOperation
     * @example
     * // Get one FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FakeProviderOperationFindFirstOrThrowArgs>(args?: SelectSubset<T, FakeProviderOperationFindFirstOrThrowArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FakeProviderOperations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FakeProviderOperations
     * const fakeProviderOperations = await prisma.fakeProviderOperation.findMany()
     * 
     * // Get first 10 FakeProviderOperations
     * const fakeProviderOperations = await prisma.fakeProviderOperation.findMany({ take: 10 })
     * 
     * // Only select the `idempotencyKey`
     * const fakeProviderOperationWithIdempotencyKeyOnly = await prisma.fakeProviderOperation.findMany({ select: { idempotencyKey: true } })
     * 
     */
    findMany<T extends FakeProviderOperationFindManyArgs>(args?: SelectSubset<T, FakeProviderOperationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FakeProviderOperation.
     * @param {FakeProviderOperationCreateArgs} args - Arguments to create a FakeProviderOperation.
     * @example
     * // Create one FakeProviderOperation
     * const FakeProviderOperation = await prisma.fakeProviderOperation.create({
     *   data: {
     *     // ... data to create a FakeProviderOperation
     *   }
     * })
     * 
     */
    create<T extends FakeProviderOperationCreateArgs>(args: SelectSubset<T, FakeProviderOperationCreateArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FakeProviderOperations.
     * @param {FakeProviderOperationCreateManyArgs} args - Arguments to create many FakeProviderOperations.
     * @example
     * // Create many FakeProviderOperations
     * const fakeProviderOperation = await prisma.fakeProviderOperation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FakeProviderOperationCreateManyArgs>(args?: SelectSubset<T, FakeProviderOperationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FakeProviderOperations and returns the data saved in the database.
     * @param {FakeProviderOperationCreateManyAndReturnArgs} args - Arguments to create many FakeProviderOperations.
     * @example
     * // Create many FakeProviderOperations
     * const fakeProviderOperation = await prisma.fakeProviderOperation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many FakeProviderOperations and only return the `idempotencyKey`
     * const fakeProviderOperationWithIdempotencyKeyOnly = await prisma.fakeProviderOperation.createManyAndReturn({
     *   select: { idempotencyKey: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FakeProviderOperationCreateManyAndReturnArgs>(args?: SelectSubset<T, FakeProviderOperationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FakeProviderOperation.
     * @param {FakeProviderOperationDeleteArgs} args - Arguments to delete one FakeProviderOperation.
     * @example
     * // Delete one FakeProviderOperation
     * const FakeProviderOperation = await prisma.fakeProviderOperation.delete({
     *   where: {
     *     // ... filter to delete one FakeProviderOperation
     *   }
     * })
     * 
     */
    delete<T extends FakeProviderOperationDeleteArgs>(args: SelectSubset<T, FakeProviderOperationDeleteArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FakeProviderOperation.
     * @param {FakeProviderOperationUpdateArgs} args - Arguments to update one FakeProviderOperation.
     * @example
     * // Update one FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FakeProviderOperationUpdateArgs>(args: SelectSubset<T, FakeProviderOperationUpdateArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FakeProviderOperations.
     * @param {FakeProviderOperationDeleteManyArgs} args - Arguments to filter FakeProviderOperations to delete.
     * @example
     * // Delete a few FakeProviderOperations
     * const { count } = await prisma.fakeProviderOperation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FakeProviderOperationDeleteManyArgs>(args?: SelectSubset<T, FakeProviderOperationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FakeProviderOperations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FakeProviderOperations
     * const fakeProviderOperation = await prisma.fakeProviderOperation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FakeProviderOperationUpdateManyArgs>(args: SelectSubset<T, FakeProviderOperationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FakeProviderOperations and returns the data updated in the database.
     * @param {FakeProviderOperationUpdateManyAndReturnArgs} args - Arguments to update many FakeProviderOperations.
     * @example
     * // Update many FakeProviderOperations
     * const fakeProviderOperation = await prisma.fakeProviderOperation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more FakeProviderOperations and only return the `idempotencyKey`
     * const fakeProviderOperationWithIdempotencyKeyOnly = await prisma.fakeProviderOperation.updateManyAndReturn({
     *   select: { idempotencyKey: true },
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
    updateManyAndReturn<T extends FakeProviderOperationUpdateManyAndReturnArgs>(args: SelectSubset<T, FakeProviderOperationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FakeProviderOperation.
     * @param {FakeProviderOperationUpsertArgs} args - Arguments to update or create a FakeProviderOperation.
     * @example
     * // Update or create a FakeProviderOperation
     * const fakeProviderOperation = await prisma.fakeProviderOperation.upsert({
     *   create: {
     *     // ... data to create a FakeProviderOperation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FakeProviderOperation we want to update
     *   }
     * })
     */
    upsert<T extends FakeProviderOperationUpsertArgs>(args: SelectSubset<T, FakeProviderOperationUpsertArgs<ExtArgs>>): Prisma__FakeProviderOperationClient<$Result.GetResult<Prisma.$FakeProviderOperationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FakeProviderOperations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationCountArgs} args - Arguments to filter FakeProviderOperations to count.
     * @example
     * // Count the number of FakeProviderOperations
     * const count = await prisma.fakeProviderOperation.count({
     *   where: {
     *     // ... the filter for the FakeProviderOperations we want to count
     *   }
     * })
    **/
    count<T extends FakeProviderOperationCountArgs>(
      args?: Subset<T, FakeProviderOperationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FakeProviderOperationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FakeProviderOperation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends FakeProviderOperationAggregateArgs>(args: Subset<T, FakeProviderOperationAggregateArgs>): Prisma.PrismaPromise<GetFakeProviderOperationAggregateType<T>>

    /**
     * Group by FakeProviderOperation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeProviderOperationGroupByArgs} args - Group by arguments.
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
      T extends FakeProviderOperationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FakeProviderOperationGroupByArgs['orderBy'] }
        : { orderBy?: FakeProviderOperationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, FakeProviderOperationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFakeProviderOperationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FakeProviderOperation model
   */
  readonly fields: FakeProviderOperationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FakeProviderOperation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FakeProviderOperationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the FakeProviderOperation model
   */
  interface FakeProviderOperationFieldRefs {
    readonly idempotencyKey: FieldRef<"FakeProviderOperation", 'String'>
    readonly requestFingerprint: FieldRef<"FakeProviderOperation", 'String'>
    readonly result: FieldRef<"FakeProviderOperation", 'String'>
    readonly reference: FieldRef<"FakeProviderOperation", 'String'>
    readonly createdAt: FieldRef<"FakeProviderOperation", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * FakeProviderOperation findUnique
   */
  export type FakeProviderOperationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter, which FakeProviderOperation to fetch.
     */
    where: FakeProviderOperationWhereUniqueInput
  }

  /**
   * FakeProviderOperation findUniqueOrThrow
   */
  export type FakeProviderOperationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter, which FakeProviderOperation to fetch.
     */
    where: FakeProviderOperationWhereUniqueInput
  }

  /**
   * FakeProviderOperation findFirst
   */
  export type FakeProviderOperationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter, which FakeProviderOperation to fetch.
     */
    where?: FakeProviderOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FakeProviderOperations to fetch.
     */
    orderBy?: FakeProviderOperationOrderByWithRelationInput | FakeProviderOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FakeProviderOperations.
     */
    cursor?: FakeProviderOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FakeProviderOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FakeProviderOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FakeProviderOperations.
     */
    distinct?: FakeProviderOperationScalarFieldEnum | FakeProviderOperationScalarFieldEnum[]
  }

  /**
   * FakeProviderOperation findFirstOrThrow
   */
  export type FakeProviderOperationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter, which FakeProviderOperation to fetch.
     */
    where?: FakeProviderOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FakeProviderOperations to fetch.
     */
    orderBy?: FakeProviderOperationOrderByWithRelationInput | FakeProviderOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for FakeProviderOperations.
     */
    cursor?: FakeProviderOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FakeProviderOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FakeProviderOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FakeProviderOperations.
     */
    distinct?: FakeProviderOperationScalarFieldEnum | FakeProviderOperationScalarFieldEnum[]
  }

  /**
   * FakeProviderOperation findMany
   */
  export type FakeProviderOperationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter, which FakeProviderOperations to fetch.
     */
    where?: FakeProviderOperationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of FakeProviderOperations to fetch.
     */
    orderBy?: FakeProviderOperationOrderByWithRelationInput | FakeProviderOperationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing FakeProviderOperations.
     */
    cursor?: FakeProviderOperationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` FakeProviderOperations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` FakeProviderOperations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of FakeProviderOperations.
     */
    distinct?: FakeProviderOperationScalarFieldEnum | FakeProviderOperationScalarFieldEnum[]
  }

  /**
   * FakeProviderOperation create
   */
  export type FakeProviderOperationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * The data needed to create a FakeProviderOperation.
     */
    data: XOR<FakeProviderOperationCreateInput, FakeProviderOperationUncheckedCreateInput>
  }

  /**
   * FakeProviderOperation createMany
   */
  export type FakeProviderOperationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FakeProviderOperations.
     */
    data: FakeProviderOperationCreateManyInput | FakeProviderOperationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FakeProviderOperation createManyAndReturn
   */
  export type FakeProviderOperationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * The data used to create many FakeProviderOperations.
     */
    data: FakeProviderOperationCreateManyInput | FakeProviderOperationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FakeProviderOperation update
   */
  export type FakeProviderOperationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * The data needed to update a FakeProviderOperation.
     */
    data: XOR<FakeProviderOperationUpdateInput, FakeProviderOperationUncheckedUpdateInput>
    /**
     * Choose, which FakeProviderOperation to update.
     */
    where: FakeProviderOperationWhereUniqueInput
  }

  /**
   * FakeProviderOperation updateMany
   */
  export type FakeProviderOperationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FakeProviderOperations.
     */
    data: XOR<FakeProviderOperationUpdateManyMutationInput, FakeProviderOperationUncheckedUpdateManyInput>
    /**
     * Filter which FakeProviderOperations to update
     */
    where?: FakeProviderOperationWhereInput
    /**
     * Limit how many FakeProviderOperations to update.
     */
    limit?: number
  }

  /**
   * FakeProviderOperation updateManyAndReturn
   */
  export type FakeProviderOperationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * The data used to update FakeProviderOperations.
     */
    data: XOR<FakeProviderOperationUpdateManyMutationInput, FakeProviderOperationUncheckedUpdateManyInput>
    /**
     * Filter which FakeProviderOperations to update
     */
    where?: FakeProviderOperationWhereInput
    /**
     * Limit how many FakeProviderOperations to update.
     */
    limit?: number
  }

  /**
   * FakeProviderOperation upsert
   */
  export type FakeProviderOperationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * The filter to search for the FakeProviderOperation to update in case it exists.
     */
    where: FakeProviderOperationWhereUniqueInput
    /**
     * In case the FakeProviderOperation found by the `where` argument doesn't exist, create a new FakeProviderOperation with this data.
     */
    create: XOR<FakeProviderOperationCreateInput, FakeProviderOperationUncheckedCreateInput>
    /**
     * In case the FakeProviderOperation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FakeProviderOperationUpdateInput, FakeProviderOperationUncheckedUpdateInput>
  }

  /**
   * FakeProviderOperation delete
   */
  export type FakeProviderOperationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
    /**
     * Filter which FakeProviderOperation to delete.
     */
    where: FakeProviderOperationWhereUniqueInput
  }

  /**
   * FakeProviderOperation deleteMany
   */
  export type FakeProviderOperationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FakeProviderOperations to delete
     */
    where?: FakeProviderOperationWhereInput
    /**
     * Limit how many FakeProviderOperations to delete.
     */
    limit?: number
  }

  /**
   * FakeProviderOperation without action
   */
  export type FakeProviderOperationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeProviderOperation
     */
    select?: FakeProviderOperationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeProviderOperation
     */
    omit?: FakeProviderOperationOmit<ExtArgs> | null
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


  export const PaymentScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    orderId: 'orderId',
    amount: 'amount',
    currency: 'currency',
    status: 'status',
    provider: 'provider',
    providerPaymentId: 'providerPaymentId',
    progressState: 'progressState',
    pendingOperation: 'pendingOperation',
    failureCode: 'failureCode',
    orderConfirmedAt: 'orderConfirmedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum]


  export const PaymentIdempotencyScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    action: 'action',
    idempotencyKey: 'idempotencyKey',
    requestFingerprint: 'requestFingerprint',
    status: 'status',
    paymentId: 'paymentId',
    responseBody: 'responseBody',
    errorMessage: 'errorMessage',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PaymentIdempotencyScalarFieldEnum = (typeof PaymentIdempotencyScalarFieldEnum)[keyof typeof PaymentIdempotencyScalarFieldEnum]


  export const FakeProviderOperationScalarFieldEnum: {
    idempotencyKey: 'idempotencyKey',
    requestFingerprint: 'requestFingerprint',
    result: 'result',
    reference: 'reference',
    createdAt: 'createdAt'
  };

  export type FakeProviderOperationScalarFieldEnum = (typeof FakeProviderOperationScalarFieldEnum)[keyof typeof FakeProviderOperationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


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


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


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
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'PaymentStatus'
   */
  export type EnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus'>
    


  /**
   * Reference to a field of type 'PaymentStatus[]'
   */
  export type ListEnumPaymentStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentStatus[]'>
    


  /**
   * Reference to a field of type 'PaymentProvider'
   */
  export type EnumPaymentProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentProvider'>
    


  /**
   * Reference to a field of type 'PaymentProvider[]'
   */
  export type ListEnumPaymentProviderFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'PaymentProvider[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


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

  export type PaymentWhereInput = {
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    id?: StringFilter<"Payment"> | string
    userId?: StringFilter<"Payment"> | string
    orderId?: StringFilter<"Payment"> | string
    amount?: DecimalFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Payment"> | string
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFilter<"Payment"> | $Enums.PaymentProvider
    providerPaymentId?: StringNullableFilter<"Payment"> | string | null
    progressState?: StringFilter<"Payment"> | string
    pendingOperation?: StringNullableFilter<"Payment"> | string | null
    failureCode?: StringNullableFilter<"Payment"> | string | null
    orderConfirmedAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
  }

  export type PaymentOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    providerPaymentId?: SortOrderInput | SortOrder
    progressState?: SortOrder
    pendingOperation?: SortOrderInput | SortOrder
    failureCode?: SortOrderInput | SortOrder
    orderConfirmedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    providerPaymentId?: string
    AND?: PaymentWhereInput | PaymentWhereInput[]
    OR?: PaymentWhereInput[]
    NOT?: PaymentWhereInput | PaymentWhereInput[]
    userId?: StringFilter<"Payment"> | string
    orderId?: StringFilter<"Payment"> | string
    amount?: DecimalFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    currency?: StringFilter<"Payment"> | string
    status?: EnumPaymentStatusFilter<"Payment"> | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFilter<"Payment"> | $Enums.PaymentProvider
    progressState?: StringFilter<"Payment"> | string
    pendingOperation?: StringNullableFilter<"Payment"> | string | null
    failureCode?: StringNullableFilter<"Payment"> | string | null
    orderConfirmedAt?: DateTimeNullableFilter<"Payment"> | Date | string | null
    createdAt?: DateTimeFilter<"Payment"> | Date | string
    updatedAt?: DateTimeFilter<"Payment"> | Date | string
  }, "id" | "providerPaymentId">

  export type PaymentOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    providerPaymentId?: SortOrderInput | SortOrder
    progressState?: SortOrder
    pendingOperation?: SortOrderInput | SortOrder
    failureCode?: SortOrderInput | SortOrder
    orderConfirmedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentCountOrderByAggregateInput
    _avg?: PaymentAvgOrderByAggregateInput
    _max?: PaymentMaxOrderByAggregateInput
    _min?: PaymentMinOrderByAggregateInput
    _sum?: PaymentSumOrderByAggregateInput
  }

  export type PaymentScalarWhereWithAggregatesInput = {
    AND?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    OR?: PaymentScalarWhereWithAggregatesInput[]
    NOT?: PaymentScalarWhereWithAggregatesInput | PaymentScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Payment"> | string
    userId?: StringWithAggregatesFilter<"Payment"> | string
    orderId?: StringWithAggregatesFilter<"Payment"> | string
    amount?: DecimalWithAggregatesFilter<"Payment"> | Decimal | DecimalJsLike | number | string
    currency?: StringWithAggregatesFilter<"Payment"> | string
    status?: EnumPaymentStatusWithAggregatesFilter<"Payment"> | $Enums.PaymentStatus
    provider?: EnumPaymentProviderWithAggregatesFilter<"Payment"> | $Enums.PaymentProvider
    providerPaymentId?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    progressState?: StringWithAggregatesFilter<"Payment"> | string
    pendingOperation?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    failureCode?: StringNullableWithAggregatesFilter<"Payment"> | string | null
    orderConfirmedAt?: DateTimeNullableWithAggregatesFilter<"Payment"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Payment"> | Date | string
  }

  export type PaymentIdempotencyWhereInput = {
    AND?: PaymentIdempotencyWhereInput | PaymentIdempotencyWhereInput[]
    OR?: PaymentIdempotencyWhereInput[]
    NOT?: PaymentIdempotencyWhereInput | PaymentIdempotencyWhereInput[]
    id?: StringFilter<"PaymentIdempotency"> | string
    userId?: StringFilter<"PaymentIdempotency"> | string
    action?: StringFilter<"PaymentIdempotency"> | string
    idempotencyKey?: StringFilter<"PaymentIdempotency"> | string
    requestFingerprint?: StringFilter<"PaymentIdempotency"> | string
    status?: StringFilter<"PaymentIdempotency"> | string
    paymentId?: StringNullableFilter<"PaymentIdempotency"> | string | null
    responseBody?: JsonNullableFilter<"PaymentIdempotency">
    errorMessage?: StringNullableFilter<"PaymentIdempotency"> | string | null
    createdAt?: DateTimeFilter<"PaymentIdempotency"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentIdempotency"> | Date | string
  }

  export type PaymentIdempotencyOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    status?: SortOrder
    paymentId?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIdempotencyWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_action_idempotencyKey?: PaymentIdempotencyUserIdActionIdempotencyKeyCompoundUniqueInput
    AND?: PaymentIdempotencyWhereInput | PaymentIdempotencyWhereInput[]
    OR?: PaymentIdempotencyWhereInput[]
    NOT?: PaymentIdempotencyWhereInput | PaymentIdempotencyWhereInput[]
    userId?: StringFilter<"PaymentIdempotency"> | string
    action?: StringFilter<"PaymentIdempotency"> | string
    idempotencyKey?: StringFilter<"PaymentIdempotency"> | string
    requestFingerprint?: StringFilter<"PaymentIdempotency"> | string
    status?: StringFilter<"PaymentIdempotency"> | string
    paymentId?: StringNullableFilter<"PaymentIdempotency"> | string | null
    responseBody?: JsonNullableFilter<"PaymentIdempotency">
    errorMessage?: StringNullableFilter<"PaymentIdempotency"> | string | null
    createdAt?: DateTimeFilter<"PaymentIdempotency"> | Date | string
    updatedAt?: DateTimeFilter<"PaymentIdempotency"> | Date | string
  }, "id" | "userId_action_idempotencyKey">

  export type PaymentIdempotencyOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    status?: SortOrder
    paymentId?: SortOrderInput | SortOrder
    responseBody?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PaymentIdempotencyCountOrderByAggregateInput
    _max?: PaymentIdempotencyMaxOrderByAggregateInput
    _min?: PaymentIdempotencyMinOrderByAggregateInput
  }

  export type PaymentIdempotencyScalarWhereWithAggregatesInput = {
    AND?: PaymentIdempotencyScalarWhereWithAggregatesInput | PaymentIdempotencyScalarWhereWithAggregatesInput[]
    OR?: PaymentIdempotencyScalarWhereWithAggregatesInput[]
    NOT?: PaymentIdempotencyScalarWhereWithAggregatesInput | PaymentIdempotencyScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    userId?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    action?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    idempotencyKey?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    requestFingerprint?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    status?: StringWithAggregatesFilter<"PaymentIdempotency"> | string
    paymentId?: StringNullableWithAggregatesFilter<"PaymentIdempotency"> | string | null
    responseBody?: JsonNullableWithAggregatesFilter<"PaymentIdempotency">
    errorMessage?: StringNullableWithAggregatesFilter<"PaymentIdempotency"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PaymentIdempotency"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PaymentIdempotency"> | Date | string
  }

  export type FakeProviderOperationWhereInput = {
    AND?: FakeProviderOperationWhereInput | FakeProviderOperationWhereInput[]
    OR?: FakeProviderOperationWhereInput[]
    NOT?: FakeProviderOperationWhereInput | FakeProviderOperationWhereInput[]
    idempotencyKey?: StringFilter<"FakeProviderOperation"> | string
    requestFingerprint?: StringFilter<"FakeProviderOperation"> | string
    result?: StringFilter<"FakeProviderOperation"> | string
    reference?: StringFilter<"FakeProviderOperation"> | string
    createdAt?: DateTimeFilter<"FakeProviderOperation"> | Date | string
  }

  export type FakeProviderOperationOrderByWithRelationInput = {
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    result?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeProviderOperationWhereUniqueInput = Prisma.AtLeast<{
    idempotencyKey?: string
    reference?: string
    AND?: FakeProviderOperationWhereInput | FakeProviderOperationWhereInput[]
    OR?: FakeProviderOperationWhereInput[]
    NOT?: FakeProviderOperationWhereInput | FakeProviderOperationWhereInput[]
    requestFingerprint?: StringFilter<"FakeProviderOperation"> | string
    result?: StringFilter<"FakeProviderOperation"> | string
    createdAt?: DateTimeFilter<"FakeProviderOperation"> | Date | string
  }, "idempotencyKey" | "reference">

  export type FakeProviderOperationOrderByWithAggregationInput = {
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    result?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
    _count?: FakeProviderOperationCountOrderByAggregateInput
    _max?: FakeProviderOperationMaxOrderByAggregateInput
    _min?: FakeProviderOperationMinOrderByAggregateInput
  }

  export type FakeProviderOperationScalarWhereWithAggregatesInput = {
    AND?: FakeProviderOperationScalarWhereWithAggregatesInput | FakeProviderOperationScalarWhereWithAggregatesInput[]
    OR?: FakeProviderOperationScalarWhereWithAggregatesInput[]
    NOT?: FakeProviderOperationScalarWhereWithAggregatesInput | FakeProviderOperationScalarWhereWithAggregatesInput[]
    idempotencyKey?: StringWithAggregatesFilter<"FakeProviderOperation"> | string
    requestFingerprint?: StringWithAggregatesFilter<"FakeProviderOperation"> | string
    result?: StringWithAggregatesFilter<"FakeProviderOperation"> | string
    reference?: StringWithAggregatesFilter<"FakeProviderOperation"> | string
    createdAt?: DateTimeWithAggregatesFilter<"FakeProviderOperation"> | Date | string
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

  export type PaymentCreateInput = {
    id?: string
    userId: string
    orderId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status?: $Enums.PaymentStatus
    provider?: $Enums.PaymentProvider
    providerPaymentId?: string | null
    progressState?: string
    pendingOperation?: string | null
    failureCode?: string | null
    orderConfirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUncheckedCreateInput = {
    id?: string
    userId: string
    orderId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status?: $Enums.PaymentStatus
    provider?: $Enums.PaymentProvider
    providerPaymentId?: string | null
    progressState?: string
    pendingOperation?: string | null
    failureCode?: string | null
    orderConfirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFieldUpdateOperationsInput | $Enums.PaymentProvider
    providerPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    progressState?: StringFieldUpdateOperationsInput | string
    pendingOperation?: NullableStringFieldUpdateOperationsInput | string | null
    failureCode?: NullableStringFieldUpdateOperationsInput | string | null
    orderConfirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFieldUpdateOperationsInput | $Enums.PaymentProvider
    providerPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    progressState?: StringFieldUpdateOperationsInput | string
    pendingOperation?: NullableStringFieldUpdateOperationsInput | string | null
    failureCode?: NullableStringFieldUpdateOperationsInput | string | null
    orderConfirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentCreateManyInput = {
    id?: string
    userId: string
    orderId: string
    amount: Decimal | DecimalJsLike | number | string
    currency?: string
    status?: $Enums.PaymentStatus
    provider?: $Enums.PaymentProvider
    providerPaymentId?: string | null
    progressState?: string
    pendingOperation?: string | null
    failureCode?: string | null
    orderConfirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFieldUpdateOperationsInput | $Enums.PaymentProvider
    providerPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    progressState?: StringFieldUpdateOperationsInput | string
    pendingOperation?: NullableStringFieldUpdateOperationsInput | string | null
    failureCode?: NullableStringFieldUpdateOperationsInput | string | null
    orderConfirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    orderId?: StringFieldUpdateOperationsInput | string
    amount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    currency?: StringFieldUpdateOperationsInput | string
    status?: EnumPaymentStatusFieldUpdateOperationsInput | $Enums.PaymentStatus
    provider?: EnumPaymentProviderFieldUpdateOperationsInput | $Enums.PaymentProvider
    providerPaymentId?: NullableStringFieldUpdateOperationsInput | string | null
    progressState?: StringFieldUpdateOperationsInput | string
    pendingOperation?: NullableStringFieldUpdateOperationsInput | string | null
    failureCode?: NullableStringFieldUpdateOperationsInput | string | null
    orderConfirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIdempotencyCreateInput = {
    id?: string
    userId: string
    action: string
    idempotencyKey: string
    requestFingerprint: string
    status: string
    paymentId?: string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIdempotencyUncheckedCreateInput = {
    id?: string
    userId: string
    action: string
    idempotencyKey: string
    requestFingerprint: string
    status: string
    paymentId?: string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIdempotencyUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIdempotencyUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIdempotencyCreateManyInput = {
    id?: string
    userId: string
    action: string
    idempotencyKey: string
    requestFingerprint: string
    status: string
    paymentId?: string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PaymentIdempotencyUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PaymentIdempotencyUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    action?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    paymentId?: NullableStringFieldUpdateOperationsInput | string | null
    responseBody?: NullableJsonNullValueInput | InputJsonValue
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeProviderOperationCreateInput = {
    idempotencyKey: string
    requestFingerprint: string
    result: string
    reference: string
    createdAt?: Date | string
  }

  export type FakeProviderOperationUncheckedCreateInput = {
    idempotencyKey: string
    requestFingerprint: string
    result: string
    reference: string
    createdAt?: Date | string
  }

  export type FakeProviderOperationUpdateInput = {
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    result?: StringFieldUpdateOperationsInput | string
    reference?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeProviderOperationUncheckedUpdateInput = {
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    result?: StringFieldUpdateOperationsInput | string
    reference?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeProviderOperationCreateManyInput = {
    idempotencyKey: string
    requestFingerprint: string
    result: string
    reference: string
    createdAt?: Date | string
  }

  export type FakeProviderOperationUpdateManyMutationInput = {
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    result?: StringFieldUpdateOperationsInput | string
    reference?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeProviderOperationUncheckedUpdateManyInput = {
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    requestFingerprint?: StringFieldUpdateOperationsInput | string
    result?: StringFieldUpdateOperationsInput | string
    reference?: StringFieldUpdateOperationsInput | string
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

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type EnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type EnumPaymentProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentProvider | EnumPaymentProviderFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentProviderFilter<$PrismaModel> | $Enums.PaymentProvider
  }

  export type PaymentCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    providerPaymentId?: SortOrder
    progressState?: SortOrder
    pendingOperation?: SortOrder
    failureCode?: SortOrder
    orderConfirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentAvgOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type PaymentMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    providerPaymentId?: SortOrder
    progressState?: SortOrder
    pendingOperation?: SortOrder
    failureCode?: SortOrder
    orderConfirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    orderId?: SortOrder
    amount?: SortOrder
    currency?: SortOrder
    status?: SortOrder
    provider?: SortOrder
    providerPaymentId?: SortOrder
    progressState?: SortOrder
    pendingOperation?: SortOrder
    failureCode?: SortOrder
    orderConfirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentSumOrderByAggregateInput = {
    amount?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type EnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type EnumPaymentProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentProvider | EnumPaymentProviderFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentProviderWithAggregatesFilter<$PrismaModel> | $Enums.PaymentProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentProviderFilter<$PrismaModel>
    _max?: NestedEnumPaymentProviderFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type PaymentIdempotencyUserIdActionIdempotencyKeyCompoundUniqueInput = {
    userId: string
    action: string
    idempotencyKey: string
  }

  export type PaymentIdempotencyCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    status?: SortOrder
    paymentId?: SortOrder
    responseBody?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIdempotencyMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    status?: SortOrder
    paymentId?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PaymentIdempotencyMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    action?: SortOrder
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    status?: SortOrder
    paymentId?: SortOrder
    errorMessage?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type FakeProviderOperationCountOrderByAggregateInput = {
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    result?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeProviderOperationMaxOrderByAggregateInput = {
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    result?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeProviderOperationMinOrderByAggregateInput = {
    idempotencyKey?: SortOrder
    requestFingerprint?: SortOrder
    result?: SortOrder
    reference?: SortOrder
    createdAt?: SortOrder
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

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type EnumPaymentStatusFieldUpdateOperationsInput = {
    set?: $Enums.PaymentStatus
  }

  export type EnumPaymentProviderFieldUpdateOperationsInput = {
    set?: $Enums.PaymentProvider
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

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedEnumPaymentStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusFilter<$PrismaModel> | $Enums.PaymentStatus
  }

  export type NestedEnumPaymentProviderFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentProvider | EnumPaymentProviderFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentProviderFilter<$PrismaModel> | $Enums.PaymentProvider
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentStatus | EnumPaymentStatusFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentStatus[] | ListEnumPaymentStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentStatusWithAggregatesFilter<$PrismaModel> | $Enums.PaymentStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentStatusFilter<$PrismaModel>
    _max?: NestedEnumPaymentStatusFilter<$PrismaModel>
  }

  export type NestedEnumPaymentProviderWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PaymentProvider | EnumPaymentProviderFieldRefInput<$PrismaModel>
    in?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    notIn?: $Enums.PaymentProvider[] | ListEnumPaymentProviderFieldRefInput<$PrismaModel>
    not?: NestedEnumPaymentProviderWithAggregatesFilter<$PrismaModel> | $Enums.PaymentProvider
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumPaymentProviderFilter<$PrismaModel>
    _max?: NestedEnumPaymentProviderFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
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
