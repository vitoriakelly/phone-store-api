export const salesPaths = {
  '/sales': {
    get: {
      tags: ['Sales'],
      summary: 'Listar vendas',
      description:
        'Lista as vendas e os respectivos valores de faturamento e lucro.',
      operationId: 'listSales',

      parameters: [
        {
          name: 'search',
          in: 'query',
          required: false,
          description:
            'Pesquisa por cliente, telefone, aparelho ou IMEI.',

          schema: {
            type: 'string',
            maxLength: 160,
          },
        },
        {
          name: 'paymentMethod',
          in: 'query',
          required: false,
          description:
            'Filtra pela forma de pagamento.',

          schema: {
            $ref: '#/components/schemas/PaymentMethod',
          },
        },
      ],

      responses: {
        200: {
          description: 'Vendas encontradas.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SaleListResponse',
              },
            },
          },
        },

        400: {
          description: 'Filtros inválidos.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },

        500: {
          $ref: '#/components/responses/InternalServerError',
        },
      },
    },

    post: {
      tags: ['Sales'],
      summary: 'Registrar venda',
      description:
        'Registra a venda e altera automaticamente o dispositivo para VENDIDO.',
      operationId: 'createSale',

      requestBody: {
        required: true,

        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateSaleInput',
            },

            example: {
              deviceId:
                'f1d4a62b-0aa2-4bf1-8824-ef172ba33ea7',
              customerName: 'Maria da Silva',
              customerPhone:
                '(88) 99999-9999',
              salePrice: 5199,
              paymentMethod: 'PIX',
              soldAt: '2026-07-27',
              notes:
                'Aparelho entregue com caixa e carregador.',
            },
          },
        },
      },

      responses: {
        201: {
          description:
            'Venda registrada com sucesso.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SaleResponse',
              },
            },
          },
        },

        400: {
          description: 'Dados inválidos.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },

        404: {
          description:
            'Dispositivo não encontrado.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },

        409: {
          description:
            'O dispositivo já foi vendido.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },

              example: {
                message:
                  'Este dispositivo já possui uma venda registrada.',
              },
            },
          },
        },

        500: {
          $ref: '#/components/responses/InternalServerError',
        },
      },
    },
  },

  '/sales/{id}': {
    get: {
      tags: ['Sales'],
      summary: 'Buscar venda por ID',
      operationId: 'findSaleById',

      parameters: [
        {
          $ref: '#/components/parameters/SaleId',
        },
      ],

      responses: {
        200: {
          description: 'Venda encontrada.',

          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['data'],

                properties: {
                  data: {
                    $ref: '#/components/schemas/Sale',
                  },
                },
              },
            },
          },
        },

        400: {
          description:
            'Identificador inválido.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },

        404: {
          description: 'Venda não encontrada.',

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },

        500: {
          $ref: '#/components/responses/InternalServerError',
        },
      },
    },
  },
} as const;

export const salesParameters = {
  SaleId: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'UUID da venda.',

    schema: {
      type: 'string',
      format: 'uuid',
    },

    example:
      '414c6206-2c41-436e-888c-d987bd471db8',
  },
} as const;

export const salesSchemas = {
  PaymentMethod: {
    type: 'string',

    enum: [
      'PIX',
      'DINHEIRO',
      'CARTAO_CREDITO',
      'CARTAO_DEBITO',
      'TRANSFERENCIA',
      'OUTRO',
    ],

    example: 'PIX',
  },

  Sale: {
    type: 'object',

    required: [
      'id',
      'deviceId',
      'deviceBrand',
      'deviceModel',
      'deviceImei',
      'purchasePrice',
      'salePrice',
      'customerName',
      'paymentMethod',
      'soldAt',
      'createdAt',
      'updatedAt',
    ],

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },

      deviceId: {
        type: 'string',
        format: 'uuid',
      },

      deviceBrand: {
        type: 'string',
        example: 'Apple',
      },

      deviceModel: {
        type: 'string',
        example: 'iPhone 14 Pro',
      },

      deviceImei: {
        type: 'string',
        pattern: '^\\d{15}$',
        example: '351234567890123',
      },

      purchasePrice: {
        type: 'number',
        format: 'double',
        example: 4200,
      },

      salePrice: {
        type: 'number',
        format: 'double',
        example: 5199,
      },

      customerName: {
        type: 'string',
        example: 'Maria da Silva',
      },

      customerPhone: {
        type: 'string',
        nullable: true,
        example: '(88) 99999-9999',
      },

      paymentMethod: {
        $ref: '#/components/schemas/PaymentMethod',
      },

      soldAt: {
        type: 'string',
        format: 'date',
        example: '2026-07-27',
      },

      notes: {
        type: 'string',
        nullable: true,
      },

      createdAt: {
        type: 'string',
        format: 'date-time',
      },

      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  CreateSaleInput: {
    type: 'object',

    required: [
      'deviceId',
      'customerName',
      'salePrice',
      'paymentMethod',
      'soldAt',
    ],

    properties: {
      deviceId: {
        type: 'string',
        format: 'uuid',
      },

      customerName: {
        type: 'string',
        minLength: 3,
        maxLength: 160,
      },

      customerPhone: {
        type: 'string',
        maxLength: 30,
        nullable: true,
      },

      salePrice: {
        type: 'number',
        minimum: 0.01,
      },

      paymentMethod: {
        $ref: '#/components/schemas/PaymentMethod',
      },

      soldAt: {
        type: 'string',
        format: 'date',
      },

      notes: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
      },
    },
  },

  SaleResponse: {
    type: 'object',
    required: ['message', 'data'],

    properties: {
      message: {
        type: 'string',
        example:
          'Venda registrada com sucesso.',
      },

      data: {
        $ref: '#/components/schemas/Sale',
      },
    },
  },

  SaleListResponse: {
    type: 'object',
    required: ['data', 'meta'],

    properties: {
      data: {
        type: 'array',

        items: {
          $ref: '#/components/schemas/Sale',
        },
      },

      meta: {
        type: 'object',

        required: [
          'total',
          'totalRevenue',
          'totalProfit',
        ],

        properties: {
          total: {
            type: 'integer',
            minimum: 0,
            example: 1,
          },

          totalRevenue: {
            type: 'number',
            example: 5199,
          },

          totalProfit: {
            type: 'number',
            example: 999,
          },
        },
      },
    },
  },
} as const;