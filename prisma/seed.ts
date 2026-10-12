const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create Users (Roles)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@greenstar.com' },
    update: {},
    create: {
      name: 'Executive Housekeeper',
      email: 'admin@greenstar.com',
      password: defaultPassword,
      role: 'ADMIN_EXECUTIVE_HOUSEKEEPER',
    },
  });

  const housekeeping = await prisma.user.upsert({
    where: { email: 'housekeeping@greenstar.com' },
    update: {},
    create: {
      name: 'Housekeeping Staff',
      email: 'housekeeping@greenstar.com',
      password: defaultPassword,
      role: 'STAF_HOUSEKEEPING',
    },
  });

  const laundry = await prisma.user.upsert({
    where: { email: 'laundry@greenstar.com' },
    update: {},
    create: {
      name: 'Laundry Staff',
      email: 'laundry@greenstar.com',
      password: defaultPassword,
      role: 'STAF_LAUNDRY',
    },
  });

  // Create Master Linen Items
  const linenItems = [
    { name: 'Duvet Cover', unitPrice: 150000, totalAsset: 200, cleanStock: 100, laundryStock: 50, inRoomStock: 40, inVillaStock: 10, condemnedStock: 0, minAlertLevel: 50, parStockTarget: 150 },
    { name: 'Sheet / Sprei', unitPrice: 95000, totalAsset: 400, cleanStock: 200, laundryStock: 100, inRoomStock: 80, inVillaStock: 20, condemnedStock: 0, minAlertLevel: 100, parStockTarget: 300 },
    { name: 'Pillow Case', unitPrice: 25000, totalAsset: 600, cleanStock: 300, laundryStock: 150, inRoomStock: 120, inVillaStock: 30, condemnedStock: 0, minAlertLevel: 150, parStockTarget: 450 },
    { name: 'Bath Towel', unitPrice: 65000, totalAsset: 400, cleanStock: 200, laundryStock: 100, inRoomStock: 80, inVillaStock: 20, condemnedStock: 0, minAlertLevel: 100, parStockTarget: 300 },
    { name: 'Face Towel', unitPrice: 20000, totalAsset: 300, cleanStock: 150, laundryStock: 70, inRoomStock: 60, inVillaStock: 20, condemnedStock: 0, minAlertLevel: 80, parStockTarget: 250 },
    { name: 'Bath Mat', unitPrice: 35000, totalAsset: 150, cleanStock: 70, laundryStock: 40, inRoomStock: 30, inVillaStock: 10, condemnedStock: 0, minAlertLevel: 40, parStockTarget: 120 },
  ];

  for (const item of linenItems) {
    await prisma.linenItem.upsert({
      where: { name: item.name },
      update: item,
      create: item,
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
