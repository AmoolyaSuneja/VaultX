export const appleSpring = {
  type: 'spring',
  stiffness: 360,
  damping: 34,
  mass: 0.9
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 3 },
  transition: appleSpring
} as const;

export const slideRight = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 16 },
  transition: appleSpring
} as const;

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.03 } }
} as const;

export const scaleIn = {
  initial: { scale: 0.99, opacity: 0, y: 4 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.99, opacity: 0, y: 2 },
  transition: appleSpring
} as const;

export const shakeX = {
  x: [0, -4, 4, -2, 2, 0],
  transition: { duration: 0.28 }
};
