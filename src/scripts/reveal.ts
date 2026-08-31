/**
 * Fades elements marked .rev in as they scroll into view. Shared by every page,
 * so the motion is identical everywhere and there is one place to disable it.
 */
export function revealOnScroll(root: ParentNode = document): void {
  const targets = Array.from(root.querySelectorAll<HTMLElement>('.rev'));
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  if (reduced || !('IntersectionObserver' in window)) {
    for (const el of targets) el.classList.add('in');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  for (const el of targets) io.observe(el);
}
