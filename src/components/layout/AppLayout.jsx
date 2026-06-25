import { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { BrandHome, BrandHeart, BrandUsers, BrandUser, BrandUserPlus } from '@/components/shared/BrandIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import DesktopAmbience from '@/components/layout/DesktopAmbience';

const tabRoots = [
  { key: 'home', path: '/', icon: BrandHome, label: 'Home' },
  { key: 'lovedOnes', path: '/loved-ones', icon: BrandHeart, label: 'People' },
  { key: 'circles', path: '/groups', icon: BrandUsers, label: 'Circles' },
  { key: 'friends', path: '/friends', icon: BrandUserPlus, label: 'Friends' },
  { key: 'more', path: '/settings', icon: BrandUser, label: 'More' },
];

function getTabKey(pathname) {
  for (const tab of tabRoots) {
    if (tab.path === '/') {
      if (pathname === '/') return tab.key;
    } else if (pathname.startsWith(tab.path)) {
      return tab.key;
    }
  }
  return 'home';
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const currentTab = getTabKey(location.pathname);

  // Notification counts
  const { data: pendingData } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: () => base44.functions.invoke('getMyPendingRequests'),
    refetchInterval: 30000,
  });
  const { data: groupsData } = useQuery({
    queryKey: ['myGroupsCount'],
    queryFn: () => base44.functions.invoke('getMyGroups'),
    refetchInterval: 30000,
  });
  const { data: sharesData } = useQuery({
    queryKey: ['pendingShares'],
    queryFn: () => base44.entities.MemoryShare.filter({ status: 'pending' }),
    refetchInterval: 30000,
  });

  // Compute current counts
  const pendingFriendCount = pendingData?.data?.incoming?.length || 0;
  const groupsCount = groupsData?.data?.total || 0;
  const pendingSharesCount = sharesData?.length || 0;

  // Track which counts the user has "seen" — persisted to survive re-login
  const [seenCounts, setSeenCounts] = useState(() => {
    try {
      const stored = localStorage.getItem('notifSeenCounts');
      return stored ? JSON.parse(stored) : { friends: 0, shares: 0, groups: 0 };
    } catch { return { friends: 0, shares: 0, groups: 0 }; }
  });
  const prevTabRef = useRef(getTabKey(window.location.pathname));

  // Persist seen counts to localStorage
  useEffect(() => {
    localStorage.setItem('notifSeenCounts', JSON.stringify(seenCounts));
  }, [seenCounts]);

  // Keep seenCounts in sync when counts drop, but skip the loading phase (all zero)
  useEffect(() => {
    if (pendingFriendCount === 0 && pendingSharesCount === 0 && groupsCount === 0) return;
    setSeenCounts(prev => ({
      friends: Math.min(prev.friends, pendingFriendCount),
      shares: Math.min(prev.shares, pendingSharesCount),
      groups: Math.min(prev.groups, groupsCount),
    }));
  }, [pendingFriendCount, pendingSharesCount, groupsCount]);

  // When switching to a different tab, mark that tab's notifications as seen
  useEffect(() => {
    if (currentTab !== prevTabRef.current) {
      prevTabRef.current = currentTab;
      setSeenCounts(prev => ({
        friends: currentTab === 'friends' ? pendingFriendCount : prev.friends,
        shares: currentTab === 'home' ? pendingSharesCount : prev.shares,
        groups: currentTab === 'circles' ? groupsCount : prev.groups,
      }));
    }
  }, [currentTab, pendingFriendCount, pendingSharesCount, groupsCount]);

  const [tabStacks, setTabStacks] = useState(() => {
    const initial = {};
    tabRoots.forEach(t => { initial[t.key] = [t.path]; });
    return initial;
  });

  // Sync location changes into the current tab's stack
  useEffect(() => {
    setTabStacks(prev => {
      const stack = prev[currentTab] || [];
      const last = stack[stack.length - 1];
      if (last !== location.pathname) {
        return { ...prev, [currentTab]: [...stack, location.pathname] };
      }
      return prev;
    });
  }, [location.pathname, currentTab]);

  const handleTabClick = useCallback((tabKey, rootPath) => {
    if (tabKey === currentTab) {
      // Re-select active tab: reset to root
      setTabStacks(prev => ({ ...prev, [tabKey]: [rootPath] }));
      navigate(rootPath, { replace: true });
    } else {
      // Switch to saved stack top or root
      const stack = tabStacks[tabKey] || [rootPath];
      const target = stack[stack.length - 1] || rootPath;
      navigate(target, { replace: true });
    }
  }, [currentTab, tabStacks, navigate]);

  const navHeight = 'calc(64px + env(safe-area-inset-bottom, 0px))';

  // Redirect to set-username if the user doesn't have one
  if (!isLoadingAuth && user && !user.username && location.pathname !== '/set-username') {
    return <Navigate to="/set-username" replace />;
  }

  return (
    <div className="bg-background screen-wash relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden lg:bg-transparent lg:screen-wash-none">
      <DesktopAmbience />
      <main
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:bg-transparent"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: navHeight,
          overscrollBehaviorY: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            className="page-container pb-8"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="app-bottom-nav fixed bottom-0 left-0 right-0 z-50">
        <div className="app-shell-width app-bottom-nav__inner">
          {tabRoots.map((tab) => {
            const isActive = tab.key === currentTab;
            const Icon = tab.icon;
            const shareBadge = tab.key === 'home' && pendingSharesCount > seenCounts.shares
              ? pendingSharesCount - seenCounts.shares
              : 0;
            const friendBadge = tab.key === 'friends' && pendingFriendCount > seenCounts.friends
              ? pendingFriendCount - seenCounts.friends
              : 0;
            const circleBadge = tab.key === 'circles' && groupsCount > seenCounts.groups
              ? groupsCount - seenCounts.groups
              : 0;

            return (
              <motion.button
                key={tab.path}
                type="button"
                whileTap={{ scale: 0.94 }}
                onClick={() => handleTabClick(tab.key, tab.path)}
                className={`app-nav-tab ${isActive ? 'app-nav-tab--active' : ''}`}
                style={{ WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative app-nav-tab__icon-wrap">
                  <Icon
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-primary' : 'text-foreground/80'
                    }`}
                  />
                  {shareBadge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1 ring-2 ring-card">
                      {shareBadge}
                    </span>
                  )}
                  {friendBadge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1 ring-2 ring-card">
                      {friendBadge}
                    </span>
                  )}
                  {circleBadge > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground px-1 ring-2 ring-card">
                      {circleBadge}
                    </span>
                  )}
                </div>
                <span
                  className={`app-nav-tab__label ${
                    isActive ? 'text-primary' : 'text-foreground/75'
                  }`}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute bottom-1.5 w-5 h-0.5 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}