export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PLAN_LIMIT"
  | "TENANT_SUSPENDED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function apiErrorBody(error: ApiError) {
  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details ?? null,
    },
  };
}

export function badRequest(message: string) {
  return new ApiError("VALIDATION_ERROR", message, 400);
}

export function unauthorized(message = "Authentication required") {
  return new ApiError("UNAUTHORIZED", message, 401);
}

export function forbidden(message = "You do not have access to this resource") {
  return new ApiError("FORBIDDEN", message, 403);
}

export function notFound(message = "Not found") {
  return new ApiError("NOT_FOUND", message, 404);
}

export function conflict(message: string) {
  return new ApiError("CONFLICT", message, 409);
}

export function planLimit(message: string) {
  return new ApiError("PLAN_LIMIT", message, 402);
}

export function tenantSuspended(message = "This school account is suspended") {
  return new ApiError("TENANT_SUSPENDED", message, 403);
}
