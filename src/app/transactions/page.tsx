import { getLinenItems } from '../actions'
import TransactionClient from './TransactionClient'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const items = await getLinenItems()
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Transaksi Sirkulasi</h2>
        <p className="text-muted-foreground">Kelola serah terima linen kotor dan bersih antar divisi.</p>
      </div>
      
      <TransactionClient items={items} />
    </div>
  )
}
