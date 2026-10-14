import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDashboardSummary, getLatestOccupancy, submitOccupancy } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OccupancySubmitButton } from '@/components/OccupancySubmitButton'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Warehouse, Loader, BedDouble, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect('/login')
  }

  const summary = await getDashboardSummary()
  const latestOccupancy = await getLatestOccupancy()

  const calculateHealth = (item: any) => {
    const activeStock = item.cleanStock + item.laundryStock + item.inRoomStock + (item.inVillaStock || 0)
    const ratio = activeStock / item.parStockTarget
    if (ratio >= 1) return { label: 'Aman', color: 'bg-emerald-500', text: 'text-emerald-900', bg: 'bg-emerald-100' }
    if (ratio >= 0.8) return { label: 'Peringatan', color: 'bg-yellow-500', text: 'text-yellow-900', bg: 'bg-yellow-100' }
    return { label: 'Kritis', color: 'bg-red-500', text: 'text-red-900', bg: 'bg-red-100' }
  }

  // Simplified calculation for demo
  const roomStandard: Record<string, number> = {
    'Duvet Cover': 1,
    'Sheet / Sprei': 2,
    'Pillow Case': 4,
    'Bath Towel': 2,
    'Face Towel': 2,
    'Bath Mat': 1,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Dashboard Utama</h2>
          <p className="text-muted-foreground">Ringkasan real-time pergerakan stok linen hotel.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gudang (Clean)</CardTitle>
            <Warehouse className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClean}</div>
            <p className="text-xs text-muted-foreground">Total unit siap pakai</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laundry (Sedang Dicuci)</CardTitle>
            <Loader className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalLaundry}</div>
            <p className="text-xs text-muted-foreground">Total unit di vendor/internal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kamar (Terpasang)</CardTitle>
            <BedDouble className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInRoom}</div>
            <p className="text-xs text-muted-foreground">Total sirkulasi di tamu hotel</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Villa (Terpasang)</CardTitle>
            <BedDouble className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalInVilla}</div>
            <p className="text-xs text-muted-foreground">Total sirkulasi di villa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afkir (Condemned)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCondemned}</div>
            <p className="text-xs text-muted-foreground">Unit rusak atau noda permanen</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Par Stock Health Indicator */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Par Stock Health Indicator</CardTitle>
            <CardDescription>Status kelayakan kuota linen aktif terhadap standar hotel</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Linen</TableHead>
                  <TableHead className="text-right">Stok Aktif</TableHead>
                  <TableHead className="text-right">Target Par</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.items.map(item => {
                  const activeStock = item.cleanStock + item.laundryStock + item.inRoomStock + (item.inVillaStock || 0)
                  const health = calculateHealth(item)
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{activeStock}</TableCell>
                      <TableCell className="text-right">{item.parStockTarget}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${health.bg} ${health.text} border-none`}>
                          <span className={`w-2 h-2 rounded-full mr-2 ${health.color}`}></span>
                          {health.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Occupancy Calculator */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Occupancy</CardTitle>
            <CardDescription>Hitung proyeksi kebutuhan hari ini</CardDescription>
          </CardHeader>
          <CardContent>
            <form key={latestOccupancy?.id || 'empty'} action={async (formData) => {
              'use server'
              const rooms = parseInt(formData.get('occupied') as string) || 0
              const villas = parseInt(formData.get('occupiedVillas') as string) || 0
              if (rooms >= 0 && villas >= 0) {
                await submitOccupancy(rooms, villas)
              }
            }} className="flex gap-2 mb-6">
              <Input type="number" name="occupied" placeholder="Kamar Hotel terisi..." defaultValue={latestOccupancy?.occupiedRooms ?? ''} />
              <Input type="number" name="occupiedVillas" placeholder="Villa terisi..." defaultValue={latestOccupancy?.occupiedVillas ?? ''} />
              <OccupancySubmitButton />
            </form>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Proyeksi Kebutuhan</h4>
              <p className="text-xs text-muted-foreground mb-4">Hotel terisi: {latestOccupancy?.occupiedRooms || 0} | Villa terisi: {latestOccupancy?.occupiedVillas || 0}</p>
              <div className="space-y-2">
                {summary.items.map(item => {
                  const hotelNeeded = (latestOccupancy?.occupiedRooms || 0) * (roomStandard[item.name] || 1)
                  const villaNeeded = (latestOccupancy?.occupiedVillas || 0) * ((roomStandard[item.name] || 1) * 2) // Villa is 2x standard
                  const totalNeeded = hotelNeeded + villaNeeded
                  return (
                    <div key={item.id} className="flex justify-between text-sm items-center border-b border-slate-100 dark:border-slate-800 pb-1">
                      <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                      <span className="font-medium">{totalNeeded} unit <span className="text-xs text-slate-400 font-normal ml-1">({hotelNeeded} H + {villaNeeded} V)</span></span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
