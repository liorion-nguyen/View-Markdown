'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AppRoot() {
  const ref = useRef(null);
  const syncRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    import('@/lib/initApp').then(({ initApp }) => {
      if (!cancelled && ref.current) {
        syncRef.current = initApp(ref.current, {
          navigate: (path) => router.push(path),
          pathname,
        });
        syncRef.current?.syncScreen(pathname);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    syncRef.current?.syncScreen(pathname);
  }, [pathname]);

  return <div id="app" ref={ref} />;
}
