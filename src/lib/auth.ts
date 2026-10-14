import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@greenstar.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan Password wajib diisi")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("Akun tidak ditemukan")
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error("Password salah")
        }

        // Return object that will be encoded in JWT
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // First time jwt callback is run, user object is available
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      const resolvedBase = process.env.NEXTAUTH_URL 
        || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
        || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : baseUrl)

      // Jika URL relatif (seperti /login)
      if (url.startsWith("/")) {
        return `${resolvedBase}${url}`
      }

      // Validasi origin secara ketat untuk mencegah open redirect
      try {
        const parsedUrl = new URL(url)
        const allowedOrigins = [new URL(baseUrl).origin]
        try {
          allowedOrigins.push(new URL(resolvedBase).origin)
        } catch {}

        if (allowedOrigins.includes(parsedUrl.origin)) {
          return url
        }
      } catch {}

      return resolvedBase
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days remember me
  },
  pages: {
    signIn: "/login",
  },
  secret: (() => {
    if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV === "production") {
      throw new Error("NEXTAUTH_SECRET wajib disetel pada environment produksi.")
    }
    return process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-only-change-in-prod"
  })()
}
