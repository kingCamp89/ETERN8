import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import { Heart, Users, BookOpen, Share2, UserPlus, Camera, CalendarDays, ArrowRight, Gift, Sparkles, MessageCircle } from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6 }
};

export default function OurStory() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Our Story" subtitle="Why we built ETRN8" showBack />

      <div className="pb-8 space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80"
            alt="Family hands together"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-background" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto pt-16 pb-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-card/20 backdrop-blur-md rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-caption text-white/90 font-medium">Our story</span>
            </div>
            <h1 className="text-page-title text-white mb-4 leading-tight">
              Preserve what matters<br />before it fades
            </h1>
            <p className="text-quote text-white/85 leading-relaxed max-w-lg mx-auto">
              ETRN8 helps you capture, organize and share the memories that define your relationships — 
              so the people you love can relive them, now and always.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="page-sections">
        <motion.div {...fadeIn} className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-section-title text-2xl mb-3">Why we built this</h2>
          <p className="text-body text-muted-foreground leading-relaxed max-w-lg mx-auto">
            The stories, voices, and moments that make your loved ones who they are shouldn't be lost to time.
            ETRN8 gives you a private, beautiful space to capture every memory — and share it with the people who matter most.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8">
          {[
            {
              icon: Camera,
              title: 'Capture',
              desc: 'Save photos, voice notes, videos and written memories — all in one place.',
              img: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&q=80'
            },
            {
              icon: BookOpen,
              title: 'Organise',
              desc: 'Each loved one gets their own profile. Every memory stays beautifully organised.',
              img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&q=80'
            },
            {
              icon: Share2,
              title: 'Share',
              desc: 'Create circles with friends and family to relive moments together.',
              img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80'
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeIn}
              transition={{ delay: i * 0.15, duration: 0.6 }}
            >
              <KeepsakeCard padding={false} className="overflow-hidden h-full">
              <div className="h-32 overflow-hidden">
                <img src={item.img} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <item.icon className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-section-title text-base mb-1">{item.title}</h3>
                <p className="text-caption leading-relaxed">{item.desc}</p>
              </div>
              </KeepsakeCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="page-sections">
        <motion.div {...fadeIn} className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-section-title text-2xl mb-3">How it works</h2>
          <p className="text-body text-muted-foreground">Getting started takes just a few minutes</p>
        </motion.div>

        <div className="space-y-6 mt-8">
          {[
            {
              step: '1',
              title: 'Add a loved one',
              desc: 'Create a profile for each person you want to remember — your child, partner, parent, or friend. Give them a photo, pick a theme, and you\'re ready.',
              icon: Heart,
              img: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&q=80',
              action: { label: 'Add your first loved one', to: '/loved-ones/new' }
            },
            {
              step: '2',
              title: 'Capture a memory',
              desc: 'Write a story, upload a photo, record a voice note, or save a video. Tag it with an emotion, date it, and attach it to a loved one\'s profile.',
              icon: Camera,
              img: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600&q=80',
              action: { label: 'Create a memory', to: '/create' }
            },
            {
              step: '3',
              title: 'Build your timeline',
              desc: 'Every memory builds a beautiful timeline for each loved one. Scroll through years of moments, relive milestones, and see your story unfold.',
              icon: CalendarDays,
              img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80',
              action: { label: 'View loved ones', to: '/loved-ones' }
            },
            {
              step: '4',
              title: 'Share in a circle',
              desc: 'Create a memory circle for family or close friends. Share select memories and let everyone contribute, like, and comment — a private social feed just for you.',
              icon: Users,
              img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
              action: { label: 'View your circles', to: '/groups' }
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeIn}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <KeepsakeCard padding={false} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                  <img src={item.img} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="p-5 sm:w-3/5 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {item.step}
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-primary" />
                    </div>
                    <h3 className="text-section-title">{item.title}</h3>
                  </div>
                  <p className="text-body text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                  <Link
                    to={item.action.to}
                    className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline"
                  >
                    {item.action.label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
              </KeepsakeCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="page-sections">
        <motion.div {...fadeIn} className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-section-title text-2xl mb-3">Friends & circles</h2>
          <p className="text-body text-muted-foreground max-w-md mx-auto">
            Share memories privately with the people who matter most
          </p>
        </motion.div>

        <motion.div {...fadeIn} className="mt-8 mb-6">
          <KeepsakeCard>
            <h3 className="text-section-title mb-2 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" /> Adding friends
            </h3>
            <p className="text-body text-muted-foreground mb-6">
              Friends let you share memories and build circles together. Here&apos;s how to connect:
            </p>

            <div className="bg-secondary/40 rounded-2xl p-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">1</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Search by username</p>
                  <p className="text-caption">Friends tab → Search</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">2</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Send request</p>
                  <p className="text-caption">They&apos;ll get a notification</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">3</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Connected!</p>
                  <p className="text-caption">You&apos;re now friends</p>
                </div>
              </div>
            </div>

            <Link
              to="/friends"
              className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline"
            >
              Go to friends <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </KeepsakeCard>
        </motion.div>

        <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
          <KeepsakeCard>
            <h3 className="text-section-title mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Creating circles
            </h3>
            <p className="text-body text-muted-foreground mb-6">
              Circles are private groups where you share memories with specific people:
            </p>

            <div className="bg-secondary/40 rounded-2xl p-5 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">1</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Create a circle</p>
                  <p className="text-caption">Name it, pick a theme</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">2</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Add friends</p>
                  <p className="text-caption">Select from your friend list</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0 hidden sm:block" />
                <div className="bg-card rounded-xl border border-border/50 p-4 text-center sm:flex-1 w-full">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-2">
                    <span className="text-body font-bold text-primary">3</span>
                  </div>
                  <p className="text-body font-medium mb-0.5">Share memories</p>
                  <p className="text-caption">Everyone sees the feed</p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-4 border border-primary/15 mb-4">
              <div className="flex gap-3">
                <MessageCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-body font-medium mb-1">How sharing works</p>
                  <p className="text-caption leading-relaxed">
                    When you create a memory, tap Share and select a circle. Members can like, comment,
                    and view all shared memories in the circle&apos;s story timeline.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
              <div className="flex gap-3">
                <Gift className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-body font-medium mb-1">Pro tip</p>
                  <p className="text-caption leading-relaxed">
                    Create a circle for each group — Family Memories, Grandkids, Wedding Memories —
                    so the right people see the right memories.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/groups"
              className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline mt-4"
            >
              Go to circles <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </KeepsakeCard>
        </motion.div>
      </section>

      <section className="page-sections text-center">
        <motion.div {...fadeIn}>
          <img
            src="https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=800&q=80"
            alt="Family walking together"
            className="w-full h-52 object-cover rounded-2xl mb-8"
          />
          <h2 className="text-section-title text-2xl mb-3">Start building your legacy</h2>
          <p className="text-body text-muted-foreground mb-6 max-w-sm mx-auto">
            Every memory you save today is a gift your loved ones will treasure tomorrow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="rounded-xl gap-2">
              <Link to="/loved-ones/new">
                <Heart className="w-4 h-4" /> Add a loved one
              </Link>
            </Button>
            <Button asChild variant="secondary" className="rounded-xl gap-2">
              <Link to="/create">
                <Camera className="w-4 h-4" /> Create a memory
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>
      </div>
    </div>
  );
}