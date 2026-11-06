'use client';

import { useLayoutEffect, useState } from 'react';

/** Número que sube hasta su valor al montarse. Con movimiento reducido muestra el valor final. */
export default function CountUp({ value, duration = 900, locale = 'es' }: { value: number; duration?: number; locale?: string }) {
  const [shown, setShown] = useState(value);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let raf = 0;
    const t0 = performance.now();
    setShown(0);
    const step = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{shown.toLocaleString(locale)}</>;
}
