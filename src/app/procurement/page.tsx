import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardSummary } from '../actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default async function ProcurementPage() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== "ADMIN_EXECUTIVE_HOUSEKEEPER") {
    redirect("/")
  }

  const summary = await getDashboardSummary()

  let totalBudget = 0
  const recommendations = summary.items.map(item => {
    const activeStock = item.cleanStock + item.laundryStock + item.inRoomStock
    const deficit = Math.max(0, item.parStockTarget - activeStock)
    const cost = deficit * item.unitPrice
    totalBudget += cost
    
    return {
      ...item,
      activeStock,
      deficit,
      cost
    }
  }).filter(item => item.deficit > 0)

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Rekomendasi Pengadaan</h2>
        <p className="text-muted-foreground">Analisis kekurangan par stock dan estimasi biaya penggantian.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Daftar Pengadaan Prioritas</CardTitle>
            <CardDescription>Item yang stok aktifnya berada di bawah standar ideal par stock.</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-center">Kekurangan Unit</TableHead>
                    <TableHead className="text-right">Estimasi Biaya</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                      <TableCell className="text-center text-red-600 font-bold">{item.deficit}</TableCell>
                      <TableCell className="text-right font-medium text-emerald-700">
                        Rp {item.cost.toLocaleString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 mb-2">Par Stock Optimal</Badge>
                <p>Tidak ada kekurangan unit linen saat ini.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-slate-200">Total Estimasi Anggaran</CardTitle>
            <CardDescription className="text-slate-400">Total biaya penggantian linen afkir/kurang.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-emerald-400 mb-4">
              Rp {totalBudget.toLocaleString('id-ID')}
            </div>
            <p className="text-sm text-slate-300">
              Anggaran ini merupakan proyeksi untuk mengembalikan sirkulasi linen hotel ke kuota ideal par stock 100%.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
