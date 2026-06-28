import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import EmptyState from '../components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, UserPlus, Heart, X, CheckCircle2, AlertTriangle, CalendarClock, Fingerprint, Crown, Activity, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function StatusPill({ variant = 'neutral', children, className = '' }) {
  const variants = {
    success: 'bg-primary/10 text-primary',
    warning: 'bg-secondary text-foreground',
    danger: 'bg-destructive/10 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={`inline-flex items-center gap-0.5 text-caption font-medium px-2 py-0.5 rounded-full ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

export default function LegacySettings() {
  const { user, checkUserAuth } = useAuth();
  const queryClient = useQueryClient();
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', relationship: '' });
  const [showAddExecutor, setShowAddExecutor] = useState(false);
  const [executorForm, setExecutorForm] = useState({ full_name: '', email: '', phone: '', relationship: '', role: 'primary' });
  const [showEnableConfirm, setShowEnableConfirm] = useState(false);

  const legacyEnabled = user?.legacy_enabled || false;
  const legacyWaitMonths = user?.legacy_wait_months || 3;
  const lastCheckin = user?.last_checkin_date ? new Date(user.last_checkin_date) : null;
  const legacyTriggered = user?.legacy_triggered || false;
  const protocolStatus = user?.legacy_protocol_status || 'idle';
  const activityTimestamp = user?.legacy_activity_timestamp ? new Date(user.legacy_activity_timestamp) : null;

  const { data: contacts = [] } = useQuery({
    queryKey: ['trustedContacts'],
    queryFn: () => base44.entities.TrustedContact.list(),
  });

  const { data: executors = [] } = useQuery({
    queryKey: ['executors'],
    queryFn: () => base44.entities.Executor.list(),
  });

  const { data: memories = [] } = useQuery({
    queryKey: ['memories'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.Memory.filter({ created_by_id: me.id });
    },
  });

  const { data: protocols = [] } = useQuery({
    queryKey: ['legacyProtocols'],
    queryFn: async () => {
      const me = await base44.auth.me();
      return base44.entities.LegacyProtocol.filter({ user_id: me.id });
    },
  });

  // Undelivered content = anything not delivered and not cancelled
  const undeliveredMemories = memories.filter(m =>
    m.delivery_status !== 'delivered' && m.delivery_status !== 'cancelled'
  );
  const verifiedContacts = contacts.filter(c => c.verification_status === 'verified');
  const pendingContacts = contacts.filter(c => c.verification_status === 'pending');
  const verifiedExecutors = executors.filter(e => e.verification_status === 'verified');
  const pendingExecutors = executors.filter(e => e.verification_status === 'pending');
  const activeProtocol = protocols.find(p =>
    !['released', 'cancelled', 'cancelled_by_user_activity', 'idle'].includes(p.status)
  );

  // Enable/disable legacy mode
  const toggleLegacyMutation = useMutation({
    mutationFn: (shouldEnable) => base44.functions.invoke('updateLegacySettings', { legacy_enabled: shouldEnable }),
    onSuccess: async () => {
      await checkUserAuth();
      queryClient.invalidateQueries({ queryKey: ['trustedContacts'] });
      toast.success('Legacy settings updated');
      setShowEnableConfirm(false);
    },
    onError: () => toast.error('Failed to update settings'),
  });

  // Update wait period
  const updateWaitMutation = useMutation({
    mutationFn: (months) => base44.functions.invoke('updateLegacySettings', { legacy_wait_months: months }),
    onSuccess: () => {
      checkUserAuth();
      toast.success(`Wait period set to ${legacyWaitMonths} months`);
    },
    onError: () => toast.error('Failed to update wait period'),
  });

  // Manual check-in
  const checkInMutation = useMutation({
    mutationFn: () => base44.functions.invoke('checkIn'),
    onSuccess: () => {
      checkUserAuth();
      toast.success('You have checked in');
    },
    onError: () => toast.error('Check-in failed'),
  });

  // Add contact — uses addTrustedContact function (sends verification email, starts pending)
  const addContactMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('addTrustedContact', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustedContacts'] });
      setShowAddContact(false);
      setContactForm({ name: '', email: '', phone: '', relationship: '' });
      toast.success('Trusted contact added. Verification email sent.');
    },
    onError: (err) => toast.error(err?.data?.error || 'Failed to add contact'),
  });

  // Delete contact
  const deleteContactMutation = useMutation({
    mutationFn: (id) => base44.entities.TrustedContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trustedContacts'] });
      toast.success('Contact removed');
    },
  });

  // Add executor — uses addExecutor function (sends verification email, starts pending)
  const addExecutorMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('addExecutor', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executors'] });
      setShowAddExecutor(false);
      setExecutorForm({ full_name: '', email: '', phone: '', relationship: '', role: 'primary' });
      toast.success('Executor added. Verification email sent.');
    },
    onError: (err) => toast.error(err?.data?.error || 'Failed to add executor'),
  });

  // Delete executor
  const deleteExecutorMutation = useMutation({
    mutationFn: (id) => base44.entities.Executor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['executors'] });
      toast.success('Executor removed');
    },
  });

  // Cancel protocol (user action)
  const cancelProtocolMutation = useMutation({
    mutationFn: () => base44.functions.invoke('autoCheckIn'),
    onSuccess: () => {
      checkUserAuth();
      queryClient.invalidateQueries({ queryKey: ['legacyProtocols'] });
      toast.success('Protocol cancelled — you are okay');
    },
  });

  // Get protocol status label — uses active LegacyProtocol status if available
  const getProtocolLabel = () => {
    const status = activeProtocol?.status || protocolStatus;
    const labels = {
      idle: { label: 'Monitoring', variant: 'success' },
      warning_stage_1: { label: 'Warning Stage 1', variant: 'warning' },
      warning_stage_2: { label: 'Warning Stage 2', variant: 'warning' },
      final_user_warning: { label: 'Final Warning', variant: 'warning' },
      welfare_check: { label: 'Welfare Check', variant: 'warning' },
      death_verification: { label: 'Death Verification', variant: 'danger' },
      executor_required: { label: 'Executor Required', variant: 'danger' },
      executor_review: { label: 'Executor Review', variant: 'warning' },
      cooling_off: { label: 'Cooling-Off (14 days)', variant: 'warning' },
      approved_for_release: { label: 'Approved for Release', variant: 'neutral' },
      released: { label: 'Released', variant: 'neutral' },
      paused: { label: 'Paused', variant: 'neutral' },
      cancelled: { label: 'Cancelled', variant: 'neutral' },
      cancelled_by_user_activity: { label: 'Cancelled (User Active)', variant: 'success' },
      verification_pending: { label: 'Verifying', variant: 'warning' },
    };
    return labels[status] || { label: status, variant: 'neutral' };
  };

  // Calculate time remaining before legacy would trigger
  const getTimeStatus = () => {
    if (!legacyEnabled || !lastCheckin) return null;
    const threshold = new Date(lastCheckin);
    threshold.setMonth(threshold.getMonth() + legacyWaitMonths);
    const now = new Date();
    if (threshold <= now) {
      return { urgent: true, label: 'Check-in overdue!', timeLeft: 'Now' };
    }
    return { urgent: false, label: 'Next check-in needed by', timeLeft: formatDistanceToNow(threshold, { addSuffix: true }) };
  };

  const timeStatus = getTimeStatus();

  const handleToggleLegacy = (enabled) => {
    if (enabled) {
      if (verifiedContacts.length < 2) {
        toast.error('You need at least 2 verified trusted contacts to enable Legacy Mode');
        return;
      }
      if (verifiedExecutors.length === 0) {
        toast.error('You need a verified executor to enable Legacy Mode');
        return;
      }
      setShowEnableConfirm(true);
    } else {
      toggleLegacyMutation.mutate(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Legacy Settings" subtitle="Preserving memories beyond a lifetime" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${legacyEnabled ? 'bg-primary/10' : 'bg-muted'} flex items-center justify-center`}>
                <Shield className={`w-5 h-5 ${legacyEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <h3 className="text-section-title">Legacy Mode</h3>
                <p className="text-caption">
                  {legacyEnabled ? 'Active and monitoring' : 'Disabled'}
                </p>
              </div>
            </div>
            <Switch
              checked={legacyEnabled}
              onCheckedChange={handleToggleLegacy}
              disabled={toggleLegacyMutation.isPending}
            />
          </div>

          {legacyEnabled && (
            <>
              {/* Wait Period */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <Label>Inactivity wait period</Label>
                  <span className="text-body font-medium text-primary">{legacyWaitMonths} month{legacyWaitMonths > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={legacyWaitMonths}
                  onChange={(e) => updateWaitMutation.mutate(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-caption text-muted-foreground mt-1">
                  <span>1 month</span>
                  <span>6 months</span>
                </div>
              </div>

              {/* Protocol Status */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-caption">Protocol status</p>
                      <StatusPill variant={getProtocolLabel().variant} className="mt-1">
                        {getProtocolLabel().label}
                      </StatusPill>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executor Status */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary" />
                    <p className="text-body font-medium">Legacy executor</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => setShowAddExecutor(true)}>
                    <UserPlus className="w-3.5 h-3.5" /> Add
                  </Button>
                </div>
                <p className="text-caption mb-2">
                  An executor is <strong>required</strong> — without one, memories will never be released. The executor has the final say before any release.
                </p>

                {verifiedExecutors.length === 0 && pendingExecutors.length === 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-center">
                    <AlertTriangle className="w-4 h-4 text-destructive mx-auto mb-1" />
                    <p className="text-caption text-destructive font-medium">No executor designated</p>
                    <p className="text-caption text-muted-foreground">Without a verified executor, memories will never be released.</p>
                  </div>
                )}

                <div className="space-y-2">
                  {[...verifiedExecutors, ...pendingExecutors].map((exec) => (
                    <div key={exec.id} className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-body font-medium">{exec.full_name}</p>
                          <p className="text-caption">{exec.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {exec.verification_status === 'verified' ? (
                          <StatusPill variant="success">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </StatusPill>
                        ) : (
                          <StatusPill variant="warning">
                            <Clock className="w-3 h-3" /> Pending
                          </StatusPill>
                        )}
                        <button onClick={() => deleteExecutorMutation.mutate(exec.id)} className="p-1 rounded-lg hover:bg-destructive/10">
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Protocol Controls */}
              {activeProtocol && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <p className="text-body font-medium">Active protocol</p>
                  </div>
                  <p className="text-caption mb-3">
                    A legacy protocol is currently active. If you are okay, confirm below to cancel it immediately.
                  </p>
                  <Button
                    size="sm"
                    className="w-full rounded-xl gap-1"
                    onClick={() => cancelProtocolMutation.mutate()}
                    disabled={cancelProtocolMutation.isPending}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    {cancelProtocolMutation.isPending ? 'Cancelling…' : "Confirm I'm okay — cancel protocol"}
                  </Button>
                </div>
              )}

              {/* Check-in Status */}
              <div className="mt-4 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-caption">Last check-in</p>
                      <p className="text-body font-medium">
                        {lastCheckin ? format(lastCheckin, 'MMM d, yyyy — h:mm a') : 'Never'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1"
                    onClick={() => checkInMutation.mutate()}
                    disabled={checkInMutation.isPending}
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    {checkInMutation.isPending ? '…' : 'Check in'}
                  </Button>
                </div>

                {timeStatus && (
                  <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-body ${
                    timeStatus.urgent ? 'bg-destructive/10 text-destructive' : 'bg-primary/5 text-primary'
                  }`}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{timeStatus.label} <strong>{timeStatus.timeLeft}</strong></span>
                  </div>
                )}
              </div>
            </>
          )}
        </KeepsakeCard>

        <KeepsakeCard className="bg-primary/5 border-primary/15">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-section-title mb-1">What happens if you don&apos;t check in</h3>
              <p className="text-body text-muted-foreground leading-relaxed">
                Here&apos;s exactly how the process works, step by step. Everything is transparent so you — and your contacts — know what to expect.
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-destructive">1</span>
                </div>
                <div className="w-0.5 flex-1 bg-border/50 mt-1" />
              </div>
              <div className="pb-3">
                <p className="text-body font-medium">Inactivity detected</p>
                <p className="text-caption">
                  After {legacyWaitMonths} month{legacyWaitMonths > 1 ? 's' : ''} without a check-in, your {verifiedContacts.length || 'verified'} contact{verifiedContacts.length !== 1 ? 's' : ''} receive{verifiedContacts.length === 1 ? 's' : ''} an email.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-foreground">2</span>
                </div>
                <div className="w-0.5 flex-1 bg-border/50 mt-1" />
              </div>
              <div className="pb-3">
                <p className="text-body font-medium">Escalating reminders</p>
                <p className="text-caption">
                  If no one responds, reminders go out on days 3, 7, and 14. After all reminders, you also receive an email.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div className="w-0.5 flex-1 bg-border/50 mt-1" />
              </div>
              <div className="pb-3">
                <p className="text-body font-medium">Contact responds</p>
                <p className="text-caption">
                  Your contact can say "They're alive" (everything resets) or "I confirm they've passed" (process advances). Multiple contacts must confirm independently.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary">4</span>
                </div>
                <div className="w-0.5 flex-1 bg-border/50 mt-1" />
              </div>
              <div className="pb-3">
                <p className="text-body font-medium">14-day cooling-off</p>
                <p className="text-caption">
                  After the first "passed" confirmation, all contacts AND you are notified. You have 14 days to open the app and cancel if you're still here.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary">5</span>
                </div>
                <div className="w-0.5 flex-1 bg-border/50 mt-1" />
              </div>
              <div className="pb-3">
                <p className="text-body font-medium">Executor approval</p>
                <p className="text-caption">
                  After 2 contacts confirm and the cooling-off period ends, your <strong>verified executor</strong> must approve the release. Without an executor, the process pauses — memories are never released.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary">6</span>
                </div>
              </div>
              <div>
                <p className="text-body font-medium">Memories released</p>
                <p className="text-caption">
                  If posthumous release is approved, all undelivered memories and messages assigned to each person will be released to that person.
                </p>
              </div>
            </div>
          </div>
        </KeepsakeCard>

        <div className="grid grid-cols-3 gap-3">
          <KeepsakeCard className="text-center py-4">
            <Heart className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-stat">{undeliveredMemories.length}</p>
            <p className="text-caption">Undelivered</p>
          </KeepsakeCard>
          <KeepsakeCard className="text-center py-4">
            <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-stat">{verifiedContacts.length}</p>
            <p className="text-caption">Verified</p>
          </KeepsakeCard>
          <KeepsakeCard className="text-center py-4">
            <Crown className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-stat">{verifiedExecutors.length}</p>
            <p className="text-caption">Executors</p>
          </KeepsakeCard>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-section-title">Trusted contacts</h3>
            <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-xl gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-section-title">Add trusted contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="Full name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="Phone number"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Input
                      placeholder="e.g. Sibling, Best friend"
                      value={contactForm.relationship}
                      onChange={(e) => setContactForm(prev => ({ ...prev, relationship: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={() => addContactMutation.mutate(contactForm)}
                    disabled={!contactForm.name || !contactForm.email || addContactMutation.isPending}
                    className="w-full rounded-xl"
                  >
                    {addContactMutation.isPending ? 'Adding…' : 'Add contact'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {contacts.map((contact, i) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <KeepsakeCard padding={false} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {contact.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-body font-medium">{contact.name}</p>
                          {contact.verification_status === 'verified' ? (
                            <StatusPill variant="success">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </StatusPill>
                          ) : (
                            <StatusPill variant="warning">
                              <Clock className="w-3 h-3" /> Pending
                            </StatusPill>
                          )}
                        </div>
                        <p className="text-caption">{contact.email}</p>
                        {contact.relationship && (
                          <p className="text-caption">{contact.relationship}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteContactMutation.mutate(contact.id)}
                      className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                      aria-label={`Remove ${contact.name}`}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </KeepsakeCard>
              </motion.div>
            ))}

            {contacts.length === 0 && (
              <EmptyState
                prompt="Build your safety net"
                subtitle="Add at least 2 trusted contacts. They must verify their email before they can confirm or receive content."
                illustration={<Shield className="w-8 h-8 text-primary/50" />}
              />
            )}
          </div>
        </div>

        {/* Add Executor Dialog */}
        <Dialog open={showAddExecutor} onOpenChange={setShowAddExecutor}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-section-title">Add legacy executor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-2">
                <Label>Full name</Label>
                <Input
                  placeholder="Full name"
                  value={executorForm.full_name}
                  onChange={(e) => setExecutorForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={executorForm.email}
                  onChange={(e) => setExecutorForm(prev => ({ ...prev, email: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  placeholder="Phone number"
                  value={executorForm.phone}
                  onChange={(e) => setExecutorForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship</Label>
                <Input
                  placeholder="e.g. Sibling, Lawyer"
                  value={executorForm.relationship}
                  onChange={(e) => setExecutorForm(prev => ({ ...prev, relationship: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={executorForm.role}
                  onValueChange={(v) => setExecutorForm(prev => ({ ...prev, role: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="secondary">Secondary</SelectItem>
                    <SelectItem value="legal_representative">Legal Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => addExecutorMutation.mutate(executorForm)}
                disabled={!executorForm.full_name || !executorForm.email || addExecutorMutation.isPending}
                className="w-full rounded-xl"
              >
                {addExecutorMutation.isPending ? 'Adding…' : 'Add executor'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <AlertDialog open={showEnableConfirm} onOpenChange={setShowEnableConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-section-title">Enable Legacy Mode?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-body text-muted-foreground">
              <p className="font-medium text-foreground">This will activate automatic monitoring with these safeguards:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>After <strong>{legacyWaitMonths} month{legacyWaitMonths > 1 ? 's' : ''}</strong> of inactivity, warning emails begin</li>
                <li>Your <strong>{verifiedContacts.length} verified contact{verifiedContacts.length !== 1 ? 's' : ''}</strong> receive{verifiedContacts.length === 1 ? 's' : ''} a verification request with multiple response options</li>
                <li><strong>2 contacts must independently confirm</strong> passing before the process advances</li>
                <li>A <strong>14-day cooling-off period</strong> starts — you can cancel by opening the app at any time</li>
                <li>After cooling-off, your <strong>verified executor</strong> must approve the release</li>
                <li>If posthumous release is approved, <strong>all undelivered memories and messages assigned to each person will be released to that person</strong></li>
                <li>Your check-in happens automatically each time you use the app — no manual action needed</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => toggleLegacyMutation.mutate(true)}
              disabled={toggleLegacyMutation.isPending}
              className="rounded-xl"
            >
              {toggleLegacyMutation.isPending ? 'Enabling…' : 'Enable Legacy Mode'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}