import type { Project } from '../model/types';
import { validateProjectJson, type ValidationResult } from './validateProject';
import { migrateProjectToFlowModel } from '../model/projectMigration';

/**
 * Check whether the parsed JSON has enough shape to attempt a migration.
 * This is intentionally loose – the migration layer normalises everything else.
 */
function looksLikeProject(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  // Must have at minimum a project meta block and either top-level pages or flows
  return (
    typeof obj.project === 'object' &&
    obj.project !== null &&
    (Array.isArray(obj.pages) || (typeof obj.flows === 'object' && obj.flows !== null))
  );
}

export function importProjectFromFile(): Promise<{ project: Project | null; validation: ValidationResult }> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve({ project: null, validation: { valid: false, errors: ['No file selected'] } });
        return;
      }

      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const validation = validateProjectJson(data);

        if (validation.valid) {
          resolve({ project: migrateProjectToFlowModel(data as Project), validation });
        } else if (looksLikeProject(data)) {
          // Schema validation failed but the structure is close enough – try to
          // load it anyway so the user doesn't lose their work.  The migration
          // layer will fill in any missing defaults.
          resolve({
            project: migrateProjectToFlowModel(data as unknown as Project),
            validation: { valid: true, errors: validation.errors },
          });
        } else {
          resolve({ project: null, validation });
        }
      } catch (err) {
        resolve({
          project: null,
          validation: { valid: false, errors: [`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`] },
        });
      }
    };

    // Handle cancel
    input.oncancel = () => {
      resolve({ project: null, validation: { valid: false, errors: ['Import cancelled'] } });
    };

    input.click();
  });
}
