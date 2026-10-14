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
      // Tentukan base URL aplikasi secara cerdas:
      // Di produksi Vercel, jangan biarkan localhost menimpa domain produksi asli.
      let resolvedBase = baseUrl
      if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
        resolvedBase = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      } else if (process.env.VERCEL_URL) {
        resolvedBase = `https://${process.env.VERCEL_URL}`
      } else if (process.env.NEXTAUTH_URL) {
        const isLocal = process.env.NEXTAUTH_URL.includes("localhost") || process.env.NEXTAUTH_URL.includes("127.0.0.1")
        if (!isLocal || process.env.NODE_ENV !== "production") {
          resolvedBase = process.env.NEXTAUTH_URL
        } else {
          resolvedBase = "https://linen-management.vercel.app"
        }
      } else if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
        resolvedBase = "https://linen-management.vercel.app"
      }

      // Jika URL relatif (seperti /login atau /)
      if (url.startsWith("/")) {
        return `${resolvedBase}${url}`
      }

      // Validasi origin secara aman untuk mencegah open redirect
      try {
        const parsedUrl = new URL(url)
        const parsedBase = new URL(resolvedBase)

        // 1. Izinkan jika origin sama dengan resolvedBase
        if (parsedUrl.origin === parsedBase.origin) {
          return url
        }

        // 2. Izinkan jika origin sama dengan baseUrl bawaan NextAuth
        try {
          if (parsedUrl.origin === new URL(baseUrl).origin) {
            return url
          }
        } catch {}

        // 3. Izinkan domain vercel resmi aplikasi (linen-management.vercel.app atau deployment preview)
        const isVercelDomain = 
          parsedUrl.protocol === "https:" && 
          (parsedUrl.hostname === "linen-management.vercel.app" || 
           (parsedUrl.hostname.startsWith("linen-management") && parsedUrl.hostname.endsWith(".vercel.app")))

        // 4. Izinkan host development lokal dan VS Code devtunnels
        const isDevDomain = 
          parsedUrl.hostname === "localhost" || 
          parsedUrl.hostname === "127.0.0.1" || 
          parsedUrl.hostname.endsWith(".devtunnels.ms")

        if (isVercelDomain || isDevDomain) {
          return url
        }
      } catch {}

      return `${resolvedBase}/login`
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
