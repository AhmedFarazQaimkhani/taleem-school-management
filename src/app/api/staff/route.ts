import { requireTenantUser } from "@/lib/rbac";
import { handleRouteError, jsonOk } from "@/lib/route";
import { staffSchema } from "@/lib/validations/phase2";
import { parseListQuery, listMeta } from "@/lib/pagination";
import { pkrToPaisa } from "@/lib/money";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { db } = await requireTenantUser(["ADMIN", "ACCOUNTANT"]);
    const url = new URL(request.url);
    const { page, pageSize, skip, q } = parseListQuery(url);
    const where: Prisma.StaffWhereInput = {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { employeeCode: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, staff] = await Promise.all([
      db.staff.count({ where }),
      db.staff.findMany({ where, skip, take: pageSize, orderBy: { name: "asc" }, include: { user: true } }),
    ]);
    return jsonOk({ staff, meta: listMeta(total, page, pageSize) });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { db, schoolId } = await requireTenantUser(["ADMIN"]);
    const body = staffSchema.parse(await request.json());
    let userId: string | undefined;
    if (body.loginEmail && body.loginPassword) {
      const user = await db.user.create({
        data: {
          schoolId,
          email: body.loginEmail,
          passwordHash: await bcrypt.hash(body.loginPassword, 12),
          role: body.loginRole ?? (body.type === "ACCOUNTANT" ? "ACCOUNTANT" : "TEACHER"),
          name: body.name,
          phone: body.phone ?? undefined,
        },
      });
      userId = user.id;
    }
    const staff = await db.staff.create({
      data: {
        schoolId,
        employeeCode: body.employeeCode,
        name: body.name,
        nameUrdu: body.nameUrdu || null,
        phone: body.phone || null,
        email: body.email || null,
        type: body.type,
        designation: body.designation || null,
        cnic: body.cnic || null,
        salaryPaisa: body.salaryPkr != null ? pkrToPaisa(body.salaryPkr) : null,
        userId,
      },
    });
    return jsonOk({ staff }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
