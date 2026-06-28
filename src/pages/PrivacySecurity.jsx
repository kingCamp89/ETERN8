import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Server, FileCheck, EyeOff,
  Clock, Users, Heart, AlertTriangle, Crown,
} from 'lucide-react';

const sections = [
  {
    icon: Lock,
    title: 'Data encryption',
    items: [
      'All data is encrypted in transit using TLS 1.3 (the same technology used by banks)',
      'Data at rest is protected with AES-256 encryption, the industry standard for sensitive information',
      'Encryption keys are rotated regularly and managed through secure key management services',
      'Your login credentials are hashed and salted — not even our systems can see your password',
    ],
  },
  {
    icon: Server,
    title: 'Secure infrastructure',
    items: [
      'Our servers run in SOC 2 Type II certified data centers with 24/7 physical security',
      'All infrastructure is monitored continuously for unauthorized access attempts',
      'Automated backups ensure your memories are never lost — we maintain multiple redundant copies',
      'Regular security audits and penetration testing by independent third-party firms',
    ],
  },
  {
    icon: EyeOff,
    title: 'Privacy by design',
    items: [
      'Zero-access architecture: ETERN8 employees cannot view your memories or personal content',
      'You control exactly which memories are shared and with whom — nothing is ever shared without your explicit action',
      'Private memories are invisible to everyone except you, even after legacy delivery',
      'Your data is never sold, shared with advertisers, or used for any purpose beyond providing the service',
    ],
  },
  {
    icon: FileCheck,
    title: 'Data ownership & control',
    items: [
      'You own your data, always. We are the custodian, not the owner.',
      'Export anytime from Settings — a ZIP with full account data (JSON), printable memory stories (PDF), and a media manifest for photos, voice, and video',
      'Delete your account from Settings — your memories, profile, groups, legacy settings, and uploaded media are removed immediately',
      'Private memories stay visible only to you — they are not shared, scheduled for delivery, or included in legacy release',
    ],
  },
];

const legacySteps = [
  {
    icon: Heart,
    title: 'Automatic inclusion',
    description: 'All undelivered memories, letters, videos, voice recordings, photos, and scheduled future messages are automatically included. You do not need to manually mark each item as posthumous.',
  },
  {
    icon: Users,
    title: 'Designate contacts',
    description: 'Nominate trusted people who know you well. Contacts must verify their email before they can act. At least 2 must independently confirm your passing.',
  },
  {
    icon: AlertTriangle,
    title: 'Verification request',
    description: 'Trusted contacts receive a secure link with multiple options: confirm alive, confirm passing, not sure, report a mistake, or pause. Tokens are single-use and expire after 7 days.',
  },
  {
    icon: Clock,
    title: '14-day cooling-off',
    description: 'A mandatory 14-day cooling-off period begins after the first confirmation. You, all contacts, and your executor are notified. You can cancel instantly by opening the app.',
  },
  {
    icon: Crown,
    title: 'Executor required',
    description: 'A verified executor must give final approval before any memories are released. Without an executor, the process pauses and nothing is ever released. The executor can approve, pause, cancel, or report a mistake.',
  },
  {
    icon: Shield,
    title: 'Secure release',
    description: 'Once all verifications pass, memories are released only to their intended recipients. Your wife receives wife letters. Your daughter receives daughter letters. No one receives content meant for someone else.',
  },
];

export default function PrivacySecurity() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Security & Privacy" subtitle="How we protect your memories" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard className="bg-primary/5 border-primary/15 text-center">
          <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="text-section-title mb-1">Your memories are sacred</h2>
          <p className="text-body text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We built ETERN8 with the belief that your most personal memories deserve the
            highest level of protection. Here&apos;s exactly how we keep them safe.
          </p>
        </KeepsakeCard>

        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <KeepsakeCard key={section.title}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-section-title">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2 text-body text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </KeepsakeCard>
          );
        })}

        <div>
          <h3 className="text-section-title mb-2 px-1">Legacy delivery process</h3>
          <p className="text-body text-muted-foreground mb-4 leading-relaxed px-1">
            Understanding what happens when Legacy Mode is activated, step by step.
          </p>

          <KeepsakeCard className="space-y-3">
            {legacySteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    {i < legacySteps.length - 1 && (
                      <div className="w-px flex-1 bg-border/50 my-1" />
                    )}
                  </div>
                  <div className="pb-2 flex-1">
                    <h4 className="text-body font-medium">{step.title}</h4>
                    <p className="text-caption leading-relaxed mt-0.5">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </KeepsakeCard>
        </div>

        <KeepsakeCard>
          <h3 className="text-section-title mb-3">Data retention & deletion</h3>
          <div className="space-y-3 text-body text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Active accounts:</strong> Your data is stored while your account
              remains active. Memories are dated and timestamped, creating a permanent record of when each memory
              was created.
            </p>
            <p>
              <strong className="text-foreground">Data export:</strong> Use Settings → Export my data to download
              a ZIP with your full account data, printable memory stories, and a media manifest. Export links in
              the manifest may expire depending on storage settings — download media promptly if you need local copies.
            </p>
            <p>
              <strong className="text-foreground">Account deletion:</strong> Settings → Delete Account permanently
              removes your memories, loved ones, groups you own, legacy settings, friendships, notifications, and
              uploaded media immediately. This cannot be undone.
            </p>
            <p>
              <strong className="text-foreground">Legacy delivery:</strong> Memories included in legacy release
              remain sealed until the full verification process completes. Private memories are never included.
              Until release, legacy content is not accessible to anyone — including ETERN8 staff.
            </p>
          </div>
        </KeepsakeCard>
      </motion.div>
    </div>
  );
}
