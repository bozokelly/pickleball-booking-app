'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';

// ─── Design-system primitives ──────────────────────────────────────────────

function Photo({
  tone,
  label,
  style,
  className = '',
  children,
}: {
  tone?: 'navy' | 'emerald' | 'graphite' | 'sand';
  label?: string;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`photo ${className}`} data-tone={tone} style={{ position: 'relative', ...style }}>
      {children}
      {label && <div className="photo-label">{label}</div>}
    </div>
  );
}

function Avatar({ tone = 'graphite', size = 28 }: { tone?: string; size?: number }) {
  return (
    <span
      className={`av av-${tone}`}
      style={{ width: size, height: size, border: '2px solid var(--surface)', display: 'inline-block', flexShrink: 0 }}
    />
  );
}

function AvatarStack({ tones = ['graphite', 'navy', 'emerald', 'sand'], size = 28 }: { tones?: string[]; size?: number }) {
  return (
    <span style={{ display: 'inline-flex' }}>
      {tones.map((t, i) => (
        <Avatar key={i} tone={t} size={size} />
      ))}
    </span>
  );
}

function Pill({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'warn' | 'danger';
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 999,
    border: '1px solid var(--border)', background: 'var(--surface)',
    fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap',
  };
  if (variant === 'accent') {
    base.background = 'color-mix(in oklab, var(--accent) 18%, transparent)';
    base.borderColor = 'color-mix(in oklab, var(--accent) 35%, transparent)';
    base.color = 'var(--text)';
  }
  if (variant === 'warn') {
    base.color = 'var(--warn)';
    base.borderColor = 'color-mix(in oklab, var(--warn) 30%, var(--border))';
    base.background = 'color-mix(in oklab, var(--warn) 8%, var(--surface))';
  }
  return <span style={base}>{children}</span>;
}

function PillDot({ color = 'var(--accent)' }: { color?: string }) {
  return (
    <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono, "SF Mono", ui-monospace, monospace)',
      fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)',
    }}>
      {children}
    </span>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────────────

function SiteNav({ session }: { session: boolean }) {
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'color-mix(in oklab, var(--bg) 80%, transparent)',
      backdropFilter: 'saturate(160%) blur(14px)',
      WebkitBackdropFilter: 'saturate(160%) blur(14px)',
      borderBottom: '1px solid color-mix(in oklab, var(--border) 60%, transparent)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, letterSpacing: '-0.02em', fontSize: 16, color: 'var(--text)', textDecoration: 'none' }}>
            <span style={{
              width: 28, height: 28, borderRadius: 8,
              background: '#111', color: 'var(--accent)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14,
            }}>B</span>
            Book A Dink
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[
              { label: 'Games', href: '/dashboard/games' },
              { label: 'Clubs', href: '/dashboard/games' },
              { label: 'For Clubs', href: '#for-clubs' },
            ].map((l) => (
              <Link key={l.label} href={l.href} style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 14, color: 'var(--text-2)',
                textDecoration: 'none', transition: 'color .15s ease',
              }}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {session ? (
            <Link href="/dashboard" style={{
              padding: '8px 18px', borderRadius: 10,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              fontWeight: 600, fontSize: 14, textDecoration: 'none',
              border: '1px solid var(--accent)',
            }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" style={{
                padding: '8px 14px', borderRadius: 10, fontSize: 14,
                fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none',
                background: 'transparent',
              }}>Sign In</Link>
              <Link href="/signup" style={{
                padding: '8px 18px', borderRadius: 10,
                background: '#111', color: '#fff',
                fontWeight: 600, fontSize: 14, textDecoration: 'none',
                border: '1px solid #111',
              }}>Get Started</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────

function Hero({ session }: { session: boolean }) {
  return (
    <section style={{ paddingTop: 64, paddingBottom: 24 }}>
      <div style={{
        maxWidth: 1280, margin: '0 auto', padding: '0 32px',
        display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 64, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Eyebrow>Perth, Western Australia · Book A Dink</Eyebrow>
          <h1 style={{
            fontFamily: 'var(--font-sans)', fontSize: 'clamp(48px, 6vw, 80px)',
            lineHeight: 0.96, letterSpacing: '-0.04em', fontWeight: 600,
            color: 'var(--text)', margin: 0,
          }}>
            Premium pickleball,{' '}
            <span style={{ color: 'var(--text-2)' }}>beautifully </span>
            <span style={{ position: 'relative', display: 'inline-block' }}>
              booked.
              <span style={{
                position: 'absolute', left: 0, right: 0, bottom: 6, height: 14,
                background: 'var(--accent)', opacity: 0.55, zIndex: -1, borderRadius: 4,
              }} />
            </span>
          </h1>
          <p style={{ fontSize: 18, maxWidth: 520, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
            Discover premium clubs, book social games, and meet players at your level — across Perth and beyond.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link href={session ? '/dashboard' : '/signup'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 12,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid var(--accent)',
              boxShadow: '0 1px 2px rgba(128,255,0,.25), inset 0 1px 0 rgba(255,255,255,.4)',
            }}>
              {session ? 'Go to Dashboard' : 'Find a game'} →
            </Link>
            <Link href="/dashboard/games" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 12,
              background: 'var(--surface)', color: 'var(--text)',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid var(--border)',
            }}>
              Browse clubs
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 8, color: 'var(--text-2)', fontSize: 13 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>✓ Server-secured bookings</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>⚡ Instant waitlist holds</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>👥 Players across WA</span>
          </div>
        </div>

        {/* Hero card — "Your next game" */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            <Eyebrow>Featured game · This week</Eyebrow>
          </div>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)', overflow: 'hidden',
          }}>
            <Photo tone="sand" label="Cottesloe · sunset" style={{ aspectRatio: '16/10', width: '100%' }}>
              <div style={{ position: 'absolute', top: 16, left: 16, color: '#fff' }}>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, opacity: 0.8, letterSpacing: '.1em' }}>THU 7 MAY</div>
                <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, maxWidth: 260, lineHeight: 1.15 }}>Thursday Sunset Social Doubles</div>
              </div>
              <div style={{ position: 'absolute', top: 16, right: 16 }}>
                <Pill variant="warn"><PillDot color="var(--warn)" /> 3 spots left</Pill>
              </div>
              <div style={{ position: 'absolute', left: 16, bottom: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
                <AvatarStack tones={['graphite', 'navy', 'emerald', 'sand']} size={24} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.85)' }}>13/16 confirmed</span>
              </div>
            </Photo>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Venue</div>
                <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>Cottesloe Civic Centre</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Cottesloe · 3.2 km</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Time</div>
                <div style={{ fontWeight: 600, marginTop: 4, fontSize: 14 }}>5:30 – 7:30 PM</div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>Round-robin · 2.5–3.5</div>
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
                <Link href={session ? '/dashboard' : '/signup'} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 16px', borderRadius: 10,
                  background: 'var(--accent)', color: 'var(--accent-ink)',
                  fontWeight: 600, fontSize: 14, textDecoration: 'none',
                  border: '1px solid var(--accent)',
                }}>
                  {session ? 'Book now' : 'Get started'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Quick actions strip ───────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { icon: '🔍', t: 'Find a game', s: 'Near you, today', href: '/dashboard/games' },
    { icon: '📍', t: 'Browse clubs', s: 'Clubs in Perth', href: '/dashboard/games' },
    { icon: '⚡', t: 'Quick join', s: 'Open spots now', href: '/signup' },
    { icon: '🏆', t: 'Memberships', s: 'From $29 / month', href: '/signup' },
  ];
  return (
    <section style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 32px' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', overflow: 'hidden',
      }}>
        {actions.map((a, i) => (
          <Link key={a.t} href={a.href} style={{
            padding: 24, borderRight: i < 3 ? '1px solid var(--border)' : 'none',
            display: 'flex', flexDirection: 'column', gap: 12,
            textDecoration: 'none', color: 'inherit', transition: 'background .15s',
          }}>
            <span style={{ fontSize: 22 }}>{a.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 14 }}>{a.t}</div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{a.s}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Game card ─────────────────────────────────────────────────────────────

function GameCard({ game }: {
  game: {
    title: string; date: string; time: string; venue: string; suburb: string;
    distanceKm: number; format: string; skill: string; price: number;
    spotsTaken: number; spotsTotal: number; tone: 'navy' | 'emerald' | 'graphite' | 'sand';
    status: 'open' | 'warn' | 'danger';
  }
}) {
  const left = game.spotsTotal - game.spotsTaken;
  const statusLabel = left <= 0 ? 'Full' : left === 1 ? '1 spot left' : left <= 5 ? `${left} spots left` : `${left} spots open`;
  const statusVariant = left <= 0 || left === 1 ? 'danger' : left <= 5 ? 'warn' : 'accent';
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', flexShrink: 0, width: 320,
    }}>
      <Photo tone={game.tone} style={{ aspectRatio: '16/10', width: '100%' }} label={`${game.suburb} · pickleball`}>
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <Pill variant={statusVariant}><PillDot color={statusVariant === 'accent' ? 'var(--accent)' : statusVariant === 'warn' ? 'var(--warn)' : 'var(--danger)'} />{statusLabel}</Pill>
        </div>
      </Photo>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-2)' }}>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>{game.date}</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span>{game.time}</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.25, color: 'var(--text)' }}>{game.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>{game.venue} · {game.distanceKm} km</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            border: '1px solid var(--border)', borderRadius: 6,
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--text-2)',
          }}>{game.format}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            border: '1px solid var(--border)', borderRadius: 6,
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11, letterSpacing: '0.04em', color: 'var(--text-2)',
          }}>{game.skill}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarStack tones={['graphite', 'navy', 'emerald', 'sand']} size={22} />
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{game.spotsTaken}/{game.spotsTotal}</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>
            {game.price === 0 ? 'Free' : `$${game.price}`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Club card ─────────────────────────────────────────────────────────────

function ClubCard({ club }: {
  club: {
    name: string; tagline: string; suburb: string; members: number; courts: number;
    skill: string; tone: 'navy' | 'emerald' | 'graphite' | 'sand';
    rating: number; membershipFrom: number; featured?: boolean;
  }
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)', overflow: 'hidden',
    }}>
      <Photo tone={club.tone} style={{ aspectRatio: '4/3', width: '100%' }} label={`${club.suburb} · club`}>
        {club.featured && (
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <Pill variant="accent"><PillDot /> Featured</Pill>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <Pill>⭐ {club.rating}</Pill>
        </div>
      </Photo>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Eyebrow>{club.suburb}</Eyebrow>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>{club.name}</div>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: 0 }}>{club.tagline}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--text-2)' }}>
          <span>{club.members.toLocaleString()} members</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span>{club.courts} courts</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span>{club.skill}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>
            From <b style={{ color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>${club.membershipFrom}</b>/mo
          </span>
          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>View club →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Section header ────────────────────────────────────────────────────────

function SectionHead({
  eyebrow, title, sub, action,
}: { eyebrow: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 style={{
          fontSize: 'clamp(32px, 3.6vw, 52px)', lineHeight: 1.04, letterSpacing: '-0.03em',
          fontWeight: 600, color: 'var(--text)', margin: 0,
        }}>{title}</h2>
        {sub && <p style={{ fontSize: 16, color: 'var(--text-2)', maxWidth: 600, margin: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Mock data ─────────────────────────────────────────────────────────────

const SAMPLE_GAMES = [
  {
    id: 'g1', title: 'Thursday Sunset Social Doubles',
    date: 'Thu 7 May', time: '5:30 – 7:30 PM',
    venue: 'Cottesloe Civic Centre Courts', suburb: 'Cottesloe',
    distanceKm: 3.2, format: 'Round-robin', skill: '2.5–3.5',
    price: 18, spotsTotal: 16, spotsTaken: 13, tone: 'sand' as const, status: 'warn' as const,
  },
  {
    id: 'g2', title: 'Saturday Open Play',
    date: 'Sat 9 May', time: '8:00 – 10:00 AM',
    venue: 'Fremantle Leisure Centre', suburb: 'Fremantle',
    distanceKm: 3.4, format: 'Open mixer', skill: 'All levels',
    price: 12, spotsTotal: 24, spotsTaken: 11, tone: 'navy' as const, status: 'open' as const,
  },
  {
    id: 'g3', title: 'Subi 3.5+ Ladder Night',
    date: 'Wed 6 May', time: '7:00 – 9:00 PM',
    venue: 'Subiaco Community Centre', suburb: 'Subiaco',
    distanceKm: 5.7, format: 'Ladder · 4 rounds', skill: '3.5–4.5',
    price: 25, spotsTotal: 12, spotsTaken: 11, tone: 'graphite' as const, status: 'danger' as const,
  },
  {
    id: 'g4', title: 'Bayswater Weeknight Drop-In',
    date: 'Tue 5 May', time: '6:30 – 8:30 PM',
    venue: 'Bayswater Waves', suburb: 'Bayswater',
    distanceKm: 9.8, format: 'Open mixer', skill: '2.5–3.5',
    price: 15, spotsTotal: 16, spotsTaken: 12, tone: 'emerald' as const, status: 'warn' as const,
  },
];

const SAMPLE_CLUBS = [
  {
    id: 'c-smpc', name: 'South Metro Pickleball Club',
    tagline: "Perth's home of premium social pickleball.",
    suburb: 'Fremantle · Melville · Cottesloe',
    members: 1284, courts: 12, skill: 'All levels · 2.5–4.5',
    tone: 'emerald' as const, rating: 4.9, membershipFrom: 49, featured: true,
  },
  {
    id: 'c-cott', name: 'Cottesloe Coastal Pickleball',
    tagline: 'Sunset socials by the beach.',
    suburb: 'Cottesloe',
    members: 642, courts: 6, skill: 'Social · 2.0–3.5',
    tone: 'sand' as const, rating: 4.8, membershipFrom: 39,
  },
  {
    id: 'c-sub', name: 'Subiaco Racquet Club',
    tagline: 'Competitive play, refined club culture.',
    suburb: 'Subiaco',
    members: 873, courts: 8, skill: 'Competitive · 3.0–5.0',
    tone: 'graphite' as const, rating: 4.7, membershipFrom: 79,
  },
  {
    id: 'c-jnd', name: 'Joondalup Pickleball Collective',
    tagline: 'North-side family club, leagues & ladders.',
    suburb: 'Joondalup',
    members: 514, courts: 10, skill: 'All levels · 2.0–4.0',
    tone: 'navy' as const, rating: 4.7, membershipFrom: 35,
  },
];

// ─── Sections ──────────────────────────────────────────────────────────────

const container: React.CSSProperties = { maxWidth: 1280, margin: '0 auto', padding: '0 32px' };

function GamesSection() {
  return (
    <section style={{ ...container, marginTop: 96 }}>
      <SectionHead
        eyebrow="Games · Perth WA"
        title="Games near you"
        sub="Hand-picked sessions matched to your level."
        action={
          <Link href="/dashboard/games" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontWeight: 600,
            fontSize: 14, textDecoration: 'none',
          }}>See all games →</Link>
        }
      />
      <div style={{ display: 'flex', gap: 24, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'thin' }}>
        {SAMPLE_GAMES.map((g) => <GameCard key={g.id} game={g} />)}
      </div>
    </section>
  );
}

function ClubsSection() {
  return (
    <section style={{ ...container, marginTop: 96 }}>
      <SectionHead
        eyebrow="Clubs"
        title="Clubs you'll want to call home"
        sub="Premium courts, real community, and zero booking chaos."
        action={
          <Link href="/dashboard/games" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontWeight: 600,
            fontSize: 14, textDecoration: 'none',
          }}>Discover all →</Link>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
        {SAMPLE_CLUBS.slice(0, 2).map((c) => <ClubCard key={c.id} club={c} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 24 }}>
        {SAMPLE_CLUBS.slice(1, 4).map((c) => <ClubCard key={c.id + 's'} club={c} />)}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Find your level', d: 'Filter by skill, format, distance and time. We surface only games where you\'ll actually have a great hit.' },
    { n: '02', t: 'Book in seconds', d: 'Credits apply automatically. Stripe handles the rest. Server-authoritative — no double bookings, ever.' },
    { n: '03', t: 'Show up. Play. Stay.', d: 'Calendar invites, weather, court info. After play: rate partners, climb the ladder, build your home club.' },
  ];
  return (
    <section style={{ ...container, marginTop: 120 }}>
      <SectionHead eyebrow="How it works" title="Three taps from couch to court." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
        {steps.map((s) => (
          <div key={s.n} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)', padding: 28,
          }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-3)', fontSize: 12 }}>{s.n}</span>
            <h3 style={{ marginTop: 14, fontSize: 24, fontWeight: 600, color: 'var(--text)' }}>{s.t}</h3>
            <p style={{ marginTop: 10, color: 'var(--text-2)', lineHeight: 1.5 }}>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: 'I used to spend Sunday nights running my own group chat. Book A Dink fills my socials in under an hour.', n: 'Daniel K.', r: 'Club Lead, Bayswater Dinks', tone: 'navy' },
    { q: "Finally a booking experience that doesn't feel like a 2008 council website.", n: 'Priya N.', r: '3.5 player, Subiaco', tone: 'graphite' },
    { q: 'We moved 600 members onto Book A Dink in a month. Revenue is up 22%.', n: 'Marcus W.', r: 'Owner, South Metro PC', tone: 'emerald' },
    { q: 'The waitlist hold is the killer feature. I pick up half my games that way.', n: 'Eliza R.', r: '3.0 player, Fremantle', tone: 'sand' },
  ];
  return (
    <section style={{ ...container, marginTop: 120 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 56, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'sticky', top: 100 }}>
          <Eyebrow>What players say</Eyebrow>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 1.04, letterSpacing: '-0.03em', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            The home for your home club.
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Replacing scattered group chats and spreadsheets with one calm, premium experience — for players and the clubs they love.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span style={{ color: 'var(--accent)', fontSize: 16 }}>★★★★★</span>
            <span style={{ fontWeight: 600 }}>4.9</span>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>on the App Store · 2,140 reviews</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {quotes.map((t, i) => (
            <div key={i} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)', padding: 24,
            }}>
              <p style={{ color: 'var(--text)', fontSize: 16, lineHeight: 1.45, margin: 0 }}>"{t.q}"</p>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)',
              }}>
                <Avatar tone={t.tone} size={32} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{t.n}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{t.r}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CLUB_ACCESS_TIERS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'A simple way to bring your club online.',
    description: 'For small clubs getting started.',
    limits: ['Up to 3 active sessions', 'Up to 20 club members'],
    features: [
      'Club profile and presence',
      'Game discovery',
      'Create and manage sessions',
      'Player bookings',
      'Waitlist support',
      'Automatic waitlist promotion',
      'Club credits',
      'Cancellation credit workflows',
      'Member-only booking controls',
      'Member priority access',
      'Session reminders',
      'Club announcements',
      'Club chat and posts',
      'Reviews and club reputation',
      'Venue management',
      'Owner and admin tools',
    ],
  },
  {
    name: 'Starter',
    price: '$19',
    tagline: 'Start taking payments and reduce manual admin.',
    description: 'For clubs running regular paid sessions.',
    limits: ['Up to 10 active sessions', 'Up to 100 club members'],
    features: [
      'Everything in Free',
      'Paid session support',
      'Stripe payment integration',
      'Card and Apple Pay via Stripe',
      'Stripe Connect onboarding',
      'Payment setup and admin controls',
      'Payment prompts for promoted waitlisted players',
      'Higher session and member capacity',
    ],
  },
  {
    name: 'Pro',
    price: '$49',
    tagline: 'Built for clubs ready to scale with confidence.',
    description: 'For growing clubs that need advanced operations.',
    limits: ['Unlimited active sessions', 'Unlimited club members'],
    features: [
      'Everything in Starter',
      'Analytics and reporting',
      'Recurring sessions',
      'Scheduled game publishing',
      'Unlimited club growth',
      'Advanced tools for larger clubs',
    ],
    highlighted: true,
  },
];

function ClubOwnerCTA() {
  return (
    <section id="for-clubs" style={{ ...container, marginTop: 120 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-1)',
        overflow: 'hidden', display: 'grid', gridTemplateColumns: '1.1fr 1fr',
      }}>
        <div style={{ padding: 56, display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'center' }}>
          <Eyebrow>For club owners</Eyebrow>
          <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)', lineHeight: 1.04, letterSpacing: '-0.03em', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Run a club that pays for itself.
          </h2>
          <p style={{ fontSize: 16, maxWidth: 460, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
            Bookings, payments, memberships, waitlists, attendance — automated and Stripe-powered. Spend Saturdays on court, not in spreadsheets.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 4, color: 'var(--text-2)' }}>
            {[{ n: '22%', l: 'avg revenue lift' }, { n: '−9 hrs', l: 'saved per week' }, { n: '98%', l: 'fill rate' }].map((s) => (
              <div key={s.l} style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{s.n}</span>
                <span style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{s.l}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 12,
              background: 'var(--accent)', color: 'var(--accent-ink)',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid var(--accent)',
            }}>Start your club →</Link>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 22px', borderRadius: 12,
              background: 'var(--surface)', color: 'var(--text)',
              fontWeight: 600, fontSize: 15, textDecoration: 'none',
              border: '1px solid var(--border)',
            }}>How it works</Link>
          </div>
        </div>
        <Photo tone="emerald" label="Club owner · admin tools" style={{ minHeight: 420 }}>
          <div style={{
            position: 'absolute', left: 28, bottom: 28, padding: 16, width: 280,
            background: 'rgba(255,255,255,.96)', color: '#111',
            borderRadius: 14, boxShadow: '0 4px 16px rgba(0,0,0,.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>📈 This week</div>
            <div style={{ fontSize: 28, fontWeight: 600, marginTop: 8, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>$4,820</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>Stripe payouts · 142 bookings</div>
            <div className="fill-bar" style={{ marginTop: 12 }}>
              <span style={{ width: '76%', background: 'var(--accent)', display: 'block', height: '100%', borderRadius: 999 }} />
            </div>
          </div>
        </Photo>
      </div>
    </section>
  );
}

function ClubAccessPricing() {
  return (
    <section id="pricing" style={{ ...container, marginTop: 80 }}>
      <SectionHead
        eyebrow="Club Access"
        title="Plans that match how your club grows."
        sub="Start with the core club flow, add payment operations when you need them, then scale into analytics and automation."
        action={(
          <a
            href="mailto:bozokelly@gmail.com?subject=Book%20A%20Dink%20club%20access"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              padding: '12px 18px',
              borderRadius: 12,
              background: '#111',
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              textDecoration: 'none',
              border: '1px solid #111',
              whiteSpace: 'nowrap',
            }}
          >
            Contact us about club access
          </a>
        )}
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18,
        alignItems: 'stretch',
      }}>
        {CLUB_ACCESS_TIERS.map((tier) => (
          <article
            key={tier.name}
            style={{
              minHeight: '100%',
              background: tier.highlighted ? '#111' : 'var(--surface)',
              color: tier.highlighted ? '#fff' : 'var(--text)',
              border: tier.highlighted ? '1px solid #111' : '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: tier.highlighted ? 'var(--shadow-3)' : 'var(--shadow-1)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <Eyebrow>{tier.name}</Eyebrow>
              {tier.highlighted && <Pill variant="accent">Best for growth</Pill>}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontSize: 42,
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  fontWeight: 650,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {tier.price}
                </span>
                <span style={{ fontSize: 14, color: tier.highlighted ? 'rgba(255,255,255,.62)' : 'var(--text-2)' }}>
                  / month
                </span>
              </div>
              <h3 style={{ fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.02em', fontWeight: 600, margin: 0 }}>
                {tier.tagline}
              </h3>
              <p style={{
                fontSize: 14,
                lineHeight: 1.5,
                minHeight: 42,
                color: tier.highlighted ? 'rgba(255,255,255,.68)' : 'var(--text-2)',
                margin: 0,
              }}>
                {tier.description}
              </p>
            </div>

            <div style={{ height: 1, background: tier.highlighted ? 'rgba(255,255,255,.14)' : 'var(--border)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Eyebrow>Limits</Eyebrow>
              <ul style={{ display: 'grid', gap: 8, listStyle: 'none', margin: 0, padding: 0 }}>
                {tier.limits.map((limit) => (
                  <li key={limit} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 14, lineHeight: 1.35 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{limit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              <Eyebrow>Features</Eyebrow>
              <ul style={{
                display: 'grid',
                gap: 8,
                listStyle: 'none',
                margin: 0,
                padding: 0,
                color: tier.highlighted ? 'rgba(255,255,255,.82)' : 'var(--text)',
              }}>
                {tier.features.map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, lineHeight: 1.35 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AppBanner() {
  return (
    <section style={{ ...container, marginTop: 80 }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-1)',
        padding: 32, display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 24,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Eyebrow>iOS · Android coming soon</Eyebrow>
          <h3 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>The full Book A Dink, in your pocket.</h3>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4, margin: 0 }}>Instant push for waitlist holds, calendar, court directions, post-game ratings.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 12,
            background: '#111', color: '#fff',
            fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>🍎 App Store</Link>
          <Link href="/signup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 18px', borderRadius: 12,
            background: 'var(--surface)', color: 'var(--text)',
            fontWeight: 600, fontSize: 14, textDecoration: 'none',
            border: '1px solid var(--border)',
          }}>Learn more</Link>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const cols = [
    { h: 'Players', items: ['Find games', 'Find clubs', 'Memberships', 'Get the app', 'Help'] },
    { h: 'Clubs', items: ['Why Book A Dink', 'Pricing', 'Onboarding', 'Sales', 'Login'] },
    { h: 'Company', items: ['About', 'Careers', 'Press', 'Contact', 'Partners'] },
    { h: 'Legal', items: ['Terms', 'Privacy', 'Cookies', 'Refunds', 'Security'] },
  ];
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', marginTop: 80 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 18, color: 'var(--text)' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#111', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>B</span>
              Book A Dink
            </div>
            <p style={{ maxWidth: 320, fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
              Premium pickleball, beautifully booked. Discover clubs, join games, build a community — all in one place.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.h} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Eyebrow>{c.h}</Eyebrow>
              {c.items.map((i) => (
                <a key={i} href="#" style={{ fontSize: 14, color: 'var(--text-2)', textDecoration: 'none' }}>{i}</a>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--border)',
          color: 'var(--text-3)', fontSize: 12,
        }}>
          <span>© 2026 Book A Dink Pty Ltd · Perth, Western Australia</span>
          <span style={{ display: 'flex', gap: 16 }}>
            <span>Payments by Stripe</span>
            <span>·</span>
            <span>ABN 00 000 000 000</span>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { session, initialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const isLoggedIn = initialized && !!session;

  return (
    <div style={{ minHeight: '100vh' }}>
      <SiteNav session={isLoggedIn} />
      <main className="page-enter">
        <Hero session={isLoggedIn} />
        <QuickActions />
        <GamesSection />
        <ClubsSection />
        <HowItWorks />
        <Testimonials />
        <ClubOwnerCTA />
        <ClubAccessPricing />
        <AppBanner />
      </main>
      <SiteFooter />
    </div>
  );
}
