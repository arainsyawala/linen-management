import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./LoginForm"

export const metadata = {
  title: "Login - Green Star Park",
}

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  // Redirect to dashboard if already logged in
  if (session) {
    redirect("/")
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
            Green Star Park
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Sistem Informasi Manajemen Linen
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
