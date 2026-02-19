import React, { useMemo } from 'react';
import {
  TextField, MenuItem, Chip, Box, Stack, Typography, Autocomplete, InputAdornment, IconButton, Button, FormControlLabel, Switch,
} from '@mui/material';
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import type { NodeKind, ServiceEndpointMethod } from '../../model/types';
import type { FieldDef } from '../../model/registry';
import {
  integrationPresets,
  infraPresets,
  frameworkPresets,
  stackPresets,
  findPresetByLabel,
  type PresetOption,
} from '../../utils/presets';
import { FrameworkPresetIcon, IntegrationPresetIcon, TechStackPresetIcon } from '../../utils/presetIcons';
import { createServiceEndpoint, parseServiceEndpoints, serviceEndpointMethods } from '../../utils/serviceEndpoints';

interface SchemaFormProps {
  fields: FieldDef[];
  data: Record<string, unknown>;
  nodeKind?: NodeKind;
  onChange: (key: string, value: unknown) => void;
}

interface PresetSelectFieldProps {
  field: FieldDef;
  value: string;
  options: PresetOption[];
  customLabel: string;
  iconMode?: 'integration' | 'infra' | 'framework';
  onChange: (value: string) => void;
}

interface PresetMultiSelectFieldProps {
  field: FieldDef;
  values: string[];
  options: PresetOption[];
  customLabel: string;
  iconMode: 'stack';
  onChange: (values: string[]) => void;
}

function PresetPill({
  preset,
  label,
  mode = 'integration',
}: {
  preset?: PresetOption;
  label: string;
  mode?: 'integration' | 'infra' | 'framework' | 'stack';
}) {
  if (mode === 'infra') {
    return (
      <Box
        sx={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1px solid #dbe3ec',
          bgcolor: '#eef2f7',
          color: '#5b6b80',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <CloudOutlinedIcon sx={{ fontSize: 12 }} />
      </Box>
    );
  }
  if (mode === 'framework') {
    return <FrameworkPresetIcon preset={preset} size={20} />;
  }
  if (mode === 'stack') {
    return <TechStackPresetIcon preset={preset} size={20} />;
  }
  const fallbackPreset = preset ?? {
    value: '',
    label,
    abbr: label.slice(0, 2).toUpperCase(),
    color: '#64748b',
    bg: '#eef2f7',
  };
  return <IntegrationPresetIcon preset={fallbackPreset} size={20} />;
}

function PresetSelectField({
  field,
  value,
  options,
  customLabel,
  iconMode = 'integration',
  onChange,
}: PresetSelectFieldProps) {
  const labelToPreset = useMemo(
    () => new Map(options.map(option => [option.label.toLowerCase(), option])),
    [options],
  );

  const selectedPreset = value ? (labelToPreset.get(value.trim().toLowerCase()) ?? findPresetByLabel(options, value)) : undefined;
  const optionLabels = options.map(option => option.label);

  return (
    <Autocomplete
      freeSolo
      options={optionLabels}
      value={value}
      onChange={(_, newValue) => onChange(typeof newValue === 'string' ? newValue : '')}
      onInputChange={(_, newInputValue, reason) => {
        if (reason === 'input') onChange(newInputValue);
      }}
      renderOption={(props, option) => {
        const preset = labelToPreset.get(option.toLowerCase());
        return (
          <Box component="li" {...props} key={option} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PresetPill preset={preset} label={option} mode={iconMode} />
            <Typography variant="body2">{option}</Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label}
          placeholder={field.placeholder ?? customLabel}
          size="small"
          fullWidth
          helperText={`Type to search presets, or write your own (${customLabel}).`}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ mr: 0.8 }}>
                    <PresetPill preset={selectedPreset} label={value || customLabel} mode={iconMode} />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

function PresetMultiSelectField({
  field,
  values,
  options,
  customLabel,
  iconMode,
  onChange,
}: PresetMultiSelectFieldProps) {
  const labelToPreset = useMemo(
    () => new Map(options.map(option => [option.label.toLowerCase(), option])),
    [options],
  );

  const optionLabels = options.map(option => option.label);

  const normalizeValues = (rawValues: Array<string | null | undefined>) => {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const raw of rawValues) {
      const value = (raw ?? '').trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      normalized.push(value);
    }

    return normalized;
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={optionLabels}
      value={values}
      onChange={(_, newValue) => onChange(normalizeValues(newValue.map(v => (typeof v === 'string' ? v : String(v)))))}
      renderOption={(props, option) => {
        const preset = labelToPreset.get(option.toLowerCase());
        return (
          <Box component="li" {...props} key={option} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PresetPill preset={preset} label={option} mode={iconMode} />
            <Typography variant="body2">{option}</Typography>
          </Box>
        );
      }}
      renderTags={(tagValues, getTagProps) => tagValues.map((tag, index) => {
        const preset = labelToPreset.get(tag.trim().toLowerCase()) ?? findPresetByLabel(options, tag);
        const { key, ...tagProps } = getTagProps({ index });

        return (
          <Chip
            key={`${tag}-${index}-${key}`}
            label={tag}
            size="small"
            avatar={<Box sx={{ ml: 0.3 }}><PresetPill preset={preset} label={tag} mode={iconMode} /></Box>}
            {...tagProps}
          />
        );
      })}
      renderInput={(params) => (
        <TextField
          {...params}
          label={field.label}
          placeholder={field.placeholder ?? customLabel}
          size="small"
          fullWidth
          helperText={`Search stacks or add custom (${customLabel}).`}
        />
      )}
    />
  );
}

function ServiceEndpointsField({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const endpoints = parseServiceEndpoints(value);

  const updateEndpoint = (index: number, patch: { method?: ServiceEndpointMethod; route?: string }) => {
    const next = endpoints.map((endpoint, idx) => (
      idx === index
        ? {
          ...endpoint,
          ...(patch.method ? { method: patch.method } : {}),
          ...(patch.route !== undefined ? { route: patch.route } : {}),
        }
        : endpoint
    ));
    onChange(next);
  };

  const removeEndpoint = (index: number) => {
    onChange(endpoints.filter((_, idx) => idx !== index));
  };

  const addEndpoint = () => {
    onChange([
      ...endpoints,
      createServiceEndpoint('GET', ''),
    ]);
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {field.label}
      </Typography>

      <Stack spacing={1} sx={{ mt: 0.8, mb: 0.8 }}>
        {endpoints.map((endpoint, index) => (
          <Stack key={endpoint.id} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <TextField
              select
              size="small"
              label="Method"
              value={endpoint.method}
              onChange={e => updateEndpoint(index, { method: e.target.value as ServiceEndpointMethod })}
              sx={{ width: 118, flexShrink: 0 }}
            >
              {serviceEndpointMethods.map(method => (
                <MenuItem key={method} value={method}>
                  {method}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              size="small"
              label="Route"
              value={endpoint.route}
              onChange={e => updateEndpoint(index, { route: e.target.value })}
              placeholder="/auth/login"
              fullWidth
            />

            <IconButton
              size="small"
              color="error"
              onClick={() => removeEndpoint(index)}
              aria-label={`Delete endpoint ${index + 1}`}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Button
        size="small"
        variant="outlined"
        startIcon={<AddOutlinedIcon />}
        onClick={addEndpoint}
        sx={{ textTransform: 'none' }}
      >
        Add endpoint
      </Button>
    </Box>
  );
}

export default function SchemaForm({ fields, data, nodeKind, onChange }: SchemaFormProps) {
  return (
    <Stack spacing={2}>
      {fields.map(field => {
        const value = data[field.key];

        if (field.type === 'string' && nodeKind === 'integration' && field.key === 'name') {
          return (
            <PresetSelectField
              key={field.key}
              field={field}
              value={(value as string) ?? ''}
              options={integrationPresets}
              customLabel="Custom integration"
              iconMode="integration"
              onChange={nextValue => onChange(field.key, nextValue)}
            />
          );
        }

        if (field.type === 'string' && nodeKind === 'brand' && field.key === 'brand') {
          return (
            <PresetSelectField
              key={field.key}
              field={field}
              value={(value as string) ?? ''}
              options={integrationPresets}
              customLabel="Custom brand"
              iconMode="integration"
              onChange={nextValue => onChange(field.key, nextValue)}
            />
          );
        }

        if (field.type === 'string' && nodeKind === 'infra' && field.key === 'provider') {
          return (
            <PresetSelectField
              key={field.key}
              field={field}
              value={(value as string) ?? ''}
              options={infraPresets}
              customLabel="Custom provider"
              iconMode="infra"
              onChange={nextValue => onChange(field.key, nextValue)}
            />
          );
        }

        if (field.type === 'string' && nodeKind === 'framework' && field.key === 'framework') {
          return (
            <PresetSelectField
              key={field.key}
              field={field}
              value={(value as string) ?? ''}
              options={frameworkPresets}
              customLabel="Custom framework"
              iconMode="framework"
              onChange={nextValue => onChange(field.key, nextValue)}
            />
          );
        }

        if (field.type === 'tags' && nodeKind === 'overview' && field.key === 'stacks') {
          const combinedStackOptions = [
            ...stackPresets,
            ...frameworkPresets,
            ...infraPresets,
          ].filter((option, index, arr) => arr.findIndex(o => o.label.toLowerCase() === option.label.toLowerCase()) === index);

          return (
            <PresetMultiSelectField
              key={field.key}
              field={field}
              values={(value as string[]) ?? []}
              options={combinedStackOptions}
              customLabel="Custom stack"
              iconMode="stack"
              onChange={nextValues => onChange(field.key, nextValues)}
            />
          );
        }

        switch (field.type) {
          case 'string':
            return (
              <TextField
                key={field.key}
                label={field.label}
                value={(value as string) ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                size="small"
                fullWidth
              />
            );

          case 'text': {
            const isCodeContent = nodeKind === 'code' && field.key === 'content';
            return (
              <TextField
                key={field.key}
                label={field.label}
                value={(value as string) ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                size="small"
                fullWidth
                multiline
                minRows={isCodeContent ? 9 : 3}
                helperText={
                  isCodeContent
                    ? 'Supports resize; paste code, JSON schema, REST snippets, or API contracts.'
                    : 'Supports Markdown: **bold**, *italic*, `code`, [link](url), and simple lists.'
                }
                sx={{
                  '& .MuiInputBase-inputMultiline': {
                    resize: 'vertical',
                    overflow: 'auto !important',
                    fontFamily: isCodeContent
                      ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                      : 'inherit',
                    fontSize: isCodeContent ? 13 : undefined,
                    lineHeight: isCodeContent ? 1.45 : undefined,
                  },
                }}
              />
            );
          }

          case 'enum':
            return (
              <TextField
                key={field.key}
                label={field.label}
                value={(value as string) ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                size="small"
                fullWidth
                select
              >
                {(field.options ?? []).map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            );

          case 'tags': {
            const tags = (value as string[]) ?? [];
            return (
              <Box key={field.key}>
                <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {tags.map((tag, i) => (
                    <Chip
                      key={`${tag}-${i}`}
                      label={tag}
                      size="small"
                      onDelete={() => {
                        const newTags = tags.filter((_, idx) => idx !== i);
                        onChange(field.key, newTags);
                      }}
                    />
                  ))}
                </Box>
                <TextField
                  size="small"
                  fullWidth
                  placeholder={field.placeholder ?? 'Add tag and press Enter...'}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.target as HTMLInputElement;
                      const val = input.value.trim();
                      if (val && !tags.includes(val)) {
                        onChange(field.key, [...tags, val]);
                        input.value = '';
                      }
                    }
                  }}
                />
              </Box>
            );
          }

          case 'endpointList':
            return (
              <ServiceEndpointsField
                key={field.key}
                field={field}
                value={value}
                onChange={nextValue => onChange(field.key, nextValue)}
              />
            );

          case 'date':
            return (
              <TextField
                key={field.key}
                label={field.label}
                type="date"
                value={(value as string) ?? ''}
                onChange={e => onChange(field.key, e.target.value)}
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            );

          case 'number':
            return (
              <TextField
                key={field.key}
                label={field.label}
                type="number"
                value={typeof value === 'number' ? value : Number(value ?? 0)}
                onChange={e => onChange(field.key, Number(e.target.value))}
                size="small"
                fullWidth
                placeholder={field.placeholder}
              />
            );

          case 'boolean':
            return (
              <FormControlLabel
                key={field.key}
                control={(
                  <Switch
                    checked={Boolean(value)}
                    onChange={(_, checked) => onChange(field.key, checked)}
                  />
                )}
                label={field.label}
              />
            );

          default:
            return null;
        }
      })}
    </Stack>
  );
}
