import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPendingHandover, getPendingDispute } from "../actions"
import HandoverClient from "./HandoverClient"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Serah Terima - Green Star Park",
}

export default async function HandoverPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.id
  
  const [pendingHandover, pendingDispute] = await Promise.all([
    getPendingHandover(userId),
    getPendingDispute(userId)
  ])
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Serah Terima & Verifikasi</h2>
        <p className="text-muted-foreground">Pusat pengecekan dan penyelesaian selisih transaksi linen antar divisi.</p>
      </div>
      
      <HandoverClient 
        initialPendingHandover={pendingHandover} 
        initialPendingDispute={pendingDispute} 
        userId={userId} 
      />
    </div>
  )
}
