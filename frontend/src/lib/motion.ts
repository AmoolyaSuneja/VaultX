export const appleSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 38,
  mass: 0.9
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
  transition: appleSpring
} as const;

export const slideRight = {
  initial: { opacity: 0, x: 36 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
  transition: appleSpring
} as const;

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.04 } }
} as const;

export const scaleIn = {
  initial: { scale: 0.985, opacity: 0, y: 6 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.985, opacity: 0, y: 4 },
  transition: appleSpring
} as const;

export const shakeX = {
  x: [0, -6, 6, -4, 4, 0],
  transition: { duration: 0.36 }
};
