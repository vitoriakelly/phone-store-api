import { prisma } from '../config/prisma.js';
import type {
  CreateDeviceDTO,
  ListDevicesQueryDTO,
  UpdateDeviceDTO,
} from '../dtos/device.dto.js';
import { AppError } from '../errors/app-error.js';
import type { Prisma } from '../generated/prisma/client.js';

type DeviceRecord = Prisma.DeviceGetPayload<
  Record<string, never>
>;

interface DeviceCompletionData {
  status: DeviceRecord['status'];
  color: string | null;
  imei: string | null;
  salePrice: number | null;
}

function mapDevice(device: DeviceRecord) {
  return {
    id: device.id,
    brand: device.brand,
    model: device.model,
    storage: device.storage,
    color: device.color,
    imei: device.imei,
    batteryHealth: device.batteryHealth,
    condition: device.condition,
    purchasePrice: Number(
      device.purchasePrice,
    ),
    salePrice:
      device.salePrice === null
        ? null
        : Number(device.salePrice),
    supplier: device.supplier,
    entryDate: device.entryDate
      .toISOString()
      .split('T')[0],
    status: device.status,
    notes: device.notes,
    createdAt:
      device.createdAt.toISOString(),
    updatedAt:
      device.updatedAt.toISOString(),
  };
}

function validateDeviceCompletion(
  data: DeviceCompletionData,
) {
  if (
    data.status ===
    'PENDENTE_INFORMACOES'
  ) {
    return;
  }

  if (!data.color) {
    throw new AppError(
      'Informe a cor antes de disponibilizar o dispositivo.',
      400,
    );
  }

  if (!data.imei) {
    throw new AppError(
      'Informe o IMEI antes de disponibilizar o dispositivo.',
      400,
    );
  }

  if (data.salePrice === null) {
    throw new AppError(
      'Informe o valor de venda antes de disponibilizar o dispositivo.',
      400,
    );
  }
}

class DeviceService {
  async create(data: CreateDeviceDTO) {
    if (data.imei) {
      const existingDevice =
        await prisma.device.findUnique({
          where: {
            imei: data.imei,
          },

          select: {
            id: true,
          },
        });

      if (existingDevice) {
        throw new AppError(
          'Já existe um dispositivo cadastrado com este IMEI.',
          409,
        );
      }
    }

    const salePrice =
      data.salePrice ?? null;

    validateDeviceCompletion({
      status: data.status,
      color: data.color ?? null,
      imei: data.imei ?? null,
      salePrice,
    });

    if (
      salePrice !== null &&
      salePrice < data.purchasePrice
    ) {
      throw new AppError(
        'O valor de venda não pode ser menor que o valor de compra.',
        400,
      );
    }

    const device =
      await prisma.device.create({
        data: {
          brand: data.brand,
          model: data.model,
          storage: data.storage,
          color: data.color ?? null,
          imei: data.imei ?? null,
          batteryHealth:
            data.batteryHealth ?? null,
          condition: data.condition,
          purchasePrice:
            data.purchasePrice,
          salePrice,
          supplier:
            data.supplier ?? null,
          entryDate: new Date(
            `${data.entryDate}T00:00:00.000Z`,
          ),
          status: data.status,
          notes: data.notes ?? null,
        },
      });

    return mapDevice(device);
  }

  async list(
    query: ListDevicesQueryDTO,
  ) {
    const where: Prisma.DeviceWhereInput =
      {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        {
          brand: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          model: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          imei: {
            contains: query.search,
          },
        },
        {
          color: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          storage: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          supplier: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    const devices =
      await prisma.device.findMany({
        where,

        orderBy: [
          {
            status: 'asc',
          },
          {
            createdAt: 'desc',
          },
        ],
      });

    return devices.map(mapDevice);
  }

  async findById(deviceId: string) {
    const device =
      await prisma.device.findUnique({
        where: {
          id: deviceId,
        },
      });

    if (!device) {
      throw new AppError(
        'Dispositivo não encontrado.',
        404,
      );
    }

    return mapDevice(device);
  }

  async update(
    deviceId: string,
    data: UpdateDeviceDTO,
  ) {
    const existingDevice =
      await prisma.device.findUnique({
        where: {
          id: deviceId,
        },
      });

    if (!existingDevice) {
      throw new AppError(
        'Dispositivo não encontrado.',
        404,
      );
    }

    if (
      data.imei !== undefined &&
      data.imei !== null &&
      data.imei !== existingDevice.imei
    ) {
      const deviceWithSameImei =
        await prisma.device.findUnique({
          where: {
            imei: data.imei,
          },

          select: {
            id: true,
          },
        });

      if (deviceWithSameImei) {
        throw new AppError(
          'Já existe outro dispositivo cadastrado com este IMEI.',
          409,
        );
      }
    }

    const purchasePrice =
      data.purchasePrice ??
      Number(
        existingDevice.purchasePrice,
      );

    const salePrice =
      data.salePrice !== undefined
        ? data.salePrice
        : existingDevice.salePrice ===
            null
          ? null
          : Number(
              existingDevice.salePrice,
            );

    const color =
      data.color !== undefined
        ? data.color
        : existingDevice.color;

    const imei =
      data.imei !== undefined
        ? data.imei
        : existingDevice.imei;

    const status =
      data.status ??
      existingDevice.status;

    if (
      salePrice !== null &&
      salePrice < purchasePrice
    ) {
      throw new AppError(
        'O valor de venda não pode ser menor que o valor de compra.',
        400,
      );
    }

    validateDeviceCompletion({
      status,
      color,
      imei,
      salePrice,
    });

    const updatedDevice =
      await prisma.device.update({
        where: {
          id: deviceId,
        },

        data: {
          ...(data.brand !==
            undefined && {
            brand: data.brand,
          }),

          ...(data.model !==
            undefined && {
            model: data.model,
          }),

          ...(data.storage !==
            undefined && {
            storage: data.storage,
          }),

          ...(data.color !==
            undefined && {
            color: data.color,
          }),

          ...(data.imei !==
            undefined && {
            imei: data.imei,
          }),

          ...(data.batteryHealth !==
            undefined && {
            batteryHealth:
              data.batteryHealth,
          }),

          ...(data.condition !==
            undefined && {
            condition: data.condition,
          }),

          ...(data.purchasePrice !==
            undefined && {
            purchasePrice:
              data.purchasePrice,
          }),

          ...(data.salePrice !==
            undefined && {
            salePrice:
              data.salePrice,
          }),

          ...(data.supplier !==
            undefined && {
            supplier: data.supplier,
          }),

          ...(data.entryDate !==
            undefined && {
            entryDate: new Date(
              `${data.entryDate}T00:00:00.000Z`,
            ),
          }),

          ...(data.status !==
            undefined && {
            status: data.status,
          }),

          ...(data.notes !==
            undefined && {
            notes: data.notes,
          }),
        },
      });

    return mapDevice(updatedDevice);
  }

  async delete(deviceId: string) {
    const device =
      await prisma.device.findUnique({
        where: {
          id: deviceId,
        },

        include: {
          sale: {
            select: {
              id: true,
            },
          },

          tradeInSale: {
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

    if (device.sale) {
      throw new AppError(
        'Não é possível excluir um dispositivo que possui uma venda registrada.',
        409,
      );
    }

    if (device.tradeInSale) {
      throw new AppError(
        'Não é possível excluir um dispositivo recebido como parte de uma troca.',
        409,
      );
    }

    await prisma.device.delete({
      where: {
        id: deviceId,
      },
    });
  }
}

export const deviceService =
  new DeviceService();