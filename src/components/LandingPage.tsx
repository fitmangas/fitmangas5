'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Instagram, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronUp,
  Info,
  Mail,
  Star,
  LockKeyhole,
  UserCircle2,
} from 'lucide-react';
import { SignupCheckoutModal } from './SignupCheckoutModal';
import { ClientLoginModal } from './ClientLoginModal';
import type { Course } from '@/types';
import { Language, Segment, translations, WHATSAPP_PHONE } from '@/types';

const HERO_IMAGE_URL = "https://www.dropbox.com/scl/fi/vmq043zpcjkehh6rsyn7n/DSC_3488.PNG?rlkey=gladkol1foebum7jcagsz1mf3&st=awo05ygo&raw=1";

type VimeoShowcaseItem = {
  title: string;
  thumbnailUrl: string | null;
};

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function LandingPage({ vimeoShowcase = [] }: { vimeoShowcase?: VimeoShowcaseItem[] }) {
  const [lang, setLang] = useState<Language>('FR');
  const [segment, setSegment] = useState<Segment>('VISIO');
  const [onsiteCity, setOnsiteCity] = useState<'NANTES' | 'MEXICO'>('NANTES');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [count, setCount] = useState(2496);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // Stats animation logic
    const baseCount = 2496;
    const baseDate = new Date("2026-03-10T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.max(0, today.getTime() - baseDate.getTime());
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const targetTotal = baseCount + (daysElapsed * 3);

    let start = baseCount;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const currentCount = Math.floor(easedProgress * (targetTotal - start) + start);
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    // Scroll to top visibility
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLang = (newLang: Language) => {
    setLang(newLang);
  };

  const getWaLink = (msg: string) => {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const activeCourses =
    segment === 'VISIO'
      ? t.courses.visio
      : onsiteCity === 'NANTES'
        ? t.courses.nantes
        : t.courses.mexico;
  const onboardingCourses = [...t.courses.visio, ...t.courses.nantes];
  const fallbackPilatesCards: { title: string; imageUrl: string; level: 'Débutant' | 'Intermédiaire' | 'Expérimenté' }[] = [
    { title: 'Pilates Mat 1', imageUrl: t.courses.visio[0]?.imageUrl ?? HERO_IMAGE_URL, level: 'Débutant' },
    { title: 'Pilates Mat 2', imageUrl: t.courses.visio[1]?.imageUrl ?? HERO_IMAGE_URL, level: 'Débutant' },
    { title: 'Barre Flow Cardio', imageUrl: t.courses.nantes[0]?.imageUrl ?? HERO_IMAGE_URL, level: 'Intermédiaire' },
    { title: 'Booty Power Sculpt', imageUrl: t.courses.nantes[1]?.imageUrl ?? HERO_IMAGE_URL, level: 'Intermédiaire' },
    { title: 'Barre Sculpt', imageUrl: t.courses.visio[1]?.imageUrl ?? HERO_IMAGE_URL, level: 'Expérimenté' },
    { title: 'Barre Full Body', imageUrl: t.courses.visio[0]?.imageUrl ?? HERO_IMAGE_URL, level: 'Expérimenté' },
  ];
  const vimeoCardsWithImage = vimeoShowcase
    .filter(
      (item) =>
        typeof item.thumbnailUrl === 'string' &&
        item.thumbnailUrl.trim().length > 0 &&
        !item.thumbnailUrl.includes('default-live'),
    )
    .map((item) => ({
      title: item.title,
      imageUrl: item.thumbnailUrl as string,
    }));
  const findByKeywords = (keywords: string[]) =>
    vimeoCardsWithImage.find((item) => keywords.some((kw) => item.title.toLowerCase().includes(kw)));

  // On verrouille les vidéos au style de miniature que tu préfères (même rendu typo visuel).
  const referenceBooty = findByKeywords(['booty power sculpt']);
  const referenceFlow = findByKeywords(['barre flow cardio']);
  const referenceImages = [referenceBooty?.imageUrl, referenceFlow?.imageUrl].filter(Boolean) as string[];

  const curatedCards = [
    { level: 'Débutant' as const, video: findByKeywords(['1 mat pilates', 'pilates mat 1', 'mat 1']) },
    { level: 'Débutant' as const, video: findByKeywords(['pilates mat 2', 'pilates mat']) },
    { level: 'Intermédiaire' as const, video: findByKeywords(['booty power sculpt']) },
    { level: 'Intermédiaire' as const, video: findByKeywords(['barre flow cardio']) },
    { level: 'Expérimenté' as const, video: findByKeywords(['booty sculpt 2', 'booty sculpt']) },
    { level: 'Expérimenté' as const, video: findByKeywords(['barre/pilates flow', 'barre pilates flow']) },
  ];

  const inspirationPilatesCards =
    vimeoCardsWithImage.length > 0
      ? curatedCards.map((entry, index) => {
          const fallback = fallbackPilatesCards[index];
          const fallbackRefImage =
            referenceImages.length > 0
              ? referenceImages[index % referenceImages.length]
              : fallback.imageUrl;
          const referenceImage =
            referenceImages.length > 0
              ? referenceImages[index % referenceImages.length]
              : fallback.imageUrl;
          return {
            title: entry.video?.title ?? fallback.title,
            imageUrl: entry.video?.imageUrl ?? referenceImage ?? fallbackRefImage,
            level: entry.level,
          };
        })
      : fallbackPilatesCards;
  // Réordonne l'affichage pour obtenir des colonnes par niveau :
  // col1 = Débutant (haut+bas), col2 = Intermédiaire, col3 = Expérimenté.
  const levelByColumnCards =
    inspirationPilatesCards.length >= 6
      ? [
          inspirationPilatesCards[0],
          inspirationPilatesCards[2],
          inspirationPilatesCards[4],
          inspirationPilatesCards[1],
          inspirationPilatesCards[3],
          inspirationPilatesCards[5],
        ]
      : inspirationPilatesCards;
  return (
    <div className="min-h-screen bg-brand-beige text-brand-ink font-sans selection:bg-brand-accent/20">
      {/* Top Bar */}
      <div className="bg-white border-b border-brand-ink/[0.03] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-3 md:py-4">
          <div className="flex items-center justify-center gap-4 md:gap-5">
            <button
              type="button"
              onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
              className="inline-flex items-center rounded-full border border-brand-accent/35 bg-brand-accent px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_10px_22px_rgba(156,146,132,0.32)] transition hover:brightness-95"
            >
              Devenir membre
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition hover:border-brand-accent/40 hover:text-brand-accent"
            >
              <UserCircle2 size={14} />
              Se connecter
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-2xl md:max-w-6xl mx-auto px-6 md:px-8 pt-6 md:pt-10 pb-24">
        {/* Language Switcher */}
        <div className="flex justify-end mb-6 md:mb-12 gap-6">
          <button 
            onClick={() => toggleLang('FR')}
            className={`text-[10px] tracking-[0.3em] uppercase transition-all ${lang === 'FR' ? 'text-brand-accent font-bold border-b border-brand-accent pb-1' : 'text-brand-ink/30 hover:text-brand-ink'}`}
          >
            FR
          </button>
          <button 
            onClick={() => toggleLang('ES')}
            className={`text-[10px] tracking-[0.3em] uppercase transition-all ${lang === 'ES' ? 'text-brand-accent font-bold border-b border-brand-accent pb-1' : 'text-brand-ink/30 hover:text-brand-ink'}`}
          >
            ES
          </button>
        </div>

        {/* Hero: texte gauche + carte droite */}
        <section className="mb-28 grid grid-cols-1 items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-1 sm:px-2"
          >
            <h1 className="text-5xl md:text-7xl font-serif italic tracking-tight leading-[1.02] text-brand-ink">
              Visio Pilates
              <br />
              is your therapy
            </h1>
            <p className="mt-6 text-[1.35rem] md:text-[1.65rem] font-serif leading-[1.35] md:leading-[1.45] text-brand-ink/80 max-w-xl tracking-tight">
              J&apos;aide les femmes à se sentir fortes et bien dans leur corps, en visio depuis chez elles.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <button
                type="button"
                onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
                className="inline-flex items-center justify-center rounded-full border border-brand-accent/35 bg-brand-accent px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_22px_rgba(156,146,132,0.35)] transition hover:brightness-95"
              >
                On démarre
              </button>
              <div className="hidden h-14 w-[2px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)] md:block" />
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className="text-[14px] font-medium tracking-[0.04em] text-brand-ink/70">Rejoignez la communauté</span>
                <div className="flex w-full items-center justify-center gap-4">
                  <a
                    href={getWaLink(t.waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center text-brand-ink/70 transition hover:text-brand-accent"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon size={19} />
                  </a>
                  <a
                    href="https://www.instagram.com/fit.mangas/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center text-brand-ink/70 transition hover:text-brand-accent"
                    aria-label="Instagram"
                  >
                    <Instagram size={19} />
                  </a>
                  <a
                    href="mailto:info@casamangas.fr"
                    className="inline-flex h-8 w-8 items-center justify-center text-brand-ink/70 transition hover:text-brand-accent"
                    aria-label="Mail"
                  >
                    <Mail size={19} />
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-11 flex items-start gap-14">
              <div className="flex flex-col">
                <span className="text-5xl md:text-6xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  {count.toLocaleString()}
                </span>
                <span className="mt-3 text-[11px] md:text-[12px] uppercase tracking-[0.12em] text-brand-ink/55 font-sans font-medium">
                  Cours donnés
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-5xl md:text-6xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  180
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-[11px] md:text-[12px] uppercase tracking-[0.12em] text-brand-ink/55 font-sans font-medium">
                  Personnes / semaine
                  <span className="relative group">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-ink/20 text-[11px] text-brand-ink/60"
                      aria-label="Information"
                    >
                      <Info size={11} />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-[11px] normal-case tracking-normal text-brand-ink/75 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      Cours collectifs et individuels confondus.
                    </span>
                  </span>
                </span>
              </div>
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[40px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-brand-ink/[0.03]"
          >
            <div className="aspect-[4/5] relative overflow-hidden">
              <img
                src={HERO_IMAGE_URL}
                alt="Alejandra Mangas"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/8 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-10 text-center">
                <h1 className="text-6xl md:text-7xl font-serif font-normal italic mb-3 tracking-tighter leading-none">{t.title}</h1>
                <p className="text-[10px] tracking-[0.4em] uppercase text-brand-accent font-bold">{t.subtitle}</p>
              </div>
            </div>
            <div className="p-6 pt-0 md:p-8 md:pt-0" />
          </motion.section>
        </section>

        {/* Segment Toggle */}
        <div className="mb-8 flex rounded-full border border-brand-ink/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <button 
            onClick={() => setSegment('VISIO')}
            className={`flex-1 rounded-full py-3 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all ${
              segment === 'VISIO'
                ? 'bg-white text-brand-ink shadow-[0_6px_18px_rgba(0,0,0,0.14)]'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            {t.segVisio}
          </button>
          <button 
            onClick={() => setSegment('NANTES')}
            className={`flex-1 rounded-full py-3 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all ${
              segment === 'NANTES'
                ? 'bg-white text-brand-ink shadow-[0_6px_18px_rgba(0,0,0,0.14)]'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            {lang === 'FR' ? 'Présentiel' : 'Presencial'}
          </button>
        </div>
        {segment === 'NANTES' ? (
          <div className="mb-12 flex justify-center gap-2">
            <button
              onClick={() => setOnsiteCity('NANTES')}
              className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                onsiteCity === 'NANTES'
                  ? 'bg-brand-accent text-white shadow-sm'
                  : 'border border-brand-ink/10 bg-white text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Nantes
            </button>
            <button
              onClick={() => setOnsiteCity('MEXICO')}
              className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                onsiteCity === 'MEXICO'
                  ? 'bg-brand-accent text-white shadow-sm'
                  : 'border border-brand-ink/10 bg-white text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Mexico
            </button>
          </div>
        ) : (
          <div className="mb-12" />
        )}

        {/* Offers Grid */}
        <div className="space-y-12 mb-20">
          <div className="text-center space-y-3">
            <span className="text-[12px] tracking-[0.45em] uppercase text-brand-accent/90 font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
              {t.sectionTitle}
            </span>
            <div className="h-px w-12 bg-brand-accent/20 mx-auto" />
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {activeCourses.map((course, i) => (
              <motion.div
                key={course.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCourse(course)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedCourse(course);
                  }
                }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="group cursor-pointer bg-white rounded-[40px] border border-brand-ink/[0.03] hover:border-brand-accent/20 transition-all duration-500 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col"
              >
                {/* Image Section */}
                <div className="h-56 sm:h-64 relative overflow-hidden">
                  <img 
                    src={course.imageUrl || (course.id.includes('coll') 
                      ? "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop" 
                      : "https://images.unsplash.com/photo-1591343395902-1adcb454c2e4?q=80&w=800&auto=format&fit=crop")} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-ink/5 group-hover:bg-transparent transition-colors duration-500" />
                  {course.badge && (
                    <div className="absolute top-6 left-6">
                      <span className="bg-brand-accent text-white text-[9px] tracking-[0.2em] uppercase px-4 py-2 rounded-full font-bold shadow-xl">
                        {course.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-6 md:p-10 flex flex-col justify-between bg-white relative">
                  <div>
                    <div className="flex justify-between items-start mb-4 md:mb-8">
                      <div className="space-y-1 md:space-y-2">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-brand-accent font-bold opacity-80">
                          {segment === 'VISIO' ? t.visioLabel : `${lang === 'FR' ? 'Studio' : 'Studio'} ${onsiteCity === 'NANTES' ? 'Nantes' : 'Mexico'}`}
                        </span>
                        <h3 className="text-2xl md:text-4xl font-serif font-normal tracking-tight text-brand-ink group-hover:text-brand-accent transition-colors duration-300 leading-none">
                          {course.title}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Info Blocks */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 md:p-4 rounded-[20px] md:rounded-3xl bg-brand-sand/10 border border-brand-ink/[0.02] flex flex-col gap-1.5 md:gap-2">
                        <ShieldCheck size={16} className="text-brand-accent/60 md:w-[18px] md:h-[18px]" />
                        <div>
                          <p className="text-[9px] md:text-[10px] tracking-wider uppercase font-bold text-brand-ink/70">
                            {segment === 'VISIO' ? 'Direct et Replay' : lang === 'FR' ? 'Cours en studio' : 'Clase en estudio'}
                          </p>
                          <p className="text-[8px] md:text-[9px] text-brand-ink/30 uppercase tracking-widest font-medium">
                            {segment === 'VISIO' ? 'Disponible' : lang === 'FR' ? 'Présence sur place' : 'Presencial'}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 md:p-4 rounded-[20px] md:rounded-3xl bg-brand-sand/10 border border-brand-ink/[0.02] flex flex-col gap-1.5 md:gap-2">
                        <CheckCircle2 size={16} className="text-brand-accent/60 md:w-[18px] md:h-[18px]" />
                        <div>
                          <p className="text-[9px] md:text-[10px] tracking-wider uppercase font-bold text-brand-ink/70">
                            {segment === 'VISIO' ? 'Bibliothèque' : lang === 'FR' ? 'Places limitées' : 'Plazas limitadas'}
                          </p>
                          <p className="text-[8px] md:text-[9px] text-brand-ink/30 uppercase tracking-widest font-medium">
                            {segment === 'VISIO' ? '+ de 25h disponible' : lang === 'FR' ? 'Réservation requise' : 'Reserva requerida'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & CTA Section */}
                  <div className="mt-6 md:mt-10 pt-4 md:pt-8 border-t border-brand-ink/[0.06] flex justify-between items-end">
                    <div className="flex flex-col">
                      <span className="text-[8px] md:text-[9px] tracking-[0.3em] uppercase text-brand-ink/30 font-bold mb-1 md:mb-2">Investissement</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl md:text-4xl font-sans font-bold tracking-tighter text-brand-ink">
                          {course.price.split(' ')[0]}
                        </span>
                        <span className="text-[9px] md:text-xs tracking-widest uppercase text-brand-ink/40 font-semibold">
                          {course.price.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </div>
                    
                    {/* CTA unique */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* WhatsApp Help Card */}
        <motion.a
          href={getWaLink(t.waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white p-10 rounded-[40px] flex flex-col items-center text-center gap-6 mb-24 hover:shadow-xl transition-all border border-brand-ink/[0.03] group"
        >
          <div className="w-16 h-16 rounded-full bg-brand-sand/30 text-brand-accent flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all">
            <WhatsAppIcon size={28} />
          </div>
          <div>
            <h4 className="text-2xl md:text-3xl font-serif font-normal tracking-tight text-brand-ink mb-2">{t.helpTitle}</h4>
            <p className="text-xs text-brand-ink/40 tracking-wide leading-relaxed max-w-[240px] mx-auto">{t.helpSub}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase font-bold text-brand-accent">
            {lang === 'FR' ? 'Discuter' : 'Chatear'}
            <ArrowRight size={14} />
          </div>
        </motion.a>

        {/* Pilates styles inspiration section */}
        <section className="mb-28 rounded-[40px] border border-brand-ink/[0.04] bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] md:p-10">
          <div className="mb-7 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.2fr_1fr]">
            <h3 className="text-4xl md:text-5xl font-sans font-bold leading-[0.98] tracking-tight text-brand-ink">
              Trouve ton style
              <br />
              Pilates idéal
            </h3>
            <p className="pt-1 text-sm md:text-base text-brand-ink/60 leading-relaxed md:max-w-[430px]">
              Explore les styles de Pilates en vidéo selon tes besoins : mobilité, équilibre, relaxation et renforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {levelByColumnCards.map((card, index) => (
              <article
                key={`${card.title}-${index}`}
                className="group relative overflow-hidden rounded-[28px] border border-white/60 bg-[#f4f4f4] p-4 shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
              >
                <p className="pointer-events-none absolute left-4 top-2 text-[52px] font-black uppercase leading-none tracking-tight text-white/85 md:text-[58px]">
                  Pilates
                </p>
                <div className="relative z-10 mt-8 h-40 overflow-hidden rounded-[20px] md:h-44">
                  <img
                    src={card.imageUrl}
                    alt={card.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="relative z-10 mt-4 inline-flex items-center rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-semibold tracking-wide text-brand-ink shadow-[0_5px_14px_rgba(0,0,0,0.12)] backdrop-blur">
                  <span>{card.level}</span>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
              className="inline-flex items-center justify-center rounded-full border border-brand-accent/35 bg-brand-accent px-9 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_12px_24px_rgba(156,146,132,0.35)] transition hover:brightness-95"
            >
              On démarre
            </button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-32">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.4em] uppercase text-brand-accent mb-3 block font-bold">Les adhérentes alias Mangitas</span>
            <h2 className="text-4xl font-serif font-normal italic tracking-tight mb-10">{lang === 'FR' ? 'Vos retours' : 'Vuestras opiniones'}</h2>
            
            {/* Grouped Avatars Row - Structural inspiration from Canva */}
            <div className="flex justify-center -space-x-5 mb-6">
              {t.testimonials.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="w-20 h-20 rounded-full border-4 border-brand-sand overflow-hidden shadow-md relative"
                  style={{ zIndex: 30 - i }}
                >
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              ))}
            </div>
            <div className="flex flex-col items-center gap-1 mb-16">
              <div className="flex gap-0.5 text-brand-accent">
                {[...Array(5)].map((_, i) => <Star key={i} size={10} fill="currentColor" strokeWidth={0} />)}
              </div>
              <span className="text-[8px] tracking-[0.2em] uppercase text-brand-ink/30 font-bold">Plus de 500 avis positifs</span>
            </div>
          </div>

          {/* Testimonial Cards Grid - Structural inspiration from Canva */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {t.testimonials.map((testimonial, i) => {
              const [name, city] = testimonial.author.split(' — ');
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[32px] border border-brand-ink/[0.03] shadow-sm flex flex-col h-full hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight text-brand-ink">{name}</span>
                      <span className="text-[9px] tracking-widest uppercase text-brand-ink/30 font-medium">{city}</span>
                    </div>
                    <div className="flex gap-0.5 text-brand-accent">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={10} fill="currentColor" strokeWidth={0} />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-base md:text-lg font-serif italic leading-relaxed text-brand-ink/80 tracking-tight">
                    {testimonial.text}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center">
          <div className="h-px w-12 bg-brand-accent/30 mx-auto mb-8" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-ink/30 mb-4">
            © 2024 {t.title} Studio
          </p>
          <div className="flex justify-center gap-6 text-[10px] tracking-widest uppercase text-brand-ink/30">
            <a href="#" className="hover:text-brand-ink transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand-ink transition-colors">Terms</a>
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/login"
              aria-label="Accès administrateur"
              title="Accès administrateur"
              className="group inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-ink/10 text-brand-ink/30 transition hover:border-brand-accent/40 hover:text-brand-accent"
            >
              <LockKeyhole size={14} className="transition group-hover:scale-110" />
            </Link>
          </div>
        </footer>
      </main>

      <SignupCheckoutModal
        course={selectedCourse}
        courseOptions={onboardingCourses}
        onSelectCourse={setSelectedCourse}
        lang={lang}
        onClose={() => setSelectedCourse(null)}
      />
      <ClientLoginModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center text-brand-ink z-50 hover:bg-brand-sand transition-colors"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
