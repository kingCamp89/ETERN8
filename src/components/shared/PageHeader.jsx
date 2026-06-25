import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigateBack } from '@/lib/navigation';

export default function PageHeader({ title, subtitle, showBack = false, action }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="pt-6 pb-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => navigateBack(navigate, location.pathname)}
              aria-label="Go back"
              className="w-11 h-11 -ml-1 flex items-center justify-center rounded-xl hover:bg-secondary/80 active:bg-secondary transition-colors shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          )}
          <div className="min-w-0">
            <h1 className="text-page-title truncate">{title}</h1>
            {subtitle && (
              <p className="text-caption mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
