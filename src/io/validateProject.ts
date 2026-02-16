import Ajv from 'ajv';
import { projectJsonSchema } from './schema';

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(projectJsonSchema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateProjectJson(data: unknown): ValidationResult {
  const valid = validate(data) as boolean;
  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors = (validate.errors ?? []).map(err => {
    const path = err.instancePath || '/';
    return `${path}: ${err.message}`;
  });

  return { valid: false, errors };
}
