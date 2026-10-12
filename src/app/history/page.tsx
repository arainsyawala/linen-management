import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getTransactionHistory, getConditionHistory } from "../actions"
import HistoryClient from "./HistoryClient"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "Histori Penginputan - Green Star Park",
}

export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await getServerSession(authOptions)
  
  // Protect page: Admin only
  if (session?.user?.role !== "ADMIN_EXECUTIVE_HOUSEKEEPER") {
    redirect("/")
  }

  const resolvedParams = await searchParams
  const search = typeof resolvedParams.q === 'string' ? resolvedParams.q : ''
  const page = typeof resolvedParams.page === 'string' ? parseInt(resolvedParams.page) : 1
  const limit = typeof resolvedParams.limit === 'string' ? parseInt(resolvedParams.limit) : 10
  const startDate = typeof resolvedParams.startDate === 'string' ? resolvedParams.startDate : undefined
  const endDate = typeof resolvedParams.endDate === 'string' ? resolvedParams.endDate : undefined

  const transactions = await getTransactionHistory({ search, page, limit, startDate, endDate })
  const conditions = await getConditionHistory({ search, page, limit, startDate, endDate })
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Histori Penginputan</h2>
        <p className="text-muted-foreground">Rekam jejak sirkulasi linen dan pelaporan kerusakan sistem.</p>
      </div>
      
      <HistoryClient transactions={transactions} conditions={conditions} />
    </div>
  )
}
