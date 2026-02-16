import type { NodeStylePreset } from '../model/types';

export const nodeColorMap: Record<NodeStylePreset, { bg: string; border: string; header: string; text: string }> = {
  blue:   { bg: '#ffffff', border: '#3f6fd8', header: '#edf3ff', text: '#1f3d78' },
  green:  { bg: '#ffffff', border: '#1e9a6a', header: '#eaf8f2', text: '#155a3f' },
  orange: { bg: '#ffffff', border: '#c97b2d', header: '#fdf3e9', text: '#7a4716' },
  red:    { bg: '#ffffff', border: '#c55656', header: '#fdeeee', text: '#7b2a2a' },
  purple: { bg: '#ffffff', border: '#6e63c9', header: '#f1efff', text: '#3a3272' },
  grey:   { bg: '#ffffff', border: '#8a96a8', header: '#f2f5f9', text: '#3d4756' },
  teal:   { bg: '#ffffff', border: '#218a8f', header: '#eaf7f7', text: '#145357' },
};
