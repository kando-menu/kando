type SchemaType = 'string' | 'number' | 'boolean' | 'enum' | 'array' | 'object';

interface SchemaField {
  type: SchemaType;
  required?: boolean;
  values?: string[]; // for enum
  schema?: Schema; // for object
  elementSchema?: Schema; // for array
}

type Schema = {
  [key: string]: SchemaField;
};

// We'll define menuItemSchema as a mutable object first, then assign recursive part later
const menuItemSchema: Schema = {
  name: { type: 'string', required: true },
  type: {
    type: 'enum',
    required: true,
    values: [
      'submenu',
      'command',
      'file',
      'hotkey',
      'macro',
      'text',
      'uri',
      'redirect',
      'settings',
    ],
  },
  icon: { type: 'string', required: true },
  iconTheme: { type: 'string', required: true },
  data: { type: 'object', required: false }, // Can be expanded
  children: { type: 'array', required: false }, // We'll add elementSchema later
};

menuItemSchema.children.elementSchema = menuItemSchema;

export const rootSchema: Schema = {
  name: { type: 'string', required: true },
  type: {
    type: 'enum',
    required: true,
    values: [
      'submenu',
      'command',
      'file',
      'hotkey',
      'macro',
      'text',
      'uri',
      'redirect',
      'settings',
    ],
  },
  icon: { type: 'string', required: true },
  iconTheme: { type: 'string', required: true },
  children: { type: 'array', required: true, elementSchema: menuItemSchema },
};

export function validateBySchema(
  data: any,
  schema: Schema,
  path = 'root'
): string | null {
  for (const key in schema) {
    const field = schema[key];
    const fullPath = `${path}.${key}`;
    const value = data?.[key];

    if (field.required && value === undefined) {
      return `Missing required field: "${fullPath}"`;
    }

    if (value === undefined) continue;

    if (field.type === 'enum') {
      if (typeof value !== 'string') {
        return `Field "${fullPath}" should be of type "string" (enum), but got "${typeof value}"`;
      }
      if (!field.values || !field.values.includes(value)) {
        return `Field "${fullPath}" must be one of: ${field.values?.join(', ')}, got "${value}"`;
      }
      continue;
    }

    const actualType = Array.isArray(value) ? 'array' : typeof value;

    if (actualType !== field.type) {
      return `Field "${fullPath}" should be of type "${field.type}", but got "${actualType}"`;
    }

    if (field.type === 'object' && field.schema) {
      const err = validateBySchema(value, field.schema, fullPath);
      if (err) return err;
    }

    if (field.type === 'array' && field.elementSchema) {
      for (let i = 0; i < value.length; i++) {
        const err = validateBySchema(value[i], field.elementSchema, `${fullPath}[${i}]`);
        if (err) return err;
      }
    }
  }

  return null;
}
