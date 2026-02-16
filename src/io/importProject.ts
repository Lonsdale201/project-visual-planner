import type { Project } from '../model/types';
import { validateProjectJson, type ValidationResult } from './validateProject';

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
          resolve({ project: data as Project, validation });
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
