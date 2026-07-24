export interface FactoryContext {
  next(sequenceName?: string): number;
}

export function createFactoryContext(seed = 0): FactoryContext {
  const counters = new Map<string, number>();

  return {
    next(sequenceName = "default") {
      const nextValue = (counters.get(sequenceName) ?? seed) + 1;
      counters.set(sequenceName, nextValue);
      return nextValue;
    },
  };
}

const defaultContext = createFactoryContext();

function sequence(context: FactoryContext | undefined, name: string): number {
  return (context ?? defaultContext).next(name);
}

export interface UserFactoryInput {
  id?: string;
  email?: string;
  passwordHash?: string;
  name?: string;
  role?: "CUSTOMER" | "ADMIN";
}

export function buildUser(overrides: UserFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "user");
  return {
    id: overrides.id ?? `test-user-${id}`,
    email: overrides.email ?? `user-${id}@example.test`,
    passwordHash: overrides.passwordHash ?? "test-password-hash",
    name: overrides.name ?? `Test User ${id}`,
    role: overrides.role ?? "CUSTOMER",
  };
}

export interface RefreshTokenFactoryInput {
  id?: string;
  tokenHash?: string;
  userId?: string;
  expiresAt?: Date;
  revokedAt?: Date | null;
  replacedByTokenId?: string | null;
}

export function buildRefreshToken(overrides: RefreshTokenFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "refresh-token");
  return {
    id: overrides.id ?? `test-refresh-token-${id}`,
    tokenHash: overrides.tokenHash ?? `test-token-hash-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
    expiresAt: overrides.expiresAt ?? new Date("2030-01-01T00:00:00.000Z"),
    revokedAt: overrides.revokedAt ?? null,
    replacedByTokenId: overrides.replacedByTokenId ?? null,
  };
}

export interface CategoryFactoryInput {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
}

export function buildCategory(overrides: CategoryFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "category");
  return {
    id: overrides.id ?? `test-category-${id}`,
    name: overrides.name ?? `Test Category ${id}`,
    slug: overrides.slug ?? `test-category-${id}`,
    description: overrides.description ?? null,
    parentId: overrides.parentId ?? null,
  };
}

export interface BrandFactoryInput {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
}

export function buildBrand(overrides: BrandFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "brand");
  return {
    id: overrides.id ?? `test-brand-${id}`,
    name: overrides.name ?? `Test Brand ${id}`,
    slug: overrides.slug ?? `test-brand-${id}`,
    description: overrides.description ?? null,
    logoUrl: overrides.logoUrl ?? null,
  };
}

export interface ProductFactoryInput {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  sku?: string;
  price?: string;
  images?: string[];
  isPublished?: boolean;
  categoryId?: string;
  brandId?: string;
}

export function buildProduct(overrides: ProductFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "product");
  return {
    id: overrides.id ?? `test-product-${id}`,
    name: overrides.name ?? `Test Product ${id}`,
    slug: overrides.slug ?? `test-product-${id}`,
    description: overrides.description ?? `Test product ${id} description`,
    sku: overrides.sku ?? `TEST-SKU-${id}`,
    price: overrides.price ?? "19.99",
    images: overrides.images ?? [],
    isPublished: overrides.isPublished ?? true,
    categoryId: overrides.categoryId ?? `test-category-${id}`,
    brandId: overrides.brandId ?? `test-brand-${id}`,
  };
}

export interface InventoryFactoryInput {
  id?: string;
  productId?: string;
  stock?: number;
  reservedStock?: number;
  lowStockThreshold?: number;
}

export function buildInventory(overrides: InventoryFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "inventory");
  return {
    id: overrides.id ?? `test-inventory-${id}`,
    productId: overrides.productId ?? `test-product-${id}`,
    stock: overrides.stock ?? 25,
    reservedStock: overrides.reservedStock ?? 0,
    lowStockThreshold: overrides.lowStockThreshold ?? 5,
  };
}

export interface OrderFactoryInput {
  id?: string;
  userId?: string;
  status?: "PENDING" | "CONFIRMED" | "CANCELLED";
  totalAmount?: string;
}

export function buildOrder(overrides: OrderFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "order");
  return {
    id: overrides.id ?? `test-order-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
    status: overrides.status ?? "PENDING",
    totalAmount: overrides.totalAmount ?? "19.99",
  };
}

export interface OrderItemFactoryInput {
  id?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
  productSlug?: string;
  quantity?: number;
  unitPrice?: string;
  subtotal?: string;
}

export function buildOrderItem(overrides: OrderItemFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "order-item");
  return {
    id: overrides.id ?? `test-order-item-${id}`,
    orderId: overrides.orderId ?? `test-order-${id}`,
    productId: overrides.productId ?? `test-product-${id}`,
    productName: overrides.productName ?? `Test Product ${id}`,
    productSlug: overrides.productSlug ?? `test-product-${id}`,
    quantity: overrides.quantity ?? 1,
    unitPrice: overrides.unitPrice ?? "19.99",
    subtotal: overrides.subtotal ?? "19.99",
  };
}

export interface CartFactoryInput {
  id?: string;
  userId?: string;
}

export function buildCart(overrides: CartFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "cart");
  return {
    id: overrides.id ?? `test-cart-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
  };
}

export interface CartItemFactoryInput {
  id?: string;
  cartId?: string;
  productId?: string;
  quantity?: number;
  nameSnapshot?: string;
  priceSnapshot?: string;
  imageSnapshot?: string | null;
}

export function buildCartItem(overrides: CartItemFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "cart-item");
  return {
    id: overrides.id ?? `test-cart-item-${id}`,
    cartId: overrides.cartId ?? `test-cart-${id}`,
    productId: overrides.productId ?? `test-product-${id}`,
    quantity: overrides.quantity ?? 1,
    nameSnapshot: overrides.nameSnapshot ?? `Test Product ${id}`,
    priceSnapshot: overrides.priceSnapshot ?? "19.99",
    imageSnapshot: overrides.imageSnapshot ?? null,
  };
}

export interface PaymentFactoryInput {
  id?: string;
  userId?: string;
  orderId?: string;
  amount?: string;
  status?: "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED";
  provider?: "MOCK";
}

export function buildPayment(overrides: PaymentFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "payment");
  return {
    id: overrides.id ?? `test-payment-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
    orderId: overrides.orderId ?? `test-order-${id}`,
    amount: overrides.amount ?? "19.99",
    status: overrides.status ?? "PENDING",
    provider: overrides.provider ?? "MOCK",
  };
}

export interface ShipmentFactoryInput {
  id?: string;
  userId?: string;
  orderId?: string;
  status?: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  recipientName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  postalCode?: string;
  country?: string;
  trackingNumber?: string | null;
}

export function buildShipment(overrides: ShipmentFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "shipment");
  return {
    id: overrides.id ?? `test-shipment-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
    orderId: overrides.orderId ?? `test-order-${id}`,
    status: overrides.status ?? "PENDING",
    recipientName: overrides.recipientName ?? `Recipient ${id}`,
    phone: overrides.phone ?? "+15555550100",
    addressLine1: overrides.addressLine1 ?? "100 Test Street",
    addressLine2: overrides.addressLine2 ?? null,
    city: overrides.city ?? "Test City",
    postalCode: overrides.postalCode ?? "00100",
    country: overrides.country ?? "US",
    trackingNumber: overrides.trackingNumber ?? `TRACK-${id}`,
  };
}

export interface NotificationFactoryInput {
  id?: string;
  userId?: string;
  type?: "ORDER_CREATED" | "PAYMENT_PAID" | "PAYMENT_FAILED" | "ORDER_SHIPPED" | "ORDER_DELIVERED" | "ORDER_CANCELLED";
  title?: string;
  message?: string;
  isRead?: boolean;
}

export function buildNotification(overrides: NotificationFactoryInput = {}, context?: FactoryContext) {
  const id = sequence(context, "notification");
  return {
    id: overrides.id ?? `test-notification-${id}`,
    userId: overrides.userId ?? `test-user-${id}`,
    type: overrides.type ?? "ORDER_CREATED",
    title: overrides.title ?? `Test Notification ${id}`,
    message: overrides.message ?? `Test notification ${id}`,
    isRead: overrides.isRead ?? false,
  };
}