/**
 * Material Design 3 (M3) Color Tokens
 */

export const m3Tokens = {
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#4A3B78',
  onPrimaryContainer: '#EADDFF',
  secondary: '#00A896',
  secondaryContainer: '#1E3A38',
  onSecondaryContainer: '#A6F2E6',
  surface: '#141218',
  surfaceContainerLow: '#1D1B20',
  surfaceContainerHigh: '#2B2930',
  outline: '#938F99',
} as const;

export type M3Tokens = typeof m3Tokens;
