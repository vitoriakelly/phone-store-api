import {
  salesParameters,
  salesPaths,
  salesSchemas,
} from '../docs/sales.swagger.js';

export const swaggerDocument = {
  openapi: '3.0.3',

  info: {
    title: 'Phone Store API',
    version: '1.0.0',
    description:
      'API para gerenciamento de dispositivos telefônicos, estoque e vendas.',
  },

  servers: [
    {
      url: 'http://localhost:3333',
      description: 'Ambiente local',
    },
  ],

  tags: [
    {
      name: 'Health',
      description: 'Verificação da API e do banco de dados.',
    },
    {
      name: 'Devices',
      description: 'Gerenciamento dos dispositivos da loja.',
    },
    {
      name: 'Sales',
      description:
        'Registro e consulta das vendas da loja.',
    },
  ],

  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Verificar a disponibilidade da API',
        operationId: 'healthCheck',

        responses: {
          200: {
            description: 'API disponível.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },

                example: {
                  status: 'ok',
                  message: 'Phone Store API está funcionando.',
                  timestamp: '2026-07-27T19:33:10.431Z',
                },
              },
            },
          },
        },
      },
    },

    '/health/database': {
      get: {
        tags: ['Health'],
        summary: 'Verificar a conexão com o PostgreSQL',
        operationId: 'databaseHealthCheck',

        responses: {
          200: {
            description: 'Banco de dados disponível.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DatabaseHealthResponse',
                },
              },
            },
          },

          503: {
            description: 'Banco de dados indisponível.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  status: 'error',
                  message:
                    'Não foi possível acessar o PostgreSQL.',
                },
              },
            },
          },
        },
      },
    },

    '/devices': {
      get: {
        tags: ['Devices'],
        summary: 'Listar dispositivos',
        description:
          'Lista os dispositivos cadastrados, permitindo pesquisa e filtro por status.',
        operationId: 'listDevices',

        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            description:
              'Pesquisa por marca, modelo, IMEI, cor ou armazenamento.',

            schema: {
              type: 'string',
              maxLength: 120,
            },

            example: 'iPhone',
          },
          {
            name: 'status',
            in: 'query',
            required: false,
            description: 'Filtra os aparelhos pelo status.',

            schema: {
              $ref: '#/components/schemas/DeviceStatus',
            },

            example: 'DISPONIVEL',
          },
        ],

        responses: {
          200: {
            description: 'Dispositivos encontrados.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DeviceListResponse',
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
        tags: ['Devices'],
        summary: 'Cadastrar dispositivo',
        description:
          'Cadastra um novo aparelho no estoque da loja.',
        operationId: 'createDevice',

        requestBody: {
          required: true,

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateDeviceInput',
              },

              examples: {
                seminovo: {
                  summary: 'Aparelho seminovo',

                  value: {
                    brand: 'Apple',
                    model: 'iPhone 14 Pro',
                    storage: '256 GB',
                    color: 'Preto',
                    imei: '351234567890123',
                    batteryHealth: 89,
                    condition: 'SEMINOVO',
                    purchasePrice: 4200,
                    salePrice: 5199,
                    supplier: 'Fornecedor Teste',
                    entryDate: '2026-07-27',
                    status: 'DISPONIVEL',
                    notes:
                      'Aparelho com caixa e carregador.',
                  },
                },

                novo: {
                  summary: 'Aparelho novo',

                  value: {
                    brand: 'Samsung',
                    model: 'Galaxy S24',
                    storage: '256 GB',
                    color: 'Cinza',
                    imei: '351234567890124',
                    condition: 'NOVO',
                    purchasePrice: 3500,
                    salePrice: 4299,
                    entryDate: '2026-07-27',
                    status: 'DISPONIVEL',
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description: 'Dispositivo cadastrado.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DeviceResponse',
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

          409: {
            description: 'IMEI já cadastrado.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  message:
                    'Já existe um dispositivo cadastrado com este IMEI.',
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

    '/devices/{id}': {
      get: {
        tags: ['Devices'],
        summary: 'Buscar dispositivo por ID',
        operationId: 'findDeviceById',

        parameters: [
          {
            $ref: '#/components/parameters/DeviceId',
          },
        ],

        responses: {
          200: {
            description: 'Dispositivo encontrado.',

            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['data'],

                  properties: {
                    data: {
                      $ref: '#/components/schemas/Device',
                    },
                  },
                },
              },
            },
          },

          400: {
            description: 'Identificador inválido.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse',
                },
              },
            },
          },

          404: {
            description: 'Dispositivo não encontrado.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  message: 'Dispositivo não encontrado.',
                },
              },
            },
          },

          500: {
            $ref: '#/components/responses/InternalServerError',
          },
        },
      },

      patch: {
        tags: ['Devices'],
        summary: 'Atualizar dispositivo',
        description:
          'Atualiza um ou mais campos do dispositivo.',
        operationId: 'updateDevice',

        parameters: [
          {
            $ref: '#/components/parameters/DeviceId',
          },
        ],

        requestBody: {
          required: true,

          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateDeviceInput',
              },

              examples: {
                valores: {
                  summary: 'Atualizar valores',

                  value: {
                    purchasePrice: 4300,
                    salePrice: 5499,
                  },
                },

                status: {
                  summary: 'Alterar status',

                  value: {
                    status: 'RESERVADO',
                  },
                },

                informacoes: {
                  summary: 'Atualizar informações',

                  value: {
                    batteryHealth: 91,
                    supplier: 'Novo fornecedor',
                    notes:
                      'Aparelho revisado e atualizado.',
                  },
                },
              },
            },
          },
        },

        responses: {
          200: {
            description: 'Dispositivo atualizado.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/DeviceResponse',
                },

                example: {
                  message:
                    'Dispositivo atualizado com sucesso.',

                  data: {
                    id: 'f1d4a62b-0aa2-4bf1-8824-ef172ba33ea7',
                    brand: 'Apple',
                    model: 'iPhone 14 Pro',
                    storage: '256 GB',
                    color: 'Preto',
                    imei: '351234567890123',
                    batteryHealth: 91,
                    condition: 'SEMINOVO',
                    purchasePrice: 4200,
                    salePrice: 5399,
                    supplier: 'Fornecedor Teste',
                    entryDate: '2026-07-27',
                    status: 'DISPONIVEL',
                    notes:
                      'Aparelho revisado e atualizado.',
                    createdAt:
                      '2026-07-27T19:33:10.431Z',
                    updatedAt:
                      '2026-07-27T20:00:00.000Z',
                  },
                },
              },
            },
          },

          400: {
            description:
              'Identificador ou dados inválidos.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse',
                },
              },
            },
          },

          404: {
            description: 'Dispositivo não encontrado.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },

          409: {
            description: 'Conflito com outro dispositivo.',

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

      delete: {
        tags: ['Devices'],
        summary: 'Excluir dispositivo',
        description:
          'Remove um dispositivo que ainda não possui venda registrada.',
        operationId: 'deleteDevice',

        parameters: [
          {
            $ref: '#/components/parameters/DeviceId',
          },
        ],

        responses: {
          204: {
            description: 'Dispositivo excluído.',
          },

          400: {
            description: 'Identificador inválido.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ValidationErrorResponse',
                },
              },
            },
          },

          404: {
            description: 'Dispositivo não encontrado.',

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
              'O dispositivo possui uma venda registrada.',

            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },

                example: {
                  message:
                    'Não é possível excluir um dispositivo que possui uma venda registrada.',
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

    ...salesPaths,
  },

  components: {
    parameters: {
      DeviceId: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'UUID do dispositivo.',

        schema: {
          type: 'string',
          format: 'uuid',
        },

        example: 'f1d4a62b-0aa2-4bf1-8824-ef172ba33ea7',
      },

      ...salesParameters,
    },

    responses: {
      InternalServerError: {
        description: 'Erro interno do servidor.',

        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse',
            },

            example: {
              message:
                'Ocorreu um erro interno no servidor.',
            },
          },
        },
      },
    },

    schemas: {
      DeviceStatus: {
        type: 'string',
        enum: [
          'DISPONIVEL',
          'RESERVADO',
          'VENDIDO',
        ],
        example: 'DISPONIVEL',
      },

      DeviceCondition: {
        type: 'string',
        enum: ['NOVO', 'SEMINOVO', 'USADO'],
        example: 'SEMINOVO',
      },

      Device: {
        type: 'object',

        required: [
          'id',
          'brand',
          'model',
          'storage',
          'color',
          'imei',
          'condition',
          'purchasePrice',
          'salePrice',
          'entryDate',
          'status',
          'createdAt',
          'updatedAt',
        ],

        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example:
              'f1d4a62b-0aa2-4bf1-8824-ef172ba33ea7',
          },

          brand: {
            type: 'string',
            example: 'Apple',
          },

          model: {
            type: 'string',
            example: 'iPhone 14 Pro',
          },

          storage: {
            type: 'string',
            example: '256 GB',
          },

          color: {
            type: 'string',
            example: 'Preto',
          },

          imei: {
            type: 'string',
            pattern: '^\\d{15}$',
            example: '351234567890123',
          },

          batteryHealth: {
            type: 'integer',
            nullable: true,
            minimum: 0,
            maximum: 100,
            example: 89,
          },

          condition: {
            $ref: '#/components/schemas/DeviceCondition',
          },

          purchasePrice: {
            type: 'number',
            format: 'double',
            minimum: 0.01,
            example: 4200,
          },

          salePrice: {
            type: 'number',
            format: 'double',
            minimum: 0.01,
            example: 5199,
          },

          supplier: {
            type: 'string',
            nullable: true,
            example: 'Fornecedor Teste',
          },

          entryDate: {
            type: 'string',
            format: 'date',
            example: '2026-07-27',
          },

          status: {
            $ref: '#/components/schemas/DeviceStatus',
          },

          notes: {
            type: 'string',
            nullable: true,
            example:
              'Aparelho com caixa e carregador.',
          },

          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-27T19:33:10.431Z',
          },

          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-27T19:33:10.431Z',
          },
        },
      },

      CreateDeviceInput: {
        type: 'object',

        required: [
          'brand',
          'model',
          'storage',
          'color',
          'imei',
          'condition',
          'purchasePrice',
          'salePrice',
          'entryDate',
        ],

        properties: {
          brand: {
            type: 'string',
            minLength: 2,
            maxLength: 80,
          },

          model: {
            type: 'string',
            minLength: 2,
            maxLength: 120,
          },

          storage: {
            type: 'string',
            minLength: 1,
            maxLength: 30,
          },

          color: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
          },

          imei: {
            type: 'string',
            pattern: '^\\d{15}$',
          },

          batteryHealth: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            nullable: true,
          },

          condition: {
            $ref: '#/components/schemas/DeviceCondition',
          },

          purchasePrice: {
            type: 'number',
            minimum: 0.01,
          },

          salePrice: {
            type: 'number',
            minimum: 0.01,
          },

          supplier: {
            type: 'string',
            maxLength: 160,
            nullable: true,
          },

          entryDate: {
            type: 'string',
            format: 'date',
          },

          status: {
            allOf: [
              {
                $ref: '#/components/schemas/DeviceStatus',
              },
            ],
            default: 'DISPONIVEL',
          },

          notes: {
            type: 'string',
            maxLength: 2000,
            nullable: true,
          },
        },
      },

      UpdateDeviceInput: {
        type: 'object',
        minProperties: 1,

        properties: {
          brand: {
            type: 'string',
            minLength: 2,
            maxLength: 80,
          },

          model: {
            type: 'string',
            minLength: 2,
            maxLength: 120,
          },

          storage: {
            type: 'string',
            minLength: 1,
            maxLength: 30,
          },

          color: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
          },

          imei: {
            type: 'string',
            pattern: '^\\d{15}$',
          },

          batteryHealth: {
            type: 'integer',
            minimum: 0,
            maximum: 100,
            nullable: true,
          },

          condition: {
            $ref: '#/components/schemas/DeviceCondition',
          },

          purchasePrice: {
            type: 'number',
            minimum: 0.01,
          },

          salePrice: {
            type: 'number',
            minimum: 0.01,
          },

          supplier: {
            type: 'string',
            maxLength: 160,
            nullable: true,
          },

          entryDate: {
            type: 'string',
            format: 'date',
          },

          status: {
            $ref: '#/components/schemas/DeviceStatus',
          },

          notes: {
            type: 'string',
            maxLength: 2000,
            nullable: true,
          },
        },
      },

      DeviceResponse: {
        type: 'object',
        required: ['message', 'data'],

        properties: {
          message: {
            type: 'string',
            example:
              'Dispositivo cadastrado com sucesso.',
          },

          data: {
            $ref: '#/components/schemas/Device',
          },
        },
      },

      DeviceListResponse: {
        type: 'object',
        required: ['data', 'meta'],

        properties: {
          data: {
            type: 'array',

            items: {
              $ref: '#/components/schemas/Device',
            },
          },

          meta: {
            type: 'object',
            required: ['total'],

            properties: {
              total: {
                type: 'integer',
                minimum: 0,
                example: 1,
              },
            },
          },
        },
      },

      HealthResponse: {
        type: 'object',
        required: ['status', 'message', 'timestamp'],

        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },

          message: {
            type: 'string',
            example:
              'Phone Store API está funcionando.',
          },

          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      DatabaseHealthResponse: {
        type: 'object',
        required: [
          'status',
          'message',
          'database',
          'timestamp',
        ],

        properties: {
          status: {
            type: 'string',
            example: 'ok',
          },

          message: {
            type: 'string',
            example:
              'Conexão com o PostgreSQL realizada com sucesso.',
          },

          database: {
            type: 'object',
            required: ['devices', 'sales'],

            properties: {
              devices: {
                type: 'integer',
                minimum: 0,
                example: 1,
              },

              sales: {
                type: 'integer',
                minimum: 0,
                example: 0,
              },
            },
          },

          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },

      ErrorResponse: {
        type: 'object',
        required: ['message'],

        properties: {
          message: {
            type: 'string',
            example:
              'Ocorreu um erro ao processar a solicitação.',
          },
        },
      },

      ValidationErrorResponse: {
        type: 'object',
        required: ['message'],

        properties: {
          message: {
            type: 'string',
            example:
              'Os dados enviados são inválidos.',
          },

          errors: {
            type: 'object',
            additionalProperties: {
              type: 'array',

              items: {
                type: 'string',
              },
            },

            example: {
              imei: [
                'O IMEI deve possuir exatamente 15 números.',
              ],
              salePrice: [
                'O valor de venda não pode ser menor que o valor de compra.',
              ],
            },
          },

          formErrors: {
            type: 'array',

            items: {
              type: 'string',
            },
          },
        },
      },

      ...salesSchemas,
    },
  },
} as const;