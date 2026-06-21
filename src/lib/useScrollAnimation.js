export default function useScrollAnimation(elements) {
  if (typeof window === 'undefined') return;
  let targets;
  if (Array.isArray(elements) || NodeList.prototype.isPrototypeOf(elements)) {
    targets = elements;
  } else {
    targets = document.querySelectorAll(elements);
  }
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in-up');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach(el => observer.observe(el));
}
