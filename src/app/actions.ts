'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// -----------------------------------------------------------------------------
// MASTER DATA
// -----------------------------------------------------------------------------

export async function getLinenItems() {
  return await prisma.linenItem.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getUsers() {
  return await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: { name: string; email: string; role: string; passwordRaw: string }) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
    throw new Error("Hanya Admin yang dapat membuat pengguna baru")
  }
  
  // Need bcrypt to hash the new password.
  // We can't import bcrypt at the top level of actions.ts because it might break Edge if we used Edge, but Node.js is fine.
  // Actually, Server Actions run in Node runtime by default.
  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(data.passwordRaw, 10)

  await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role,
      password: hashedPassword
    }
  })
  
  revalidatePath('/users')
}

// -----------------------------------------------------------------------------
// DASHBOARD & SUMMARY
// -----------------------------------------------------------------------------

export async function getDashboardSummary() {
  const items = await prisma.linenItem.findMany()
  
  let totalClean = 0
  let totalLaundry = 0
  let totalInRoom = 0
  let totalInVilla = 0
  let totalCondemned = 0
  
  items.forEach(item => {
    totalClean += item.cleanStock
    totalLaundry += item.laundryStock
    totalInRoom += item.inRoomStock
    totalInVilla += item.inVillaStock
    totalCondemned += item.condemnedStock
  })
  
  return {
    totalClean,
    totalLaundry,
    totalInRoom,
    totalInVilla,
    totalCondemned,
    items
  }
}

// -----------------------------------------------------------------------------
// TRANSACTIONS
// -----------------------------------------------------------------------------

export async function submitTransaction(
  type: string, // DIRTY_HOTEL_TO_LAUNDRY, DIRTY_VILLA_TO_LAUNDRY, LAUNDRY_TO_CLEAN, CLEAN_TO_HOTEL, CLEAN_TO_VILLA
  role: string, // Kept for signature compatibility, but ignored for auth
  items: { linenItemId: string; quantity: number }[],
  notes?: string
) {
  if (!items.length) throw new Error("Item tidak boleh kosong");

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  return await prisma.$transaction(async (tx) => {
    const transactionNo = `TRX-${Date.now()}`
    
    const isInternal = type === 'CLEAN_TO_HOTEL' || type === 'CLEAN_TO_VILLA'
    
    const trx = await tx.transaction.create({
      data: {
        transactionNo,
        type,
        notes,
        status: isInternal ? 'ACCEPTED' : 'PENDING',
        createdById: userId,
        acceptedById: isInternal ? userId : null,
        items: {
          create: items.map(i => ({
            linenItemId: i.linenItemId,
            quantity: i.quantity,
            receivedQty: isInternal ? i.quantity : null
          }))
        }
      }
    })

    // Mutate Stock
    for (const item of items) {
      if (type === 'DIRTY_HOTEL_TO_LAUNDRY') {
        await tx.linenItem.update({
          where: { id: item.linenItemId },
          data: {
            inRoomStock: { decrement: item.quantity },
            transitStock: { increment: item.quantity }
          }
        })
      } else if (type === 'DIRTY_VILLA_TO_LAUNDRY') {
        await tx.linenItem.update({
          where: { id: item.linenItemId },
          data: {
            inVillaStock: { decrement: item.quantity },
            transitStock: { increment: item.quantity }
          }
        })
      } else if (type === 'LAUNDRY_TO_CLEAN') {
        await tx.linenItem.update({
          where: { id: item.linenItemId },
          data: {
            laundryStock: { decrement: item.quantity },
            transitStock: { increment: item.quantity }
          }
        })
      } else if (type === 'CLEAN_TO_HOTEL') {
        // Internal, bypass transit
        await tx.linenItem.update({
          where: { id: item.linenItemId },
          data: {
            cleanStock: { decrement: item.quantity },
            inRoomStock: { increment: item.quantity }
          }
        })
      } else if (type === 'CLEAN_TO_VILLA') {
        // Internal, bypass transit
        await tx.linenItem.update({
          where: { id: item.linenItemId },
          data: {
            cleanStock: { decrement: item.quantity },
            inVillaStock: { increment: item.quantity }
          }
        })
      }
    }

    revalidatePath('/')
    revalidatePath('/transactions')
    return trx
  })
}

// -----------------------------------------------------------------------------
// CONDITION LOGGING
// -----------------------------------------------------------------------------

export async function submitConditionLog(
  role: string, // Ignored for auth
  linenItemId: string,
  condition: string, // GOOD, STAINED, DAMAGED
  quantity: number,
  notes?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  return await prisma.$transaction(async (tx) => {
    const log = await tx.conditionLog.create({
      data: {
        linenItemId,
        condition,
        quantity,
        notes,
        reportedById: userId
      }
    })

    if (condition === 'DAMAGED') {
      // Auto cut from active inventory (assume it cuts from cleanStock for now)
      // and add to condemned
      await tx.linenItem.update({
        where: { id: linenItemId },
        data: {
          totalAsset: { decrement: quantity },
          cleanStock: { decrement: quantity }, // Attempt to decrement from clean
          condemnedStock: { increment: quantity }
        }
      })
    }

    revalidatePath('/')
    revalidatePath('/condition')
    revalidatePath('/procurement')
    return log
  })
}

// -----------------------------------------------------------------------------
// HISTORY & LOGS
// -----------------------------------------------------------------------------

export async function getTransactionHistory({ 
  search = '', 
  page = 1, 
  limit = 10,
  startDate,
  endDate
}: { 
  search?: string, 
  page?: number, 
  limit?: number,
  startDate?: string,
  endDate?: string
} = {}) {
  const skip = (page - 1) * limit
  
  const where: any = {}
  
  if (search) {
    where.OR = [
      { transactionNo: { contains: search } },
      { type: { contains: search } },
      { notes: { contains: search } },
      { createdBy: { name: { contains: search } } },
      { items: { some: { linenItem: { name: { contains: search } } } } }
    ]
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`)
    }
  }

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        createdBy: { select: { name: true, role: true } },
        items: { include: { linenItem: { select: { name: true } } } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.transaction.count({ where })
  ])

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function getConditionHistory({ 
  search = '', 
  page = 1, 
  limit = 10,
  startDate,
  endDate
}: { 
  search?: string, 
  page?: number, 
  limit?: number,
  startDate?: string,
  endDate?: string
} = {}) {
  const skip = (page - 1) * limit
  
  const where: any = {}
  
  if (search) {
    where.OR = [
      { condition: { contains: search } },
      { notes: { contains: search } },
      { reportedBy: { name: { contains: search } } },
      { linenItem: { name: { contains: search } } }
    ]
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate) {
      where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`)
    }
  }

  const [data, total] = await Promise.all([
    prisma.conditionLog.findMany({
      where,
      include: {
        reportedBy: { select: { name: true, role: true } },
        linenItem: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.conditionLog.count({ where })
  ])

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// -----------------------------------------------------------------------------
// OCCUPANCY
// -----------------------------------------------------------------------------

export async function submitOccupancy(occupiedRooms: number, occupiedVillas: number, totalRooms: number = 100, totalVillas: number = 20) {
  const result = await prisma.dailyOccupancy.create({
    data: {
      occupiedRooms,
      totalRooms,
      occupiedVillas,
      totalVillas
    }
  })
  revalidatePath('/')
  return result
}

export async function getLatestOccupancy() {
  return await prisma.dailyOccupancy.findFirst({
    orderBy: { createdAt: 'desc' }
  })
}

// -----------------------------------------------------------------------------
// HANDOVER & DISPUTE
// -----------------------------------------------------------------------------

export async function getPendingHandover(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return []

  // Receivers mapping:
  // HOUSEKEEPING receives: LAUNDRY_TO_CLEAN
  // LAUNDRY receives: DIRTY_HOTEL_TO_LAUNDRY, DIRTY_VILLA_TO_LAUNDRY
  const types = user.role === 'STAF_LAUNDRY' 
    ? ['DIRTY_HOTEL_TO_LAUNDRY', 'DIRTY_VILLA_TO_LAUNDRY'] 
    : ['LAUNDRY_TO_CLEAN', 'CLEAN_TO_HOTEL', 'CLEAN_TO_VILLA']

  return await prisma.transaction.findMany({
    where: { status: 'PENDING', type: { in: types } },
    include: {
      createdBy: { select: { name: true, role: true } },
      items: { include: { linenItem: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function getPendingDispute(userId: string) {
  return await prisma.transaction.findMany({
    where: { status: 'DISPUTED', createdById: userId },
    include: {
      acceptedBy: { select: { name: true, role: true } },
      items: { include: { linenItem: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function verifyTransaction(transactionId: string, userId: string, receivedItems: { itemId: string, receivedQty: number }[], notes?: string) {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true }
    })
    
    if (!transaction || transaction.status !== 'PENDING') throw new Error("Transaksi tidak valid")

    let hasDiscrepancy = false
    
    for (const submittedItem of transaction.items) {
      const rec = receivedItems.find(r => r.itemId === submittedItem.id)
      const rQty = rec ? rec.receivedQty : submittedItem.quantity
      if (rQty !== submittedItem.quantity) hasDiscrepancy = true
      
      await tx.transactionItem.update({
        where: { id: submittedItem.id },
        data: { receivedQty: rQty }
      })
    }

    if (hasDiscrepancy) {
      // Disputed
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'DISPUTED', acceptedById: userId, disputeNotes: notes }
      })
    } else {
      // Accepted completely
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'ACCEPTED', acceptedById: userId }
      })
      
      // Move from transit to destination
      for (const item of transaction.items) {
        if (transaction.type.includes('TO_LAUNDRY')) {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: item.quantity }, laundryStock: { increment: item.quantity } } })
        } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: item.quantity }, cleanStock: { increment: item.quantity } } })
        } else if (transaction.type === 'CLEAN_TO_HOTEL') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: item.quantity }, inRoomStock: { increment: item.quantity } } })
        } else if (transaction.type === 'CLEAN_TO_VILLA') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: item.quantity }, inVillaStock: { increment: item.quantity } } })
        }
      }
    }
  })
}

export async function confirmDispute(transactionId: string, action: 'APPROVE' | 'REJECT') {
  return await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.findUnique({
      where: { id: transactionId },
      include: { items: true }
    })
    
    if (!transaction || transaction.status !== 'DISPUTED') throw new Error("Transaksi tidak valid")

    if (action === 'REJECT') {
      // Return everything from transit back to source
      for (const item of transaction.items) {
        const qty = item.quantity
        if (transaction.type === 'DIRTY_HOTEL_TO_LAUNDRY') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: qty }, inRoomStock: { increment: qty } } })
        } else if (transaction.type === 'DIRTY_VILLA_TO_LAUNDRY') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: qty }, inVillaStock: { increment: qty } } })
        } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: qty }, laundryStock: { increment: qty } } })
        } else if (transaction.type === 'CLEAN_TO_HOTEL' || transaction.type === 'CLEAN_TO_VILLA') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: qty }, cleanStock: { increment: qty } } })
        }
      }
      await tx.transaction.update({ where: { id: transactionId }, data: { status: 'REJECTED' } })
    } else {
      // Approve the revised amounts
      for (const item of transaction.items) {
        const originalQty = item.quantity
        const rQty = item.receivedQty ?? originalQty
        const missingQty = originalQty - rQty

        if (transaction.type === 'DIRTY_HOTEL_TO_LAUNDRY') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: originalQty }, laundryStock: { increment: rQty }, inRoomStock: { increment: missingQty } } })
        } else if (transaction.type === 'DIRTY_VILLA_TO_LAUNDRY') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: originalQty }, laundryStock: { increment: rQty }, inVillaStock: { increment: missingQty } } })
        } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: originalQty }, cleanStock: { increment: rQty }, laundryStock: { increment: missingQty } } })
        } else if (transaction.type === 'CLEAN_TO_HOTEL') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: originalQty }, inRoomStock: { increment: rQty }, cleanStock: { increment: missingQty } } })
        } else if (transaction.type === 'CLEAN_TO_VILLA') {
          await tx.linenItem.update({ where: { id: item.linenItemId }, data: { transitStock: { decrement: originalQty }, inVillaStock: { increment: rQty }, cleanStock: { increment: missingQty } } })
        }
      }
      await tx.transaction.update({ where: { id: transactionId }, data: { status: 'ACCEPTED' } })
    }
  })
}
