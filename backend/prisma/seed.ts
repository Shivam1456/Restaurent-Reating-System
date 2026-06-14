import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@rating.com';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@Password123', 10);
    
    const admin = await prisma.user.create({
      data: {
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        address: 'System Admin Office, Metro City',
        role: Role.SYSTEM_ADMIN
      }
    });
    
    console.log('Default SYSTEM_ADMIN created successfully:', admin.email);
  } else {
    console.log('SYSTEM_ADMIN already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
