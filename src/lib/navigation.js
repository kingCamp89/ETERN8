/** Tab root paths for back-navigation fallback in PageHeader */
const TAB_ROOT_RULES = [
  { match: (p) => p.startsWith('/loved-ones'), root: '/loved-ones' },
  { match: (p) => p.startsWith('/groups'), root: '/groups' },
  { match: (p) => p.startsWith('/friends'), root: '/friends' },
  {
    match: (p) =>
      p === '/settings' ||
      p.startsWith('/help') ||
      p.startsWith('/privacy') ||
      p.startsWith('/subscription') ||
      p.startsWith('/our-story') ||
      p.startsWith('/legacy') ||
      p.startsWith('/future-deliveries') ||
      p.startsWith('/memory-books') ||
      p.startsWith('/search') ||
      p.startsWith('/shared'),
    root: '/settings',
  },
];

export function getTabRoot(pathname) {
  for (const { match, root } of TAB_ROOT_RULES) {
    if (match(pathname)) return root;
  }
  return '/';
}

export function navigateBack(navigate, pathname) {
  const root = getTabRoot(pathname);
  if (root && pathname !== root && pathname.startsWith(`${root}/`)) {
    navigate(root);
    return;
  }
  navigate(-1);
}
