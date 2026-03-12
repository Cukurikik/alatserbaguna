export interface CropOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AspectRatio {
  label: string;
  value: number | null; // null means freeform
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { label: 'Free', value: null },
  { label: '1:1 (Square)', value: 1 },
  { label: '16:9 (Landscape)', value: 16 / 9 },
  { label: '9:16 (Portrait)', value: 9 / 16 },
  { label: '4:3 (Classic)', value: 4 / 3 },
  { label: '3:4 (Vertical)', value: 3 / 4 },
];
