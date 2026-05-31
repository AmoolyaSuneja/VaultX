import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function startSmoothScroll() {
  if (typeof window === 'undefined') return;
  if (lenisInstance) return;

  const prefersReducedMotion =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) return;

  lenisInstance = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    lerp: 0.14,
    wheelMultiplier: 1.15
  });

  function raf(time: number) {
    lenisInstance?.raf(time);
    window.requestAnimationFrame(raf);
  }

  window.requestAnimationFrame(raf);
}

export function scrollToTop() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: false });
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
