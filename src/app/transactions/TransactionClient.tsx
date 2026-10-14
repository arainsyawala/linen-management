'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { submitTransaction } from '../actions'
import { useSession } from 'next-auth/react'

export default function TransactionClient({ items }: { items: any[] }) {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const [type, setType] = useState('')
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const allTypeLabels: Record<string, string> = {
    'CLEAN_TO_HOTEL': 'Pemasangan Bersih (Gudang -> Kamar Hotel)',
    'CLEAN_TO_VILLA': 'Pemasangan Bersih (Gudang -> Villa)',
    'DIRTY_HOTEL_TO_LAUNDRY': 'Penyerahan Kotor (Kamar Hotel -> Laundry)',
    'DIRTY_VILLA_TO_LAUNDRY': 'Penyerahan Kotor (Villa -> Laundry)',
    'LAUNDRY_TO_CLEAN': 'Penerimaan Bersih (Laundry -> Gudang)'
  }

  let typeLabels = { ...allTypeLabels }
  if (role === 'STAF_HOUSEKEEPING') {
    typeLabels = {
      'DIRTY_HOTEL_TO_LAUNDRY': allTypeLabels['DIRTY_HOTEL_TO_LAUNDRY'],
      'DIRTY_VILLA_TO_LAUNDRY': allTypeLabels['DIRTY_VILLA_TO_LAUNDRY'],
      'CLEAN_TO_HOTEL': allTypeLabels['CLEAN_TO_HOTEL'],
      'CLEAN_TO_VILLA': allTypeLabels['CLEAN_TO_VILLA'],
    }
  } else if (role === 'STAF_LAUNDRY') {
    typeLabels = {
      'LAUNDRY_TO_CLEAN': allTypeLabels['LAUNDRY_TO_CLEAN'],
    }
  }

  const updateQuantity = (item: any, delta: number) => {
    if (!type) {
      toast.warning('Pilih Jenis Transaksi', { description: 'Harap pilih jenis transaksi terlebih dahulu.' })
      return
    }

    let maxStock = 0
    if (type === 'CLEAN_TO_HOTEL' || type === 'CLEAN_TO_VILLA') maxStock = item.cleanStock
    else if (type === 'DIRTY_HOTEL_TO_LAUNDRY') maxStock = item.inRoomStock
    else if (type === 'DIRTY_VILLA_TO_LAUNDRY') maxStock = item.inVillaStock
    else if (type === 'LAUNDRY_TO_CLEAN') maxStock = item.laundryStock

    setCart(prev => {
      const current = prev[item.id] || 0
      let updated = Math.max(0, current + delta)
      
      if (updated > maxStock) {
        toast.warning('Stok Terbatas', { description: `Stok maksimal yang tersedia untuk ditarik adalah ${maxStock}.` })
        updated = maxStock
      }
      
      return { ...prev, [item.id]: updated }
    })
  }

  const handleTypeChange = (val: string | null) => {
    setType(val || '')
    setCart({})
  }

  const handleSubmit = async () => {
    if (!type) {
      toast.error('Gagal', { description: 'Pilih jenis transaksi terlebih dahulu.' })
      return
    }

    const payload = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => ({ linenItemId: id, quantity: qty }))

    if (payload.length === 0) {
      toast.error('Gagal', { description: 'Pilih minimal satu item.' })
      return
    }

    setLoading(true)
    try {
      await submitTransaction(type, role, payload, notes)
      toast.success('Berhasil', { description: 'Transaksi sirkulasi berhasil dicatat.' })
      setCart({})
      setNotes('')
    } catch (e: any) {
      toast.error('Gagal', { description: e.message || 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sirkulasi Harian</CardTitle>
          <CardDescription>Pilih jenis transaksi dan masukkan kuantitas per item.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="space-y-2 md:col-span-3">
              <label className="text-sm font-medium">Nama Penulis</label>
              <Input disabled value={session?.user?.name || "Memuat..."} className="bg-slate-50 dark:bg-slate-900" />
            </div>
            <div className="space-y-2 md:col-span-5">
              <label className="text-sm font-medium">Jenis Transaksi</label>
              <Select value={type} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Silakan Pilih...">
                    {type ? typeLabels[type] : "Silakan Pilih..."}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium">Catatan (Opsional)</label>
              <Input placeholder="Keterangan..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <Card key={item.id} className="border-emerald-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription>
                Gudang: {item.cleanStock} | Laundry: {item.laundryStock}
                <br/>
                Kamar: {item.inRoomStock} | Villa: {item.inVillaStock || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{cart[item.id] || 0}</span>
                <div className="grid grid-cols-4 gap-2 w-full">
                  <Button variant="outline" onClick={() => updateQuantity(item, -5)}>-5</Button>
                  <Button variant="outline" onClick={() => updateQuantity(item, -1)}>-1</Button>
                  <Button variant="outline" onClick={() => updateQuantity(item, 1)}>+1</Button>
                  <Button variant="outline" onClick={() => updateQuantity(item, 5)}>+5</Button>
                  <Button variant="outline" className="col-span-2 text-emerald-700 bg-emerald-50" onClick={() => updateQuantity(item, 10)}>+10</Button>
                  <Button variant="outline" className="col-span-2 text-emerald-700 bg-emerald-50" onClick={() => updateQuantity(item, 50)}>+50</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          size="lg" 
          onClick={handleSubmit} 
          disabled={loading} 
          loading={loading}
          className="w-full md:w-auto px-12 bg-emerald-600 hover:bg-emerald-700 min-w-[190px]"
        >
          Submit Transaksi
        </Button>
      </div>
    </div>
  )
}
