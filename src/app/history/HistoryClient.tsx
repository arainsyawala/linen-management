"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export default function HistoryClient({ transactions, conditions }: { transactions: any, conditions: any }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<'transactions' | 'conditions'>(
    (searchParams.get('tab') as any) || 'transactions'
  )
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '')
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  useEffect(() => {
    const handler = setTimeout(() => {
      const currentQ = searchParams.get('q') || ''
      const currentStart = searchParams.get('startDate') || ''
      const currentEnd = searchParams.get('endDate') || ''
      
      if (currentQ !== searchTerm || currentStart !== startDate || currentEnd !== endDate) {
        const params = new URLSearchParams(searchParams.toString())
        params.set('page', '1') // reset page when filters change
        
        if (searchTerm) params.set('q', searchTerm)
        else params.delete('q')
        
        if (startDate) params.set('startDate', startDate)
        else params.delete('startDate')
        
        if (endDate) params.set('endDate', endDate)
        else params.delete('endDate')
        
        router.push(pathname + '?' + params.toString())
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [searchTerm, startDate, endDate, pathname, router, searchParams])

  const handleTabChange = (newTab: 'transactions' | 'conditions') => {
    setTab(newTab)
    router.push(pathname + '?' + createQueryString('tab', newTab))
  }

  const handlePageChange = (newPage: number) => {
    router.push(pathname + '?' + createQueryString('page', newPage.toString()))
  }

  const handleLimitChange = (newLimit: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', newLimit || '10')
    params.set('page', '1') // reset page when limit changes
    router.push(pathname + '?' + params.toString())
  }

  const handleResetFilters = () => {
    setSearchTerm('')
    setStartDate('')
    setEndDate('')
  }

  const typeLabels: Record<string, string> = {
    'CLEAN_TO_HOTEL': 'Gudang -> Kamar Hotel',
    'CLEAN_TO_VILLA': 'Gudang -> Villa',
    'DIRTY_HOTEL_TO_LAUNDRY': 'Kamar Hotel -> Laundry',
    'DIRTY_VILLA_TO_LAUNDRY': 'Villa -> Laundry',
    'LAUNDRY_TO_CLEAN': 'Laundry -> Gudang'
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'CLEAN_TO_HOTEL': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'CLEAN_TO_VILLA': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
      case 'DIRTY_HOTEL_TO_LAUNDRY': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
      case 'DIRTY_VILLA_TO_LAUNDRY': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'LAUNDRY_TO_CLEAN': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'STAINED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'DAMAGED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button 
          onClick={() => handleTabChange('transactions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'transactions' ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Riwayat Sirkulasi
        </button>
        <button 
          onClick={() => handleTabChange('conditions')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'conditions' ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Riwayat Pelaporan Kondisi
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-2">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Cari data..." 
              className="pl-8 bg-white dark:bg-slate-950" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Input 
              type="date" 
              className="bg-white dark:bg-slate-950 w-full sm:w-auto text-sm" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="Tanggal Mulai"
            />
            <Input 
              type="date" 
              className="bg-white dark:bg-slate-950 w-full sm:w-auto text-sm" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="Tanggal Akhir"
            />
            {(searchTerm || startDate || endDate) && (
              <Button variant="ghost" size="icon" onClick={handleResetFilters} title="Reset Filter" className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-sm text-muted-foreground">Tampilkan</span>
          <Select value={searchParams.get('limit') || '10'} onValueChange={handleLimitChange}>
            <SelectTrigger className="w-20 bg-white dark:bg-slate-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-t-0 rounded-tl-none shadow-sm">
        <CardContent className="p-0">
          {tab === 'transactions' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead>Penulis</TableHead>
                    <TableHead>Jenis Transaksi</TableHead>
                    <TableHead>Detail Barang</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.data.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada data transaksi.</TableCell></TableRow>
                  ) : transactions.data.map((trx: any) => (
                    <TableRow key={trx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(trx.createdAt).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">{trx.createdBy.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 ${getStatusColor(trx.type)}`}>
                          {typeLabels[trx.type] || trx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <ul className="list-disc pl-4">
                          {trx.items.map((i: any) => (
                            <li key={i.id}>{i.linenItem.name} ({i.quantity}x)</li>
                          ))}
                        </ul>
                      </TableCell>
                      <TableCell className="text-sm italic text-slate-500">{trx.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === 'conditions' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead>Pelapor</TableHead>
                    <TableHead>Barang</TableHead>
                    <TableHead>Kondisi</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conditions.data.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-slate-500">Belum ada data pelaporan kondisi.</TableCell></TableRow>
                  ) : conditions.data.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">{log.reportedBy.name}</TableCell>
                      <TableCell>{log.linenItem.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`border-0 ${getStatusColor(log.condition)}`}>
                          {log.condition}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">{log.quantity}</TableCell>
                      <TableCell className="text-sm italic text-slate-500">{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Menampilkan {(tab === 'transactions' ? transactions.meta.page : conditions.meta.page) * (tab === 'transactions' ? transactions.meta.limit : conditions.meta.limit) - (tab === 'transactions' ? transactions.meta.limit : conditions.meta.limit) + 1} - {Math.min((tab === 'transactions' ? transactions.meta.page : conditions.meta.page) * (tab === 'transactions' ? transactions.meta.limit : conditions.meta.limit), (tab === 'transactions' ? transactions.meta.total : conditions.meta.total))} dari {tab === 'transactions' ? transactions.meta.total : conditions.meta.total} data
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            disabled={(tab === 'transactions' ? transactions.meta.page : conditions.meta.page) <= 1}
            onClick={() => handlePageChange((tab === 'transactions' ? transactions.meta.page : conditions.meta.page) - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-2">
            Halaman {tab === 'transactions' ? transactions.meta.page : conditions.meta.page} dari {tab === 'transactions' ? transactions.meta.totalPages : conditions.meta.totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={(tab === 'transactions' ? transactions.meta.page : conditions.meta.page) >= (tab === 'transactions' ? transactions.meta.totalPages : conditions.meta.totalPages)}
            onClick={() => handlePageChange((tab === 'transactions' ? transactions.meta.page : conditions.meta.page) + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
