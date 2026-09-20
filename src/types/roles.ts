export type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "TEACHER"
  | "ACCOUNTANT"
  | "PARENT"
  | "STUDENT";

export const TENANT_ROLES: AppRole[] = [
  "ADMIN",
  "TEACHER",
  "ACCOUNTANT",
  "PARENT",
  "STUDENT",
];
