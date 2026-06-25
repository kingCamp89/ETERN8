import { Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';
import BrandWordmark from '@/components/shared/BrandWordmark';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  const { data: authData, isFetched } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const user = await base44.auth.me();
        return { user, isAuthenticated: true };
      } catch {
        return { user: null, isAuthenticated: false };
      }
    },
  });

  const homePath = isFetched && authData?.isAuthenticated ? '/' : '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-10 bg-gradient-warm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-[5rem] leading-none font-heading font-light text-primary/25 select-none" aria-hidden="true">
          404
        </p>

        <BrandWordmark as="h1" size="md" className="justify-center mt-2" />

        <KeepsakeCard className="mt-6 text-left">
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h2 className="text-section-title">This page isn&apos;t here</h2>
              <p className="text-body text-muted-foreground mt-2">
                {pageName ? (
                  <>
                    We couldn&apos;t find <span className="text-foreground font-medium">/{pageName}</span>.
                  </>
                ) : (
                  'The page you requested could not be found.'
                )}
              </p>
            </div>
          </div>

          {isFetched && authData?.isAuthenticated && authData.user?.role === 'admin' && (
            <p className="text-caption text-muted-foreground mt-4 pt-4 border-t border-border/50">
              Admin note: this route may not be implemented yet.
            </p>
          )}
        </KeepsakeCard>

        <Button asChild className="w-full h-12 rounded-xl mt-6 gap-2">
          <Link to={homePath}>
            <Home className="w-4 h-4" />
            {authData?.isAuthenticated ? 'Back to home' : 'Go to sign in'}
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
