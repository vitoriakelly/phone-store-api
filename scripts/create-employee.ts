import 'dotenv/config';

import { hash } from 'bcryptjs';

import { prisma } from '../src/config/prisma.js';
import { UserRole } from '../src/generated/prisma/client.js';

async function createEmployee() {
  const name =
    process.env.EMPLOYEE_NAME?.trim();

  const email =
    process.env.EMPLOYEE_EMAIL
      ?.trim()
      .toLowerCase();

  const password =
    process.env.EMPLOYEE_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      'Informe EMPLOYEE_NAME, EMPLOYEE_EMAIL e EMPLOYEE_PASSWORD no arquivo .env.',
    );
  }

  if (password.length < 8) {
    throw new Error(
      'A senha do funcionário deve possuir pelo menos 8 caracteres.',
    );
  }

  const passwordHash = await hash(
    password,
    12,
  );

  const employee = await prisma.user.upsert({
    where: {
      email,
    },

    update: {
      name,
      passwordHash,
      role: UserRole.FUNCIONARIO,
      active: true,
    },

    create: {
      name,
      email,
      passwordHash,
      role: UserRole.FUNCIONARIO,
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
    'Usuário FUNCIONARIO criado ou atualizado:',
  );

  console.table(employee);
}

createEmployee()
  .catch((error: unknown) => {
    console.error(
      'Erro ao criar usuário FUNCIONARIO:',
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });