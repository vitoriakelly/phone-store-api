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

const { ReportService } = await import(
  './report.service.js'
);

describe('ReportService', () => {
  const service = new ReportService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('monta relatório de vendas com totais', async () => {
    const now = new Date(
      '2026-08-03T12:00:00.000Z',
    );

    prismaMock.sale.findMany.mockResolvedValue(
      [
        {
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
          commissionPaymentStatus:
            'PENDING',
          commissionPaidAt: null,
          customerName: 'João',
          customerPhone: null,
          customerZipCode: '01310100',
          customerStreet: 'Rua A',
          customerNeighborhood:
            'Centro',
          customerCity: 'São Paulo',
          customerAddressNumber: '10',
          customerSocialNetwork:
            '@joao',
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
        },
      ],
    );

    prismaMock.sale.count.mockResolvedValue(
      1,
    );

    prismaMock.sale.aggregate
      .mockResolvedValueOnce({
        _sum: {
          grossSalePrice: 3000,
          discountAmount: 0,
          salePrice: 3000,
          purchasePrice: 2000,
          commissionAmount: 300,
        },
      })
      .mockResolvedValueOnce({
        _sum: {
          salePrice: 0,
          discountAmount: 0,
        },
      });

    const result =
      await service.getSalesReport({
        page: 1,
      });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toMatchObject({
      total: 1,
      totalGrossRevenue: 3000,
      totalRevenue: 3000,
      totalCost: 2000,
      totalCommission: 300,
      totalProfit: 1000,
      totalProfitAfterCommission: 700,
      averageTicket: 3000,
    });
  });

  it('monta relatório de dispositivos com indicadores globais', async () => {
    prismaMock.device.findMany.mockResolvedValue(
      [],
    );
    prismaMock.device.count
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(2);

    prismaMock.device.groupBy.mockResolvedValue(
      [
        {
          status: 'DISPONIVEL',
          _count: {
            _all: 4,
          },
        },
        {
          status: 'VENDIDO',
          _count: {
            _all: 2,
          },
        },
      ],
    );

    prismaMock.device.aggregate.mockResolvedValue(
      {
        _sum: {
          purchasePrice: 8000,
          salePrice: 12000,
        },
      },
    );

    const result =
      await service.getDevicesReport({
        page: 1,
      });

    expect(result.meta).toMatchObject({
      totalDevices: 6,
      available: 4,
      sold: 2,
      totalPurchaseValue: 8000,
      totalSaleValue: 12000,
      potentialProfit: 4000,
    });
  });
});
