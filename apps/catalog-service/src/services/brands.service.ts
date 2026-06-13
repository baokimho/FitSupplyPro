import { ConflictError, NotFoundError } from "@shared/utils";
import prisma from "../config/db.js";
import type { BrandInput, UpdateBrandInput } from "../validations/brand.schema.js";

export const createBrandService = async (body: BrandInput) => {
  const existingBrand = await prisma.brand.findFirst({
    where: {
      OR: [{ name: body.name }, { slug: body.slug }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (existingBrand) {
    const field = existingBrand.name === body.name ? "name" : "slug";
    throw new ConflictError(`Brand ${field} already exists`, {
      field,
      value: field === "name" ? body.name : body.slug,
    });
  }

  return prisma.brand.create({
    data: body,
  });
};

export const getAllBrandsService = async () => {
  return prisma.brand.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getBrandByIdService = async (id: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
  });

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  return brand;
};

export const updateBrandService = async (id: string, data: UpdateBrandInput) => {
  const brand = await prisma.brand.findUnique({ where: { id } });

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  if (data.name || data.slug) {
    const existingBrand = await prisma.brand.findFirst({
      where: {
        id: { not: id },
        OR: [
          ...(data.name ? [{ name: data.name }] : []),
          ...(data.slug ? [{ slug: data.slug }] : []),
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (existingBrand) {
      const field = data.name && existingBrand.name === data.name ? "name" : "slug";
      throw new ConflictError(`Brand ${field} already exists`, {
        field,
        value: field === "name" ? data.name : data.slug,
      });
    }
  }

  return prisma.brand.update({
    where: { id },
    data,
  });
};

export const deleteBrandService = async (id: string) => {
  const brand = await prisma.brand.findUnique({ where: { id } });

  if (!brand) {
    throw new NotFoundError("Brand not found");
  }

  await prisma.brand.delete({
    where: { id },
  });
};
