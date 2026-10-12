'use client'

import { Button } from '@/components/ui/button'
import { Printer, Download } from 'lucide-react'

export default function ReportActions({ data, filename }: { data: any[], filename: string }) {
  
  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" onClick={handlePrint} className="gap-2">
        <Printer className="w-4 h-4" /> Cetak
      </Button>
      <Button variant="default" onClick={handleExportCSV} className="gap-2">
        <Download className="w-4 h-4" /> Ekspor CSV
      </Button>
    </div>
  )
}
