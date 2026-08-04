import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createPrismaMock } from '../test/mocks.js';

const prismaMock = createPrismaMock();

vi.mock('../config/prisma.js', () => ({
  prisma: prismaMock,
}));

const { dashboardService } =
  await import('./dashboard.service.js');

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta o resumo de estoque e vendas', async () => {
    prismaMock.device.groupBy.mockResolvedValue(
      [
        {
          status:
            'PENDENTE_INFORMACOES',
          _count: {
            _all: 2,
          },
        },
        {
          status: 'DISPONIVEL',
          _count: {
            _all: 5,
          },
        },
        {
          status: 'RESERVADO',
          _count: {
            _all: 1,
          },
        },
        {
          status: 'VENDIDO',
          _count: {
            _all: 3,
          },
        },
      ],
    );

    prismaMock.device.aggregate.mockResolvedValue(
      {
        _sum: {
          salePrice: 15000,
        },
      },
    );

    prismaMock.device.findMany.mockResolvedValue(
      [
        {
          id: 'device-1',
          brand: 'Apple',
          model: 'iPhone 13',
          storage: '128GB',
          color: 'Preto',
          condition: 'SEMINOVO',
          salePrice: 3200,
          entryDate: new Date(
            '2026-08-01T00:00:00.000Z',
          ),
          status: 'DISPONIVEL',
          createdAt: new Date(
            '2026-08-01T12:00:00.000Z',
          ),
        },
      ],
    );

    prismaMock.sale.aggregate.mockResolvedValue(
      {
        _count: {
          _all: 2,
        },
        _sum: {
          salePrice: 6000,
          purchasePrice: 4000,
          commissionAmount: 200,
        },
      },
    );

    prismaMock.sale.findMany.mockResolvedValue(
      [
        {
          id: 'sale-1',
          sellerName: 'Maria',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 13',
          customerName: 'João',
          salePrice: 3000,
          purchasePrice: 2000,
          commissionAmount: 100,
          paymentMethod: 'PIX',
          soldAt: new Date(
            '2026-08-03T00:00:00.000Z',
          ),
          createdAt: new Date(
            '2026-08-03T12:00:00.000Z',
          ),
          updatedAt: new Date(
            '2026-08-03T12:00:00.000Z',
          ),
          payments: [
            {
              id: 'pay-1',
              saleId: 'sale-1',
              method: 'PIX',
              amount: 3000,
              installments: null,
              createdAt: new Date(
                '2026-08-03T12:00:00.000Z',
              ),
              updatedAt: new Date(
                '2026-08-03T12:00:00.000Z',
              ),
            },
          ],
        },
      ],
    );

    const result =
      await dashboardService.getDashboard(
        {
          startDate: '2026-08-01',
          endDate: '2026-08-31',
        },
      );

    expect(result.stock).toMatchObject({
      total: 11,
      pending: 2,
      available: 5,
      reserved: 1,
      sold: 3,
      inventoryValue: 15000,
    });

    expect(result.sales).toMatchObject({
      totalRevenue: 6000,
      totalProfit: 2000,
      totalCommission: 200,
      totalProfitAfterCommission: 1800,
      totalSales: 2,
      averageTicket: 3000,
    });

    expect(
      result.recentDevices[0],
    ).toMatchObject({
      id: 'device-1',
      salePrice: 3200,
      entryDate: '2026-08-01',
    });

    expect(
      result.recentSales[0],
    ).toMatchObject({
      id: 'sale-1',
      soldAt: '2026-08-03',
      salePrice: 3000,
    });
  });
});
