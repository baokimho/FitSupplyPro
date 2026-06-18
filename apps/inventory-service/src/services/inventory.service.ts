import { ConflictError, NotFoundError, BadRequestError } from "@shared/utils";
import prisma from "../config/db.js";
import type {
  AdjustInventoryInput,
  BatchInventoryInput,
  CreateInventoryInput,
  ReleaseInventoryInput,
  ReserveInventoryInput,
  UpdateInventoryInput,
} from "../validations/inventory.schema.js";

type InventoryRecord = Awaited<ReturnType<typeof prisma.inventory.findUniqueOrThrow>>;

const toInventoryResponse = (inventory: InventoryRecord) => ({
  id: inventory.id,
  productId: inventory.productId,
  stock: inventory.stock,
  reservedStock: inventory.reservedStock,
  availableStock: inventory.stock - inventory.reservedStock,
  lowStockThreshold: inventory.lowStockThreshold,
  createdAt: inventory.createdAt,
  updatedAt: inventory.updatedAt,
});

const ensureStockConsistency = (stock: number, reservedStock: number) => {
  if (stock < 0) {
    throw new BadRequestError("Stock cannot be negative");
  }

  if (stock < reservedStock) {
    throw new BadRequestError("Stock cannot be lower than reserved stock");
  }
};

const getInventoryRecordByProductId = async (productId: string) => {
  const inventory = await prisma.inventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    throw new NotFoundError("Inventory not found");
  }

  return inventory;
};

export const createInventoryService = async (body: CreateInventoryInput) => {
  const existingInventory = await prisma.inventory.findUnique({
    where: { productId: body.productId },
    select: { id: true },
  });

  if (existingInventory) {
    throw new ConflictError("Inventory already exists", {
      productId: body.productId,
    });
  }

  const inventory = await prisma.inventory.create({
    data: body,
  });

  return toInventoryResponse(inventory);
};

export const getInventoryByProductIdService = async (productId: string) => {
  const inventory = await getInventoryRecordByProductId(productId);
  return toInventoryResponse(inventory);
};

export const updateInventoryByProductIdService = async (
  productId: string,
  data: UpdateInventoryInput,
) => {
  const inventory = await getInventoryRecordByProductId(productId);
  const nextStock = data.stock ?? inventory.stock;

  ensureStockConsistency(nextStock, inventory.reservedStock);

  const updated = await prisma.inventory.update({
    where: { productId },
    data,
  });

  return toInventoryResponse(updated);
};

export const getInventoriesByProductIdsService = async ({ productIds }: BatchInventoryInput) => {
  const uniqueProductIds = [...new Set(productIds)];
  const inventories = await prisma.inventory.findMany({
    where: {
      productId: {
        in: uniqueProductIds,
      },
    },
  });

  const inventoryMap = new Map(
    inventories.map((inventory) => [inventory.productId, toInventoryResponse(inventory)]),
  );

  return uniqueProductIds
    .map((productId) => inventoryMap.get(productId))
    .filter((inventory): inventory is NonNullable<typeof inventory> => Boolean(inventory));
};

export const adjustInventoryStockService = async (
  productId: string,
  body: AdjustInventoryInput,
) => {
  const inventory = await getInventoryRecordByProductId(productId);
  const nextStock = inventory.stock + body.quantity;

  ensureStockConsistency(nextStock, inventory.reservedStock);

  const updated = await prisma.inventory.update({
    where: { productId },
    data: {
      stock: nextStock,
    },
  });

  return toInventoryResponse(updated);
};

export const reserveInventoryStockService = async (
  productId: string,
  body: ReserveInventoryInput,
) => {
  const inventory = await getInventoryRecordByProductId(productId);
  const availableStock = inventory.stock - inventory.reservedStock;

  if (availableStock < body.quantity) {
    throw new BadRequestError("Insufficient stock", {
      productId,
      availableStock,
      requestedQuantity: body.quantity,
    });
  }

  const updated = await prisma.inventory.update({
    where: { productId },
    data: {
      reservedStock: inventory.reservedStock + body.quantity,
    },
  });

  return toInventoryResponse(updated);
};

export const releaseInventoryStockService = async (
  productId: string,
  body: ReleaseInventoryInput,
) => {
  const inventory = await getInventoryRecordByProductId(productId);

  if (inventory.reservedStock < body.quantity) {
    throw new BadRequestError("Reserved stock is insufficient", {
      productId,
      reservedStock: inventory.reservedStock,
      releaseQuantity: body.quantity,
    });
  }

  const updated = await prisma.inventory.update({
    where: { productId },
    data: {
      reservedStock: inventory.reservedStock - body.quantity,
    },
  });

  return toInventoryResponse(updated);
};
