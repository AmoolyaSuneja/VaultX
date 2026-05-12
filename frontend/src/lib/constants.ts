export const categoryPalette: Record<string, string> = {
  Finance: 'border-line bg-surface-muted text-textPrimary',
  Personal: 'border-line bg-surface-muted text-textPrimary',
  Work: 'border-line bg-surface-muted text-textPrimary',
  Social: 'border-line bg-surface-muted text-textPrimary',
  Shopping: 'border-line bg-surface-muted text-textPrimary',
  General: 'border-line bg-surface-muted text-textMuted'
};

export const defaultCategories = Object.keys(categoryPalette);

export const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'az', label: 'A-Z' },
  { value: 'za', label: 'Z-A' }
] as const;

export const APP_NAME = 'VaultX';
