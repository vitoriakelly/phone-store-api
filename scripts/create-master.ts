import 'dotenv/config';

import { hash } from 'bcryptjs';

import { prisma } from '../src/config/prisma.js';
import { UserRole } from '../src/generated/prisma/client.js';

async function createMaster() {
  const name = process.env.MASTER_NAME?.trim();
  const email =
    process.env.MASTER_EMAIL
      ?.trim()
      .toLowerCase();
  const password =
    process.env.MASTER_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      'Informe MASTER_NAME, MASTER_EMAIL e MASTER_PASSWORD no arquivo .env.',
    );
  }

  if (password.length < 8) {
    throw new Error(
      'A senha do usuário MASTER deve possuir pelo menos 8 caracteres.',
    );
  }

  const passwordHash = await hash(
    password,
    12,
  );

  const master = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      name,
      passwordHash,
      role: UserRole.MASTER,
      active: true,
    },

    create: {
      name,
      email,
      passwordHash,
      role: UserRole.MASTER,
      active: true,
    },

    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  console.log(
    'Usuário MASTER criado ou atualizado:',
  );

  console.table(master);
}

createMaster()
  .catch((error: unknown) => {
    console.error(
      'Erro ao criar usuário MASTER:',
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });