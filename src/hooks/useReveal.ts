import { useEffect } from 'react';

/**
 * Adds an `.in` class to every element matching `.reveal` once it scrolls into
 * view. Re-runs whenever any dep changes so newly-mounted reveals are wired up.
 */
export function useReveal(deps: ReadonlyArray<unknown> = []): void {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
