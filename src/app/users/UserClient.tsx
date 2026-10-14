"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { createUser } from "../actions"
import { Loader2 } from "lucide-react"

export default function UserClient({ users }: { users: any[] }) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("STAF_HOUSEKEEPING")
  const [password, setPassword] = useState("")

  const isAdmin = session?.user?.role === "ADMIN_EXECUTIVE_HOUSEKEEPER"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error("Form tidak lengkap")
      return
    }

    setLoading(true)
    try {
      await createUser({ name, email, role, passwordRaw: password })
      toast.success("Berhasil menambahkan staf baru")
      setName("")
      setEmail("")
      setPassword("")
    } catch (e: any) {
      toast.error("Gagal menambahkan akun", { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  if (!isAdmin) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-md">Akses Ditolak. Hanya Admin yang dapat melihat halaman ini.</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daftarkan Akun Baru</CardTitle>
          <CardDescription>Buat akun login untuk staf Housekeeping atau Laundry baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lengkap</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Misal: Joko Susanto" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat Email (Untuk Login)</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="joko@greenstar.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jabatan / Peran</label>
                <Select value={role} onValueChange={(val) => setRole(val || "STAF_HOUSEKEEPING")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAF_HOUSEKEEPING">Staf Housekeeping</SelectItem>
                    <SelectItem value="STAF_LAUNDRY">Staf Laundry</SelectItem>
                    <SelectItem value="ADMIN_EXECUTIVE_HOUSEKEEPER">Admin / Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kata Sandi</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter" required minLength={6} />
              </div>
            </div>
            
            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={loading} loading={loading} className="bg-emerald-600 hover:bg-emerald-700 min-w-[130px]">
                Daftarkan Staf
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    {u.role === 'ADMIN_EXECUTIVE_HOUSEKEEPER' ? 'Admin' : 
                     u.role === 'STAF_HOUSEKEEPING' ? 'Housekeeping' : 'Laundry'}
                  </TableCell>
                  <TableCell>{new Date(u.createdAt).toLocaleDateString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
