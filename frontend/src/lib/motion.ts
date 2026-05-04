export const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const slideRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 30, stiffness: 300 }
} as const;

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.04 } }
} as const;

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.18, ease: 'easeOut' }
} as const;

export const shakeX = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: 0.36 }
};
