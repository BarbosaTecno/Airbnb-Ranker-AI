
// Fix: @ts-ignore used to bypass export member check for PrismaClient when generated types might not be present
// @ts-ignore
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@local';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin123!', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'admin',
        status: 'active',
        locale: 'pt-BR'
      }
    });
    console.log('✅ Admin inicial criado: admin@local / Admin123!');
  } else {
    console.log('ℹ️ Admin inicial já existe.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    // Fix: Explicitly cast process to any to avoid "Property 'exit' does not exist on type 'Process'" error in restricted environments
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
