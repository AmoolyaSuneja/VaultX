// Motion primitives tuned for a quiet, professional feel:
//   - Page transitions: sub-4px translate, ~220ms, cubic-bezier(0.22, 1, 0.36, 1).
//   - Modal/scale: barely perceptible, fast fade + 1% scale.
//   - No translations > 6px, no springs that overshoot.

const smoothEase = [0.22, 1, 0.36, 1] as const;

export const appleSpring = {
  type: 'spring',
  stiffness: 420,
  damping: 44,
  mass: 0.8
} as const;

export const pageTransition = {
  duration: 0.22,
  ease: smoothEase
} as const;

export const fadeUp = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 2 },
  transition: pageTransition
} as const;

export const slideRight = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 8 },
  transition: { duration: 0.26, ease: smoothEase }
} as const;

export const staggerChildren = {
  animate: { transition: { staggerChildren: 0.03 } }
} as const;

export const scaleIn = {
  initial: { scale: 0.995, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.995, opacity: 0 },
  transition: { duration: 0.18, ease: smoothEase }
} as const;

export const shakeX = {
  x: [0, -3, 3, -2, 2, 0],
  transition: { duration: 0.24 }
};
