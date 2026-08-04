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

const { saleService } = await import(
  './sale.service.js'
);

function buildAvailableDevice(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  return {
    id: 'device-1',
    brand: 'Apple',
    model: 'iPhone 13',
    storage: '128GB',
    color: 'Preto',
    imei: '123456789012345',
    batteryHealth: 95,
    condition: 'SEMINOVO',
    purchasePrice: 2000,
    salePrice: 3000,
    supplier: null,
    entryDate: new Date(
      '2026-08-01T00:00:00.000Z',
    ),
    status: 'DISPONIVEL',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    sale: null,
    ...overrides,
  };
}

function buildSaleInput(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  return {
    deviceId:
      '550e8400-e29b-41d4-a716-446655440000',
    sellerId:
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    customerName: 'João Cliente',
    customerPhone: '11999999999',
    customerZipCode: '01310-100',
    customerStreet: 'Av. Paulista',
    customerNeighborhood: 'Bela Vista',
    customerCity: 'São Paulo',
    customerAddressNumber: '1000',
    customerSocialNetwork: '@joao',
    salePrice: 3000,
    discountAmount: 0,
    payments: [
      {
        method: 'PIX' as const,
        amount: 3000,
      },
    ],
    soldAt: '2026-08-03',
    ...overrides,
  };
}

function buildSaleRecord(
  overrides: Record<
    string,
    unknown
  > = {},
) {
  const now = new Date(
    '2026-08-03T12:00:00.000Z',
  );

  return {
    id: 'sale-1',
    deviceId: 'device-1',
    tradeInDeviceId: null,
    sellerId: 'seller-1',
    sellerName: 'Maria',
    deviceBrand: 'Apple',
    deviceModel: 'iPhone 13',
    deviceImei: '123456789012345',
    deviceCondition: 'SEMINOVO',
    purchasePrice: 2000,
    grossSalePrice: 3000,
    discountAmount: 0,
    salePrice: 3000,
    commissionType: 'PERCENTAGE',
    commissionValue: 10,
    commissionAmount: 300,
    commissionPaymentStatus: 'PENDING',
    commissionPaidAt: null,
    customerName: 'João Cliente',
    customerPhone: '11999999999',
    customerZipCode: '01310-100',
    customerStreet: 'Av. Paulista',
    customerNeighborhood: 'Bela Vista',
    customerCity: 'São Paulo',
    customerAddressNumber: '1000',
    customerSocialNetwork: '@joao',
    paymentMethod: 'PIX',
    soldAt: new Date(
      '2026-08-03T00:00:00.000Z',
    ),
    notes: null,
    createdAt: now,
    updatedAt: now,
    tradeInDevice: null,
    payments: [
      {
        id: 'pay-1',
        saleId: 'sale-1',
        method: 'PIX',
        amount: 3000,
        installments: null,
        createdAt: now,
        updatedAt: now,
      },
    ],
    ...overrides,
  };
}

describe('SaleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lança 404 quando o dispositivo não existe', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      saleService.create(
        buildSaleInput(),
      ),
    ).rejects.toMatchObject({
      statusCode: 404,
      message:
        'Dispositivo não encontrado.',
    });
  });

  it('impede venda de dispositivo pendente', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      buildAvailableDevice({
        status: 'PENDENTE_INFORMACOES',
      }),
    );

    await expect(
      saleService.create(
        buildSaleInput(),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('impede venda de dispositivo já vendido', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      buildAvailableDevice({
        status: 'VENDIDO',
        sale: {
          id: 'sale-1',
        },
      }),
    );

    await expect(
      saleService.create(
        buildSaleInput(),
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message:
        'Este dispositivo já possui uma venda registrada.',
    });
  });

  it('rejeita pagamentos que não fecham o valor', async () => {
    await expect(
      saleService.create(
        buildSaleInput({
          payments: [
            {
              method: 'PIX',
              amount: 1000,
            },
          ],
        }),
      ),
    ).rejects.toBeInstanceOf(AppError);
  });

  it('cria venda válida e marca dispositivo como vendido', async () => {
    prismaMock.device.findUnique.mockResolvedValue(
      buildAvailableDevice(),
    );

    const createdSale =
      buildSaleRecord();

    prismaMock.$transaction.mockImplementation(
      async (callback) => {
        const transaction = {
          user: {
            findFirst: vi
              .fn()
              .mockResolvedValue({
                id: 'seller-1',
                name: 'Maria',
              }),
          },
          device: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi
              .fn()
              .mockResolvedValue({}),
          },
          sale: {
            create: vi
              .fn()
              .mockResolvedValue(
                createdSale,
              ),
          },
        };

        return callback(transaction);
      },
    );

    const result =
      await saleService.create(
        buildSaleInput({
          commissionType: 'PERCENTAGE',
          commissionValue: 10,
        }),
      );

    expect(result.id).toBe('sale-1');
    expect(result.salePrice).toBe(
      3000,
    );
    expect(
      result.commissionAmount,
    ).toBe(300);
    expect(result.soldAt).toBe(
      '2026-08-03',
    );
    expect(
      prismaMock.$transaction,
    ).toHaveBeenCalledOnce();
  });

  it('lista vendas com totais financeiros', async () => {
    prismaMock.sale.findMany.mockResolvedValue(
      [buildSaleRecord()],
    );
    prismaMock.sale.count.mockResolvedValue(
      1,
    );
    prismaMock.sale.aggregate.mockResolvedValue(
      {
        _sum: {
          salePrice: 3000,
          purchasePrice: 2000,
          commissionAmount: 300,
        },
      },
    );

    const result =
      await saleService.list({
        page: 1,
      });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({
      total: 1,
      totalRevenue: 3000,
      totalProfit: 1000,
      totalCommission: 300,
      totalProfitAfterCommission: 700,
      averageTicket: 3000,
    });
  });

  it('atualiza status de pagamento da comissão', async () => {
    prismaMock.sale.findUnique.mockResolvedValue(
      {
        id: 'sale-1',
        commissionAmount: 300,
      },
    );
    prismaMock.sale.update.mockResolvedValue(
      buildSaleRecord({
        commissionPaymentStatus:
          'PAID',
        commissionPaidAt: new Date(),
      }),
    );

    const result =
      await saleService.updateCommissionPaymentStatus(
        'sale-1',
        {
          status: 'PAID',
        },
      );

    expect(
      result.commissionPaymentStatus,
    ).toBe('PAID');
    expect(
      prismaMock.sale.update,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          commissionPaymentStatus:
            'PAID',
          commissionPaidAt:
            expect.any(Date),
        }),
      }),
    );
  });

  it('impede atualizar comissão zerada', async () => {
    prismaMock.sale.findUnique.mockResolvedValue(
      {
        id: 'sale-1',
        commissionAmount: 0,
      },
    );

    await expect(
      saleService.updateCommissionPaymentStatus(
        'sale-1',
        {
          status: 'PAID',
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it('lança 404 ao buscar venda inexistente', async () => {
    prismaMock.sale.findUnique.mockResolvedValue(
      null,
    );

    await expect(
      saleService.findById('missing'),
    ).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
