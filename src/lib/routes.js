export function screenFromPath(pathname) {
  const path = pathname.replace(/\/$/, '') || '/';
  if (path === '/workspace') return 'workspace';
  if (path === '/compose') return 'compose';
  if (path === '/guide') return 'guide';
  return 'landing';
}

/** @param {'landing' | 'guide' | 'workspace' | 'compose'} screen */
export function pathFromScreen(screen) {
  if (screen === 'workspace') return '/workspace';
  if (screen === 'compose') return '/compose';
  if (screen === 'guide') return '/guide';
  return '/';
}
