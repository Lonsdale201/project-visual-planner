export interface DbSchemaField {
  name: string;
  type: string;
  constraints?: string;
}

function cleanupLine(raw: string): string {
  return raw
    .replace(/--.*$/, '')
    .replace(/\/\/.*$/, '')
    .replace(/,\s*$/, '')
    .replace(/;\s*$/, '')
    .trim()
    .replace(/^[-*+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .trim();
}

function parseTypeAndConstraints(raw: string): { type: string; constraints: string } {
  const value = raw.trim();
  if (!value) return { type: 'text', constraints: '' };

  const typeMatch = value.match(/^([a-zA-Z][\w]*(?:\s*\([^)]+\))?(?:\[\])?)/);
  if (!typeMatch) return { type: value, constraints: '' };

  const type = typeMatch[1].trim();
  const constraints = value.slice(typeMatch[0].length).trim();
  return { type, constraints };
}

function parseJsonSchema(source: string): DbSchemaField[] {
  const parseRecordEntry = (nameRaw: string, value: unknown): DbSchemaField | null => {
    const name = nameRaw.trim();
    if (!name) return null;

    if (typeof value === 'string') {
      const { type, constraints } = parseTypeAndConstraints(value);
      return { name, type, constraints };
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const type = typeof record.type === 'string' ? record.type.trim() : 'text';
      const constraints = typeof record.constraints === 'string' ? record.constraints.trim() : '';
      return { name, type, constraints };
    }

    return { name, type: 'text', constraints: '' };
  };

  try {
    const parsed = JSON.parse(source) as unknown;

    if (Array.isArray(parsed)) {
      return parsed
        .flatMap((item): DbSchemaField[] => {
          if (!item || typeof item !== 'object') return [];
          const record = item as Record<string, unknown>;
          const name = typeof record.name === 'string' ? record.name.trim() : '';
          if (!name) return [];

          const type = typeof record.type === 'string' ? record.type.trim() : 'text';
          const constraints = typeof record.constraints === 'string' ? record.constraints.trim() : '';
          return [{ name, type, constraints }];
        });
    }

    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;

      if (record.properties && typeof record.properties === 'object') {
        const requiredSet = new Set(
          Array.isArray(record.required)
            ? record.required.filter((item): item is string => typeof item === 'string').map(item => item.trim())
            : [],
        );
        return Object.entries(record.properties as Record<string, unknown>).flatMap(([key, value]) => {
          const parsedField = parseRecordEntry(key, value);
          if (!parsedField) return [];
          if (requiredSet.has(parsedField.name) && !parsedField.constraints) {
            return [{ ...parsedField, constraints: 'required' }];
          }
          return [parsedField];
        });
      }

      if (Array.isArray(record.fields)) {
        return record.fields.flatMap((item): DbSchemaField[] => {
          if (!item || typeof item !== 'object') return [];
          const fieldRecord = item as Record<string, unknown>;
          const name = typeof fieldRecord.name === 'string' ? fieldRecord.name.trim() : '';
          if (!name) return [];
          const parsedField = parseRecordEntry(name, fieldRecord);
          return parsedField ? [parsedField] : [];
        });
      }

      return Object.entries(record).flatMap(([key, value]) => {
        const parsedField = parseRecordEntry(key, value);
        return parsedField ? [parsedField] : [];
      });
    }
  } catch {
    // Not valid JSON schema text, fallback to line parser.
  }

  return [];
}

function parseLineBasedSchema(source: string): DbSchemaField[] {
  const lines = source.split('\n').map(cleanupLine).filter(Boolean);
  const fields: DbSchemaField[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw
      .replace(/^```[\w-]*$/i, '')
      .replace(/^[({[]\s*/, '')
      .replace(/\s*[)}\]]$/, '')
      .trim();
    if (!line) continue;
    if (/^create\s+table/i.test(line) || /^table\s+/i.test(line)) continue;
    if (/^(constraint|primary\s+key|foreign\s+key|unique|check|index|key)\b/i.test(line)) continue;
    if (/^[-|:\s]+$/.test(line)) continue;

    if (line.includes('|')) {
      const parts = line.split('|').map(part => part.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const first = parts[0].toLowerCase();
        if (first === 'field' || first === 'name' || first === 'column') continue;
        const name = parts[0].replace(/["`]/g, '').trim();
        if (!name) continue;
        const { type, constraints } = parseTypeAndConstraints(parts.slice(1).join(' '));
        fields.push({ name, type, constraints });
        continue;
      }
    }

    if (line.includes(':')) {
      const [namePart, restPart] = line.split(/:(.+)/).filter(Boolean);
      const name = (namePart ?? '').trim().replace(/["`]/g, '');
      if (!name) continue;
      const { type, constraints } = parseTypeAndConstraints(restPart ?? '');
      fields.push({ name, type, constraints });
      continue;
    }

    const sqlLike = line.match(/^["`]?([a-zA-Z_][\w$]*)["`]?\s+(.+)$/);
    if (!sqlLike) continue;

    const name = sqlLike[1].trim();
    const { type, constraints } = parseTypeAndConstraints(sqlLike[2]);
    fields.push({ name, type, constraints });
  }

  return fields;
}

export function parseDbSchema(schemaNotes: string): DbSchemaField[] {
  const source = schemaNotes.trim();
  if (!source) return [];

  const maybeJson = source[0] === '{' || source[0] === '[' ? parseJsonSchema(source) : [];
  const parsed = maybeJson.length ? maybeJson : parseLineBasedSchema(source);

  // Keep first occurrence by column name for stable preview.
  const seen = new Set<string>();
  const unique = parsed.filter(field => {
    const key = field.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}
