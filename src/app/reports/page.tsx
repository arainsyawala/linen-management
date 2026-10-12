import { getDashboardSummary } from '../actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import ReportActions from './ReportActions'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const summary = await getDashboardSummary()

  // Format data for export
  const exportData = summary.items.map(item => ({
    'Nama Linen': item.name,
    'Stok Gudang (Clean)': item.cleanStock,
    'Stok Laundry': item.laundryStock,
    'Stok Kamar (In Room)': item.inRoomStock,
    'Total Stok Aktif': item.cleanStock + item.laundryStock + item.inRoomStock,
    'Total Afkir / Rusak': item.condemnedStock,
    'Kerugian Afkir (Rp)': item.condemnedStock * item.unitPrice
  }))

  const totalLoss = summary.items.reduce((sum, item) => sum + (item.condemnedStock * item.unitPrice), 0)

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 print:mb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Laporan Sirkulasi & Afkir Linen</h2>
          <p className="text-muted-foreground print:hidden">Bulan {new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
        </div>
        <ReportActions data={exportData} filename={`Laporan_Linen_${new Date().toISOString().slice(0, 10)}`} />
      </div>

      <div className="grid gap-6">
        <Card className="print:shadow-none print:border-none">
          <CardHeader className="print:px-0">
            <CardTitle>Rekapitulasi Sirkulasi Linen</CardTitle>
            <CardDescription>Distribusi linen aktif per {new Date().toLocaleDateString('id-ID')}</CardDescription>
          </CardHeader>
          <CardContent className="print:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Linen</TableHead>
                  <TableHead className="text-right">Gudang (Clean)</TableHead>
                  <TableHead className="text-right">Laundry</TableHead>
                  <TableHead className="text-right">Kamar (Terpasang)</TableHead>
                  <TableHead className="text-right font-bold text-emerald-700">Total Aktif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.cleanStock}</TableCell>
                    <TableCell className="text-right">{item.laundryStock}</TableCell>
                    <TableCell className="text-right">{item.inRoomStock}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-700">
                      {item.cleanStock + item.laundryStock + item.inRoomStock}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 print:shadow-none print:border-none print:bg-transparent">
          <CardHeader className="print:px-0 border-b border-red-100 dark:border-red-900/50 pb-4 mb-4">
            <CardTitle className="text-red-700 dark:text-red-400 font-bold text-xl">Laporan Kerugian Linen Afkir (Damaged / Condemned)</CardTitle>
            <CardDescription className="text-red-900/70 dark:text-red-400/70">Kalkulasi nilai aset yang hilang akibat kerusakan permanen.</CardDescription>
          </CardHeader>
          <CardContent className="print:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Linen</TableHead>
                  <TableHead className="text-right">Total Afkir (Unit)</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right text-red-700">Total Kerugian</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.condemnedStock}</TableCell>
                    <TableCell className="text-right">Rp {item.unitPrice.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-medium text-red-700">
                      Rp {(item.condemnedStock * item.unitPrice).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end text-lg bg-red-100 dark:bg-red-900/40 p-4 rounded-lg">
              <span className="font-semibold mr-4 text-red-900 dark:text-red-200">Total Kerugian Aset:</span>
              <span className="font-bold text-red-700 dark:text-red-400">Rp {totalLoss.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
