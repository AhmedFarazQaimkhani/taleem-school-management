import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/types/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      schoolId: string | null;
      schoolSlug: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: AppRole;
    schoolId: string | null;
    schoolSlug: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: AppRole;
    schoolId: string | null;
    schoolSlug: string | null;
  }
}
