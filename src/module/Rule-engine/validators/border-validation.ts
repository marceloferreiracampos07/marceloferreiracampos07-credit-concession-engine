import { ZodSchema } from "zod";

export function validateBorderData<T>(schema: ZodSchema<T>, data: any): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const formattedErrors = result.error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));

    throw new Error(JSON.stringify({
      type: "VALIDATION_ERROR",
      errors: formattedErrors
    }));
  }

  return result.data;
}