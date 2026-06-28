import { useState } from 'react';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const categories = [
  {
    title: 'Getting Started',
    items: [
      {
        q: 'What is ETERN8?',
        a: 'ETERN8 is a digital time capsule that helps you preserve memories, messages, photos, and voice recordings for the people you love. You can create profiles for family members, write memories for specific occasions, and even schedule messages to be delivered in the future.',
      },
      {
        q: 'How do I create my first memory?',
        a: 'Tap Capture on the home screen, or open a loved one\'s profile and add a memory. Choose text, photo, voice, or video, fill in the details, and save it.',
      },
      {
        q: 'How do I add a loved one?',
        a: 'Go to Your People, then tap Add. Fill in their name, relationship, and optionally upload a photo and write a cover message about them.',
      },
    ],
  },
  {
    title: 'Memories & Content',
    items: [
      {
        q: 'What types of memories can I create?',
        a: 'You can create text memories, upload photos, record voice messages, and upload videos. Each memory can include a title, date, tags, and an emotion label to help you organize them.',
      },
      {
        q: 'Can I edit or delete a memory later?',
        a: 'Yes. Open any memory to view it in detail, then edit its content, change its settings, or delete it if needed.',
      },
      {
        q: 'Are my private memories visible to others?',
        a: 'No. Turn on "Keep this memory private" when creating or editing a memory. Private memories are only visible to you — they cannot be shared, scheduled for delivery, or included in legacy release.',
      },
      {
        q: 'What are private notes?',
        a: 'Private notes are separate from memories — short writings only you can read. Find them in Settings → Private Notes, or from a loved one\'s profile. If legacy delivery is enabled, notes can be released to the person they are about after the verification process.',
      },
      {
        q: 'How are my photos and videos stored?',
        a: 'All media files are stored securely in the cloud with encryption. Only you have access to them while you maintain your account.',
      },
    ],
  },
  {
    title: 'Future Delivery',
    items: [
      {
        q: 'How does future delivery work?',
        a: 'When creating a memory, you can schedule it for future delivery by setting a specific date and occasion. The memory stays locked until that date, when it becomes visible to the recipient.',
      },
      {
        q: 'Can I schedule a memory for years in the future?',
        a: 'Yes. You can write a letter for a child\'s 18th birthday or wedding day. These memories are securely stored and timestamped, proving they were written long before delivery.',
      },
      {
        q: 'What happens if I change my mind about a scheduled memory?',
        a: 'You can edit or unschedule any future delivery at any time. You keep full control over all your content.',
      },
    ],
  },
  {
    title: 'Legacy Mode',
    items: [
      {
        q: 'What is Legacy Mode?',
        a: 'Legacy Mode ensures your undelivered memories reach the people you intended if you pass away unexpectedly. When enabled, all undelivered memories with recipients are automatically included — you do not need to mark each one individually. Private memories are always excluded.',
      },
      {
        q: 'How does the posthumous delivery process work?',
        a: 'When a designated trusted contact reports your passing, our system initiates a verification process. Multiple trusted contacts must independently confirm. Once verified, your pre-selected legacy memories are released to each recipient as you intended.',
      },
      {
        q: 'How many trusted contacts do I need?',
        a: 'We recommend at least 3 trusted contacts. This ensures a reliable verification process and prevents any single person from triggering delivery prematurely.',
      },
      {
        q: 'What safeguards prevent premature delivery?',
        a: 'Legacy delivery requires: (1) a formal request from a trusted contact, (2) independent verification from at least one other trusted contact, (3) a mandatory waiting period, and (4) optional additional identity verification steps.',
      },
      {
        q: 'Can trusted contacts see my memories before delivery?',
        a: 'No. Trusted contacts cannot view any of your content. They only serve as verifiers in the delivery process. Your memories remain private until verification completes.',
      },
    ],
  },
  {
    title: 'Security & Privacy',
    items: [
      {
        q: 'Is my data encrypted?',
        a: 'Yes. All data is encrypted in transit (TLS/SSL) and at rest (AES-256). Your memories are stored in secure, access-controlled data centers.',
      },
      {
        q: 'Who can access my memories?',
        a: 'Only you can access your memories while your account is active. No ETERN8 employee can view your content. In legacy mode, only designated recipients receive the memories you chose for them.',
      },
      {
        q: 'What happens to my data if I cancel my subscription?',
        a: 'Canceling Premium does not delete your account or memories. Your data stays on your account unless you delete it yourself. To permanently remove everything immediately, use Settings → Delete Account.',
      },
      {
        q: 'Can I delete my account and all my data?',
        a: 'Yes. Go to Settings → Delete Account. This permanently removes your memories, loved ones, groups, legacy settings, friendships, notifications, and uploaded media immediately. This cannot be undone.',
      },
      {
        q: 'Can I export or download my data?',
        a: 'Go to Settings → Export my data to download a ZIP with your full account data (JSON), printable memory stories with quoted messages, and a media guide for voice and video files. Per-person PDFs are also available from profile and memory book pages.',
      },
    ],
  },
  {
    title: 'Account & Billing',
    items: [
      {
        q: 'How do I upgrade to Premium?',
        a: 'Open Settings → Subscription to compare plans. Secure paid checkout via Stripe is not available yet — Premium billing will be enabled in a future update.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'When Premium billing is available, you will be able to cancel anytime and keep access until the end of your billing period. Your memories are not deleted when a subscription ends.',
      },
      {
        q: 'Is there a family plan?',
        a: 'We currently offer individual plans. Each account is designed for one person to create memories for their loved ones.',
      },
      {
        q: 'What payment methods do you accept?',
        a: 'When billing launches, we plan to accept major credit and debit cards through Stripe. Checkout is not yet available in the app.',
      },
    ],
  },
];

export default function Help() {
  const [openCategory, setOpenCategory] = useState('Getting Started');

  return (
    <div className="min-h-screen">
      <PageHeader title="Help & FAQ" subtitle="Find answers to common questions" showBack />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="page-sections pb-8"
      >
        <KeepsakeCard className="bg-primary/5 border-primary/15">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h3 className="text-section-title mb-1">Need more help?</h3>
              <p className="text-body text-muted-foreground mb-3">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="rounded-xl gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email support
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl gap-2">
                  <MessageCircle className="w-3.5 h-3.5" /> Live chat
                </Button>
              </div>
            </div>
          </div>
        </KeepsakeCard>

        <div className="space-y-3">
          {categories.map((category, ci) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.04 }}
            >
              <KeepsakeCard padding={false} className="overflow-hidden">
                <Accordion
                  type="single"
                  collapsible
                  value={openCategory === category.title ? category.title : ''}
                  onValueChange={(v) => setOpenCategory(v || '')}
                >
                  <AccordionItem value={category.title} className="border-none">
                    <AccordionTrigger className="px-5 py-4 hover:no-underline">
                      <span className="text-section-title">{category.title}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-1">
                      <div className="space-y-1 pb-3">
                        {category.items.map((item, i) => (
                          <Accordion key={i} type="single" collapsible>
                            <AccordionItem value={`${category.title}-${i}`} className="border-border/30">
                              <AccordionTrigger className="py-3 text-body font-medium hover:no-underline text-left">
                                {item.q}
                              </AccordionTrigger>
                              <AccordionContent className="pb-3">
                                <p className="text-body text-muted-foreground leading-relaxed">
                                  {item.a}
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </KeepsakeCard>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
