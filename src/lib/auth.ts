import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { AppRole } from "@/types/roles";

async function findActiveSchoolUser(email: string) {
  const matches = await prisma.user.findMany({
    where: { email, status: "ACTIVE" },
    include: { school: true },
  });
  const usable = matches.filter(
    (row) => row.school.status !== "SUSPENDED" && row.school.status !== "CANCELLED",
  );
  if (usable.length !== 1) return null;
  return { tenant: usable[0]!.school, user: usable[0]! };
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        slug: { label: "School slug", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;
        const slug = credentials?.slug?.trim().toLowerCase();
        if (!email || !password) return null;

        const superAdmin = await prisma.superAdminUser.findUnique({ where: { email } });
        if (superAdmin) {
          const ok = await bcrypt.compare(password, superAdmin.passwordHash);
          if (!ok) return null;
          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name ?? "Super Admin",
            role: "SUPER_ADMIN" as AppRole,
            schoolId: null,
            schoolSlug: null,
          };
        }

        const bySlug = slug
          ? await prisma.tenant.findUnique({ where: { slug } })
          : null;
        const userOnSlug = bySlug
          ? await prisma.user.findFirst({
              where: { email, schoolId: bySlug.id, status: "ACTIVE" },
            })
          : null;

        const fallback =
          userOnSlug && bySlug
            ? { tenant: bySlug, user: userOnSlug }
            : await findActiveSchoolUser(email);

        if (!fallback) return null;
        if (fallback.tenant.status === "SUSPENDED" || fallback.tenant.status === "CANCELLED") return null;

        const ok = await bcrypt.compare(password, fallback.user.passwordHash);
        if (!ok) return null;

        return {
          id: fallback.user.id,
          email: fallback.user.email,
          name: fallback.user.name,
          role: fallback.user.role as AppRole,
          schoolId: fallback.user.schoolId,
          schoolSlug: fallback.tenant.slug,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: AppRole }).role;
        token.schoolId = (user as { schoolId: string | null }).schoolId;
        token.schoolSlug = (user as { schoolSlug: string | null }).schoolSlug;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.role = token.role as AppRole;
        session.user.schoolId = (token.schoolId as string | null) ?? null;
        session.user.schoolSlug = (token.schoolSlug as string | null) ?? null;
      }
      return session;
    },
  },
};
