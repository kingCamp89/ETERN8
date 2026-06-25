import { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { Check, Crown, X, Shield, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { name: 'Loved one profiles', free: '3', premium: 'Unlimited' },
  { name: 'Text memories', free: '50', premium: 'Unlimited' },
  { name: 'Photo memories', free: 'Included', premium: 'Unlimited' },
  { name: 'Voice recordings', free: false, premium: true },
  { name: 'Video memories', free: false, premium: true },
  { name: 'Future scheduled delivery', free: false, premium: true },
  { name: 'Legacy posthumous delivery', free: false, premium: true },
  { name: 'Memory books (PDF export)', free: false, premium: true },
  { name: 'Advanced search & filters', free: false, premium: true },
  { name: 'Unlimited tags & emotions', free: false, premium: true },
  { name: 'Priority support', free: false, premium: true },
  { name: 'Data export', free: false, premium: true },
];

const faqs = [
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. You can upgrade to Premium or downgrade to Free at any time. If you downgrade, Premium features remain accessible until the end of your current billing period.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'All your data is preserved. Premium-only content like voice recordings and videos remain stored but become inaccessible. You can access them again anytime by upgrading back to Premium.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a 14-day free trial of Premium, so you can explore all features before committing. No credit card required for the trial.',
  },
  {
    q: 'How does billing work?',
    a: 'Billing is handled securely through Stripe. You can choose monthly or yearly billing. Yearly plans save you 17% compared to monthly.',
  },
];

export default function Subscription() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen">
      <PageHeader title="Subscription" subtitle="Choose the plan that's right for you" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <div className="flex items-center justify-center gap-3">
          <span className={`text-body ${!yearly ? 'font-semibold' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setYearly(!yearly)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              yearly ? 'bg-primary' : 'bg-secondary'
            }`}
            aria-label={yearly ? 'Switch to monthly billing' : 'Switch to yearly billing'}
          >
            <div className={`w-5 h-5 rounded-full bg-card shadow-sm absolute top-0.5 transition-transform ${
              yearly ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
          <span className={`text-body flex items-center gap-1.5 ${yearly ? 'font-semibold' : 'text-muted-foreground'}`}>
            Yearly
            <span className="bg-primary/10 text-primary text-caption font-semibold px-1.5 py-0.5 rounded-full">
              Save 17%
            </span>
          </span>
        </div>

        <div className="grid gap-4">
          <KeepsakeCard>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-section-title text-3xl">Free</span>
              <span className="text-caption">forever</span>
            </div>
            <p className="text-body text-muted-foreground mb-4">Start preserving your most precious memories</p>
            <Button className="w-full rounded-xl" variant="secondary" disabled>
              Current plan
            </Button>
          </KeepsakeCard>

          <KeepsakeCard padding={false} className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bg-gradient-gold text-primary-foreground text-center py-1.5">
              <span className="text-caption font-semibold flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" /> Recommended
              </span>
            </div>
            <div className="p-5 pt-8">
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-section-title text-3xl">
                  ${yearly ? '8.29' : '9.99'}
                </span>
                <span className="text-caption">/month</span>
              </div>
              {yearly && (
                <p className="text-caption text-primary mb-1">Billed yearly at $99.50</p>
              )}
              <p className="text-body text-muted-foreground mb-4">Everything you need to preserve a lifetime of memories</p>
              <Button className="w-full rounded-xl">
                Start free trial
              </Button>
              <p className="text-center text-caption text-muted-foreground mt-2">14-day free trial. No credit card needed.</p>
            </div>
          </KeepsakeCard>
        </div>

        <KeepsakeCard padding={false} className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border/30">
            <h3 className="text-section-title">Plan comparison</h3>
          </div>
          <div className="divide-y divide-border/20">
            <div className="flex items-center px-5 py-2.5 bg-secondary/30">
              <span className="flex-1 text-overline normal-case tracking-normal">Feature</span>
              <span className="w-16 text-center text-overline normal-case tracking-normal">Free</span>
              <span className="w-16 text-center text-overline normal-case tracking-normal text-primary">Premium</span>
            </div>
            {features.map((feature) => (
              <div key={feature.name} className="flex items-center px-5 py-3">
                <span className="flex-1 text-body">{feature.name}</span>
                <span className="w-16 text-center">
                  {feature.free === true ? (
                    <Check className="w-4 h-4 text-primary mx-auto" />
                  ) : feature.free === false ? (
                    <X className="w-4 h-4 text-muted-foreground/40 mx-auto" />
                  ) : (
                    <span className="text-caption text-muted-foreground">{feature.free}</span>
                  )}
                </span>
                <span className="w-16 text-center">
                  {feature.premium === true ? (
                    <Check className="w-4 h-4 text-primary mx-auto" />
                  ) : (
                    <span className="text-body font-medium">{feature.premium}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </KeepsakeCard>

        <div className="grid grid-cols-2 gap-3">
          <KeepsakeCard className="text-center py-4">
            <Shield className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-body font-medium">Cancel anytime</p>
            <p className="text-caption">No lock-in contracts</p>
          </KeepsakeCard>
          <KeepsakeCard className="text-center py-4">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-body font-medium">14-day trial</p>
            <p className="text-caption">No credit card needed</p>
          </KeepsakeCard>
        </div>

        <div>
          <h3 className="text-section-title mb-3 px-1">Billing FAQ</h3>
          <KeepsakeCard padding={false} className="divide-y divide-border/20">
            {faqs.map((faq, i) => (
              <div key={i} className="p-4">
                <h4 className="text-body font-medium mb-1">{faq.q}</h4>
                <p className="text-body text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </KeepsakeCard>
        </div>
      </motion.div>
    </div>
  );
}
