"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { verifyTransaction, confirmDispute } from "../actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function HandoverClient({ 
  initialPendingHandover, 
  initialPendingDispute, 
  userId 
}: { 
  initialPendingHandover: any[], 
  initialPendingDispute: any[],
  userId: string 
}) {
  const router = useRouter()
  const [tab, setTab] = useState<'verify' | 'dispute'>('verify')
  const [loading, setLoading] = useState(false)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)
  const [editingData, setEditingData] = useState<Record<string, { receivedQty: number }>>({})
  const [disputeNote, setDisputeNote] = useState<string>('')
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)

  const handleQtyChange = (itemId: string, val: string) => {
    const parsed = parseInt(val, 10)
    setEditingData(prev => ({
      ...prev,
      [itemId]: { receivedQty: isNaN(parsed) ? 0 : Math.max(0, parsed) }
    }))
  }

  const submitVerification = async (txId: string, items: any[]) => {
    try {
      setLoading(true)
      setLoadingActionId(`verify-${txId}`)
      const receivedItems = items.map(item => ({
        itemId: item.id,
        receivedQty: editingData[item.id]?.receivedQty !== undefined 
          ? editingData[item.id].receivedQty 
          : item.quantity
      }))
      
      const hasDiscrepancy = receivedItems.some(r => {
        const orig = items.find(i => i.id === r.itemId)
        return orig && r.receivedQty !== orig.quantity
      })

      if (hasDiscrepancy && !disputeNote.trim()) {
        setSelectedTxId(txId)
        toast.warning("Terdapat Selisih", { description: "Harap isi catatan selisih sebelum melanjutkan." })
        setLoading(false)
        setLoadingActionId(null)
        return
      }

      const res = await verifyTransaction(txId, userId, receivedItems, hasDiscrepancy ? disputeNote.trim() : undefined)
      if (res && !res.success) {
        toast.error("Gagal", { description: res.error || "Gagal memproses serah terima" })
        return
      }

      toast.success(hasDiscrepancy ? "Revisi Terkirim!" : "Serah Terima Berhasil!", {
        description: hasDiscrepancy ? "Menunggu konfirmasi dari pihak pengirim." : "Barang telah resmi masuk ke stok Anda."
      })
      
      setSelectedTxId(null)
      setDisputeNote('')
      router.refresh()
    } catch (err: any) {
      toast.error("Gagal", { description: err.message || "Terjadi kesalahan sistem" })
    } finally {
      setLoading(false)
      setLoadingActionId(null)
    }
  }

  const handleDisputeAction = async (txId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      setLoading(true)
      setLoadingActionId(`dispute-${txId}-${action}`)
      const res = await confirmDispute(txId, action)
      if (res && !res.success) {
        toast.error("Gagal", { description: res.error || "Gagal memproses konfirmasi selisih" })
        return
      }
      toast.success(action === 'APPROVE' ? "Selisih Disetujui!" : "Transaksi Dibatalkan", {
        description: action === 'APPROVE' 
          ? "Stok berhasil disesuaikan dengan angka baru." 
          : "Barang telah dikembalikan sepenuhnya ke stok Anda."
      })
      router.refresh()
    } catch (err: any) {
      toast.error("Gagal", { description: err.message || "Terjadi kesalahan sistem" })
    } finally {
      setLoading(false)
      setLoadingActionId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button 
          onClick={() => setTab('verify')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'verify' ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Tugas Verifikasi Anda ({initialPendingHandover.length})
        </button>
        <button 
          onClick={() => setTab('dispute')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === 'dispute' ? 'bg-white dark:bg-slate-900 border-t border-l border-r border-slate-200 dark:border-slate-800 text-orange-600 dark:text-orange-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Menunggu Konfirmasi Anda ({initialPendingDispute.length})
        </button>
      </div>

      <Card className="border-t-0 rounded-tl-none shadow-sm">
        <CardContent className="p-0">
          {tab === 'verify' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead>Pengirim</TableHead>
                    <TableHead>Jenis Pengiriman</TableHead>
                    <TableHead>Detail Barang (Ubah jika kurang)</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPendingHandover.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Belum ada barang masuk yang perlu diverifikasi.</TableCell></TableRow>
                  ) : initialPendingHandover.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">{tx.createdBy.name}</TableCell>
                      <TableCell><Badge variant="outline">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {tx.items.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <span className="text-sm font-medium">{item.linenItem.name}</span>
                              <span className="text-sm text-slate-500 whitespace-nowrap">Dikirim: {item.quantity}</span>
                              <span className="text-sm">→ Diterima:</span>
                              <Input 
                                type="number" 
                                min={0}
                                className="w-20 h-8" 
                                value={editingData[item.id]?.receivedQty ?? item.quantity}
                                onChange={(e) => handleQtyChange(item.id, e.target.value)}
                              />
                            </div>
                          ))}
                          {selectedTxId === tx.id && (
                            <div className="pt-2">
                              <Input 
                                placeholder="Tulis catatan (misal: 2 pcs sprei kotor tertinggal)"
                                value={disputeNote}
                                onChange={(e) => setDisputeNote(e.target.value)}
                                className="border-orange-200 focus-visible:ring-orange-500"
                              />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          onClick={() => submitVerification(tx.id, tx.items)} 
                          disabled={loading}
                          loading={loadingActionId === `verify-${tx.id}`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[125px]"
                        >
                          {selectedTxId === tx.id ? "Konfirmasi Revisi" : "Terima Barang"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {tab === 'dispute' && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="whitespace-nowrap">Waktu</TableHead>
                    <TableHead>Penerima</TableHead>
                    <TableHead>Jenis Pengiriman</TableHead>
                    <TableHead>Laporan Selisih</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {initialPendingDispute.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-slate-500">Tidak ada laporan selisih yang menunggu konfirmasi Anda.</TableCell></TableRow>
                  ) : initialPendingDispute.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium">{tx.acceptedBy?.name || 'Sistem'}</TableCell>
                      <TableCell><Badge variant="outline">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {tx.items.map((item: any) => (
                            <div key={item.id} className="text-sm">
                              {item.quantity !== item.receivedQty ? (
                                <span className="text-red-600 font-medium">{item.linenItem.name}: {item.quantity} → {item.receivedQty}</span>
                              ) : (
                                <span className="text-slate-500">{item.linenItem.name}: {item.quantity} (Pas)</span>
                              )}
                            </div>
                          ))}
                          <div className="mt-2 text-sm italic text-orange-600 bg-orange-50 dark:bg-orange-950/30 p-2 rounded border border-orange-100 dark:border-orange-900">
                            " {tx.disputeNotes} "
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDisputeAction(tx.id, 'REJECT')} 
                          disabled={loading}
                          loading={loadingActionId === `dispute-${tx.id}-REJECT`}
                          className="text-red-600 border-red-200 hover:bg-red-50 min-w-[95px]"
                        >
                          Batal Total
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleDisputeAction(tx.id, 'APPROVE')} 
                          disabled={loading}
                          loading={loadingActionId === `dispute-${tx.id}-APPROVE`}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[115px]"
                        >
                          Setujui Selisih
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
