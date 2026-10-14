'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { submitConditionLog } from '../actions'
import { useSession } from 'next-auth/react'

export default function ConditionClient({ items }: { items: any[] }) {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const [selectedItem, setSelectedItem] = useState('')
  const [condition, setCondition] = useState('DAMAGED')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const conditionLabels: Record<string, string> = {
    'STAINED': 'Stained (Cuci Ulang Khusus)',
    'DAMAGED': 'Damaged / Condemned (Afkir)'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || quantity <= 0) {
      toast.error('Gagal', { description: 'Pilih item dan kuantitas valid.' })
      return
    }

    setLoading(true)
    try {
      await submitConditionLog(role, selectedItem, condition, quantity, notes)
      toast.success('Berhasil', { 
        description: condition === 'DAMAGED' 
          ? `Linen afkir dicatat. ${quantity} unit terpotong otomatis dari persediaan aktif.`
          : 'Kondisi linen berhasil dicatat.'
      })
      setQuantity(1)
      setNotes('')
    } catch (e: any) {
      toast.error('Gagal', { description: e.message || 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Log Kondisi & Afkir</CardTitle>
          <CardDescription>Laporkan linen yang rusak, noda permanen, atau afkir.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Penulis</label>
              <Input disabled value={session?.user?.name || "Memuat..."} className="bg-slate-50 dark:bg-slate-900" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Item Linen</label>
              <Select value={selectedItem} onValueChange={(val) => setSelectedItem(val as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Linen">
                    {items.find(i => i.id === selectedItem)?.name || "Pilih Linen"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {items.map(item => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Kondisi</label>
              <Select value={condition} onValueChange={(val) => setCondition(val as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kondisi">{conditionLabels[condition]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STAINED">Stained (Cuci Ulang Khusus)</SelectItem>
                  <SelectItem value="DAMAGED" className="text-red-600 font-semibold">Damaged / Condemned (Afkir)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kuantitas</label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} required />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan / Keterangan Kategori Noda</label>
              <Input placeholder="Misal: Robek besar, Noda darah..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={loading || !selectedItem} 
                loading={loading}
                className={`w-full ${condition === 'DAMAGED' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                Laporkan Kondisi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-red-100 bg-red-50/50">
        <CardHeader>
          <CardTitle className="text-red-800">Kebijakan Otomatisasi Sistem</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-900 space-y-3">
          <p>
            <strong>Tindakan Afkir (Damaged/Condemned):</strong><br/>
            Ketika Anda melaporkan item sebagai <em>Damaged</em>, sistem akan secara otomatis memotong stok aktif dari gudang dan memindahkannya ke dalam daftar Afkir permanen.
          </p>
          <p>
            Aksi ini bersifat permanen dan akan langsung mengurangi indikator <strong>Par Stock Health</strong> serta menambah daftar kebutuhan pengadaan unit baru.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
