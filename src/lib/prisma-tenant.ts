import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { delegateName, isTenantModel } from "@/lib/tenant-models";

export class CrossTenantError extends Error {
  constructor(message = "Cross-tenant access blocked") {
    super(message);
    this.name = "CrossTenantError";
  }
}

function mergeSchoolIdWhere(where: Record<string, unknown> | undefined, schoolId: string) {
  if (!where || Object.keys(where).length === 0) {
    return { schoolId };
  }
  return { AND: [where, { schoolId }] };
}

function assertWriteSchoolId(data: unknown, schoolId: string, model: string) {
  if (!data || typeof data !== "object") return;
  const row = data as Record<string, unknown>;
  if (row.schoolId !== undefined && row.schoolId !== schoolId) {
    throw new CrossTenantError(`Cannot write ${model} for a different schoolId`);
  }
  row.schoolId = schoolId;
}

function injectCreateData(data: unknown, schoolId: string, model: string) {
  if (Array.isArray(data)) {
    for (const item of data) {
      assertWriteSchoolId(item, schoolId, model);
    }
    return data;
  }
  assertWriteSchoolId(data, schoolId, model);
  return data;
}

function notFound(model: string) {
  return new Prisma.PrismaClientKnownRequestError(
    `No ${model} found for this tenant`,
    { code: "P2025", clientVersion: Prisma.prismaVersion.client },
  );
}

type DelegateCall = (args: unknown) => Promise<unknown>;

type ModelDelegate = {
  findUnique: DelegateCall;
  findUniqueOrThrow: DelegateCall;
  findFirst: DelegateCall;
  update: DelegateCall;
  delete: DelegateCall;
  upsert: DelegateCall;
};

function modelDelegate(model: string): ModelDelegate {
  return (prisma as unknown as Record<string, ModelDelegate>)[delegateName(model)];
}

/**
 * Returns a Prisma client that automatically injects and enforces `schoolId`
 * on every query against tenant-owned models. Use this in all tenant API routes.
 *
 * Platform tables (Tenant, Plan, SuperAdminUser, PlatformSubscriptionPayment,
 * PasswordResetToken) are left unscoped so Super Admin operations still work
 * on the base client.
 *
 * Nested writes are also tagged with schoolId at the top-level record.
 * Prefer explicit schoolId on nested creates as well — the extension will
 * reject a mismatched schoolId rather than silently overwrite it.
 */
export function createTenantClient(schoolId: string) {
  if (!schoolId) {
    throw new Error("createTenantClient requires a schoolId");
  }

  return prisma.$extends({
    name: "tenantIsolation",
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async findUnique({ model, args }) {
          const delegate = modelDelegate(model);
          if (!isTenantModel(model)) {
            return delegate.findUnique(args);
          }
          return delegate.findFirst({
            ...args,
            where: mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId),
          });
        },
        async findUniqueOrThrow({ model, args }) {
          const delegate = modelDelegate(model);
          if (!isTenantModel(model)) {
            return delegate.findUniqueOrThrow(args);
          }
          const row = await delegate.findFirst({
            ...args,
            where: mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId),
          });
          if (!row) throw notFound(model);
          return row;
        },
        async create({ model, args, query }) {
          if (isTenantModel(model)) {
            args.data = injectCreateData(args.data, schoolId, model) as typeof args.data;
          }
          return query(args);
        },
        async createMany({ model, args, query }) {
          if (isTenantModel(model)) {
            args.data = injectCreateData(args.data, schoolId, model) as typeof args.data;
          }
          return query(args);
        },
        async update({ model, args }) {
          const delegate = modelDelegate(model);
          if (!isTenantModel(model)) {
            return delegate.update(args);
          }
          const existing = (await delegate.findFirst({
            where: mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId),
            select: { id: true },
          })) as { id: string } | null;
          if (!existing) throw notFound(model);
          assertWriteSchoolId(args.data, schoolId, model);
          return delegate.update({ ...args, where: { id: existing.id } });
        },
        async updateMany({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
            if (args.data && typeof args.data === "object" && "schoolId" in args.data) {
              assertWriteSchoolId(args.data, schoolId, model);
            }
          }
          return query(args);
        },
        async delete({ model, args }) {
          const delegate = modelDelegate(model);
          if (!isTenantModel(model)) {
            return delegate.delete(args);
          }
          const existing = (await delegate.findFirst({
            where: mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId),
            select: { id: true },
          })) as { id: string } | null;
          if (!existing) throw notFound(model);
          return delegate.delete({ ...args, where: { id: existing.id } });
        },
        async deleteMany({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async upsert({ model, args }) {
          const delegate = modelDelegate(model);
          if (!isTenantModel(model)) {
            return delegate.upsert(args);
          }
          const existing = (await delegate.findFirst({
            where: mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId),
            select: { id: true },
          })) as { id: string } | null;
          if (existing) {
            assertWriteSchoolId(args.update, schoolId, model);
            return delegate.upsert({
              ...args,
              where: { id: existing.id },
              update: args.update,
            });
          }
          assertWriteSchoolId(args.create, schoolId, model);
          return delegate.upsert({
            ...args,
            create: args.create,
          });
        },
        async count({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
        async groupBy({ model, args, query }) {
          if (isTenantModel(model)) {
            args.where = mergeSchoolIdWhere(args.where as Record<string, unknown>, schoolId);
          }
          return query(args);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof createTenantClient>;

const tenantClientCache = new Map<string, TenantClient>();

export function getTenantClient(schoolId: string): TenantClient {
  if (process.env.NODE_ENV === "development") {
    return createTenantClient(schoolId);
  }
  const cached = tenantClientCache.get(schoolId);
  if (cached) return cached;
  const client = createTenantClient(schoolId);
  tenantClientCache.set(schoolId, client);
  return client;
}

/** Unscoped client — platform tables and Super Admin only. */
export function getPlatformClient(): PrismaClient {
  return prisma;
}
