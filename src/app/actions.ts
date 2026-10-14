'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// -----------------------------------------------------------------------------
// MASTER DATA
// -----------------------------------------------------------------------------

export async function getLinenItems() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

  return await prisma.linenItem.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function getUsers() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
    throw new Error("Unauthorized: Hanya Admin yang dapat melihat daftar pengguna")
  }

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
  
  if (!data.name?.trim() || !data.email?.trim() || !data.passwordRaw || !data.role) {
    throw new Error("Semua field wajib diisi")
  }
  if (!['ADMIN_EXECUTIVE_HOUSEKEEPER', 'STAF_HOUSEKEEPING', 'STAF_LAUNDRY'].includes(data.role)) {
    throw new Error("Role pengguna tidak valid")
  }
  if (data.passwordRaw.length < 6) {
    throw new Error("Password minimal 6 karakter")
  }

  const bcrypt = require('bcryptjs')
  const hashedPassword = await bcrypt.hash(data.passwordRaw, 10)

  await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
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
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

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
  type: string,
  role: string,
  items: { linenItemId: string; quantity: number }[],
  notes?: string
) {
  if (!items || !items.length) throw new Error("Item tidak boleh kosong");

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id
  const userRole = session.user.role

  const allowedHousekeepingTypes = ['DIRTY_HOTEL_TO_LAUNDRY', 'DIRTY_VILLA_TO_LAUNDRY', 'CLEAN_TO_HOTEL', 'CLEAN_TO_VILLA']
  const allowedLaundryTypes = ['LAUNDRY_TO_CLEAN']

  if (userRole === 'STAF_HOUSEKEEPING' && !allowedHousekeepingTypes.includes(type)) {
    throw new Error("Staf Housekeeping tidak memiliki izin untuk jenis transaksi ini")
  }
  if (userRole === 'STAF_LAUNDRY' && !allowedLaundryTypes.includes(type)) {
    throw new Error("Staf Laundry tidak memiliki izin untuk jenis transaksi ini")
  }
  if (!['ADMIN_EXECUTIVE_HOUSEKEEPER', 'STAF_HOUSEKEEPING', 'STAF_LAUNDRY'].includes(userRole)) {
    throw new Error("Role tidak memiliki izin untuk membuat transaksi")
  }
  if (![...allowedHousekeepingTypes, ...allowedLaundryTypes].includes(type)) {
    throw new Error("Jenis transaksi tidak valid")
  }

  // Validate item entries and quantities
  for (const item of items) {
    if (!item.linenItemId || typeof item.linenItemId !== 'string') {
      throw new Error("ID item linen tidak valid")
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new Error("Kuantitas setiap item harus berupa bilangan bulat positif (> 0)")
    }
  }

  return await prisma.$transaction(async (tx) => {
    const transactionNo = `TRX-${Date.now()}`
    
    const isInternal = type === 'CLEAN_TO_HOTEL' || type === 'CLEAN_TO_VILLA'

    // Batch query all linen items to avoid N roundtrips
    const linenItemIds = items.map(i => i.linenItemId)
    const currentItems = await tx.linenItem.findMany({
      where: { id: { in: linenItemIds } }
    })
    const itemMap = new Map(currentItems.map(i => [i.id, i]))

    // In-memory stock sufficiency validation
    for (const item of items) {
      const currentItem = itemMap.get(item.linenItemId)
      if (!currentItem) {
        throw new Error("Item linen tidak ditemukan")
      }

      if (type === 'DIRTY_HOTEL_TO_LAUNDRY') {
        if (currentItem.inRoomStock < item.quantity) {
          throw new Error(`Stok di kamar hotel untuk ${currentItem.name} tidak mencukupi (Tersedia: ${currentItem.inRoomStock}, Diminta: ${item.quantity})`)
        }
      } else if (type === 'DIRTY_VILLA_TO_LAUNDRY') {
        if (currentItem.inVillaStock < item.quantity) {
          throw new Error(`Stok di villa untuk ${currentItem.name} tidak mencukupi (Tersedia: ${currentItem.inVillaStock}, Diminta: ${item.quantity})`)
        }
      } else if (type === 'LAUNDRY_TO_CLEAN') {
        if (currentItem.laundryStock < item.quantity) {
          throw new Error(`Stok di laundry untuk ${currentItem.name} tidak mencukupi (Tersedia: ${currentItem.laundryStock}, Diminta: ${item.quantity})`)
        }
      } else if (type === 'CLEAN_TO_HOTEL') {
        if (currentItem.cleanStock < item.quantity) {
          throw new Error(`Stok bersih di gudang untuk ${currentItem.name} tidak mencukupi (Tersedia: ${currentItem.cleanStock}, Diminta: ${item.quantity})`)
        }
      } else if (type === 'CLEAN_TO_VILLA') {
        if (currentItem.cleanStock < item.quantity) {
          throw new Error(`Stok bersih di gudang untuk ${currentItem.name} tidak mencukupi (Tersedia: ${currentItem.cleanStock}, Diminta: ${item.quantity})`)
        }
      }
    }

    // Mutate Stock in parallel
    await Promise.all(
      items.map(item => {
        if (type === 'DIRTY_HOTEL_TO_LAUNDRY') {
          return tx.linenItem.update({
            where: { id: item.linenItemId },
            data: {
              inRoomStock: { decrement: item.quantity },
              transitStock: { increment: item.quantity }
            }
          })
        } else if (type === 'DIRTY_VILLA_TO_LAUNDRY') {
          return tx.linenItem.update({
            where: { id: item.linenItemId },
            data: {
              inVillaStock: { decrement: item.quantity },
              transitStock: { increment: item.quantity }
            }
          })
        } else if (type === 'LAUNDRY_TO_CLEAN') {
          return tx.linenItem.update({
            where: { id: item.linenItemId },
            data: {
              laundryStock: { decrement: item.quantity },
              transitStock: { increment: item.quantity }
            }
          })
        } else if (type === 'CLEAN_TO_HOTEL') {
          return tx.linenItem.update({
            where: { id: item.linenItemId },
            data: {
              cleanStock: { decrement: item.quantity },
              inRoomStock: { increment: item.quantity }
            }
          })
        } else if (type === 'CLEAN_TO_VILLA') {
          return tx.linenItem.update({
            where: { id: item.linenItemId },
            data: {
              cleanStock: { decrement: item.quantity },
              inVillaStock: { increment: item.quantity }
            }
          })
        }
      })
    )

    const trx = await tx.transaction.create({
      data: {
        transactionNo,
        type,
        notes: notes?.trim() || null,
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

    revalidatePath('/')
    revalidatePath('/transactions')
    revalidatePath('/handover')
    return trx
  }, {
    maxWait: 15000,
    timeout: 30000
  })
}

// -----------------------------------------------------------------------------
// CONDITION LOGGING
// -----------------------------------------------------------------------------

export async function submitConditionLog(
  role: string,
  linenItemId: string,
  condition: string,
  quantity: number,
  notes?: string
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const userId = session.user.id

  if (!linenItemId || typeof linenItemId !== 'string') {
    throw new Error("Item linen wajib dipilih")
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Kuantitas harus berupa bilangan bulat positif (> 0)")
  }
  if (!['GOOD', 'STAINED', 'DAMAGED'].includes(condition)) {
    throw new Error("Status kondisi tidak valid")
  }

  return await prisma.$transaction(async (tx) => {
    const currentItem = await tx.linenItem.findUnique({
      where: { id: linenItemId }
    })
    if (!currentItem) throw new Error("Item linen tidak ditemukan")

    if (condition === 'DAMAGED') {
      if (currentItem.cleanStock < quantity) {
        throw new Error(`Stok bersih di gudang tidak mencukupi untuk afkir (Tersedia: ${currentItem.cleanStock}, Diminta: ${quantity})`)
      }
      await tx.linenItem.update({
        where: { id: linenItemId },
        data: {
          totalAsset: { decrement: quantity },
          cleanStock: { decrement: quantity },
          condemnedStock: { increment: quantity }
        }
      })
    }

    const log = await tx.conditionLog.create({
      data: {
        linenItemId,
        condition,
        quantity,
        notes: notes?.trim() || null,
        reportedById: userId
      }
    })

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
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
    throw new Error("Unauthorized: Hanya Admin yang dapat melihat riwayat transaksi")
  }

  const safePage = Math.max(1, Number.isInteger(page) ? page : 1)
  const safeLimit = Math.min(100, Math.max(1, Number.isInteger(limit) ? limit : 10))
  const skip = (safePage - 1) * safeLimit
  
  const where: any = {}
  
  if (search && typeof search === 'string') {
    const cleanSearch = search.trim()
    if (cleanSearch) {
      where.OR = [
        { transactionNo: { contains: cleanSearch, mode: 'insensitive' } },
        { type: { contains: cleanSearch, mode: 'insensitive' } },
        { notes: { contains: cleanSearch, mode: 'insensitive' } },
        { createdBy: { name: { contains: cleanSearch, mode: 'insensitive' } } },
        { items: { some: { linenItem: { name: { contains: cleanSearch, mode: 'insensitive' } } } } }
      ]
    }
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate && !isNaN(Date.parse(startDate))) {
      where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate && !isNaN(Date.parse(endDate))) {
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
      take: safeLimit
    }),
    prisma.transaction.count({ where })
  ])

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
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
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
    throw new Error("Unauthorized: Hanya Admin yang dapat melihat riwayat kondisi")
  }

  const safePage = Math.max(1, Number.isInteger(page) ? page : 1)
  const safeLimit = Math.min(100, Math.max(1, Number.isInteger(limit) ? limit : 10))
  const skip = (safePage - 1) * safeLimit
  
  const where: any = {}
  
  if (search && typeof search === 'string') {
    const cleanSearch = search.trim()
    if (cleanSearch) {
      where.OR = [
        { condition: { contains: cleanSearch, mode: 'insensitive' } },
        { notes: { contains: cleanSearch, mode: 'insensitive' } },
        { reportedBy: { name: { contains: cleanSearch, mode: 'insensitive' } } },
        { linenItem: { name: { contains: cleanSearch, mode: 'insensitive' } } }
      ]
    }
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate && !isNaN(Date.parse(startDate))) {
      where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`)
    }
    if (endDate && !isNaN(Date.parse(endDate))) {
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
      take: safeLimit
    }),
    prisma.conditionLog.count({ where })
  ])

  return {
    data,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  }
}

// -----------------------------------------------------------------------------
// OCCUPANCY
// -----------------------------------------------------------------------------

export async function submitOccupancy(occupiedRooms: number, occupiedVillas: number, totalRooms: number = 100, totalVillas: number = 20) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  if (!Number.isInteger(occupiedRooms) || occupiedRooms < 0) {
    throw new Error("Jumlah kamar terisi harus berupa angka bulat non-negatif")
  }
  if (!Number.isInteger(occupiedVillas) || occupiedVillas < 0) {
    throw new Error("Jumlah villa terisi harus berupa angka bulat non-negatif")
  }
  if (!Number.isInteger(totalRooms) || totalRooms <= 0) {
    totalRooms = 100
  }
  if (!Number.isInteger(totalVillas) || totalVillas <= 0) {
    totalVillas = 20
  }

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
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("Unauthorized")

  return await prisma.dailyOccupancy.findFirst({
    orderBy: { createdAt: 'desc' }
  })
}

// -----------------------------------------------------------------------------
// HANDOVER & DISPUTE
// -----------------------------------------------------------------------------

export async function getPendingHandover(userId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Selalu gunakan ID pengguna terautentikasi untuk keamanan
  const verifiedUserId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: verifiedUserId } })
  if (!user) return []

  // Receivers mapping:
  // ADMIN can view all handovers
  // HOUSEKEEPING receives: LAUNDRY_TO_CLEAN, CLEAN_TO_HOTEL, CLEAN_TO_VILLA
  // LAUNDRY receives: DIRTY_HOTEL_TO_LAUNDRY, DIRTY_VILLA_TO_LAUNDRY
  const types = user.role === 'ADMIN_EXECUTIVE_HOUSEKEEPER'
    ? ['DIRTY_HOTEL_TO_LAUNDRY', 'DIRTY_VILLA_TO_LAUNDRY', 'LAUNDRY_TO_CLEAN', 'CLEAN_TO_HOTEL', 'CLEAN_TO_VILLA']
    : user.role === 'STAF_LAUNDRY' 
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

export async function getPendingDispute(userId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")

  const verifiedUserId = session.user.id
  const userRole = session.user.role

  const where: any = { status: 'DISPUTED' }
  if (userRole !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
    where.createdById = verifiedUserId
  }

  return await prisma.transaction.findMany({
    where,
    include: {
      acceptedBy: { select: { name: true, role: true } },
      items: { include: { linenItem: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function verifyTransaction(transactionId: string, userId: string, receivedItems: { itemId: string, receivedQty: number }[], notes?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const verifiedUserId = session.user.id
  const userRole = session.user.role

  if (!transactionId || typeof transactionId !== 'string') {
    throw new Error("ID transaksi tidak valid")
  }
  if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
    throw new Error("Daftar item tidak valid atau kosong")
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      })
      
      if (!transaction || transaction.status !== 'PENDING') {
        throw new Error("Transaksi tidak valid atau sudah selesai diproses")
      }

      // Validasi wewenang penerima berdasarkan peran
      if (userRole === 'STAF_LAUNDRY' && !transaction.type.includes('TO_LAUNDRY')) {
        throw new Error("Staf Laundry hanya dapat memverifikasi pengiriman ke Laundry")
      }
      if (userRole === 'STAF_HOUSEKEEPING' && transaction.type.includes('TO_LAUNDRY')) {
        throw new Error("Staf Housekeeping tidak dapat memverifikasi pengiriman ke Laundry")
      }

      let hasDiscrepancy = false
      const itemUpdates: { id: string; receivedQty: number }[] = []

      for (const submittedItem of transaction.items) {
        const rec = receivedItems.find(r => r.itemId === submittedItem.id)
        const rawQty = rec !== undefined ? rec.receivedQty : submittedItem.quantity
        const rQty = Number(rawQty)

        if (!Number.isInteger(rQty) || rQty < 0) {
          throw new Error("Kuantitas barang yang diterima harus berupa bilangan bulat non-negatif")
        }
        if (rQty > submittedItem.quantity) {
          throw new Error(`Kuantitas diterima (${rQty}) tidak boleh melebihi kuantitas dikirim (${submittedItem.quantity})`)
        }

        if (rQty !== submittedItem.quantity) {
          hasDiscrepancy = true
        }

        itemUpdates.push({
          id: submittedItem.id,
          receivedQty: rQty
        })
      }

      // Update seluruh item transaksi secara bersamaan
      await Promise.all(
        itemUpdates.map(u => 
          tx.transactionItem.update({
            where: { id: u.id },
            data: { receivedQty: u.receivedQty }
          })
        )
      )

      if (hasDiscrepancy) {
        // Disputed
        await tx.transaction.update({
          where: { id: transactionId },
          data: { 
            status: 'DISPUTED', 
            acceptedById: verifiedUserId, 
            disputeNotes: notes?.trim() || null 
          }
        })
      } else {
        // Accepted completely
        await tx.transaction.update({
          where: { id: transactionId },
          data: { 
            status: 'ACCEPTED', 
            acceptedById: verifiedUserId 
          }
        })
        
        // Move from transit to destination secara paralel
        await Promise.all(
          transaction.items.map(item => {
            if (transaction.type.includes('TO_LAUNDRY')) {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { 
                  transitStock: { decrement: item.quantity }, 
                  laundryStock: { increment: item.quantity } 
                } 
              })
            } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { 
                  transitStock: { decrement: item.quantity }, 
                  cleanStock: { increment: item.quantity } 
                } 
              })
            } else if (transaction.type === 'CLEAN_TO_HOTEL') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { 
                  transitStock: { decrement: item.quantity }, 
                  inRoomStock: { increment: item.quantity } 
                } 
              })
            } else if (transaction.type === 'CLEAN_TO_VILLA') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { 
                  transitStock: { decrement: item.quantity }, 
                  inVillaStock: { increment: item.quantity } 
                } 
              })
            }
          })
        )
      }

      return { hasDiscrepancy }
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    revalidatePath('/handover')
    revalidatePath('/transactions')
    revalidatePath('/')
    
    return { success: true, hasDiscrepancy: result.hasDiscrepancy }
  } catch (error: any) {
    console.error("verifyTransaction error:", error)
    return { success: false, error: error.message || "Gagal memproses serah terima" }
  }
}

export async function confirmDispute(transactionId: string, action: 'APPROVE' | 'REJECT') {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized")
  const verifiedUserId = session.user.id
  const userRole = session.user.role

  if (!['APPROVE', 'REJECT'].includes(action)) {
    throw new Error("Aksi konfirmasi selisih tidak valid")
  }
  if (!transactionId || typeof transactionId !== 'string') {
    throw new Error("ID transaksi tidak valid")
  }

  try {
    await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { items: true }
      })
      
      if (!transaction || transaction.status !== 'DISPUTED') {
        throw new Error("Transaksi tidak valid atau bukan status DISPUTED")
      }

      // Hanya pembuat transaksi atau Admin yang berhak menyetujui/menolak selisih
      if (transaction.createdById !== verifiedUserId && userRole !== 'ADMIN_EXECUTIVE_HOUSEKEEPER') {
        throw new Error("Unauthorized: Hanya pembuat transaksi atau Admin yang dapat menyelesaikan selisih")
      }

      if (action === 'REJECT') {
        // Return everything from transit back to source secara paralel
        await Promise.all(
          transaction.items.map(item => {
            const qty = item.quantity
            if (transaction.type === 'DIRTY_HOTEL_TO_LAUNDRY') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: qty }, inRoomStock: { increment: qty } } 
              })
            } else if (transaction.type === 'DIRTY_VILLA_TO_LAUNDRY') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: qty }, inVillaStock: { increment: qty } } 
              })
            } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: qty }, laundryStock: { increment: qty } } 
              })
            } else if (transaction.type === 'CLEAN_TO_HOTEL' || transaction.type === 'CLEAN_TO_VILLA') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: qty }, cleanStock: { increment: qty } } 
              })
            }
          })
        )
        await tx.transaction.update({ where: { id: transactionId }, data: { status: 'REJECTED' } })
      } else {
        // Approve the revised amounts secara paralel
        await Promise.all(
          transaction.items.map(item => {
            const originalQty = item.quantity
            const rQty = item.receivedQty ?? originalQty
            const missingQty = originalQty - rQty

            if (transaction.type === 'DIRTY_HOTEL_TO_LAUNDRY') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: originalQty }, laundryStock: { increment: rQty }, inRoomStock: { increment: missingQty } } 
              })
            } else if (transaction.type === 'DIRTY_VILLA_TO_LAUNDRY') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: originalQty }, laundryStock: { increment: rQty }, inVillaStock: { increment: missingQty } } 
              })
            } else if (transaction.type === 'LAUNDRY_TO_CLEAN') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: originalQty }, cleanStock: { increment: rQty }, laundryStock: { increment: missingQty } } 
              })
            } else if (transaction.type === 'CLEAN_TO_HOTEL') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: originalQty }, inRoomStock: { increment: rQty }, cleanStock: { increment: missingQty } } 
              })
            } else if (transaction.type === 'CLEAN_TO_VILLA') {
              return tx.linenItem.update({ 
                where: { id: item.linenItemId }, 
                data: { transitStock: { decrement: originalQty }, inVillaStock: { increment: rQty }, cleanStock: { increment: missingQty } } 
              })
            }
          })
        )
        await tx.transaction.update({ where: { id: transactionId }, data: { status: 'ACCEPTED' } })
      }
    }, {
      maxWait: 15000,
      timeout: 30000
    })

    revalidatePath('/handover')
    revalidatePath('/transactions')
    revalidatePath('/')

    return { success: true }
  } catch (error: any) {
    console.error("confirmDispute error:", error)
    return { success: false, error: error.message || "Gagal memproses konfirmasi selisih" }
  }
}
