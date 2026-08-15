import { randomUUID } from "node:crypto";
import { BadRequestError, ConflictError, NotFoundError } from "@shared/utils";
import type { Prisma } from "../generated/prisma/index.js";
import prisma from "../config/db.js";
import type {
  AdjustInventoryInput,
  BatchInventoryInput,
  ConsumeInventoryInput,
  CreateInventoryInput,
  ReleaseInventoryInput,
  ReserveInventoryInput,
  UpdateInventoryInput,
} from "../validations/inventory.schema.js";

type InventoryRecord = Awaited<ReturnType<typeof prisma.inventory.findUniqueOrThrow>>;

type InventoryOperationRow = {
  productId: string;
  type: string;
  quantity: number;
};

type InventoryMutationType = "RESERVE" | "RELEASE" | "CONSUME";

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

const claimInventoryOperation = async (
  tx: Prisma.TransactionClient,
  productId: string,
  operationId: string,
  type: InventoryMutationType,
  quantity: number,
) => {
  const inserted = await tx.$queryRaw<InventoryOperationRow[]>`
    INSERT INTO "InventoryOperation" ("id", "operationId", "productId", "type", "quantity")
    VALUES (${randomUUID()}, ${operationId}, ${productId}, ${type}, ${quantity})
    ON CONFLICT ("operationId") DO NOTHING
    RETURNING "productId", "type", "quantity"
  `;

  if (inserted[0]) {
    return { duplicate: false };
  }

  const existing = await tx.$queryRaw<InventoryOperationRow[]>`
    SELECT "productId", "type", "quantity"
    FROM "InventoryOperation"
    WHERE "operationId" = ${operationId}
  `;
  const operation = existing[0];

  if (!operation) {
    throw new ConflictError("Inventory operation is already in progress", { operationId });
  }

  if (operation.productId !== productId || operation.type !== type || operation.quantity !== quantity) {
    throw new ConflictError("Inventory operation id was reused with different input", { operationId });
  }

  return { duplicate: true };
};

const getInventoryWithinTransaction = async (tx: Prisma.TransactionClient, productId: string) => {
  const inventory = await tx.inventory.findUnique({
    where: { productId },
  });

  if (!inventory) {
    throw new NotFoundError("Inventory not found");
  }

  return inventory;
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
  const runMutation = async (tx: Prisma.TransactionClient) => {
    const updatedRows = await tx.$queryRaw<InventoryRecord[]>`
      UPDATE "Inventory"
      SET "reservedStock" = "reservedStock" + ${body.quantity}, "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "stock" - "reservedStock" >= ${body.quantity}
      RETURNING *
    `;

    const updated = updatedRows[0];
    if (updated) {
      return updated;
    }

    const inventory = await getInventoryWithinTransaction(tx, productId);
    const availableStock = inventory.stock - inventory.reservedStock;

    throw new BadRequestError("Insufficient stock", {
      productId,
      availableStock,
      requestedQuantity: body.quantity,
    });
  };

  if (!body.operationId) {
    return toInventoryResponse(await prisma.$transaction(runMutation));
  }

  return toInventoryResponse(await prisma.$transaction(async (tx) => {
    const claim = await claimInventoryOperation(tx, productId, body.operationId ?? "", "RESERVE", body.quantity);
    if (claim.duplicate) {
      return getInventoryWithinTransaction(tx, productId);
    }

    return runMutation(tx);
  }));
};
export const releaseInventoryStockService = async (
  productId: string,
  body: ReleaseInventoryInput,
) => {
  const runMutation = async (tx: Prisma.TransactionClient) => {
    const updatedRows = await tx.$queryRaw<InventoryRecord[]>`
      UPDATE "Inventory"
      SET "reservedStock" = "reservedStock" - ${body.quantity}, "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "reservedStock" >= ${body.quantity}
      RETURNING *
    `;

    const updated = updatedRows[0];
    if (updated) {
      return updated;
    }

    const inventory = await getInventoryWithinTransaction(tx, productId);

    throw new BadRequestError("Reserved stock is insufficient", {
      productId,
      reservedStock: inventory.reservedStock,
      releaseQuantity: body.quantity,
    });
  };

  if (!body.operationId) {
    return toInventoryResponse(await prisma.$transaction(runMutation));
  }

  return toInventoryResponse(await prisma.$transaction(async (tx) => {
    const claim = await claimInventoryOperation(tx, productId, body.operationId ?? "", "RELEASE", body.quantity);
    if (claim.duplicate) {
      return getInventoryWithinTransaction(tx, productId);
    }

    return runMutation(tx);
  }));
};
export const consumeInventoryReservationService = async (
  productId: string,
  body: ConsumeInventoryInput,
) => {
  const runMutation = async (tx: Prisma.TransactionClient) => {
    const updatedRows = await tx.$queryRaw<InventoryRecord[]>`
      UPDATE "Inventory"
      SET
        "stock" = "stock" - ${body.quantity},
        "reservedStock" = "reservedStock" - ${body.quantity},
        "updatedAt" = NOW()
      WHERE "productId" = ${productId}
        AND "reservedStock" >= ${body.quantity}
        AND "stock" >= ${body.quantity}
      RETURNING *
    `;

    const updated = updatedRows[0];
    if (updated) {
      return updated;
    }

    const inventory = await getInventoryWithinTransaction(tx, productId);

    throw new BadRequestError("Reserved stock is insufficient", {
      productId,
      reservedStock: inventory.reservedStock,
      consumeQuantity: body.quantity,
    });
  };

  if (!body.operationId) {
    return toInventoryResponse(await prisma.$transaction(runMutation));
  }

  return toInventoryResponse(await prisma.$transaction(async (tx) => {
    const claim = await claimInventoryOperation(tx, productId, body.operationId ?? "", "CONSUME", body.quantity);
    if (claim.duplicate) {
      return getInventoryWithinTransaction(tx, productId);
    }

    return runMutation(tx);
  }));
};
