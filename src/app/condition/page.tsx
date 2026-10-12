import { getLinenItems } from '../actions'
import ConditionClient from './ConditionClient'

export const dynamic = 'force-dynamic'

export default async function ConditionPage() {
  const items = await getLinenItems()
  
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Pencatatan Kondisi</h2>
        <p className="text-muted-foreground">Catat laporan afkir atau kerusakan linen dengan auto-cut sistem.</p>
      </div>
      
      <ConditionClient items={items} />
    </div>
  )
}
