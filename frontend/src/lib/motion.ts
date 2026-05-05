export const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
} as const;

export const slideRight = {
  initial: { opacity: 0, x: 28 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 28 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
} as const;

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.04 } }
} as const;

export const scaleIn = {
  initial: { scale: 0.98, opacity: 0, y: 8 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.98, opacity: 0, y: 6 },
  transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] }
} as const;

export const shakeX = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: 0.36 }
};
