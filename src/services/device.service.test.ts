import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AppError } from '../errors/app-error.js';
import { createPrismaMock } from '../test/mocks.js';

const prismaMock = createPrismaMock();

vi.mock('../config/prisma.js', () => ({
  prisma: prismaMock,
}));

const { deviceService } = await import(
  './device.service.js'
);

function buildDevice(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  const now = new Date(
    '2026-08-01T12:00:00.000Z',
  );

  return {
    id: 'device-1',
    brand: 'Apple',
    model: 'iPhone 13',
    storage: '128GB',
    color: 'Preto',
    imei: '123456789012345',
    batteryHealth: 95,
    condition: 'SEMINOVO',
    purchasePrice: 2500,
    salePrice: 3200,
    supplier: 'Fornecedor',
    entryDate: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    status: 'DISPONIVEL',
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('DeviceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cria dispositivo disponível', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      null,
    );
    prismaMock.device.create.mockResolvedValue(
      buildDevice(),
    );

    const result =
      await deviceService.create({
        brand: 'Apple',
        model: 'iPhone 13',
        storage: '128GB',
        color: 'Preto',
        imei: '123456789012345',
        batteryHealth: 95,
        condition: 'SEMINOVO',
        purchasePrice: 2500,
        salePrice: 3200,
        supplier: 'Fornecedor',
        entryDate: '2026-08-01',
        status: 'DISPONIVEL',
        notes: null,
      });

    expect(result.id).toBe('device-1');
    expect(result.purchasePrice).toBe(
      2500,
    );
    expect(result.salePrice).toBe(
      3200,
    );
    expect(result.entryDate).toBe(
      '2026-08-01',
    );
  });

  it('impede IMEI duplicado na criação', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      {
        id: 'outro',
      },
    );

    await expect(
      deviceService.create({
        brand: 'Apple',
        model: 'iPhone 13',
        storage: '128GB',
        color: 'Preto',
        imei: '123456789012345',
        batteryHealth: 95,
        condition: 'SEMINOVO',
        purchasePrice: 2500,
        salePrice: 3200,
        entryDate: '2026-08-01',
        status: 'DISPONIVEL',
      }),
    ).rejects.toMatchObject({
      message:
        'Já existe um dispositivo cadastrado com este IMEI.',
      statusCode: 409,
    });
  });

  it('exige informações completas para status disponível', async () => {
    await expect(
      deviceService.create({
        brand: 'Apple',
        model: 'iPhone 13',
        storage: '128GB',
        condition: 'SEMINOVO',
        purchasePrice: 2500,
        entryDate: '2026-08-01',
        status: 'DISPONIVEL',
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('lista dispositivos com paginação', async () => {
    prismaMock.device.findMany.mockResolvedValue(
      [buildDevice()],
    );
    prismaMock.device.count.mockResolvedValue(
      1,
    );

    const result =
      await deviceService.list({
        page: 1,
      });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({
      page: 1,
      pageSize: 10,
      total: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  });

  it('lança 404 ao buscar dispositivo inexistente', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      deviceService.findById(
        'missing',
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('não exclui dispositivo com venda', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      {
        ...buildDevice(),
        sale: {
          id: 'sale-1',
        },
        tradeInSale: null,
      },
    );

    await expect(
      deviceService.delete('device-1'),
    ).rejects.toMatchObject({
      statusCode: 409,
      message:
        'Não é possível excluir um dispositivo que possui uma venda registrada.',
    });
  });

  it('exclui dispositivo sem vínculos', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      {
        ...buildDevice(),
        sale: null,
        tradeInSale: null,
      },
    );
    prismaMock.device.delete.mockResolvedValue(
      {},
    );

    await deviceService.delete(
      'device-1',
    );

    expect(
      prismaMock.device.delete,
    ).toHaveBeenCalledWith({
      where: {
        id: 'device-1',
      },
    });
  });

  it('impede update com preço de venda menor que compra', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      buildDevice({
        purchasePrice: 3000,
        salePrice: 3500,
      }),
    );

    await expect(
      deviceService.update('device-1', {
        salePrice: 2000,
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message:
        'O valor de venda não pode ser menor que o valor de compra.',
    });
  });
});
