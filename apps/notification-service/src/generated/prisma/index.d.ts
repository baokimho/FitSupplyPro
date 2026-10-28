
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
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>
/**
 * Model CheckoutEvent
 *
 */
export type CheckoutEvent = $Result.DefaultSelection<Prisma.$CheckoutEventPayload>
/**
 * Model ConsumerDelivery
 *
 */
export type ConsumerDelivery = $Result.DefaultSelection<Prisma.$ConsumerDeliveryPayload>
/**
 * Model NotificationDelivery
 *
 */
export type NotificationDelivery = $Result.DefaultSelection<Prisma.$NotificationDeliveryPayload>
/**
 * Model FakeEmailReceipt
 *
 */
export type FakeEmailReceipt = $Result.DefaultSelection<Prisma.$FakeEmailReceiptPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const NotificationType: {
  ORDER_CONFIRMED: 'ORDER_CONFIRMED',
  ORDER_CREATED: 'ORDER_CREATED',
  PAYMENT_PAID: 'PAYMENT_PAID',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  ORDER_SHIPPED: 'ORDER_SHIPPED',
  ORDER_DELIVERED: 'ORDER_DELIVERED',
  ORDER_CANCELLED: 'ORDER_CANCELLED'
};

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]


export const NotificationChannel: {
  EMAIL: 'EMAIL'
};

export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel]


export const NotificationDeliveryStatus: {
  PENDING: 'PENDING',
  SENDING: 'SENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

export type NotificationDeliveryStatus = (typeof NotificationDeliveryStatus)[keyof typeof NotificationDeliveryStatus]

}

export type NotificationType = $Enums.NotificationType

export const NotificationType: typeof $Enums.NotificationType

export type NotificationChannel = $Enums.NotificationChannel

export const NotificationChannel: typeof $Enums.NotificationChannel

export type NotificationDeliveryStatus = $Enums.NotificationDeliveryStatus

export const NotificationDeliveryStatus: typeof $Enums.NotificationDeliveryStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient({
 *   adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL })
 * })
 * // Fetch zero or more Notifications
 * const notifications = await prisma.notification.findMany()
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
   * // Fetch zero or more Notifications
   * const notifications = await prisma.notification.findMany()
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
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs, ClientOptions>;

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
   * `prisma.consumerDelivery`: Exposes CRUD operations for the **ConsumerDelivery** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ConsumerDeliveries
    * const consumerDeliveries = await prisma.consumerDelivery.findMany()
    * ```
    */
  get consumerDelivery(): Prisma.ConsumerDeliveryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notificationDelivery`: Exposes CRUD operations for the **NotificationDelivery** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more NotificationDeliveries
    * const notificationDeliveries = await prisma.notificationDelivery.findMany()
    * ```
    */
  get notificationDelivery(): Prisma.NotificationDeliveryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.fakeEmailReceipt`: Exposes CRUD operations for the **FakeEmailReceipt** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more FakeEmailReceipts
    * const fakeEmailReceipts = await prisma.fakeEmailReceipt.findMany()
    * ```
    */
  get fakeEmailReceipt(): Prisma.FakeEmailReceiptDelegate<ExtArgs, ClientOptions>;
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
    Notification: 'Notification',
    CheckoutEvent: 'CheckoutEvent',
    ConsumerDelivery: 'ConsumerDelivery',
    NotificationDelivery: 'NotificationDelivery',
    FakeEmailReceipt: 'FakeEmailReceipt'
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
      modelProps: "notification" | "checkoutEvent" | "consumerDelivery" | "notificationDelivery" | "fakeEmailReceipt"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NotificationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
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
      ConsumerDelivery: {
        payload: Prisma.$ConsumerDeliveryPayload<ExtArgs>
        fields: Prisma.ConsumerDeliveryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ConsumerDeliveryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ConsumerDeliveryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          findFirst: {
            args: Prisma.ConsumerDeliveryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ConsumerDeliveryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          findMany: {
            args: Prisma.ConsumerDeliveryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>[]
          }
          create: {
            args: Prisma.ConsumerDeliveryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          createMany: {
            args: Prisma.ConsumerDeliveryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ConsumerDeliveryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>[]
          }
          delete: {
            args: Prisma.ConsumerDeliveryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          update: {
            args: Prisma.ConsumerDeliveryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          deleteMany: {
            args: Prisma.ConsumerDeliveryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ConsumerDeliveryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ConsumerDeliveryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>[]
          }
          upsert: {
            args: Prisma.ConsumerDeliveryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ConsumerDeliveryPayload>
          }
          aggregate: {
            args: Prisma.ConsumerDeliveryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateConsumerDelivery>
          }
          groupBy: {
            args: Prisma.ConsumerDeliveryGroupByArgs<ExtArgs>
            result: $Utils.Optional<ConsumerDeliveryGroupByOutputType>[]
          }
          count: {
            args: Prisma.ConsumerDeliveryCountArgs<ExtArgs>
            result: $Utils.Optional<ConsumerDeliveryCountAggregateOutputType> | number
          }
        }
      }
      NotificationDelivery: {
        payload: Prisma.$NotificationDeliveryPayload<ExtArgs>
        fields: Prisma.NotificationDeliveryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationDeliveryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationDeliveryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          findFirst: {
            args: Prisma.NotificationDeliveryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationDeliveryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          findMany: {
            args: Prisma.NotificationDeliveryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>[]
          }
          create: {
            args: Prisma.NotificationDeliveryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          createMany: {
            args: Prisma.NotificationDeliveryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationDeliveryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>[]
          }
          delete: {
            args: Prisma.NotificationDeliveryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          update: {
            args: Prisma.NotificationDeliveryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeliveryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationDeliveryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NotificationDeliveryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>[]
          }
          upsert: {
            args: Prisma.NotificationDeliveryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationDeliveryPayload>
          }
          aggregate: {
            args: Prisma.NotificationDeliveryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotificationDelivery>
          }
          groupBy: {
            args: Prisma.NotificationDeliveryGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationDeliveryGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationDeliveryCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationDeliveryCountAggregateOutputType> | number
          }
        }
      }
      FakeEmailReceipt: {
        payload: Prisma.$FakeEmailReceiptPayload<ExtArgs>
        fields: Prisma.FakeEmailReceiptFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FakeEmailReceiptFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FakeEmailReceiptFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          findFirst: {
            args: Prisma.FakeEmailReceiptFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FakeEmailReceiptFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          findMany: {
            args: Prisma.FakeEmailReceiptFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>[]
          }
          create: {
            args: Prisma.FakeEmailReceiptCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          createMany: {
            args: Prisma.FakeEmailReceiptCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FakeEmailReceiptCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>[]
          }
          delete: {
            args: Prisma.FakeEmailReceiptDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          update: {
            args: Prisma.FakeEmailReceiptUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          deleteMany: {
            args: Prisma.FakeEmailReceiptDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FakeEmailReceiptUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FakeEmailReceiptUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>[]
          }
          upsert: {
            args: Prisma.FakeEmailReceiptUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FakeEmailReceiptPayload>
          }
          aggregate: {
            args: Prisma.FakeEmailReceiptAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFakeEmailReceipt>
          }
          groupBy: {
            args: Prisma.FakeEmailReceiptGroupByArgs<ExtArgs>
            result: $Utils.Optional<FakeEmailReceiptGroupByOutputType>[]
          }
          count: {
            args: Prisma.FakeEmailReceiptCountArgs<ExtArgs>
            result: $Utils.Optional<FakeEmailReceiptCountAggregateOutputType> | number
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
    notification?: NotificationOmit
    checkoutEvent?: CheckoutEventOmit
    consumerDelivery?: ConsumerDeliveryOmit
    notificationDelivery?: NotificationDeliveryOmit
    fakeEmailReceipt?: FakeEmailReceiptOmit
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
   * Count Type NotificationCountOutputType
   */

  export type NotificationCountOutputType = {
    deliveries: number
  }

  export type NotificationCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deliveries?: boolean | NotificationCountOutputTypeCountDeliveriesArgs
  }

  // Custom InputTypes
  /**
   * NotificationCountOutputType without action
   */
  export type NotificationCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationCountOutputType
     */
    select?: NotificationCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * NotificationCountOutputType without action
   */
  export type NotificationCountOutputTypeCountDeliveriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationDeliveryWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationMinAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.NotificationType | null
    title: string | null
    message: string | null
    isRead: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    sourceEventId: string | null
    correlationId: string | null
    traceparent: string | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    type: $Enums.NotificationType | null
    title: string | null
    message: string | null
    isRead: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
    sourceEventId: string | null
    correlationId: string | null
    traceparent: string | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    userId: number
    type: number
    title: number
    message: number
    isRead: number
    createdAt: number
    updatedAt: number
    sourceEventId: number
    correlationId: number
    traceparent: number
    _all: number
  }


  export type NotificationMinAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    createdAt?: true
    updatedAt?: true
    sourceEventId?: true
    correlationId?: true
    traceparent?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    createdAt?: true
    updatedAt?: true
    sourceEventId?: true
    correlationId?: true
    traceparent?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    userId?: true
    type?: true
    title?: true
    message?: true
    isRead?: true
    createdAt?: true
    updatedAt?: true
    sourceEventId?: true
    correlationId?: true
    traceparent?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead: boolean
    createdAt: Date
    updatedAt: Date
    sourceEventId: string | null
    correlationId: string | null
    traceparent: string | null
    _count: NotificationCountAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sourceEventId?: boolean
    correlationId?: boolean
    traceparent?: boolean
    deliveries?: boolean | Notification$deliveriesArgs<ExtArgs>
    _count?: boolean | NotificationCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sourceEventId?: boolean
    correlationId?: boolean
    traceparent?: boolean
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sourceEventId?: boolean
    correlationId?: boolean
    traceparent?: boolean
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectScalar = {
    id?: boolean
    userId?: boolean
    type?: boolean
    title?: boolean
    message?: boolean
    isRead?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sourceEventId?: boolean
    correlationId?: boolean
    traceparent?: boolean
  }

  export type NotificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "type" | "title" | "message" | "isRead" | "createdAt" | "updatedAt" | "sourceEventId" | "correlationId" | "traceparent", ExtArgs["result"]["notification"]>
  export type NotificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    deliveries?: boolean | Notification$deliveriesArgs<ExtArgs>
    _count?: boolean | NotificationCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type NotificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type NotificationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {
      deliveries: Prisma.$NotificationDeliveryPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      type: $Enums.NotificationType
      title: string
      message: string
      isRead: boolean
      createdAt: Date
      updatedAt: Date
      sourceEventId: string | null
      correlationId: string | null
      traceparent: string | null
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications and returns the data saved in the database.
     * @param {NotificationCreateManyAndReturnArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications and returns the data updated in the database.
     * @param {NotificationUpdateManyAndReturnArgs} args - Arguments to update many Notifications.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.updateManyAndReturn({
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
    updateManyAndReturn<T extends NotificationUpdateManyAndReturnArgs>(args: SelectSubset<T, NotificationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
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
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    deliveries<T extends Notification$deliveriesArgs<ExtArgs> = {}>(args?: Subset<T, Notification$deliveriesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
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
   * Fields of the Notification model
   */
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'String'>
    readonly userId: FieldRef<"Notification", 'String'>
    readonly type: FieldRef<"Notification", 'NotificationType'>
    readonly title: FieldRef<"Notification", 'String'>
    readonly message: FieldRef<"Notification", 'String'>
    readonly isRead: FieldRef<"Notification", 'Boolean'>
    readonly createdAt: FieldRef<"Notification", 'DateTime'>
    readonly updatedAt: FieldRef<"Notification", 'DateTime'>
    readonly sourceEventId: FieldRef<"Notification", 'String'>
    readonly correlationId: FieldRef<"Notification", 'String'>
    readonly traceparent: FieldRef<"Notification", 'String'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification createManyAndReturn
   */
  export type NotificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to update.
     */
    limit?: number
  }

  /**
   * Notification updateManyAndReturn
   */
  export type NotificationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to update.
     */
    limit?: number
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to delete.
     */
    limit?: number
  }

  /**
   * Notification.deliveries
   */
  export type Notification$deliveriesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    where?: NotificationDeliveryWhereInput
    orderBy?: NotificationDeliveryOrderByWithRelationInput | NotificationDeliveryOrderByWithRelationInput[]
    cursor?: NotificationDeliveryWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationDeliveryScalarFieldEnum | NotificationDeliveryScalarFieldEnum[]
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
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
   * Model ConsumerDelivery
   */

  export type AggregateConsumerDelivery = {
    _count: ConsumerDeliveryCountAggregateOutputType | null
    _avg: ConsumerDeliveryAvgAggregateOutputType | null
    _sum: ConsumerDeliverySumAggregateOutputType | null
    _min: ConsumerDeliveryMinAggregateOutputType | null
    _max: ConsumerDeliveryMaxAggregateOutputType | null
  }

  export type ConsumerDeliveryAvgAggregateOutputType = {
    replayCount: number | null
    attempts: number | null
  }

  export type ConsumerDeliverySumAggregateOutputType = {
    replayCount: number | null
    attempts: number | null
  }

  export type ConsumerDeliveryMinAggregateOutputType = {
    consumer: string | null
    messageKey: string | null
    replayCount: number | null
    attempts: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsumerDeliveryMaxAggregateOutputType = {
    consumer: string | null
    messageKey: string | null
    replayCount: number | null
    attempts: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ConsumerDeliveryCountAggregateOutputType = {
    consumer: number
    messageKey: number
    replayCount: number
    attempts: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ConsumerDeliveryAvgAggregateInputType = {
    replayCount?: true
    attempts?: true
  }

  export type ConsumerDeliverySumAggregateInputType = {
    replayCount?: true
    attempts?: true
  }

  export type ConsumerDeliveryMinAggregateInputType = {
    consumer?: true
    messageKey?: true
    replayCount?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsumerDeliveryMaxAggregateInputType = {
    consumer?: true
    messageKey?: true
    replayCount?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ConsumerDeliveryCountAggregateInputType = {
    consumer?: true
    messageKey?: true
    replayCount?: true
    attempts?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ConsumerDeliveryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsumerDelivery to aggregate.
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ConsumerDeliveries to fetch.
     */
    orderBy?: ConsumerDeliveryOrderByWithRelationInput | ConsumerDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: ConsumerDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ConsumerDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ConsumerDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned ConsumerDeliveries
    **/
    _count?: true | ConsumerDeliveryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: ConsumerDeliveryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: ConsumerDeliverySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: ConsumerDeliveryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: ConsumerDeliveryMaxAggregateInputType
  }

  export type GetConsumerDeliveryAggregateType<T extends ConsumerDeliveryAggregateArgs> = {
        [P in keyof T & keyof AggregateConsumerDelivery]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateConsumerDelivery[P]>
      : GetScalarType<T[P], AggregateConsumerDelivery[P]>
  }




  export type ConsumerDeliveryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ConsumerDeliveryWhereInput
    orderBy?: ConsumerDeliveryOrderByWithAggregationInput | ConsumerDeliveryOrderByWithAggregationInput[]
    by: ConsumerDeliveryScalarFieldEnum[] | ConsumerDeliveryScalarFieldEnum
    having?: ConsumerDeliveryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ConsumerDeliveryCountAggregateInputType | true
    _avg?: ConsumerDeliveryAvgAggregateInputType
    _sum?: ConsumerDeliverySumAggregateInputType
    _min?: ConsumerDeliveryMinAggregateInputType
    _max?: ConsumerDeliveryMaxAggregateInputType
  }

  export type ConsumerDeliveryGroupByOutputType = {
    consumer: string
    messageKey: string
    replayCount: number
    attempts: number
    createdAt: Date
    updatedAt: Date
    _count: ConsumerDeliveryCountAggregateOutputType | null
    _avg: ConsumerDeliveryAvgAggregateOutputType | null
    _sum: ConsumerDeliverySumAggregateOutputType | null
    _min: ConsumerDeliveryMinAggregateOutputType | null
    _max: ConsumerDeliveryMaxAggregateOutputType | null
  }

  type GetConsumerDeliveryGroupByPayload<T extends ConsumerDeliveryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ConsumerDeliveryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ConsumerDeliveryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ConsumerDeliveryGroupByOutputType[P]>
            : GetScalarType<T[P], ConsumerDeliveryGroupByOutputType[P]>
        }
      >
    >


  export type ConsumerDeliverySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    consumer?: boolean
    messageKey?: boolean
    replayCount?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consumerDelivery"]>

  export type ConsumerDeliverySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    consumer?: boolean
    messageKey?: boolean
    replayCount?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consumerDelivery"]>

  export type ConsumerDeliverySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    consumer?: boolean
    messageKey?: boolean
    replayCount?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["consumerDelivery"]>

  export type ConsumerDeliverySelectScalar = {
    consumer?: boolean
    messageKey?: boolean
    replayCount?: boolean
    attempts?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ConsumerDeliveryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"consumer" | "messageKey" | "replayCount" | "attempts" | "createdAt" | "updatedAt", ExtArgs["result"]["consumerDelivery"]>

  export type $ConsumerDeliveryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ConsumerDelivery"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      consumer: string
      messageKey: string
      replayCount: number
      attempts: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["consumerDelivery"]>
    composites: {}
  }

  type ConsumerDeliveryGetPayload<S extends boolean | null | undefined | ConsumerDeliveryDefaultArgs> = $Result.GetResult<Prisma.$ConsumerDeliveryPayload, S>

  type ConsumerDeliveryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ConsumerDeliveryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ConsumerDeliveryCountAggregateInputType | true
    }

  export interface ConsumerDeliveryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ConsumerDelivery'], meta: { name: 'ConsumerDelivery' } }
    /**
     * Find zero or one ConsumerDelivery that matches the filter.
     * @param {ConsumerDeliveryFindUniqueArgs} args - Arguments to find a ConsumerDelivery
     * @example
     * // Get one ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ConsumerDeliveryFindUniqueArgs>(args: SelectSubset<T, ConsumerDeliveryFindUniqueArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ConsumerDelivery that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ConsumerDeliveryFindUniqueOrThrowArgs} args - Arguments to find a ConsumerDelivery
     * @example
     * // Get one ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ConsumerDeliveryFindUniqueOrThrowArgs>(args: SelectSubset<T, ConsumerDeliveryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConsumerDelivery that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryFindFirstArgs} args - Arguments to find a ConsumerDelivery
     * @example
     * // Get one ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ConsumerDeliveryFindFirstArgs>(args?: SelectSubset<T, ConsumerDeliveryFindFirstArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ConsumerDelivery that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryFindFirstOrThrowArgs} args - Arguments to find a ConsumerDelivery
     * @example
     * // Get one ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ConsumerDeliveryFindFirstOrThrowArgs>(args?: SelectSubset<T, ConsumerDeliveryFindFirstOrThrowArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ConsumerDeliveries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ConsumerDeliveries
     * const consumerDeliveries = await prisma.consumerDelivery.findMany()
     *
     * // Get first 10 ConsumerDeliveries
     * const consumerDeliveries = await prisma.consumerDelivery.findMany({ take: 10 })
     *
     * // Only select the `consumer`
     * const consumerDeliveryWithConsumerOnly = await prisma.consumerDelivery.findMany({ select: { consumer: true } })
     *
     */
    findMany<T extends ConsumerDeliveryFindManyArgs>(args?: SelectSubset<T, ConsumerDeliveryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ConsumerDelivery.
     * @param {ConsumerDeliveryCreateArgs} args - Arguments to create a ConsumerDelivery.
     * @example
     * // Create one ConsumerDelivery
     * const ConsumerDelivery = await prisma.consumerDelivery.create({
     *   data: {
     *     // ... data to create a ConsumerDelivery
     *   }
     * })
     *
     */
    create<T extends ConsumerDeliveryCreateArgs>(args: SelectSubset<T, ConsumerDeliveryCreateArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ConsumerDeliveries.
     * @param {ConsumerDeliveryCreateManyArgs} args - Arguments to create many ConsumerDeliveries.
     * @example
     * // Create many ConsumerDeliveries
     * const consumerDelivery = await prisma.consumerDelivery.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends ConsumerDeliveryCreateManyArgs>(args?: SelectSubset<T, ConsumerDeliveryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ConsumerDeliveries and returns the data saved in the database.
     * @param {ConsumerDeliveryCreateManyAndReturnArgs} args - Arguments to create many ConsumerDeliveries.
     * @example
     * // Create many ConsumerDeliveries
     * const consumerDelivery = await prisma.consumerDelivery.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many ConsumerDeliveries and only return the `consumer`
     * const consumerDeliveryWithConsumerOnly = await prisma.consumerDelivery.createManyAndReturn({
     *   select: { consumer: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends ConsumerDeliveryCreateManyAndReturnArgs>(args?: SelectSubset<T, ConsumerDeliveryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ConsumerDelivery.
     * @param {ConsumerDeliveryDeleteArgs} args - Arguments to delete one ConsumerDelivery.
     * @example
     * // Delete one ConsumerDelivery
     * const ConsumerDelivery = await prisma.consumerDelivery.delete({
     *   where: {
     *     // ... filter to delete one ConsumerDelivery
     *   }
     * })
     *
     */
    delete<T extends ConsumerDeliveryDeleteArgs>(args: SelectSubset<T, ConsumerDeliveryDeleteArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ConsumerDelivery.
     * @param {ConsumerDeliveryUpdateArgs} args - Arguments to update one ConsumerDelivery.
     * @example
     * // Update one ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends ConsumerDeliveryUpdateArgs>(args: SelectSubset<T, ConsumerDeliveryUpdateArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ConsumerDeliveries.
     * @param {ConsumerDeliveryDeleteManyArgs} args - Arguments to filter ConsumerDeliveries to delete.
     * @example
     * // Delete a few ConsumerDeliveries
     * const { count } = await prisma.consumerDelivery.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends ConsumerDeliveryDeleteManyArgs>(args?: SelectSubset<T, ConsumerDeliveryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConsumerDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ConsumerDeliveries
     * const consumerDelivery = await prisma.consumerDelivery.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends ConsumerDeliveryUpdateManyArgs>(args: SelectSubset<T, ConsumerDeliveryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ConsumerDeliveries and returns the data updated in the database.
     * @param {ConsumerDeliveryUpdateManyAndReturnArgs} args - Arguments to update many ConsumerDeliveries.
     * @example
     * // Update many ConsumerDeliveries
     * const consumerDelivery = await prisma.consumerDelivery.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more ConsumerDeliveries and only return the `consumer`
     * const consumerDeliveryWithConsumerOnly = await prisma.consumerDelivery.updateManyAndReturn({
     *   select: { consumer: true },
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
    updateManyAndReturn<T extends ConsumerDeliveryUpdateManyAndReturnArgs>(args: SelectSubset<T, ConsumerDeliveryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ConsumerDelivery.
     * @param {ConsumerDeliveryUpsertArgs} args - Arguments to update or create a ConsumerDelivery.
     * @example
     * // Update or create a ConsumerDelivery
     * const consumerDelivery = await prisma.consumerDelivery.upsert({
     *   create: {
     *     // ... data to create a ConsumerDelivery
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ConsumerDelivery we want to update
     *   }
     * })
     */
    upsert<T extends ConsumerDeliveryUpsertArgs>(args: SelectSubset<T, ConsumerDeliveryUpsertArgs<ExtArgs>>): Prisma__ConsumerDeliveryClient<$Result.GetResult<Prisma.$ConsumerDeliveryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ConsumerDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryCountArgs} args - Arguments to filter ConsumerDeliveries to count.
     * @example
     * // Count the number of ConsumerDeliveries
     * const count = await prisma.consumerDelivery.count({
     *   where: {
     *     // ... the filter for the ConsumerDeliveries we want to count
     *   }
     * })
    **/
    count<T extends ConsumerDeliveryCountArgs>(
      args?: Subset<T, ConsumerDeliveryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ConsumerDeliveryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ConsumerDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends ConsumerDeliveryAggregateArgs>(args: Subset<T, ConsumerDeliveryAggregateArgs>): Prisma.PrismaPromise<GetConsumerDeliveryAggregateType<T>>

    /**
     * Group by ConsumerDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ConsumerDeliveryGroupByArgs} args - Group by arguments.
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
      T extends ConsumerDeliveryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ConsumerDeliveryGroupByArgs['orderBy'] }
        : { orderBy?: ConsumerDeliveryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, ConsumerDeliveryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetConsumerDeliveryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ConsumerDelivery model
   */
  readonly fields: ConsumerDeliveryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ConsumerDelivery.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ConsumerDeliveryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the ConsumerDelivery model
   */
  interface ConsumerDeliveryFieldRefs {
    readonly consumer: FieldRef<"ConsumerDelivery", 'String'>
    readonly messageKey: FieldRef<"ConsumerDelivery", 'String'>
    readonly replayCount: FieldRef<"ConsumerDelivery", 'Int'>
    readonly attempts: FieldRef<"ConsumerDelivery", 'Int'>
    readonly createdAt: FieldRef<"ConsumerDelivery", 'DateTime'>
    readonly updatedAt: FieldRef<"ConsumerDelivery", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * ConsumerDelivery findUnique
   */
  export type ConsumerDeliveryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter, which ConsumerDelivery to fetch.
     */
    where: ConsumerDeliveryWhereUniqueInput
  }

  /**
   * ConsumerDelivery findUniqueOrThrow
   */
  export type ConsumerDeliveryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter, which ConsumerDelivery to fetch.
     */
    where: ConsumerDeliveryWhereUniqueInput
  }

  /**
   * ConsumerDelivery findFirst
   */
  export type ConsumerDeliveryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter, which ConsumerDelivery to fetch.
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ConsumerDeliveries to fetch.
     */
    orderBy?: ConsumerDeliveryOrderByWithRelationInput | ConsumerDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ConsumerDeliveries.
     */
    cursor?: ConsumerDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ConsumerDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ConsumerDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ConsumerDeliveries.
     */
    distinct?: ConsumerDeliveryScalarFieldEnum | ConsumerDeliveryScalarFieldEnum[]
  }

  /**
   * ConsumerDelivery findFirstOrThrow
   */
  export type ConsumerDeliveryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter, which ConsumerDelivery to fetch.
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ConsumerDeliveries to fetch.
     */
    orderBy?: ConsumerDeliveryOrderByWithRelationInput | ConsumerDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for ConsumerDeliveries.
     */
    cursor?: ConsumerDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ConsumerDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ConsumerDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ConsumerDeliveries.
     */
    distinct?: ConsumerDeliveryScalarFieldEnum | ConsumerDeliveryScalarFieldEnum[]
  }

  /**
   * ConsumerDelivery findMany
   */
  export type ConsumerDeliveryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter, which ConsumerDeliveries to fetch.
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of ConsumerDeliveries to fetch.
     */
    orderBy?: ConsumerDeliveryOrderByWithRelationInput | ConsumerDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing ConsumerDeliveries.
     */
    cursor?: ConsumerDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` ConsumerDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` ConsumerDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of ConsumerDeliveries.
     */
    distinct?: ConsumerDeliveryScalarFieldEnum | ConsumerDeliveryScalarFieldEnum[]
  }

  /**
   * ConsumerDelivery create
   */
  export type ConsumerDeliveryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * The data needed to create a ConsumerDelivery.
     */
    data: XOR<ConsumerDeliveryCreateInput, ConsumerDeliveryUncheckedCreateInput>
  }

  /**
   * ConsumerDelivery createMany
   */
  export type ConsumerDeliveryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ConsumerDeliveries.
     */
    data: ConsumerDeliveryCreateManyInput | ConsumerDeliveryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConsumerDelivery createManyAndReturn
   */
  export type ConsumerDeliveryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * The data used to create many ConsumerDeliveries.
     */
    data: ConsumerDeliveryCreateManyInput | ConsumerDeliveryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ConsumerDelivery update
   */
  export type ConsumerDeliveryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * The data needed to update a ConsumerDelivery.
     */
    data: XOR<ConsumerDeliveryUpdateInput, ConsumerDeliveryUncheckedUpdateInput>
    /**
     * Choose, which ConsumerDelivery to update.
     */
    where: ConsumerDeliveryWhereUniqueInput
  }

  /**
   * ConsumerDelivery updateMany
   */
  export type ConsumerDeliveryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ConsumerDeliveries.
     */
    data: XOR<ConsumerDeliveryUpdateManyMutationInput, ConsumerDeliveryUncheckedUpdateManyInput>
    /**
     * Filter which ConsumerDeliveries to update
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * Limit how many ConsumerDeliveries to update.
     */
    limit?: number
  }

  /**
   * ConsumerDelivery updateManyAndReturn
   */
  export type ConsumerDeliveryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * The data used to update ConsumerDeliveries.
     */
    data: XOR<ConsumerDeliveryUpdateManyMutationInput, ConsumerDeliveryUncheckedUpdateManyInput>
    /**
     * Filter which ConsumerDeliveries to update
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * Limit how many ConsumerDeliveries to update.
     */
    limit?: number
  }

  /**
   * ConsumerDelivery upsert
   */
  export type ConsumerDeliveryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * The filter to search for the ConsumerDelivery to update in case it exists.
     */
    where: ConsumerDeliveryWhereUniqueInput
    /**
     * In case the ConsumerDelivery found by the `where` argument doesn't exist, create a new ConsumerDelivery with this data.
     */
    create: XOR<ConsumerDeliveryCreateInput, ConsumerDeliveryUncheckedCreateInput>
    /**
     * In case the ConsumerDelivery was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ConsumerDeliveryUpdateInput, ConsumerDeliveryUncheckedUpdateInput>
  }

  /**
   * ConsumerDelivery delete
   */
  export type ConsumerDeliveryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
    /**
     * Filter which ConsumerDelivery to delete.
     */
    where: ConsumerDeliveryWhereUniqueInput
  }

  /**
   * ConsumerDelivery deleteMany
   */
  export type ConsumerDeliveryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ConsumerDeliveries to delete
     */
    where?: ConsumerDeliveryWhereInput
    /**
     * Limit how many ConsumerDeliveries to delete.
     */
    limit?: number
  }

  /**
   * ConsumerDelivery without action
   */
  export type ConsumerDeliveryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ConsumerDelivery
     */
    select?: ConsumerDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the ConsumerDelivery
     */
    omit?: ConsumerDeliveryOmit<ExtArgs> | null
  }


  /**
   * Model NotificationDelivery
   */

  export type AggregateNotificationDelivery = {
    _count: NotificationDeliveryCountAggregateOutputType | null
    _avg: NotificationDeliveryAvgAggregateOutputType | null
    _sum: NotificationDeliverySumAggregateOutputType | null
    _min: NotificationDeliveryMinAggregateOutputType | null
    _max: NotificationDeliveryMaxAggregateOutputType | null
  }

  export type NotificationDeliveryAvgAggregateOutputType = {
    attemptCount: number | null
  }

  export type NotificationDeliverySumAggregateOutputType = {
    attemptCount: number | null
  }

  export type NotificationDeliveryMinAggregateOutputType = {
    id: string | null
    notificationId: string | null
    channel: $Enums.NotificationChannel | null
    status: $Enums.NotificationDeliveryStatus | null
    attemptCount: number | null
    nextAttemptAt: Date | null
    claimToken: string | null
    claimExpiresAt: Date | null
    providerMessageId: string | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
    sentAt: Date | null
  }

  export type NotificationDeliveryMaxAggregateOutputType = {
    id: string | null
    notificationId: string | null
    channel: $Enums.NotificationChannel | null
    status: $Enums.NotificationDeliveryStatus | null
    attemptCount: number | null
    nextAttemptAt: Date | null
    claimToken: string | null
    claimExpiresAt: Date | null
    providerMessageId: string | null
    lastError: string | null
    createdAt: Date | null
    updatedAt: Date | null
    sentAt: Date | null
  }

  export type NotificationDeliveryCountAggregateOutputType = {
    id: number
    notificationId: number
    channel: number
    status: number
    attemptCount: number
    nextAttemptAt: number
    claimToken: number
    claimExpiresAt: number
    providerMessageId: number
    lastError: number
    createdAt: number
    updatedAt: number
    sentAt: number
    _all: number
  }


  export type NotificationDeliveryAvgAggregateInputType = {
    attemptCount?: true
  }

  export type NotificationDeliverySumAggregateInputType = {
    attemptCount?: true
  }

  export type NotificationDeliveryMinAggregateInputType = {
    id?: true
    notificationId?: true
    channel?: true
    status?: true
    attemptCount?: true
    nextAttemptAt?: true
    claimToken?: true
    claimExpiresAt?: true
    providerMessageId?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    sentAt?: true
  }

  export type NotificationDeliveryMaxAggregateInputType = {
    id?: true
    notificationId?: true
    channel?: true
    status?: true
    attemptCount?: true
    nextAttemptAt?: true
    claimToken?: true
    claimExpiresAt?: true
    providerMessageId?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    sentAt?: true
  }

  export type NotificationDeliveryCountAggregateInputType = {
    id?: true
    notificationId?: true
    channel?: true
    status?: true
    attemptCount?: true
    nextAttemptAt?: true
    claimToken?: true
    claimExpiresAt?: true
    providerMessageId?: true
    lastError?: true
    createdAt?: true
    updatedAt?: true
    sentAt?: true
    _all?: true
  }

  export type NotificationDeliveryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationDelivery to aggregate.
     */
    where?: NotificationDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotificationDeliveries to fetch.
     */
    orderBy?: NotificationDeliveryOrderByWithRelationInput | NotificationDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: NotificationDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotificationDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotificationDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned NotificationDeliveries
    **/
    _count?: true | NotificationDeliveryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
    **/
    _avg?: NotificationDeliveryAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
    **/
    _sum?: NotificationDeliverySumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: NotificationDeliveryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: NotificationDeliveryMaxAggregateInputType
  }

  export type GetNotificationDeliveryAggregateType<T extends NotificationDeliveryAggregateArgs> = {
        [P in keyof T & keyof AggregateNotificationDelivery]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotificationDelivery[P]>
      : GetScalarType<T[P], AggregateNotificationDelivery[P]>
  }




  export type NotificationDeliveryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationDeliveryWhereInput
    orderBy?: NotificationDeliveryOrderByWithAggregationInput | NotificationDeliveryOrderByWithAggregationInput[]
    by: NotificationDeliveryScalarFieldEnum[] | NotificationDeliveryScalarFieldEnum
    having?: NotificationDeliveryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationDeliveryCountAggregateInputType | true
    _avg?: NotificationDeliveryAvgAggregateInputType
    _sum?: NotificationDeliverySumAggregateInputType
    _min?: NotificationDeliveryMinAggregateInputType
    _max?: NotificationDeliveryMaxAggregateInputType
  }

  export type NotificationDeliveryGroupByOutputType = {
    id: string
    notificationId: string
    channel: $Enums.NotificationChannel
    status: $Enums.NotificationDeliveryStatus
    attemptCount: number
    nextAttemptAt: Date
    claimToken: string | null
    claimExpiresAt: Date | null
    providerMessageId: string | null
    lastError: string | null
    createdAt: Date
    updatedAt: Date
    sentAt: Date | null
    _count: NotificationDeliveryCountAggregateOutputType | null
    _avg: NotificationDeliveryAvgAggregateOutputType | null
    _sum: NotificationDeliverySumAggregateOutputType | null
    _min: NotificationDeliveryMinAggregateOutputType | null
    _max: NotificationDeliveryMaxAggregateOutputType | null
  }

  type GetNotificationDeliveryGroupByPayload<T extends NotificationDeliveryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationDeliveryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationDeliveryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationDeliveryGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationDeliveryGroupByOutputType[P]>
        }
      >
    >


  export type NotificationDeliverySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    notificationId?: boolean
    channel?: boolean
    status?: boolean
    attemptCount?: boolean
    nextAttemptAt?: boolean
    claimToken?: boolean
    claimExpiresAt?: boolean
    providerMessageId?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sentAt?: boolean
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationDelivery"]>

  export type NotificationDeliverySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    notificationId?: boolean
    channel?: boolean
    status?: boolean
    attemptCount?: boolean
    nextAttemptAt?: boolean
    claimToken?: boolean
    claimExpiresAt?: boolean
    providerMessageId?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sentAt?: boolean
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationDelivery"]>

  export type NotificationDeliverySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    notificationId?: boolean
    channel?: boolean
    status?: boolean
    attemptCount?: boolean
    nextAttemptAt?: boolean
    claimToken?: boolean
    claimExpiresAt?: boolean
    providerMessageId?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sentAt?: boolean
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notificationDelivery"]>

  export type NotificationDeliverySelectScalar = {
    id?: boolean
    notificationId?: boolean
    channel?: boolean
    status?: boolean
    attemptCount?: boolean
    nextAttemptAt?: boolean
    claimToken?: boolean
    claimExpiresAt?: boolean
    providerMessageId?: boolean
    lastError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    sentAt?: boolean
  }

  export type NotificationDeliveryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "notificationId" | "channel" | "status" | "attemptCount" | "nextAttemptAt" | "claimToken" | "claimExpiresAt" | "providerMessageId" | "lastError" | "createdAt" | "updatedAt" | "sentAt", ExtArgs["result"]["notificationDelivery"]>
  export type NotificationDeliveryInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }
  export type NotificationDeliveryIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }
  export type NotificationDeliveryIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    notification?: boolean | NotificationDefaultArgs<ExtArgs>
  }

  export type $NotificationDeliveryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "NotificationDelivery"
    objects: {
      notification: Prisma.$NotificationPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      notificationId: string
      channel: $Enums.NotificationChannel
      status: $Enums.NotificationDeliveryStatus
      attemptCount: number
      nextAttemptAt: Date
      claimToken: string | null
      claimExpiresAt: Date | null
      providerMessageId: string | null
      lastError: string | null
      createdAt: Date
      updatedAt: Date
      sentAt: Date | null
    }, ExtArgs["result"]["notificationDelivery"]>
    composites: {}
  }

  type NotificationDeliveryGetPayload<S extends boolean | null | undefined | NotificationDeliveryDefaultArgs> = $Result.GetResult<Prisma.$NotificationDeliveryPayload, S>

  type NotificationDeliveryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationDeliveryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationDeliveryCountAggregateInputType | true
    }

  export interface NotificationDeliveryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['NotificationDelivery'], meta: { name: 'NotificationDelivery' } }
    /**
     * Find zero or one NotificationDelivery that matches the filter.
     * @param {NotificationDeliveryFindUniqueArgs} args - Arguments to find a NotificationDelivery
     * @example
     * // Get one NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationDeliveryFindUniqueArgs>(args: SelectSubset<T, NotificationDeliveryFindUniqueArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one NotificationDelivery that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationDeliveryFindUniqueOrThrowArgs} args - Arguments to find a NotificationDelivery
     * @example
     * // Get one NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationDeliveryFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationDeliveryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationDelivery that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryFindFirstArgs} args - Arguments to find a NotificationDelivery
     * @example
     * // Get one NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationDeliveryFindFirstArgs>(args?: SelectSubset<T, NotificationDeliveryFindFirstArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first NotificationDelivery that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryFindFirstOrThrowArgs} args - Arguments to find a NotificationDelivery
     * @example
     * // Get one NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationDeliveryFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationDeliveryFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more NotificationDeliveries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all NotificationDeliveries
     * const notificationDeliveries = await prisma.notificationDelivery.findMany()
     *
     * // Get first 10 NotificationDeliveries
     * const notificationDeliveries = await prisma.notificationDelivery.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const notificationDeliveryWithIdOnly = await prisma.notificationDelivery.findMany({ select: { id: true } })
     *
     */
    findMany<T extends NotificationDeliveryFindManyArgs>(args?: SelectSubset<T, NotificationDeliveryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a NotificationDelivery.
     * @param {NotificationDeliveryCreateArgs} args - Arguments to create a NotificationDelivery.
     * @example
     * // Create one NotificationDelivery
     * const NotificationDelivery = await prisma.notificationDelivery.create({
     *   data: {
     *     // ... data to create a NotificationDelivery
     *   }
     * })
     *
     */
    create<T extends NotificationDeliveryCreateArgs>(args: SelectSubset<T, NotificationDeliveryCreateArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many NotificationDeliveries.
     * @param {NotificationDeliveryCreateManyArgs} args - Arguments to create many NotificationDeliveries.
     * @example
     * // Create many NotificationDeliveries
     * const notificationDelivery = await prisma.notificationDelivery.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends NotificationDeliveryCreateManyArgs>(args?: SelectSubset<T, NotificationDeliveryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many NotificationDeliveries and returns the data saved in the database.
     * @param {NotificationDeliveryCreateManyAndReturnArgs} args - Arguments to create many NotificationDeliveries.
     * @example
     * // Create many NotificationDeliveries
     * const notificationDelivery = await prisma.notificationDelivery.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many NotificationDeliveries and only return the `id`
     * const notificationDeliveryWithIdOnly = await prisma.notificationDelivery.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends NotificationDeliveryCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationDeliveryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a NotificationDelivery.
     * @param {NotificationDeliveryDeleteArgs} args - Arguments to delete one NotificationDelivery.
     * @example
     * // Delete one NotificationDelivery
     * const NotificationDelivery = await prisma.notificationDelivery.delete({
     *   where: {
     *     // ... filter to delete one NotificationDelivery
     *   }
     * })
     *
     */
    delete<T extends NotificationDeliveryDeleteArgs>(args: SelectSubset<T, NotificationDeliveryDeleteArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one NotificationDelivery.
     * @param {NotificationDeliveryUpdateArgs} args - Arguments to update one NotificationDelivery.
     * @example
     * // Update one NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends NotificationDeliveryUpdateArgs>(args: SelectSubset<T, NotificationDeliveryUpdateArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more NotificationDeliveries.
     * @param {NotificationDeliveryDeleteManyArgs} args - Arguments to filter NotificationDeliveries to delete.
     * @example
     * // Delete a few NotificationDeliveries
     * const { count } = await prisma.notificationDelivery.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends NotificationDeliveryDeleteManyArgs>(args?: SelectSubset<T, NotificationDeliveryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many NotificationDeliveries
     * const notificationDelivery = await prisma.notificationDelivery.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends NotificationDeliveryUpdateManyArgs>(args: SelectSubset<T, NotificationDeliveryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more NotificationDeliveries and returns the data updated in the database.
     * @param {NotificationDeliveryUpdateManyAndReturnArgs} args - Arguments to update many NotificationDeliveries.
     * @example
     * // Update many NotificationDeliveries
     * const notificationDelivery = await prisma.notificationDelivery.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more NotificationDeliveries and only return the `id`
     * const notificationDeliveryWithIdOnly = await prisma.notificationDelivery.updateManyAndReturn({
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
    updateManyAndReturn<T extends NotificationDeliveryUpdateManyAndReturnArgs>(args: SelectSubset<T, NotificationDeliveryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one NotificationDelivery.
     * @param {NotificationDeliveryUpsertArgs} args - Arguments to update or create a NotificationDelivery.
     * @example
     * // Update or create a NotificationDelivery
     * const notificationDelivery = await prisma.notificationDelivery.upsert({
     *   create: {
     *     // ... data to create a NotificationDelivery
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the NotificationDelivery we want to update
     *   }
     * })
     */
    upsert<T extends NotificationDeliveryUpsertArgs>(args: SelectSubset<T, NotificationDeliveryUpsertArgs<ExtArgs>>): Prisma__NotificationDeliveryClient<$Result.GetResult<Prisma.$NotificationDeliveryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of NotificationDeliveries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryCountArgs} args - Arguments to filter NotificationDeliveries to count.
     * @example
     * // Count the number of NotificationDeliveries
     * const count = await prisma.notificationDelivery.count({
     *   where: {
     *     // ... the filter for the NotificationDeliveries we want to count
     *   }
     * })
    **/
    count<T extends NotificationDeliveryCountArgs>(
      args?: Subset<T, NotificationDeliveryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationDeliveryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a NotificationDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends NotificationDeliveryAggregateArgs>(args: Subset<T, NotificationDeliveryAggregateArgs>): Prisma.PrismaPromise<GetNotificationDeliveryAggregateType<T>>

    /**
     * Group by NotificationDelivery.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationDeliveryGroupByArgs} args - Group by arguments.
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
      T extends NotificationDeliveryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationDeliveryGroupByArgs['orderBy'] }
        : { orderBy?: NotificationDeliveryGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, NotificationDeliveryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationDeliveryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the NotificationDelivery model
   */
  readonly fields: NotificationDeliveryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for NotificationDelivery.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationDeliveryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    notification<T extends NotificationDefaultArgs<ExtArgs> = {}>(args?: Subset<T, NotificationDefaultArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
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
   * Fields of the NotificationDelivery model
   */
  interface NotificationDeliveryFieldRefs {
    readonly id: FieldRef<"NotificationDelivery", 'String'>
    readonly notificationId: FieldRef<"NotificationDelivery", 'String'>
    readonly channel: FieldRef<"NotificationDelivery", 'NotificationChannel'>
    readonly status: FieldRef<"NotificationDelivery", 'NotificationDeliveryStatus'>
    readonly attemptCount: FieldRef<"NotificationDelivery", 'Int'>
    readonly nextAttemptAt: FieldRef<"NotificationDelivery", 'DateTime'>
    readonly claimToken: FieldRef<"NotificationDelivery", 'String'>
    readonly claimExpiresAt: FieldRef<"NotificationDelivery", 'DateTime'>
    readonly providerMessageId: FieldRef<"NotificationDelivery", 'String'>
    readonly lastError: FieldRef<"NotificationDelivery", 'String'>
    readonly createdAt: FieldRef<"NotificationDelivery", 'DateTime'>
    readonly updatedAt: FieldRef<"NotificationDelivery", 'DateTime'>
    readonly sentAt: FieldRef<"NotificationDelivery", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * NotificationDelivery findUnique
   */
  export type NotificationDeliveryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which NotificationDelivery to fetch.
     */
    where: NotificationDeliveryWhereUniqueInput
  }

  /**
   * NotificationDelivery findUniqueOrThrow
   */
  export type NotificationDeliveryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which NotificationDelivery to fetch.
     */
    where: NotificationDeliveryWhereUniqueInput
  }

  /**
   * NotificationDelivery findFirst
   */
  export type NotificationDeliveryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which NotificationDelivery to fetch.
     */
    where?: NotificationDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotificationDeliveries to fetch.
     */
    orderBy?: NotificationDeliveryOrderByWithRelationInput | NotificationDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NotificationDeliveries.
     */
    cursor?: NotificationDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotificationDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotificationDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NotificationDeliveries.
     */
    distinct?: NotificationDeliveryScalarFieldEnum | NotificationDeliveryScalarFieldEnum[]
  }

  /**
   * NotificationDelivery findFirstOrThrow
   */
  export type NotificationDeliveryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which NotificationDelivery to fetch.
     */
    where?: NotificationDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotificationDeliveries to fetch.
     */
    orderBy?: NotificationDeliveryOrderByWithRelationInput | NotificationDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for NotificationDeliveries.
     */
    cursor?: NotificationDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotificationDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotificationDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NotificationDeliveries.
     */
    distinct?: NotificationDeliveryScalarFieldEnum | NotificationDeliveryScalarFieldEnum[]
  }

  /**
   * NotificationDelivery findMany
   */
  export type NotificationDeliveryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter, which NotificationDeliveries to fetch.
     */
    where?: NotificationDeliveryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of NotificationDeliveries to fetch.
     */
    orderBy?: NotificationDeliveryOrderByWithRelationInput | NotificationDeliveryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing NotificationDeliveries.
     */
    cursor?: NotificationDeliveryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` NotificationDeliveries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` NotificationDeliveries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of NotificationDeliveries.
     */
    distinct?: NotificationDeliveryScalarFieldEnum | NotificationDeliveryScalarFieldEnum[]
  }

  /**
   * NotificationDelivery create
   */
  export type NotificationDeliveryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * The data needed to create a NotificationDelivery.
     */
    data: XOR<NotificationDeliveryCreateInput, NotificationDeliveryUncheckedCreateInput>
  }

  /**
   * NotificationDelivery createMany
   */
  export type NotificationDeliveryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many NotificationDeliveries.
     */
    data: NotificationDeliveryCreateManyInput | NotificationDeliveryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * NotificationDelivery createManyAndReturn
   */
  export type NotificationDeliveryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * The data used to create many NotificationDeliveries.
     */
    data: NotificationDeliveryCreateManyInput | NotificationDeliveryCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * NotificationDelivery update
   */
  export type NotificationDeliveryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * The data needed to update a NotificationDelivery.
     */
    data: XOR<NotificationDeliveryUpdateInput, NotificationDeliveryUncheckedUpdateInput>
    /**
     * Choose, which NotificationDelivery to update.
     */
    where: NotificationDeliveryWhereUniqueInput
  }

  /**
   * NotificationDelivery updateMany
   */
  export type NotificationDeliveryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update NotificationDeliveries.
     */
    data: XOR<NotificationDeliveryUpdateManyMutationInput, NotificationDeliveryUncheckedUpdateManyInput>
    /**
     * Filter which NotificationDeliveries to update
     */
    where?: NotificationDeliveryWhereInput
    /**
     * Limit how many NotificationDeliveries to update.
     */
    limit?: number
  }

  /**
   * NotificationDelivery updateManyAndReturn
   */
  export type NotificationDeliveryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * The data used to update NotificationDeliveries.
     */
    data: XOR<NotificationDeliveryUpdateManyMutationInput, NotificationDeliveryUncheckedUpdateManyInput>
    /**
     * Filter which NotificationDeliveries to update
     */
    where?: NotificationDeliveryWhereInput
    /**
     * Limit how many NotificationDeliveries to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * NotificationDelivery upsert
   */
  export type NotificationDeliveryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * The filter to search for the NotificationDelivery to update in case it exists.
     */
    where: NotificationDeliveryWhereUniqueInput
    /**
     * In case the NotificationDelivery found by the `where` argument doesn't exist, create a new NotificationDelivery with this data.
     */
    create: XOR<NotificationDeliveryCreateInput, NotificationDeliveryUncheckedCreateInput>
    /**
     * In case the NotificationDelivery was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationDeliveryUpdateInput, NotificationDeliveryUncheckedUpdateInput>
  }

  /**
   * NotificationDelivery delete
   */
  export type NotificationDeliveryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
    /**
     * Filter which NotificationDelivery to delete.
     */
    where: NotificationDeliveryWhereUniqueInput
  }

  /**
   * NotificationDelivery deleteMany
   */
  export type NotificationDeliveryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which NotificationDeliveries to delete
     */
    where?: NotificationDeliveryWhereInput
    /**
     * Limit how many NotificationDeliveries to delete.
     */
    limit?: number
  }

  /**
   * NotificationDelivery without action
   */
  export type NotificationDeliveryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the NotificationDelivery
     */
    select?: NotificationDeliverySelect<ExtArgs> | null
    /**
     * Omit specific fields from the NotificationDelivery
     */
    omit?: NotificationDeliveryOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationDeliveryInclude<ExtArgs> | null
  }


  /**
   * Model FakeEmailReceipt
   */

  export type AggregateFakeEmailReceipt = {
    _count: FakeEmailReceiptCountAggregateOutputType | null
    _min: FakeEmailReceiptMinAggregateOutputType | null
    _max: FakeEmailReceiptMaxAggregateOutputType | null
  }

  export type FakeEmailReceiptMinAggregateOutputType = {
    deliveryKey: string | null
    fingerprint: string | null
    messageId: string | null
    createdAt: Date | null
  }

  export type FakeEmailReceiptMaxAggregateOutputType = {
    deliveryKey: string | null
    fingerprint: string | null
    messageId: string | null
    createdAt: Date | null
  }

  export type FakeEmailReceiptCountAggregateOutputType = {
    deliveryKey: number
    fingerprint: number
    messageId: number
    createdAt: number
    _all: number
  }


  export type FakeEmailReceiptMinAggregateInputType = {
    deliveryKey?: true
    fingerprint?: true
    messageId?: true
    createdAt?: true
  }

  export type FakeEmailReceiptMaxAggregateInputType = {
    deliveryKey?: true
    fingerprint?: true
    messageId?: true
    createdAt?: true
  }

  export type FakeEmailReceiptCountAggregateInputType = {
    deliveryKey?: true
    fingerprint?: true
    messageId?: true
    createdAt?: true
    _all?: true
  }

  export type FakeEmailReceiptAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FakeEmailReceipt to aggregate.
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of FakeEmailReceipts to fetch.
     */
    orderBy?: FakeEmailReceiptOrderByWithRelationInput | FakeEmailReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: FakeEmailReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` FakeEmailReceipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` FakeEmailReceipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned FakeEmailReceipts
    **/
    _count?: true | FakeEmailReceiptCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
    **/
    _min?: FakeEmailReceiptMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
    **/
    _max?: FakeEmailReceiptMaxAggregateInputType
  }

  export type GetFakeEmailReceiptAggregateType<T extends FakeEmailReceiptAggregateArgs> = {
        [P in keyof T & keyof AggregateFakeEmailReceipt]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFakeEmailReceipt[P]>
      : GetScalarType<T[P], AggregateFakeEmailReceipt[P]>
  }




  export type FakeEmailReceiptGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FakeEmailReceiptWhereInput
    orderBy?: FakeEmailReceiptOrderByWithAggregationInput | FakeEmailReceiptOrderByWithAggregationInput[]
    by: FakeEmailReceiptScalarFieldEnum[] | FakeEmailReceiptScalarFieldEnum
    having?: FakeEmailReceiptScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FakeEmailReceiptCountAggregateInputType | true
    _min?: FakeEmailReceiptMinAggregateInputType
    _max?: FakeEmailReceiptMaxAggregateInputType
  }

  export type FakeEmailReceiptGroupByOutputType = {
    deliveryKey: string
    fingerprint: string
    messageId: string
    createdAt: Date
    _count: FakeEmailReceiptCountAggregateOutputType | null
    _min: FakeEmailReceiptMinAggregateOutputType | null
    _max: FakeEmailReceiptMaxAggregateOutputType | null
  }

  type GetFakeEmailReceiptGroupByPayload<T extends FakeEmailReceiptGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FakeEmailReceiptGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FakeEmailReceiptGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FakeEmailReceiptGroupByOutputType[P]>
            : GetScalarType<T[P], FakeEmailReceiptGroupByOutputType[P]>
        }
      >
    >


  export type FakeEmailReceiptSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deliveryKey?: boolean
    fingerprint?: boolean
    messageId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeEmailReceipt"]>

  export type FakeEmailReceiptSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deliveryKey?: boolean
    fingerprint?: boolean
    messageId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeEmailReceipt"]>

  export type FakeEmailReceiptSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    deliveryKey?: boolean
    fingerprint?: boolean
    messageId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["fakeEmailReceipt"]>

  export type FakeEmailReceiptSelectScalar = {
    deliveryKey?: boolean
    fingerprint?: boolean
    messageId?: boolean
    createdAt?: boolean
  }

  export type FakeEmailReceiptOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"deliveryKey" | "fingerprint" | "messageId" | "createdAt", ExtArgs["result"]["fakeEmailReceipt"]>

  export type $FakeEmailReceiptPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "FakeEmailReceipt"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      deliveryKey: string
      fingerprint: string
      messageId: string
      createdAt: Date
    }, ExtArgs["result"]["fakeEmailReceipt"]>
    composites: {}
  }

  type FakeEmailReceiptGetPayload<S extends boolean | null | undefined | FakeEmailReceiptDefaultArgs> = $Result.GetResult<Prisma.$FakeEmailReceiptPayload, S>

  type FakeEmailReceiptCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FakeEmailReceiptFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FakeEmailReceiptCountAggregateInputType | true
    }

  export interface FakeEmailReceiptDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['FakeEmailReceipt'], meta: { name: 'FakeEmailReceipt' } }
    /**
     * Find zero or one FakeEmailReceipt that matches the filter.
     * @param {FakeEmailReceiptFindUniqueArgs} args - Arguments to find a FakeEmailReceipt
     * @example
     * // Get one FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FakeEmailReceiptFindUniqueArgs>(args: SelectSubset<T, FakeEmailReceiptFindUniqueArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one FakeEmailReceipt that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FakeEmailReceiptFindUniqueOrThrowArgs} args - Arguments to find a FakeEmailReceipt
     * @example
     * // Get one FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FakeEmailReceiptFindUniqueOrThrowArgs>(args: SelectSubset<T, FakeEmailReceiptFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FakeEmailReceipt that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptFindFirstArgs} args - Arguments to find a FakeEmailReceipt
     * @example
     * // Get one FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FakeEmailReceiptFindFirstArgs>(args?: SelectSubset<T, FakeEmailReceiptFindFirstArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first FakeEmailReceipt that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptFindFirstOrThrowArgs} args - Arguments to find a FakeEmailReceipt
     * @example
     * // Get one FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FakeEmailReceiptFindFirstOrThrowArgs>(args?: SelectSubset<T, FakeEmailReceiptFindFirstOrThrowArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more FakeEmailReceipts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all FakeEmailReceipts
     * const fakeEmailReceipts = await prisma.fakeEmailReceipt.findMany()
     *
     * // Get first 10 FakeEmailReceipts
     * const fakeEmailReceipts = await prisma.fakeEmailReceipt.findMany({ take: 10 })
     *
     * // Only select the `deliveryKey`
     * const fakeEmailReceiptWithDeliveryKeyOnly = await prisma.fakeEmailReceipt.findMany({ select: { deliveryKey: true } })
     *
     */
    findMany<T extends FakeEmailReceiptFindManyArgs>(args?: SelectSubset<T, FakeEmailReceiptFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a FakeEmailReceipt.
     * @param {FakeEmailReceiptCreateArgs} args - Arguments to create a FakeEmailReceipt.
     * @example
     * // Create one FakeEmailReceipt
     * const FakeEmailReceipt = await prisma.fakeEmailReceipt.create({
     *   data: {
     *     // ... data to create a FakeEmailReceipt
     *   }
     * })
     *
     */
    create<T extends FakeEmailReceiptCreateArgs>(args: SelectSubset<T, FakeEmailReceiptCreateArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many FakeEmailReceipts.
     * @param {FakeEmailReceiptCreateManyArgs} args - Arguments to create many FakeEmailReceipts.
     * @example
     * // Create many FakeEmailReceipts
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends FakeEmailReceiptCreateManyArgs>(args?: SelectSubset<T, FakeEmailReceiptCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many FakeEmailReceipts and returns the data saved in the database.
     * @param {FakeEmailReceiptCreateManyAndReturnArgs} args - Arguments to create many FakeEmailReceipts.
     * @example
     * // Create many FakeEmailReceipts
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Create many FakeEmailReceipts and only return the `deliveryKey`
     * const fakeEmailReceiptWithDeliveryKeyOnly = await prisma.fakeEmailReceipt.createManyAndReturn({
     *   select: { deliveryKey: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     *
     */
    createManyAndReturn<T extends FakeEmailReceiptCreateManyAndReturnArgs>(args?: SelectSubset<T, FakeEmailReceiptCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a FakeEmailReceipt.
     * @param {FakeEmailReceiptDeleteArgs} args - Arguments to delete one FakeEmailReceipt.
     * @example
     * // Delete one FakeEmailReceipt
     * const FakeEmailReceipt = await prisma.fakeEmailReceipt.delete({
     *   where: {
     *     // ... filter to delete one FakeEmailReceipt
     *   }
     * })
     *
     */
    delete<T extends FakeEmailReceiptDeleteArgs>(args: SelectSubset<T, FakeEmailReceiptDeleteArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one FakeEmailReceipt.
     * @param {FakeEmailReceiptUpdateArgs} args - Arguments to update one FakeEmailReceipt.
     * @example
     * // Update one FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends FakeEmailReceiptUpdateArgs>(args: SelectSubset<T, FakeEmailReceiptUpdateArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more FakeEmailReceipts.
     * @param {FakeEmailReceiptDeleteManyArgs} args - Arguments to filter FakeEmailReceipts to delete.
     * @example
     * // Delete a few FakeEmailReceipts
     * const { count } = await prisma.fakeEmailReceipt.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends FakeEmailReceiptDeleteManyArgs>(args?: SelectSubset<T, FakeEmailReceiptDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FakeEmailReceipts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many FakeEmailReceipts
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends FakeEmailReceiptUpdateManyArgs>(args: SelectSubset<T, FakeEmailReceiptUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more FakeEmailReceipts and returns the data updated in the database.
     * @param {FakeEmailReceiptUpdateManyAndReturnArgs} args - Arguments to update many FakeEmailReceipts.
     * @example
     * // Update many FakeEmailReceipts
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     * // Update zero or more FakeEmailReceipts and only return the `deliveryKey`
     * const fakeEmailReceiptWithDeliveryKeyOnly = await prisma.fakeEmailReceipt.updateManyAndReturn({
     *   select: { deliveryKey: true },
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
    updateManyAndReturn<T extends FakeEmailReceiptUpdateManyAndReturnArgs>(args: SelectSubset<T, FakeEmailReceiptUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one FakeEmailReceipt.
     * @param {FakeEmailReceiptUpsertArgs} args - Arguments to update or create a FakeEmailReceipt.
     * @example
     * // Update or create a FakeEmailReceipt
     * const fakeEmailReceipt = await prisma.fakeEmailReceipt.upsert({
     *   create: {
     *     // ... data to create a FakeEmailReceipt
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the FakeEmailReceipt we want to update
     *   }
     * })
     */
    upsert<T extends FakeEmailReceiptUpsertArgs>(args: SelectSubset<T, FakeEmailReceiptUpsertArgs<ExtArgs>>): Prisma__FakeEmailReceiptClient<$Result.GetResult<Prisma.$FakeEmailReceiptPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of FakeEmailReceipts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptCountArgs} args - Arguments to filter FakeEmailReceipts to count.
     * @example
     * // Count the number of FakeEmailReceipts
     * const count = await prisma.fakeEmailReceipt.count({
     *   where: {
     *     // ... the filter for the FakeEmailReceipts we want to count
     *   }
     * })
    **/
    count<T extends FakeEmailReceiptCountArgs>(
      args?: Subset<T, FakeEmailReceiptCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FakeEmailReceiptCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a FakeEmailReceipt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends FakeEmailReceiptAggregateArgs>(args: Subset<T, FakeEmailReceiptAggregateArgs>): Prisma.PrismaPromise<GetFakeEmailReceiptAggregateType<T>>

    /**
     * Group by FakeEmailReceipt.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FakeEmailReceiptGroupByArgs} args - Group by arguments.
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
      T extends FakeEmailReceiptGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FakeEmailReceiptGroupByArgs['orderBy'] }
        : { orderBy?: FakeEmailReceiptGroupByArgs['orderBy'] },
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
    >(args: SubsetIntersection<T, FakeEmailReceiptGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFakeEmailReceiptGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the FakeEmailReceipt model
   */
  readonly fields: FakeEmailReceiptFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for FakeEmailReceipt.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FakeEmailReceiptClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
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
   * Fields of the FakeEmailReceipt model
   */
  interface FakeEmailReceiptFieldRefs {
    readonly deliveryKey: FieldRef<"FakeEmailReceipt", 'String'>
    readonly fingerprint: FieldRef<"FakeEmailReceipt", 'String'>
    readonly messageId: FieldRef<"FakeEmailReceipt", 'String'>
    readonly createdAt: FieldRef<"FakeEmailReceipt", 'DateTime'>
  }


  // Custom InputTypes
  /**
   * FakeEmailReceipt findUnique
   */
  export type FakeEmailReceiptFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter, which FakeEmailReceipt to fetch.
     */
    where: FakeEmailReceiptWhereUniqueInput
  }

  /**
   * FakeEmailReceipt findUniqueOrThrow
   */
  export type FakeEmailReceiptFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter, which FakeEmailReceipt to fetch.
     */
    where: FakeEmailReceiptWhereUniqueInput
  }

  /**
   * FakeEmailReceipt findFirst
   */
  export type FakeEmailReceiptFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter, which FakeEmailReceipt to fetch.
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of FakeEmailReceipts to fetch.
     */
    orderBy?: FakeEmailReceiptOrderByWithRelationInput | FakeEmailReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for FakeEmailReceipts.
     */
    cursor?: FakeEmailReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` FakeEmailReceipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` FakeEmailReceipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of FakeEmailReceipts.
     */
    distinct?: FakeEmailReceiptScalarFieldEnum | FakeEmailReceiptScalarFieldEnum[]
  }

  /**
   * FakeEmailReceipt findFirstOrThrow
   */
  export type FakeEmailReceiptFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter, which FakeEmailReceipt to fetch.
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of FakeEmailReceipts to fetch.
     */
    orderBy?: FakeEmailReceiptOrderByWithRelationInput | FakeEmailReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for FakeEmailReceipts.
     */
    cursor?: FakeEmailReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` FakeEmailReceipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` FakeEmailReceipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of FakeEmailReceipts.
     */
    distinct?: FakeEmailReceiptScalarFieldEnum | FakeEmailReceiptScalarFieldEnum[]
  }

  /**
   * FakeEmailReceipt findMany
   */
  export type FakeEmailReceiptFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter, which FakeEmailReceipts to fetch.
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of FakeEmailReceipts to fetch.
     */
    orderBy?: FakeEmailReceiptOrderByWithRelationInput | FakeEmailReceiptOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing FakeEmailReceipts.
     */
    cursor?: FakeEmailReceiptWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` FakeEmailReceipts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` FakeEmailReceipts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of FakeEmailReceipts.
     */
    distinct?: FakeEmailReceiptScalarFieldEnum | FakeEmailReceiptScalarFieldEnum[]
  }

  /**
   * FakeEmailReceipt create
   */
  export type FakeEmailReceiptCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * The data needed to create a FakeEmailReceipt.
     */
    data: XOR<FakeEmailReceiptCreateInput, FakeEmailReceiptUncheckedCreateInput>
  }

  /**
   * FakeEmailReceipt createMany
   */
  export type FakeEmailReceiptCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many FakeEmailReceipts.
     */
    data: FakeEmailReceiptCreateManyInput | FakeEmailReceiptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FakeEmailReceipt createManyAndReturn
   */
  export type FakeEmailReceiptCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * The data used to create many FakeEmailReceipts.
     */
    data: FakeEmailReceiptCreateManyInput | FakeEmailReceiptCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * FakeEmailReceipt update
   */
  export type FakeEmailReceiptUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * The data needed to update a FakeEmailReceipt.
     */
    data: XOR<FakeEmailReceiptUpdateInput, FakeEmailReceiptUncheckedUpdateInput>
    /**
     * Choose, which FakeEmailReceipt to update.
     */
    where: FakeEmailReceiptWhereUniqueInput
  }

  /**
   * FakeEmailReceipt updateMany
   */
  export type FakeEmailReceiptUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update FakeEmailReceipts.
     */
    data: XOR<FakeEmailReceiptUpdateManyMutationInput, FakeEmailReceiptUncheckedUpdateManyInput>
    /**
     * Filter which FakeEmailReceipts to update
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * Limit how many FakeEmailReceipts to update.
     */
    limit?: number
  }

  /**
   * FakeEmailReceipt updateManyAndReturn
   */
  export type FakeEmailReceiptUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * The data used to update FakeEmailReceipts.
     */
    data: XOR<FakeEmailReceiptUpdateManyMutationInput, FakeEmailReceiptUncheckedUpdateManyInput>
    /**
     * Filter which FakeEmailReceipts to update
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * Limit how many FakeEmailReceipts to update.
     */
    limit?: number
  }

  /**
   * FakeEmailReceipt upsert
   */
  export type FakeEmailReceiptUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * The filter to search for the FakeEmailReceipt to update in case it exists.
     */
    where: FakeEmailReceiptWhereUniqueInput
    /**
     * In case the FakeEmailReceipt found by the `where` argument doesn't exist, create a new FakeEmailReceipt with this data.
     */
    create: XOR<FakeEmailReceiptCreateInput, FakeEmailReceiptUncheckedCreateInput>
    /**
     * In case the FakeEmailReceipt was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FakeEmailReceiptUpdateInput, FakeEmailReceiptUncheckedUpdateInput>
  }

  /**
   * FakeEmailReceipt delete
   */
  export type FakeEmailReceiptDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
    /**
     * Filter which FakeEmailReceipt to delete.
     */
    where: FakeEmailReceiptWhereUniqueInput
  }

  /**
   * FakeEmailReceipt deleteMany
   */
  export type FakeEmailReceiptDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which FakeEmailReceipts to delete
     */
    where?: FakeEmailReceiptWhereInput
    /**
     * Limit how many FakeEmailReceipts to delete.
     */
    limit?: number
  }

  /**
   * FakeEmailReceipt without action
   */
  export type FakeEmailReceiptDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FakeEmailReceipt
     */
    select?: FakeEmailReceiptSelect<ExtArgs> | null
    /**
     * Omit specific fields from the FakeEmailReceipt
     */
    omit?: FakeEmailReceiptOmit<ExtArgs> | null
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


  export const NotificationScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    type: 'type',
    title: 'title',
    message: 'message',
    isRead: 'isRead',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sourceEventId: 'sourceEventId',
    correlationId: 'correlationId',
    traceparent: 'traceparent'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const CheckoutEventScalarFieldEnum: {
    eventId: 'eventId',
    eventType: 'eventType',
    processedAt: 'processedAt',
    fingerprint: 'fingerprint',
    result: 'result'
  };

  export type CheckoutEventScalarFieldEnum = (typeof CheckoutEventScalarFieldEnum)[keyof typeof CheckoutEventScalarFieldEnum]


  export const ConsumerDeliveryScalarFieldEnum: {
    consumer: 'consumer',
    messageKey: 'messageKey',
    replayCount: 'replayCount',
    attempts: 'attempts',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ConsumerDeliveryScalarFieldEnum = (typeof ConsumerDeliveryScalarFieldEnum)[keyof typeof ConsumerDeliveryScalarFieldEnum]


  export const NotificationDeliveryScalarFieldEnum: {
    id: 'id',
    notificationId: 'notificationId',
    channel: 'channel',
    status: 'status',
    attemptCount: 'attemptCount',
    nextAttemptAt: 'nextAttemptAt',
    claimToken: 'claimToken',
    claimExpiresAt: 'claimExpiresAt',
    providerMessageId: 'providerMessageId',
    lastError: 'lastError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    sentAt: 'sentAt'
  };

  export type NotificationDeliveryScalarFieldEnum = (typeof NotificationDeliveryScalarFieldEnum)[keyof typeof NotificationDeliveryScalarFieldEnum]


  export const FakeEmailReceiptScalarFieldEnum: {
    deliveryKey: 'deliveryKey',
    fingerprint: 'fingerprint',
    messageId: 'messageId',
    createdAt: 'createdAt'
  };

  export type FakeEmailReceiptScalarFieldEnum = (typeof FakeEmailReceiptScalarFieldEnum)[keyof typeof FakeEmailReceiptScalarFieldEnum]


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
   * Reference to a field of type 'NotificationType'
   */
  export type EnumNotificationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationType'>
    


  /**
   * Reference to a field of type 'NotificationType[]'
   */
  export type ListEnumNotificationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationType[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


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
   * Reference to a field of type 'NotificationChannel'
   */
  export type EnumNotificationChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationChannel'>



  /**
   * Reference to a field of type 'NotificationChannel[]'
   */
  export type ListEnumNotificationChannelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationChannel[]'>



  /**
   * Reference to a field of type 'NotificationDeliveryStatus'
   */
  export type EnumNotificationDeliveryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationDeliveryStatus'>



  /**
   * Reference to a field of type 'NotificationDeliveryStatus[]'
   */
  export type ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationDeliveryStatus[]'>



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


  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: StringFilter<"Notification"> | string
    userId?: StringFilter<"Notification"> | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    title?: StringFilter<"Notification"> | string
    message?: StringFilter<"Notification"> | string
    isRead?: BoolFilter<"Notification"> | boolean
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    updatedAt?: DateTimeFilter<"Notification"> | Date | string
    sourceEventId?: StringNullableFilter<"Notification"> | string | null
    correlationId?: StringNullableFilter<"Notification"> | string | null
    traceparent?: StringNullableFilter<"Notification"> | string | null
    deliveries?: NotificationDeliveryListRelationFilter
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sourceEventId?: SortOrderInput | SortOrder
    correlationId?: SortOrderInput | SortOrder
    traceparent?: SortOrderInput | SortOrder
    deliveries?: NotificationDeliveryOrderByRelationAggregateInput
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    sourceEventId?: string
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    userId?: StringFilter<"Notification"> | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    title?: StringFilter<"Notification"> | string
    message?: StringFilter<"Notification"> | string
    isRead?: BoolFilter<"Notification"> | boolean
    createdAt?: DateTimeFilter<"Notification"> | Date | string
    updatedAt?: DateTimeFilter<"Notification"> | Date | string
    correlationId?: StringNullableFilter<"Notification"> | string | null
    traceparent?: StringNullableFilter<"Notification"> | string | null
    deliveries?: NotificationDeliveryListRelationFilter
  }, "id" | "sourceEventId">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sourceEventId?: SortOrderInput | SortOrder
    correlationId?: SortOrderInput | SortOrder
    traceparent?: SortOrderInput | SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Notification"> | string
    userId?: StringWithAggregatesFilter<"Notification"> | string
    type?: EnumNotificationTypeWithAggregatesFilter<"Notification"> | $Enums.NotificationType
    title?: StringWithAggregatesFilter<"Notification"> | string
    message?: StringWithAggregatesFilter<"Notification"> | string
    isRead?: BoolWithAggregatesFilter<"Notification"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
    sourceEventId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    correlationId?: StringNullableWithAggregatesFilter<"Notification"> | string | null
    traceparent?: StringNullableWithAggregatesFilter<"Notification"> | string | null
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

  export type ConsumerDeliveryWhereInput = {
    AND?: ConsumerDeliveryWhereInput | ConsumerDeliveryWhereInput[]
    OR?: ConsumerDeliveryWhereInput[]
    NOT?: ConsumerDeliveryWhereInput | ConsumerDeliveryWhereInput[]
    consumer?: StringFilter<"ConsumerDelivery"> | string
    messageKey?: StringFilter<"ConsumerDelivery"> | string
    replayCount?: IntFilter<"ConsumerDelivery"> | number
    attempts?: IntFilter<"ConsumerDelivery"> | number
    createdAt?: DateTimeFilter<"ConsumerDelivery"> | Date | string
    updatedAt?: DateTimeFilter<"ConsumerDelivery"> | Date | string
  }

  export type ConsumerDeliveryOrderByWithRelationInput = {
    consumer?: SortOrder
    messageKey?: SortOrder
    replayCount?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsumerDeliveryWhereUniqueInput = Prisma.AtLeast<{
    consumer_messageKey_replayCount?: ConsumerDeliveryConsumerMessageKeyReplayCountCompoundUniqueInput
    AND?: ConsumerDeliveryWhereInput | ConsumerDeliveryWhereInput[]
    OR?: ConsumerDeliveryWhereInput[]
    NOT?: ConsumerDeliveryWhereInput | ConsumerDeliveryWhereInput[]
    consumer?: StringFilter<"ConsumerDelivery"> | string
    messageKey?: StringFilter<"ConsumerDelivery"> | string
    replayCount?: IntFilter<"ConsumerDelivery"> | number
    attempts?: IntFilter<"ConsumerDelivery"> | number
    createdAt?: DateTimeFilter<"ConsumerDelivery"> | Date | string
    updatedAt?: DateTimeFilter<"ConsumerDelivery"> | Date | string
  }, "consumer_messageKey_replayCount">

  export type ConsumerDeliveryOrderByWithAggregationInput = {
    consumer?: SortOrder
    messageKey?: SortOrder
    replayCount?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ConsumerDeliveryCountOrderByAggregateInput
    _avg?: ConsumerDeliveryAvgOrderByAggregateInput
    _max?: ConsumerDeliveryMaxOrderByAggregateInput
    _min?: ConsumerDeliveryMinOrderByAggregateInput
    _sum?: ConsumerDeliverySumOrderByAggregateInput
  }

  export type ConsumerDeliveryScalarWhereWithAggregatesInput = {
    AND?: ConsumerDeliveryScalarWhereWithAggregatesInput | ConsumerDeliveryScalarWhereWithAggregatesInput[]
    OR?: ConsumerDeliveryScalarWhereWithAggregatesInput[]
    NOT?: ConsumerDeliveryScalarWhereWithAggregatesInput | ConsumerDeliveryScalarWhereWithAggregatesInput[]
    consumer?: StringWithAggregatesFilter<"ConsumerDelivery"> | string
    messageKey?: StringWithAggregatesFilter<"ConsumerDelivery"> | string
    replayCount?: IntWithAggregatesFilter<"ConsumerDelivery"> | number
    attempts?: IntWithAggregatesFilter<"ConsumerDelivery"> | number
    createdAt?: DateTimeWithAggregatesFilter<"ConsumerDelivery"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ConsumerDelivery"> | Date | string
  }

  export type NotificationDeliveryWhereInput = {
    AND?: NotificationDeliveryWhereInput | NotificationDeliveryWhereInput[]
    OR?: NotificationDeliveryWhereInput[]
    NOT?: NotificationDeliveryWhereInput | NotificationDeliveryWhereInput[]
    id?: StringFilter<"NotificationDelivery"> | string
    notificationId?: StringFilter<"NotificationDelivery"> | string
    channel?: EnumNotificationChannelFilter<"NotificationDelivery"> | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFilter<"NotificationDelivery"> | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFilter<"NotificationDelivery"> | number
    nextAttemptAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    claimToken?: StringNullableFilter<"NotificationDelivery"> | string | null
    claimExpiresAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
    providerMessageId?: StringNullableFilter<"NotificationDelivery"> | string | null
    lastError?: StringNullableFilter<"NotificationDelivery"> | string | null
    createdAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    sentAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
    notification?: XOR<NotificationScalarRelationFilter, NotificationWhereInput>
  }

  export type NotificationDeliveryOrderByWithRelationInput = {
    id?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    nextAttemptAt?: SortOrder
    claimToken?: SortOrderInput | SortOrder
    claimExpiresAt?: SortOrderInput | SortOrder
    providerMessageId?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sentAt?: SortOrderInput | SortOrder
    notification?: NotificationOrderByWithRelationInput
  }

  export type NotificationDeliveryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    notificationId_channel?: NotificationDeliveryNotificationIdChannelCompoundUniqueInput
    AND?: NotificationDeliveryWhereInput | NotificationDeliveryWhereInput[]
    OR?: NotificationDeliveryWhereInput[]
    NOT?: NotificationDeliveryWhereInput | NotificationDeliveryWhereInput[]
    notificationId?: StringFilter<"NotificationDelivery"> | string
    channel?: EnumNotificationChannelFilter<"NotificationDelivery"> | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFilter<"NotificationDelivery"> | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFilter<"NotificationDelivery"> | number
    nextAttemptAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    claimToken?: StringNullableFilter<"NotificationDelivery"> | string | null
    claimExpiresAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
    providerMessageId?: StringNullableFilter<"NotificationDelivery"> | string | null
    lastError?: StringNullableFilter<"NotificationDelivery"> | string | null
    createdAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    sentAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
    notification?: XOR<NotificationScalarRelationFilter, NotificationWhereInput>
  }, "id" | "notificationId_channel">

  export type NotificationDeliveryOrderByWithAggregationInput = {
    id?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    nextAttemptAt?: SortOrder
    claimToken?: SortOrderInput | SortOrder
    claimExpiresAt?: SortOrderInput | SortOrder
    providerMessageId?: SortOrderInput | SortOrder
    lastError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sentAt?: SortOrderInput | SortOrder
    _count?: NotificationDeliveryCountOrderByAggregateInput
    _avg?: NotificationDeliveryAvgOrderByAggregateInput
    _max?: NotificationDeliveryMaxOrderByAggregateInput
    _min?: NotificationDeliveryMinOrderByAggregateInput
    _sum?: NotificationDeliverySumOrderByAggregateInput
  }

  export type NotificationDeliveryScalarWhereWithAggregatesInput = {
    AND?: NotificationDeliveryScalarWhereWithAggregatesInput | NotificationDeliveryScalarWhereWithAggregatesInput[]
    OR?: NotificationDeliveryScalarWhereWithAggregatesInput[]
    NOT?: NotificationDeliveryScalarWhereWithAggregatesInput | NotificationDeliveryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"NotificationDelivery"> | string
    notificationId?: StringWithAggregatesFilter<"NotificationDelivery"> | string
    channel?: EnumNotificationChannelWithAggregatesFilter<"NotificationDelivery"> | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusWithAggregatesFilter<"NotificationDelivery"> | $Enums.NotificationDeliveryStatus
    attemptCount?: IntWithAggregatesFilter<"NotificationDelivery"> | number
    nextAttemptAt?: DateTimeWithAggregatesFilter<"NotificationDelivery"> | Date | string
    claimToken?: StringNullableWithAggregatesFilter<"NotificationDelivery"> | string | null
    claimExpiresAt?: DateTimeNullableWithAggregatesFilter<"NotificationDelivery"> | Date | string | null
    providerMessageId?: StringNullableWithAggregatesFilter<"NotificationDelivery"> | string | null
    lastError?: StringNullableWithAggregatesFilter<"NotificationDelivery"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"NotificationDelivery"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"NotificationDelivery"> | Date | string
    sentAt?: DateTimeNullableWithAggregatesFilter<"NotificationDelivery"> | Date | string | null
  }

  export type FakeEmailReceiptWhereInput = {
    AND?: FakeEmailReceiptWhereInput | FakeEmailReceiptWhereInput[]
    OR?: FakeEmailReceiptWhereInput[]
    NOT?: FakeEmailReceiptWhereInput | FakeEmailReceiptWhereInput[]
    deliveryKey?: StringFilter<"FakeEmailReceipt"> | string
    fingerprint?: StringFilter<"FakeEmailReceipt"> | string
    messageId?: StringFilter<"FakeEmailReceipt"> | string
    createdAt?: DateTimeFilter<"FakeEmailReceipt"> | Date | string
  }

  export type FakeEmailReceiptOrderByWithRelationInput = {
    deliveryKey?: SortOrder
    fingerprint?: SortOrder
    messageId?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeEmailReceiptWhereUniqueInput = Prisma.AtLeast<{
    deliveryKey?: string
    messageId?: string
    AND?: FakeEmailReceiptWhereInput | FakeEmailReceiptWhereInput[]
    OR?: FakeEmailReceiptWhereInput[]
    NOT?: FakeEmailReceiptWhereInput | FakeEmailReceiptWhereInput[]
    fingerprint?: StringFilter<"FakeEmailReceipt"> | string
    createdAt?: DateTimeFilter<"FakeEmailReceipt"> | Date | string
  }, "deliveryKey" | "messageId">

  export type FakeEmailReceiptOrderByWithAggregationInput = {
    deliveryKey?: SortOrder
    fingerprint?: SortOrder
    messageId?: SortOrder
    createdAt?: SortOrder
    _count?: FakeEmailReceiptCountOrderByAggregateInput
    _max?: FakeEmailReceiptMaxOrderByAggregateInput
    _min?: FakeEmailReceiptMinOrderByAggregateInput
  }

  export type FakeEmailReceiptScalarWhereWithAggregatesInput = {
    AND?: FakeEmailReceiptScalarWhereWithAggregatesInput | FakeEmailReceiptScalarWhereWithAggregatesInput[]
    OR?: FakeEmailReceiptScalarWhereWithAggregatesInput[]
    NOT?: FakeEmailReceiptScalarWhereWithAggregatesInput | FakeEmailReceiptScalarWhereWithAggregatesInput[]
    deliveryKey?: StringWithAggregatesFilter<"FakeEmailReceipt"> | string
    fingerprint?: StringWithAggregatesFilter<"FakeEmailReceipt"> | string
    messageId?: StringWithAggregatesFilter<"FakeEmailReceipt"> | string
    createdAt?: DateTimeWithAggregatesFilter<"FakeEmailReceipt"> | Date | string
  }

  export type NotificationCreateInput = {
    id?: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sourceEventId?: string | null
    correlationId?: string | null
    traceparent?: string | null
    deliveries?: NotificationDeliveryCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUncheckedCreateInput = {
    id?: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sourceEventId?: string | null
    correlationId?: string | null
    traceparent?: string | null
    deliveries?: NotificationDeliveryUncheckedCreateNestedManyWithoutNotificationInput
  }

  export type NotificationUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
    deliveries?: NotificationDeliveryUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
    deliveries?: NotificationDeliveryUncheckedUpdateManyWithoutNotificationNestedInput
  }

  export type NotificationCreateManyInput = {
    id?: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sourceEventId?: string | null
    correlationId?: string | null
    traceparent?: string | null
  }

  export type NotificationUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
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

  export type ConsumerDeliveryCreateInput = {
    consumer: string
    messageKey: string
    replayCount?: number
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsumerDeliveryUncheckedCreateInput = {
    consumer: string
    messageKey: string
    replayCount?: number
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsumerDeliveryUpdateInput = {
    consumer?: StringFieldUpdateOperationsInput | string
    messageKey?: StringFieldUpdateOperationsInput | string
    replayCount?: IntFieldUpdateOperationsInput | number
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsumerDeliveryUncheckedUpdateInput = {
    consumer?: StringFieldUpdateOperationsInput | string
    messageKey?: StringFieldUpdateOperationsInput | string
    replayCount?: IntFieldUpdateOperationsInput | number
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsumerDeliveryCreateManyInput = {
    consumer: string
    messageKey: string
    replayCount?: number
    attempts?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ConsumerDeliveryUpdateManyMutationInput = {
    consumer?: StringFieldUpdateOperationsInput | string
    messageKey?: StringFieldUpdateOperationsInput | string
    replayCount?: IntFieldUpdateOperationsInput | number
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ConsumerDeliveryUncheckedUpdateManyInput = {
    consumer?: StringFieldUpdateOperationsInput | string
    messageKey?: StringFieldUpdateOperationsInput | string
    replayCount?: IntFieldUpdateOperationsInput | number
    attempts?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type NotificationDeliveryCreateInput = {
    id?: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
    notification: NotificationCreateNestedOneWithoutDeliveriesInput
  }

  export type NotificationDeliveryUncheckedCreateInput = {
    id?: string
    notificationId: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
  }

  export type NotificationDeliveryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notification?: NotificationUpdateOneRequiredWithoutDeliveriesNestedInput
  }

  export type NotificationDeliveryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    notificationId?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationDeliveryCreateManyInput = {
    id?: string
    notificationId: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
  }

  export type NotificationDeliveryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationDeliveryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    notificationId?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type FakeEmailReceiptCreateInput = {
    deliveryKey: string
    fingerprint: string
    messageId: string
    createdAt?: Date | string
  }

  export type FakeEmailReceiptUncheckedCreateInput = {
    deliveryKey: string
    fingerprint: string
    messageId: string
    createdAt?: Date | string
  }

  export type FakeEmailReceiptUpdateInput = {
    deliveryKey?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeEmailReceiptUncheckedUpdateInput = {
    deliveryKey?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeEmailReceiptCreateManyInput = {
    deliveryKey: string
    fingerprint: string
    messageId: string
    createdAt?: Date | string
  }

  export type FakeEmailReceiptUpdateManyMutationInput = {
    deliveryKey?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FakeEmailReceiptUncheckedUpdateManyInput = {
    deliveryKey?: StringFieldUpdateOperationsInput | string
    fingerprint?: StringFieldUpdateOperationsInput | string
    messageId?: StringFieldUpdateOperationsInput | string
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

  export type EnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NotificationDeliveryListRelationFilter = {
    every?: NotificationDeliveryWhereInput
    some?: NotificationDeliveryWhereInput
    none?: NotificationDeliveryWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type NotificationDeliveryOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sourceEventId?: SortOrder
    correlationId?: SortOrder
    traceparent?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sourceEventId?: SortOrder
    correlationId?: SortOrder
    traceparent?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    type?: SortOrder
    title?: SortOrder
    message?: SortOrder
    isRead?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sourceEventId?: SortOrder
    correlationId?: SortOrder
    traceparent?: SortOrder
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

  export type EnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type ConsumerDeliveryConsumerMessageKeyReplayCountCompoundUniqueInput = {
    consumer: string
    messageKey: string
    replayCount: number
  }

  export type ConsumerDeliveryCountOrderByAggregateInput = {
    consumer?: SortOrder
    messageKey?: SortOrder
    replayCount?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsumerDeliveryAvgOrderByAggregateInput = {
    replayCount?: SortOrder
    attempts?: SortOrder
  }

  export type ConsumerDeliveryMaxOrderByAggregateInput = {
    consumer?: SortOrder
    messageKey?: SortOrder
    replayCount?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsumerDeliveryMinOrderByAggregateInput = {
    consumer?: SortOrder
    messageKey?: SortOrder
    replayCount?: SortOrder
    attempts?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ConsumerDeliverySumOrderByAggregateInput = {
    replayCount?: SortOrder
    attempts?: SortOrder
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

  export type EnumNotificationChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationChannel | EnumNotificationChannelFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationChannelFilter<$PrismaModel> | $Enums.NotificationChannel
  }

  export type EnumNotificationDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationDeliveryStatus | EnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel> | $Enums.NotificationDeliveryStatus
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

  export type NotificationScalarRelationFilter = {
    is?: NotificationWhereInput
    isNot?: NotificationWhereInput
  }

  export type NotificationDeliveryNotificationIdChannelCompoundUniqueInput = {
    notificationId: string
    channel: $Enums.NotificationChannel
  }

  export type NotificationDeliveryCountOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    nextAttemptAt?: SortOrder
    claimToken?: SortOrder
    claimExpiresAt?: SortOrder
    providerMessageId?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sentAt?: SortOrder
  }

  export type NotificationDeliveryAvgOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type NotificationDeliveryMaxOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    nextAttemptAt?: SortOrder
    claimToken?: SortOrder
    claimExpiresAt?: SortOrder
    providerMessageId?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sentAt?: SortOrder
  }

  export type NotificationDeliveryMinOrderByAggregateInput = {
    id?: SortOrder
    notificationId?: SortOrder
    channel?: SortOrder
    status?: SortOrder
    attemptCount?: SortOrder
    nextAttemptAt?: SortOrder
    claimToken?: SortOrder
    claimExpiresAt?: SortOrder
    providerMessageId?: SortOrder
    lastError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    sentAt?: SortOrder
  }

  export type NotificationDeliverySumOrderByAggregateInput = {
    attemptCount?: SortOrder
  }

  export type EnumNotificationChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationChannel | EnumNotificationChannelFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationChannelWithAggregatesFilter<$PrismaModel> | $Enums.NotificationChannel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationChannelFilter<$PrismaModel>
    _max?: NestedEnumNotificationChannelFilter<$PrismaModel>
  }

  export type EnumNotificationDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationDeliveryStatus | EnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.NotificationDeliveryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel>
    _max?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel>
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

  export type FakeEmailReceiptCountOrderByAggregateInput = {
    deliveryKey?: SortOrder
    fingerprint?: SortOrder
    messageId?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeEmailReceiptMaxOrderByAggregateInput = {
    deliveryKey?: SortOrder
    fingerprint?: SortOrder
    messageId?: SortOrder
    createdAt?: SortOrder
  }

  export type FakeEmailReceiptMinOrderByAggregateInput = {
    deliveryKey?: SortOrder
    fingerprint?: SortOrder
    messageId?: SortOrder
    createdAt?: SortOrder
  }

  export type NotificationDeliveryCreateNestedManyWithoutNotificationInput = {
    create?: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput> | NotificationDeliveryCreateWithoutNotificationInput[] | NotificationDeliveryUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationDeliveryCreateOrConnectWithoutNotificationInput | NotificationDeliveryCreateOrConnectWithoutNotificationInput[]
    createMany?: NotificationDeliveryCreateManyNotificationInputEnvelope
    connect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
  }

  export type NotificationDeliveryUncheckedCreateNestedManyWithoutNotificationInput = {
    create?: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput> | NotificationDeliveryCreateWithoutNotificationInput[] | NotificationDeliveryUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationDeliveryCreateOrConnectWithoutNotificationInput | NotificationDeliveryCreateOrConnectWithoutNotificationInput[]
    createMany?: NotificationDeliveryCreateManyNotificationInputEnvelope
    connect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumNotificationTypeFieldUpdateOperationsInput = {
    set?: $Enums.NotificationType
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NotificationDeliveryUpdateManyWithoutNotificationNestedInput = {
    create?: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput> | NotificationDeliveryCreateWithoutNotificationInput[] | NotificationDeliveryUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationDeliveryCreateOrConnectWithoutNotificationInput | NotificationDeliveryCreateOrConnectWithoutNotificationInput[]
    upsert?: NotificationDeliveryUpsertWithWhereUniqueWithoutNotificationInput | NotificationDeliveryUpsertWithWhereUniqueWithoutNotificationInput[]
    createMany?: NotificationDeliveryCreateManyNotificationInputEnvelope
    set?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    disconnect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    delete?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    connect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    update?: NotificationDeliveryUpdateWithWhereUniqueWithoutNotificationInput | NotificationDeliveryUpdateWithWhereUniqueWithoutNotificationInput[]
    updateMany?: NotificationDeliveryUpdateManyWithWhereWithoutNotificationInput | NotificationDeliveryUpdateManyWithWhereWithoutNotificationInput[]
    deleteMany?: NotificationDeliveryScalarWhereInput | NotificationDeliveryScalarWhereInput[]
  }

  export type NotificationDeliveryUncheckedUpdateManyWithoutNotificationNestedInput = {
    create?: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput> | NotificationDeliveryCreateWithoutNotificationInput[] | NotificationDeliveryUncheckedCreateWithoutNotificationInput[]
    connectOrCreate?: NotificationDeliveryCreateOrConnectWithoutNotificationInput | NotificationDeliveryCreateOrConnectWithoutNotificationInput[]
    upsert?: NotificationDeliveryUpsertWithWhereUniqueWithoutNotificationInput | NotificationDeliveryUpsertWithWhereUniqueWithoutNotificationInput[]
    createMany?: NotificationDeliveryCreateManyNotificationInputEnvelope
    set?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    disconnect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    delete?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    connect?: NotificationDeliveryWhereUniqueInput | NotificationDeliveryWhereUniqueInput[]
    update?: NotificationDeliveryUpdateWithWhereUniqueWithoutNotificationInput | NotificationDeliveryUpdateWithWhereUniqueWithoutNotificationInput[]
    updateMany?: NotificationDeliveryUpdateManyWithWhereWithoutNotificationInput | NotificationDeliveryUpdateManyWithWhereWithoutNotificationInput[]
    deleteMany?: NotificationDeliveryScalarWhereInput | NotificationDeliveryScalarWhereInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NotificationCreateNestedOneWithoutDeliveriesInput = {
    create?: XOR<NotificationCreateWithoutDeliveriesInput, NotificationUncheckedCreateWithoutDeliveriesInput>
    connectOrCreate?: NotificationCreateOrConnectWithoutDeliveriesInput
    connect?: NotificationWhereUniqueInput
  }

  export type EnumNotificationChannelFieldUpdateOperationsInput = {
    set?: $Enums.NotificationChannel
  }

  export type EnumNotificationDeliveryStatusFieldUpdateOperationsInput = {
    set?: $Enums.NotificationDeliveryStatus
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type NotificationUpdateOneRequiredWithoutDeliveriesNestedInput = {
    create?: XOR<NotificationCreateWithoutDeliveriesInput, NotificationUncheckedCreateWithoutDeliveriesInput>
    connectOrCreate?: NotificationCreateOrConnectWithoutDeliveriesInput
    upsert?: NotificationUpsertWithoutDeliveriesInput
    connect?: NotificationWhereUniqueInput
    update?: XOR<XOR<NotificationUpdateToOneWithWhereWithoutDeliveriesInput, NotificationUpdateWithoutDeliveriesInput>, NotificationUncheckedUpdateWithoutDeliveriesInput>
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

  export type NestedEnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
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

  export type NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationType[] | ListEnumNotificationTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
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

  export type NestedEnumNotificationChannelFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationChannel | EnumNotificationChannelFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationChannelFilter<$PrismaModel> | $Enums.NotificationChannel
  }

  export type NestedEnumNotificationDeliveryStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationDeliveryStatus | EnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel> | $Enums.NotificationDeliveryStatus
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

  export type NestedEnumNotificationChannelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationChannel | EnumNotificationChannelFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationChannel[] | ListEnumNotificationChannelFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationChannelWithAggregatesFilter<$PrismaModel> | $Enums.NotificationChannel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationChannelFilter<$PrismaModel>
    _max?: NestedEnumNotificationChannelFilter<$PrismaModel>
  }

  export type NestedEnumNotificationDeliveryStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationDeliveryStatus | EnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.NotificationDeliveryStatus[] | ListEnumNotificationDeliveryStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumNotificationDeliveryStatusWithAggregatesFilter<$PrismaModel> | $Enums.NotificationDeliveryStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel>
    _max?: NestedEnumNotificationDeliveryStatusFilter<$PrismaModel>
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

  export type NotificationDeliveryCreateWithoutNotificationInput = {
    id?: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
  }

  export type NotificationDeliveryUncheckedCreateWithoutNotificationInput = {
    id?: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
  }

  export type NotificationDeliveryCreateOrConnectWithoutNotificationInput = {
    where: NotificationDeliveryWhereUniqueInput
    create: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput>
  }

  export type NotificationDeliveryCreateManyNotificationInputEnvelope = {
    data: NotificationDeliveryCreateManyNotificationInput | NotificationDeliveryCreateManyNotificationInput[]
    skipDuplicates?: boolean
  }

  export type NotificationDeliveryUpsertWithWhereUniqueWithoutNotificationInput = {
    where: NotificationDeliveryWhereUniqueInput
    update: XOR<NotificationDeliveryUpdateWithoutNotificationInput, NotificationDeliveryUncheckedUpdateWithoutNotificationInput>
    create: XOR<NotificationDeliveryCreateWithoutNotificationInput, NotificationDeliveryUncheckedCreateWithoutNotificationInput>
  }

  export type NotificationDeliveryUpdateWithWhereUniqueWithoutNotificationInput = {
    where: NotificationDeliveryWhereUniqueInput
    data: XOR<NotificationDeliveryUpdateWithoutNotificationInput, NotificationDeliveryUncheckedUpdateWithoutNotificationInput>
  }

  export type NotificationDeliveryUpdateManyWithWhereWithoutNotificationInput = {
    where: NotificationDeliveryScalarWhereInput
    data: XOR<NotificationDeliveryUpdateManyMutationInput, NotificationDeliveryUncheckedUpdateManyWithoutNotificationInput>
  }

  export type NotificationDeliveryScalarWhereInput = {
    AND?: NotificationDeliveryScalarWhereInput | NotificationDeliveryScalarWhereInput[]
    OR?: NotificationDeliveryScalarWhereInput[]
    NOT?: NotificationDeliveryScalarWhereInput | NotificationDeliveryScalarWhereInput[]
    id?: StringFilter<"NotificationDelivery"> | string
    notificationId?: StringFilter<"NotificationDelivery"> | string
    channel?: EnumNotificationChannelFilter<"NotificationDelivery"> | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFilter<"NotificationDelivery"> | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFilter<"NotificationDelivery"> | number
    nextAttemptAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    claimToken?: StringNullableFilter<"NotificationDelivery"> | string | null
    claimExpiresAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
    providerMessageId?: StringNullableFilter<"NotificationDelivery"> | string | null
    lastError?: StringNullableFilter<"NotificationDelivery"> | string | null
    createdAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    updatedAt?: DateTimeFilter<"NotificationDelivery"> | Date | string
    sentAt?: DateTimeNullableFilter<"NotificationDelivery"> | Date | string | null
  }

  export type NotificationCreateWithoutDeliveriesInput = {
    id?: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sourceEventId?: string | null
    correlationId?: string | null
    traceparent?: string | null
  }

  export type NotificationUncheckedCreateWithoutDeliveriesInput = {
    id?: string
    userId: string
    type: $Enums.NotificationType
    title: string
    message: string
    isRead?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    sourceEventId?: string | null
    correlationId?: string | null
    traceparent?: string | null
  }

  export type NotificationCreateOrConnectWithoutDeliveriesInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutDeliveriesInput, NotificationUncheckedCreateWithoutDeliveriesInput>
  }

  export type NotificationUpsertWithoutDeliveriesInput = {
    update: XOR<NotificationUpdateWithoutDeliveriesInput, NotificationUncheckedUpdateWithoutDeliveriesInput>
    create: XOR<NotificationCreateWithoutDeliveriesInput, NotificationUncheckedCreateWithoutDeliveriesInput>
    where?: NotificationWhereInput
  }

  export type NotificationUpdateToOneWithWhereWithoutDeliveriesInput = {
    where?: NotificationWhereInput
    data: XOR<NotificationUpdateWithoutDeliveriesInput, NotificationUncheckedUpdateWithoutDeliveriesInput>
  }

  export type NotificationUpdateWithoutDeliveriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NotificationUncheckedUpdateWithoutDeliveriesInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    isRead?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sourceEventId?: NullableStringFieldUpdateOperationsInput | string | null
    correlationId?: NullableStringFieldUpdateOperationsInput | string | null
    traceparent?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type NotificationDeliveryCreateManyNotificationInput = {
    id?: string
    channel?: $Enums.NotificationChannel
    status?: $Enums.NotificationDeliveryStatus
    attemptCount?: number
    nextAttemptAt?: Date | string
    claimToken?: string | null
    claimExpiresAt?: Date | string | null
    providerMessageId?: string | null
    lastError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    sentAt?: Date | string | null
  }

  export type NotificationDeliveryUpdateWithoutNotificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationDeliveryUncheckedUpdateWithoutNotificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type NotificationDeliveryUncheckedUpdateManyWithoutNotificationInput = {
    id?: StringFieldUpdateOperationsInput | string
    channel?: EnumNotificationChannelFieldUpdateOperationsInput | $Enums.NotificationChannel
    status?: EnumNotificationDeliveryStatusFieldUpdateOperationsInput | $Enums.NotificationDeliveryStatus
    attemptCount?: IntFieldUpdateOperationsInput | number
    nextAttemptAt?: DateTimeFieldUpdateOperationsInput | Date | string
    claimToken?: NullableStringFieldUpdateOperationsInput | string | null
    claimExpiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    providerMessageId?: NullableStringFieldUpdateOperationsInput | string | null
    lastError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
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