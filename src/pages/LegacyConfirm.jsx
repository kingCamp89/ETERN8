import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import KeepsakeCard from '@/components/shared/KeepsakeCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Shield, Heart, AlertTriangle, CheckCircle2, Mail, Users, Clock,
  HelpCircle, PauseCircle, XCircle, Crown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const iconVariants = {
  success: 'bg-primary/10 text-primary',
  warning: 'bg-secondary text-foreground',
  error: 'bg-destructive/10 text-destructive',
  primary: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

function LegacyConfirmShell({ children, className }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-warm p-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className={cn('max-w-md w-full', className)}
      >
        {children}
      </motion.div>
    </div>
  );
}

function LegacyResultCard({ icon: Icon, variant = 'primary', title, children, footer, actions }) {
  return (
    <LegacyConfirmShell>
      <KeepsakeCard className={actions ? '' : 'text-center'}>
        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', iconVariants[variant], actions ? '' : 'mx-auto')}>
          <Icon className="w-8 h-8" />
        </div>
        <h1 className="text-section-title mb-2">{title}</h1>
        <div className="text-body text-muted-foreground leading-relaxed">{children}</div>
        {footer && <div className="mt-4">{footer}</div>}
        {actions && <div className="mt-6 space-y-3">{actions}</div>}
      </KeepsakeCard>
    </LegacyConfirmShell>
  );
}

export default function LegacyConfirm() {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user');
  const contactId = searchParams.get('contact');
  const executorId = searchParams.get('executor');
  const approvalId = searchParams.get('approval');
  const token = searchParams.get('token');
  const verifyContact = searchParams.get('verify_contact');
  const verifyExecutor = searchParams.get('verify_executor');

  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (verifyContact && token) {
      handleVerifyContact();
    } else if (verifyExecutor && token) {
      handleVerifyExecutor();
    }
  }, []);

  const handleVerifyContact = async () => {
    setStatus('loading');
    try {
      const response = await base44.functions.invoke('verifyTrustedContact', {
        contactId: verifyContact,
        token,
      });
      if (response.data?.success || response.data?.already_verified) {
        setStatus('contact_verified');
      } else {
        setStatus('error');
        toast.error(response.data?.error || 'Verification failed');
      }
    } catch {
      setStatus('error');
      toast.error('Could not verify. The link may have expired.');
    }
  };

  const handleVerifyExecutor = async () => {
    setStatus('loading');
    try {
      const response = await base44.functions.invoke('verifyExecutor', {
        executorId: verifyExecutor,
        token,
      });
      if (response.data?.success || response.data?.already_verified) {
        setStatus('executor_verified');
      } else {
        setStatus('error');
        toast.error(response.data?.error || 'Verification failed');
      }
    } catch {
      setStatus('error');
      toast.error('Could not verify. The link may have expired.');
    }
  };

  const handleAction = async (actionType) => {
    setStatus('loading');
    try {
      const payload = { userId, token, action: actionType };
      if (contactId) payload.contactId = contactId;
      if (executorId) payload.executorId = executorId;
      if (approvalId) payload.approvalId = approvalId;

      const response = await base44.functions.invoke('confirmLegacy', payload);
      const data = response.data;

      if (data.action === 'marked_alive') {
        setStatus('marked_alive');
      } else if (data.action === 'executor_approved') {
        setStatus('executor_approved');
      } else if (data.action === 'executor_paused') {
        setStatus('paused');
      } else if (data.action === 'executor_cancelled') {
        setStatus('cancelled');
      } else if (data.action === 'not_sure') {
        setStatus('not_sure');
      } else if (data.action === 'mistake_reported') {
        setStatus('mistake_reported');
      } else if (data.action === 'paused') {
        setStatus('paused');
      } else if (data.action === 'quorum_met') {
        setStatus('quorum_waiting');
        setResult(data);
      } else if (data.action === 'confirmation_recorded') {
        setStatus('confirmed_passed');
        setResult(data);
      } else if (data.already_confirmed) {
        setStatus('confirmed_passed');
        setResult({ message: 'You have already confirmed.' });
      } else {
        setStatus('confirmed_passed');
        setResult(data);
      }
    } catch {
      setStatus('error');
      toast.error('Could not process. The link may have expired.');
    }
  };

  if (status === 'contact_verified') {
    return (
      <LegacyResultCard icon={CheckCircle2} variant="success" title="Email verified">
        <p>
          Thank you for verifying your email. You are now a verified trusted contact.
          If you are ever needed to verify your loved one&apos;s wellbeing, you will receive an email with instructions.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'executor_verified') {
    return (
      <LegacyResultCard icon={Crown} variant="primary" title="Executor verified">
        <p>
          Thank you for verifying your email. You are now a verified legacy executor.
          If you are ever needed to approve, pause, or cancel a legacy release, you will receive an email with secure links.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'executor_approved') {
    return (
      <LegacyResultCard icon={CheckCircle2} variant="success" title="Release approved">
        <p>
          You have approved the release of legacy memories. They will be delivered to each recipient on the next processing cycle.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'paused') {
    return (
      <LegacyResultCard icon={PauseCircle} variant="warning" title="Process paused">
        <p>
          The legacy release process has been paused. No memories will be released at this time.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'cancelled') {
    return (
      <LegacyResultCard icon={XCircle} variant="muted" title="Process cancelled">
        <p>
          The legacy release process has been cancelled. No memories will be released.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'not_sure') {
    return (
      <LegacyResultCard icon={HelpCircle} variant="primary" title="Thank you">
        <p>
          Your response has been recorded. No action will be taken at this time. There is no pressure — take the time you need.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'mistake_reported') {
    return (
      <LegacyResultCard icon={AlertTriangle} variant="warning" title="Thank you for reporting">
        <p>
          The protocol has been paused while we investigate. No memories will be released. Thank you for helping prevent a mistake.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'marked_alive') {
    return (
      <LegacyResultCard icon={CheckCircle2} variant="success" title="Thank you for confirming">
        <p>
          You&apos;ve confirmed that this person is alive and well. Their legacy protocol has been cancelled and no further action is needed.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'quorum_waiting') {
    return (
      <LegacyResultCard icon={Clock} variant="warning" title="Confirmation recorded">
        <p className="mb-4">
          Enough contacts ({result?.total_confirmations}/{result?.required_quorum}) have confirmed. A 14-day cooling-off period is now active to ensure no mistakes were made.
        </p>
        <p className="text-caption">
          If the person is still alive, they can open the app to cancel this process.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'confirmed_passed') {
    return (
      <LegacyResultCard
        icon={CheckCircle2}
        variant="success"
        title="Confirmation recorded"
        footer={
          <>
            {result?.total_confirmations && result?.required_quorum && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-body font-medium">
                  {result.total_confirmations}/{result.required_quorum} confirmations
                </span>
              </div>
            )}
            <p className="text-caption mt-4">
              A 14-day cooling-off period applies. If the person is still alive, they can open the app to cancel.
            </p>
          </>
        }
      >
        <p>{result?.message || 'Your confirmation has been recorded.'}</p>
      </LegacyResultCard>
    );
  }

  if (status === 'error') {
    return (
      <LegacyResultCard icon={AlertTriangle} variant="error" title="Something went wrong">
        <p>
          We couldn&apos;t process your request. This may happen if the link has expired or was already used.
        </p>
      </LegacyResultCard>
    );
  }

  if (status === 'loading') {
    return (
      <LegacyConfirmShell>
        <div className="text-center py-8">
          <LoadingSpinner size="lg" className="mx-auto mb-3" />
          <p className="text-body text-muted-foreground">Processing…</p>
        </div>
      </LegacyConfirmShell>
    );
  }

  const isValid = (userId && token && (contactId || executorId)) || (verifyContact && token) || (verifyExecutor && token);
  if (!isValid) {
    return (
      <LegacyResultCard icon={AlertTriangle} variant="error" title="Invalid link">
        <p>
          This link is incomplete or has expired. Please check the email you received and try again.
        </p>
      </LegacyResultCard>
    );
  }

  const isExecutor = !!executorId;
  if (isExecutor) {
    return (
      <LegacyResultCard
        icon={Crown}
        variant="primary"
        title="Executor action required"
        actions={
          <>
            <Button onClick={() => handleAction('executor_approve')} disabled={status === 'loading'} className="w-full rounded-xl gap-2">
              <CheckCircle2 className="w-4 h-4" /> Approve release
            </Button>
            <Button onClick={() => handleAction('executor_pause')} disabled={status === 'loading'} variant="outline" className="w-full rounded-xl gap-2">
              <PauseCircle className="w-4 h-4" /> Pause process
            </Button>
            <Button onClick={() => handleAction('executor_cancel')} disabled={status === 'loading'} variant="outline" className="w-full rounded-xl gap-2">
              <XCircle className="w-4 h-4" /> Cancel process
            </Button>
            <Button
              onClick={() => handleAction('report_mistake')}
              disabled={status === 'loading'}
              variant="outline"
              className="w-full rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
            >
              <AlertTriangle className="w-4 h-4" /> Report a mistake
            </Button>
            <p className="text-caption text-center pt-1">
              Take the time you need. You are the final safeguard.
            </p>
          </>
        }
      >
        <p>
          You are the designated legacy executor. The verification process has completed and the cooling-off period has ended.
          Your decision is the final safeguard before any memories are released.
        </p>
      </LegacyResultCard>
    );
  }

  return (
    <LegacyResultCard
      icon={Mail}
      variant="primary"
      title="Can you help verify?"
      actions={
        <>
          <Button onClick={() => handleAction('mark_alive')} disabled={status === 'loading'} className="w-full rounded-xl gap-2">
            <Shield className="w-4 h-4" /> They are alive — cancel the alert
          </Button>
          <Button
            onClick={() => handleAction('confirm_passed')}
            disabled={status === 'loading'}
            variant="outline"
            className="w-full rounded-xl gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
          >
            <Heart className="w-4 h-4" /> I confirm they have passed away
          </Button>
          <Button onClick={() => handleAction('not_sure')} disabled={status === 'loading'} variant="ghost" className="w-full rounded-xl gap-2">
            <HelpCircle className="w-4 h-4" /> I am not sure
          </Button>
          <Button onClick={() => handleAction('report_mistake')} disabled={status === 'loading'} variant="ghost" className="w-full rounded-xl gap-2">
            <AlertTriangle className="w-4 h-4" /> Report a mistake
          </Button>
          <Button onClick={() => handleAction('pause')} disabled={status === 'loading'} variant="ghost" className="w-full rounded-xl gap-2">
            <PauseCircle className="w-4 h-4" /> Pause this process
          </Button>
          <p className="text-caption text-center pt-1">
            There is no pressure. Multiple confirmations and a 14-day cooling-off period are required before any memories are released.
          </p>
        </>
      }
    >
      <p>
        Someone you care about named you as a trusted contact. We haven&apos;t heard from them in a while, and we need your help.
      </p>
    </LegacyResultCard>
  );
}
