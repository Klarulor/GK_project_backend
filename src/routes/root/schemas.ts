export const HEALTH_CHECK_SCHEMA = {
  type: "object",
  title: "HealthCheckResult",
  required: ["status", "details"],
  properties: {
    status: {
      type: "string",
      enum: ["ok", "error", "shutting_down"],
      description: "The overall status of the Health Check",
      example: "ok",
    },
    info: {
      type: "object",
      description:
        'The info object contains information of each health indicator which is of status "up"',
      additionalProperties: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["up", "down"],
            example: "up",
          },
        },
        additionalProperties: true,
      },
      example: {
        database: { status: "up", version: "15.2" },
        redis: { status: "up", latencyMs: 5 },
      },
    },
    error: {
      type: "object",
      description:
        'The error object contains information of each health indicator which is of status "down"',
      additionalProperties: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["up", "down"],
            example: "down",
          },
        },
        additionalProperties: true,
      },
      example: {
        paymentGateway: { status: "down", message: "Connection timeout" },
      },
    },
    details: {
      type: "object",
      description:
        "The details object contains information of every health indicator",
      additionalProperties: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["up", "down"],
          },
        },
        additionalProperties: true,
      },
    },
  },
};
