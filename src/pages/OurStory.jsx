import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import KeepsakeCard from '../components/shared/KeepsakeCard';
import { Button } from '@/components/ui/button';
import {
  Heart, Users, BookOpen, Share2, UserPlus, Camera,
  CalendarDays, ArrowRight, Gift, MessageCircle, Pen
} from 'lucide-react';

const fadeIn = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
};

const staggerFade = (i) => ({
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
});

function OrnamentalDivider() {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="flex gap-1.5 items-center">
        <div className="w-1 h-1 rounded-full bg-primary/30" />
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
        <div className="w-1 h-1 rounded-full bg-primary/30" />
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
}

export default function OurStory() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Our Story" subtitle="Why we built ETERN8" showBack />

      <div className="pb-12 space-y-10">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl" style={{ minHeight: 340 }}>
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&q=80"
              alt="Family hands together"
              className="w-full h-full object-cover"
              style={{ filter: 'sepia(0.5) brightness(0.78) contrast(1.12) saturate(0.85)' }}
            />
            {/* Film grain */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay',
                opacity: 0.6,
              }}
            />
            {/* Vignette */}
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.58) 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background to-transparent" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto pt-14 pb-20 px-5 text-center">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="inline-flex items-center gap-2.5 mb-5">
                <div className="h-px w-8 bg-white/45" />
                <span
                  className="text-white/70 tracking-[0.25em] uppercase text-[10px] font-semibold"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  Est. 2024
                </span>
                <div className="h-px w-8 bg-white/45" />
              </div>

              <h1
                className="font-heading text-[2.4rem] font-bold text-white leading-[1.15] mb-4"
                style={{ textShadow: '0 2px 24px rgba(0,0,0,0.45)' }}
              >
                Some moments deserve<br />
                <em className="italic" style={{ color: '#F5E4BC' }}>to live forever</em>
              </h1>

              <p
                className="text-quote text-white text-[15px] leading-relaxed max-w-md mx-auto px-3 py-2 rounded-xl"
                style={{
                  textShadow: '0 1px 12px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.6)',
                  background: 'rgba(0,0,0,0.22)',
                  backdropFilter: 'blur(4px)',
                  WebkitBackdropFilter: 'blur(4px)',
                }}
              >
                ETERN8 was born from a simple truth — the stories, voices, and faces
                we love most are always slipping away. We built this so they never have to.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── Founder's Letter ─────────────────────────────────── */}
        <motion.section {...fadeIn} className="page-sections">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-px bg-border/50" />
            <Pen className="w-3 h-3 text-muted-foreground/40" />
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <div
            className="keepsake-card rounded-2xl p-6 sm:p-8 relative overflow-hidden"
            style={{
              background: 'linear-gradient(155deg, hsl(var(--gold-wash)) 0%, hsl(var(--card)) 55%)',
            }}
          >
            {/* Decorative background accents */}
            <div
              className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)',
                transform: 'translate(30%, -30%)',
              }}
            />
            <div
              className="absolute bottom-0 left-0 w-28 h-28 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, hsl(var(--gold-glow) / 0.18) 0%, transparent 70%)',
                transform: 'translate(-20%, 20%)',
              }}
            />

            <div className="relative z-10">
              <div
                className="text-7xl font-heading text-primary/15 leading-none mb-0 select-none"
                style={{ fontFamily: 'var(--font-heading)', lineHeight: 0.75, marginBottom: '-0.1em' }}
              >
                "
              </div>

              <blockquote className="text-quote-lg leading-[1.85] mb-5">
                It started with losing my father. When he passed, I realised I had almost no
                record of his voice — his laugh, the stories he told, the little things that
                made him him. Just a few photos and the memories already beginning to blur.
              </blockquote>

              <p className="text-body text-muted-foreground leading-relaxed mb-4">
                That loss became ETERN8. Not just an app — a promise. That the people who shape us
                won't be forgotten. That the small, ordinary moments — the dad jokes, the Sunday
                drives, the advice given over the phone — are worth keeping forever.
              </p>

              <p className="text-body text-muted-foreground leading-relaxed">
                I built ETERN8 for everyone who's ever wished they'd recorded more. Written more down.
                Asked one more question. It's never too late to start — and now, neither will you have to.
              </p>

              <div className="mt-7 pt-5 border-t border-border/40 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/12 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-body font-semibold font-heading text-foreground text-sm">The ETERN8 Team</p>
                  <p className="text-caption">Building memories that last</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Pull Quote ───────────────────────────────────────── */}
        <motion.section {...fadeIn} className="text-center px-4 py-2">
          <div className="relative inline-block max-w-sm mx-auto">
            <div
              className="absolute -top-2 -left-2 text-6xl font-heading text-primary/14 leading-none select-none"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              "
            </div>
            <p className="text-quote-lg text-foreground/75 leading-[1.9] relative z-10 px-7">
              Every life is a story worth telling.<br />
              Every memory is a thread worth keeping.
            </p>
            <div
              className="absolute -bottom-5 -right-1 text-6xl font-heading text-primary/14 leading-none select-none rotate-180"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              "
            </div>
          </div>
          <div className="h-px w-10 bg-primary/30 mx-auto mt-10" />
        </motion.section>

        {/* ── What We Believe ──────────────────────────────────── */}
        <section className="page-sections">
          <motion.div {...fadeIn} className="text-center">
            <span className="text-overline">Our philosophy</span>
            <h2 className="text-section-title text-2xl mt-1.5">Three things we believe</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-4 mt-2">
            {[
              {
                icon: Camera,
                number: '01',
                title: 'Capture',
                desc: 'Every photo, voice note, and written word is a piece of someone\'s legacy. Save them before they slip away.',
                img: 'https://images.unsplash.com/photo-1695425812104-8a9963d58887?w=400&q=80'
              },
              {
                icon: BookOpen,
                number: '02',
                title: 'Organise',
                desc: 'Memories deserve a home — not a camera roll. Each loved one gets their own beautiful, living archive.',
                img: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=400&q=80'
              },
              {
                icon: Share2,
                number: '03',
                title: 'Share',
                desc: 'The best stories are told together. Private circles for the people who matter most.',
                img: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80'
              }
            ].map((item, i) => (
              <motion.div key={i} {...staggerFade(i)}>
                <KeepsakeCard padding={false} className="overflow-hidden h-full">
                  <div className="h-36 overflow-hidden relative">
                    <img
                      src={item.img}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ filter: 'sepia(0.3) saturate(0.88) brightness(0.94) contrast(1.05)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card/75 via-transparent to-transparent" />
                    <span
                      className="absolute bottom-2.5 left-4 text-3xl font-heading font-bold text-white/22 leading-none select-none"
                    >
                      {item.number}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <h3 className="text-section-title text-base">{item.title}</h3>
                    </div>
                    <p className="text-caption leading-relaxed">{item.desc}</p>
                  </div>
                </KeepsakeCard>
              </motion.div>
            ))}
          </div>
        </section>

        <OrnamentalDivider />

        {/* ── How It Works ─────────────────────────────────────── */}
        <section className="page-sections">
          <motion.div {...fadeIn} className="text-center">
            <span className="text-overline">Getting started</span>
            <h2 className="text-section-title text-2xl mt-1.5">Your first four steps</h2>
            <p className="text-body text-muted-foreground mt-2">
              Begin in minutes. Build something that lasts forever.
            </p>
          </motion.div>

          <div className="space-y-4 mt-4">
            {[
              {
                step: '01',
                title: 'Add a loved one',
                desc: 'Create a profile for each person whose story matters — your child, parent, partner, or friend. A photo, a name, a theme.',
                icon: Heart,
                img: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600&q=80',
                action: { label: 'Add your first loved one', to: '/loved-ones/new' }
              },
              {
                step: '02',
                title: 'Capture a memory',
                desc: 'A photo, a voice note, a written story, a video. Tag it with how it made you feel. Date it. Let it breathe.',
                icon: Camera,
                img: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?w=600&q=80',
                action: { label: 'Create a memory', to: '/create' }
              },
              {
                step: '03',
                title: 'Build the timeline',
                desc: 'Watch a life unfold year by year — milestones, quiet moments, everyday magic. Every memory finds its place.',
                icon: CalendarDays,
                img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80',
                action: { label: 'View loved ones', to: '/loved-ones' }
              },
              {
                step: '04',
                title: 'Share in a circle',
                desc: 'Invite family and close friends. Share the memories that belong to everyone — and let them add their own.',
                icon: Users,
                img: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80',
                action: { label: 'View your circles', to: '/groups' }
              }
            ].map((item, i) => (
              <motion.div key={i} {...staggerFade(i)}>
                <KeepsakeCard padding={false} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-2/5 h-44 sm:h-auto overflow-hidden relative shrink-0">
                      <img
                        src={item.img}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'sepia(0.22) saturate(0.9) brightness(0.97)' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent sm:bg-gradient-to-r" />
                      <span
                        className="absolute bottom-3 left-4 text-5xl font-heading font-bold text-white/20 leading-none select-none"
                      >
                        {item.step}
                      </span>
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <item.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <h3 className="text-section-title">{item.title}</h3>
                      </div>
                      <p className="text-body text-muted-foreground leading-relaxed mb-4">{item.desc}</p>
                      <Link
                        to={item.action.to}
                        className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline w-fit"
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

        <OrnamentalDivider />

        {/* ── Friends & Circles ────────────────────────────────── */}
        <section className="page-sections">
          <motion.div {...fadeIn} className="text-center">
            <span className="text-overline">Your people</span>
            <h2 className="text-section-title text-2xl mt-1.5">Friends & circles</h2>
            <p className="text-body text-muted-foreground mt-2 max-w-md mx-auto">
              The best memories are shared ones. Connect with the people who were there.
            </p>
          </motion.div>

          <motion.div {...fadeIn} className="mt-2">
            <KeepsakeCard>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-section-title">Adding friends</h3>
                  <p className="text-body text-muted-foreground mt-1">
                    Search by username, send a request, and connect in seconds.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/40 rounded-xl p-4 mb-5">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
                  {[
                    { label: 'Search by username', sub: 'Friends tab → Search' },
                    { label: 'Send request', sub: "They'll get a notification" },
                    { label: 'Connected!', sub: "You're now friends" }
                  ].map((s, i) => (
                    <div key={i} className="contents">
                      <div className="bg-card rounded-xl border border-border/50 p-3.5 text-center sm:flex-1 w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-body font-medium text-sm mb-0.5">{s.label}</p>
                        <p className="text-caption">{s.sub}</p>
                      </div>
                      {i < 2 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Link to="/friends" className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline">
                Go to friends <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </KeepsakeCard>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.12 }}>
            <KeepsakeCard>
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-section-title">Creating circles</h3>
                  <p className="text-body text-muted-foreground mt-1">
                    A private space where the right people share the right memories.
                  </p>
                </div>
              </div>

              <div className="bg-secondary/40 rounded-xl p-4 mb-5">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-0">
                  {[
                    { label: 'Create a circle', sub: 'Name it, pick a theme' },
                    { label: 'Add friends', sub: 'Select from your list' },
                    { label: 'Share memories', sub: 'Everyone sees the feed' }
                  ].map((s, i) => (
                    <div key={i} className="contents">
                      <div className="bg-card rounded-xl border border-border/50 p-3.5 text-center sm:flex-1 w-full">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <span className="text-xs font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-body font-medium text-sm mb-0.5">{s.label}</p>
                        <p className="text-caption">{s.sub}</p>
                      </div>
                      {i < 2 && (
                        <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block mx-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-5">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/15">
                  <div className="flex gap-2.5">
                    <MessageCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body font-medium text-sm mb-1">How sharing works</p>
                      <p className="text-caption leading-relaxed">
                        Tap Share on any memory and pick a circle. Everyone can like, comment and add their own.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 border border-border/50">
                  <div className="flex gap-2.5">
                    <Gift className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-body font-medium text-sm mb-1">Pro tip</p>
                      <p className="text-caption leading-relaxed">
                        Create separate circles — Family, Wedding, Grandkids — so memories reach the right people.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Link to="/groups" className="inline-flex items-center gap-1.5 text-body font-medium text-primary hover:underline">
                Go to circles <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </KeepsakeCard>
          </motion.div>
        </section>

        {/* ── Legacy CTA ───────────────────────────────────────── */}
        <motion.section {...fadeIn} className="page-sections">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1489710437720-ebb67ec84dd2?w=800&q=80"
              alt="Family walking together"
              className="w-full h-56 object-cover"
              style={{ filter: 'sepia(0.35) saturate(0.82) brightness(0.78) contrast(1.06)' }}
            />
            <div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, transparent 32%, rgba(0,0,0,0.52) 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="text-center pt-2">
            <h2 className="text-section-title text-2xl mb-3">Start your story today</h2>
            <p className="text-quote text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
              Every memory you save today is a gift your loved ones will carry with them always.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild className="rounded-xl gap-2 btn-gradient">
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
          </div>
        </motion.section>

      </div>
    </div>
  );
}
