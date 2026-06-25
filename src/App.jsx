import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from 'sonner'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ProtectedRoute from '@/components/ProtectedRoute';

import AppLayout from '@/components/layout/AppLayout';
import LoadingScreen from '@/components/shared/LoadingScreen';

// Auth pages (eagerly loaded — needed immediately on auth redirects)
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

// Lazy-loaded pages — code-split for faster initial load
const Intro = React.lazy(() => import('@/pages/Intro'));
const LegacyConfirm = React.lazy(() => import('@/pages/LegacyConfirm'));

const Home = React.lazy(() => import('@/pages/Home'));
const LovedOnes = React.lazy(() => import('@/pages/LovedOnes'));
const AddLovedOne = React.lazy(() => import('@/pages/AddLovedOne'));
import ProfileDetail from '@/pages/ProfileDetail';
const CreateMemory = React.lazy(() => import('@/pages/CreateMemory'));
const MemoryDetail = React.lazy(() => import('@/pages/MemoryDetail'));
const MemoryStory = React.lazy(() => import('@/pages/MemoryStory'));
const Search = React.lazy(() => import('@/pages/Search'));
const SetUsername = React.lazy(() => import('@/pages/SetUsername'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const FutureDeliveries = React.lazy(() => import('@/pages/FutureDeliveries'));
const LegacySettings = React.lazy(() => import('@/pages/LegacySettings'));
const MemoryBooks = React.lazy(() => import('@/pages/MemoryBooks'));
const MemoryBookDetail = React.lazy(() => import('@/pages/MemoryBookDetail'));
const Subscription = React.lazy(() => import('@/pages/Subscription'));
const Help = React.lazy(() => import('@/pages/Help'));
const PrivacySecurity = React.lazy(() => import('@/pages/PrivacySecurity'));
const TaggedMemories = React.lazy(() => import('@/pages/TaggedMemories'));
const Groups = React.lazy(() => import('@/pages/Groups'));
const GroupDetail = React.lazy(() => import('@/pages/GroupDetail'));
const GroupStory = React.lazy(() => import('@/pages/GroupStory'));
const OurStory = React.lazy(() => import('@/pages/OurStory'));
const Friends = React.lazy(() => import('@/pages/Friends'));
const Notifications = React.lazy(() => import('@/pages/Notifications'));

const PageFallback = () => <LoadingScreen />;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen message="Loading your memories..." />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
    // For 'auth_required' and unknown errors, let ProtectedRoute handle the auth check
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/intro" element={<Suspense fallback={<PageFallback />}><Intro /></Suspense>} />
      <Route path="/legacy-confirm" element={<Suspense fallback={<PageFallback />}><LegacyConfirm /></Suspense>} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/set-username" element={<Suspense fallback={<PageFallback />}><SetUsername /></Suspense>} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Suspense fallback={<PageFallback />}><Home /></Suspense>} />
          <Route path="/loved-ones" element={<Suspense fallback={<PageFallback />}><LovedOnes /></Suspense>} />
          <Route path="/loved-ones/new" element={<Suspense fallback={<PageFallback />}><AddLovedOne /></Suspense>} />
          <Route path="/profile/:id" element={<Suspense fallback={<PageFallback />}><ProfileDetail /></Suspense>} />
          <Route path="/create" element={<Suspense fallback={<PageFallback />}><CreateMemory /></Suspense>} />
          <Route path="/memory/:id" element={<Suspense fallback={<PageFallback />}><MemoryDetail /></Suspense>} />
          <Route path="/story/:id" element={<Suspense fallback={<PageFallback />}><MemoryStory /></Suspense>} />
          <Route path="/search" element={<Suspense fallback={<PageFallback />}><Search /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageFallback />}><Settings /></Suspense>} />
          <Route path="/future-deliveries" element={<Suspense fallback={<PageFallback />}><FutureDeliveries /></Suspense>} />
          <Route path="/legacy" element={<Suspense fallback={<PageFallback />}><LegacySettings /></Suspense>} />
          <Route path="/memory-books" element={<Suspense fallback={<PageFallback />}><MemoryBooks /></Suspense>} />
          <Route path="/memory-books/:id" element={<Suspense fallback={<PageFallback />}><MemoryBookDetail /></Suspense>} />
          <Route path="/subscription" element={<Suspense fallback={<PageFallback />}><Subscription /></Suspense>} />
          <Route path="/help" element={<Suspense fallback={<PageFallback />}><Help /></Suspense>} />
          <Route path="/privacy" element={<Suspense fallback={<PageFallback />}><PrivacySecurity /></Suspense>} />
          <Route path="/shared" element={<Suspense fallback={<PageFallback />}><TaggedMemories /></Suspense>} />
          <Route path="/groups" element={<Suspense fallback={<PageFallback />}><Groups /></Suspense>} />
          <Route path="/groups/:id" element={<Suspense fallback={<PageFallback />}><GroupDetail /></Suspense>} />
          <Route path="/groups/:id/story" element={<Suspense fallback={<PageFallback />}><GroupStory /></Suspense>} />
          <Route path="/friends" element={<Suspense fallback={<PageFallback />}><Friends /></Suspense>} />
          <Route path="/notifications" element={<Suspense fallback={<PageFallback />}><Notifications /></Suspense>} />
          <Route path="/our-story" element={<Suspense fallback={<PageFallback />}><OurStory /></Suspense>} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" richColors />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App