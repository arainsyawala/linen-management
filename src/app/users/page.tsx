import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getUsers } from "../actions"
import UserClient from "./UserClient"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Kelola Pengguna - Green Star Park",
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)

  if (session?.user?.role !== "ADMIN_EXECUTIVE_HOUSEKEEPER") {
    redirect("/")
  }

  const users = await getUsers()
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Kelola Akun Staf</h2>
        <p className="text-muted-foreground">Tambah dan kelola hak akses sistem.</p>
      </div>
      
      <UserClient users={users} />
    </div>
  )
}
