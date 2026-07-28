import { prisma } from '../config/prisma.js';
import type {
  CreateSaleDTO,
  ListSalesQueryDTO,
} from '../dtos/sale.dto.js';
import { AppError } from '../errors/app-error.js';
import {
  Prisma,
  type Sale,
} from '../generated/prisma/client.js';

function mapSale(sale: Sale) {
  return {
    id: sale.id,
    deviceId: sale.deviceId,
    deviceBrand: sale.deviceBrand,
    deviceModel: sale.deviceModel,
    deviceImei: sale.deviceImei,
    purchasePrice: Number(sale.purchasePrice),
    salePrice: Number(sale.salePrice),
    customerName: sale.customerName,
    customerPhone: sale.customerPhone,
    paymentMethod: sale.paymentMethod,
    soldAt: sale.soldAt.toISOString().slice(0, 10),
    notes: sale.notes,
    createdAt: sale.createdAt.toISOString(),
    updatedAt: sale.updatedAt.toISOString(),
  };
}

class SaleService {
  async create(data: CreateSaleDTO) {
    const device = await prisma.device.findUnique({
      where: {
        id: data.deviceId,
      },
      include: {
        sale: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!device) {
      throw new AppError(
        'Dispositivo não encontrado.',
        404,
      );
    }

    if (
      device.status === 'VENDIDO' ||
      device.sale
    ) {
      throw new AppError(
        'Este dispositivo já possui uma venda registrada.',
        409,
      );
    }

    try {
      const updatedDevice =
        await prisma.device.update({
          where: {
            id: device.id,
          },

          data: {
            status: 'VENDIDO',

            sale: {
              create: {
                deviceBrand: device.brand,
                deviceModel: device.model,
                deviceImei: device.imei,
                purchasePrice:
                  device.purchasePrice,
                salePrice: data.salePrice,
                customerName:
                  data.customerName,
                customerPhone:
                  data.customerPhone || null,
                paymentMethod:
                  data.paymentMethod,
                soldAt: new Date(
                  `${data.soldAt}T00:00:00.000Z`,
                ),
                notes: data.notes || null,
              },
            },
          },

          include: {
            sale: true,
          },
        });

      if (!updatedDevice.sale) {
        throw new AppError(
          'Não foi possível registrar a venda.',
          500,
        );
      }

      return mapSale(updatedDevice.sale);
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          'Este dispositivo já possui uma venda registrada.',
          409,
        );
      }

      throw error;
    }
  }

  async list(query: ListSalesQueryDTO) {
    const where: Prisma.SaleWhereInput = {};

    if (query.paymentMethod) {
      where.paymentMethod =
        query.paymentMethod;
    }

    if (query.search) {
      where.OR = [
        {
          customerName: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          customerPhone: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceBrand: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceModel: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          deviceImei: {
            contains: query.search,
          },
        },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      orderBy: [
        {
          soldAt: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
    });

    const mappedSales = sales.map(mapSale);

    const totalRevenue = mappedSales.reduce(
      (total, sale) =>
        total + sale.salePrice,
      0,
    );

    const totalProfit = mappedSales.reduce(
      (total, sale) =>
        total +
        (sale.salePrice -
          sale.purchasePrice),
      0,
    );

    return {
      data: mappedSales,
      meta: {
        total: mappedSales.length,
        totalRevenue,
        totalProfit,
      },
    };
  }

  async findById(saleId: string) {
    const sale = await prisma.sale.findUnique({
      where: {
        id: saleId,
      },
    });

    if (!sale) {
      throw new AppError(
        'Venda não encontrada.',
        404,
      );
    }

    return mapSale(sale);
  }
}

export const saleService =
  new SaleService();