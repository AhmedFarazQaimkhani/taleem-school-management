import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiError, apiErrorBody } from "@/lib/api";
import { CrossTenantError } from "@/lib/prisma-tenant";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json(
      { error: { code: "CONFLICT", message: "A record with those unique fields already exists", details: error.meta } },
      { status: 409 },
    );
  }

  if (error instanceof CrossTenantError) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: error.message, details: null } },
      { status: 403 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(apiErrorBody(error), { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong", details: null } },
    { status: 500 },
  );
}
