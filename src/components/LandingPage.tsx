'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Instagram, 
  ChevronUp,
  Info,
  Mail,
  Star,
  LockKeyhole,
  UserCircle2,
} from 'lucide-react';
import { SignupCheckoutModal } from './SignupCheckoutModal';
import { ClientLoginModal } from './ClientLoginModal';
import { OfferCardFeatures } from './landing/OfferCardFeatures';
import type { Course } from '@/types';
import { Language, Segment, translations, WHATSAPP_PHONE } from '@/types';
import { SHOW_MEXICO } from '@/lib/landing/feature-flags';
import { LANDING_HERO_IMAGE, landingOfferImageUrl } from '@/lib/landing/images';
import { SEO_PILLAR_PAGES } from '@/lib/seo-pillar-pages';

const HERO_IMAGE_URL = process.env.NEXT_PUBLIC_LANDING_HERO_IMAGE_URL || LANDING_HERO_IMAGE;

function withLocalOfferImages(courses: Course[]): Course[] {
  return courses.map((course) => ({
    ...course,
    imageUrl: landingOfferImageUrl(course.id) ?? course.imageUrl,
  }));
}
const LANDING_INSTAGRAM_URL = process.env.NEXT_PUBLIC_LANDING_INSTAGRAM_URL || 'https://www.instagram.com/fit.mangas/';
const LANDING_CONTACT_EMAIL = process.env.NEXT_PUBLIC_LANDING_CONTACT_EMAIL || 'info@casamangas.fr';

type VimeoShowcaseItem = {
  title: string;
  thumbnailUrl: string | null;
};

type BlogPreviewItem = {
  titleFr: string;
  titleEs: string | null;
  excerptFr: string | null;
  excerptEs: string | null;
  coverImageUrl: string | null;
  categoryLabelFr?: string | null;
  categoryLabelEs?: string | null;
};

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function LandingPage({
  vimeoShowcase = [],
  blogPreviews = [],
  initialLang = 'FR',
  openLoginRequired = false,
  initialOfferId,
}: {
  vimeoShowcase?: VimeoShowcaseItem[];
  blogPreviews?: BlogPreviewItem[];
  initialLang?: Language;
  openLoginRequired?: boolean;
  initialOfferId?: string;
}) {
  const [lang, setLang] = useState<Language>(initialLang);
  const [segment, setSegment] = useState<Segment>('VISIO');
  const [onsiteCity, setOnsiteCity] = useState<'NANTES' | 'MEXICO'>('NANTES');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [count, setCount] = useState(2496);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const t = translations[lang];
  const l =
    lang === 'FR'
      ? {
          member: 'Devenir membre',
          login: 'Se connecter',
          heroTitleTop: 'Visio Pilates',
          heroTitleBottom: 'est ta thérapie',
          heroBody: "J’aide les femmes à se sentir fortes et bien dans leur corps, en visio depuis chez elles.",
          start: 'On démarre',
          community: 'Rejoignez la communauté',
          liveReplay: 'Direct et Replay',
          available: 'Disponible',
          library: 'Bibliothèque',
          hoursAvailable: '+ de 25h disponible',
          studioClass: 'Cours en studio',
          onsite: 'Présence sur place',
          limitedSpots: 'Places limitées',
          bookingRequired: 'Réservation requise',
          testimonialsLabel: 'Les adhérentes alias Mangitas',
          reviews: 'Vos retours',
          positiveReviews: 'Plus de 500 avis positifs',
          blogLabel: 'Le Blog',
          blogTitle: 'Inspiration Pilates & bien-être',
          blogCta: 'S’inscrire pour accéder au blog',
          blogArticleCta: 'Réservé aux membres — S’inscrire',
          privacy: 'Confidentialité',
          terms: 'Conditions',
          proofGiven: 'Cours donnés',
          proofPeople: 'Personnes / semaine',
          proofTooltip: 'Cours collectifs et individuels confondus.',
          investment: 'Investissement',
          subscriptionLabel: 'Ton abonnement',
          sessionLabel: 'La séance',
          stylesTitleTop: 'Trouve ton style',
          stylesTitleBottom: 'Pilates idéal',
          stylesBody: 'Explore les styles de Pilates en vidéo selon tes besoins : mobilité, équilibre, relaxation et renforcement.',
          levels: {
            beginner: 'Débutant',
            intermediate: 'Intermédiaire',
            advanced: 'Expérimenté',
          },
        }
      : {
          member: 'Hacerme miembro',
          login: 'Conectarse',
          heroTitleTop: 'Visio Pilates',
          heroTitleBottom: 'es tu terapia',
          heroBody: 'Ayudo a las mujeres a sentirse fuertes y bien en su cuerpo, en clases online desde casa.',
          start: 'Empezamos',
          community: 'Únete a la comunidad',
          liveReplay: 'Directo y replay',
          available: 'Disponible',
          library: 'Biblioteca',
          hoursAvailable: '+ de 25h disponibles',
          studioClass: 'Clase en estudio',
          onsite: 'Presencial',
          limitedSpots: 'Plazas limitadas',
          bookingRequired: 'Reserva requerida',
          testimonialsLabel: 'Las alumnas alias Mangitas',
          reviews: 'Vuestras opiniones',
          positiveReviews: 'Más de 500 opiniones positivas',
          blogLabel: 'El Blog',
          blogTitle: 'Inspiración Pilates y bienestar',
          blogCta: 'Inscribirse para acceder al blog',
          blogArticleCta: 'Reservado a miembros — Inscribirse',
          privacy: 'Privacidad',
          terms: 'Condiciones',
          proofGiven: 'Clases dadas',
          proofPeople: 'Personas / semana',
          proofTooltip: 'Clases grupales e individuales combinadas.',
          investment: 'Inversión',
          subscriptionLabel: 'Tu suscripción',
          sessionLabel: 'La sesión',
          stylesTitleTop: 'Encuentra tu estilo',
          stylesTitleBottom: 'Pilates ideal',
          stylesBody: 'Explora los estilos de Pilates en video según tus necesidades: movilidad, equilibrio, relajación y fortalecimiento.',
          levels: {
            beginner: 'Principiante',
            intermediate: 'Intermedio',
            advanced: 'Avanzado',
          },
        };
  const goldCtaClass =
    'inline-flex items-center justify-center rounded-full border-2 border-[#F8C890] bg-white/80 text-brand-ink shadow-[0_8px_20px_rgba(248,200,144,0.14)] transition hover:bg-[#F8C890]/88 hover:text-white hover:shadow-[0_12px_26px_rgba(248,200,144,0.28)]';
  const visibleBlogPreviews = blogPreviews.slice(0, 3);
  const currentYear = new Date().getFullYear();

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

  const loginRequiredMessage =
    lang === 'ES'
      ? 'Conéctate para acceder a tu espacio.'
      : 'Connecte-toi pour accéder à ton espace.';

  useEffect(() => {
    if (openLoginRequired) setShowLoginModal(true);
  }, [openLoginRequired]);

  useEffect(() => {
    if (!SHOW_MEXICO && onsiteCity === 'MEXICO') setOnsiteCity('NANTES');
  }, [onsiteCity]);

  const toggleLang = (newLang: Language) => {
    setLang(newLang);
  };

  const getWaLink = (msg: string) => {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  function offerCardTitle(course: Course): React.ReactNode {
    if (course.id === 'v-coll') {
      const main = lang === 'FR' ? 'Visio collectif' : 'Visio colectivo';
      const suffix = lang === 'FR' ? '8 cours/mois' : '8 cursos/mes';
      return (
        <>
          {main}{' '}
          <span className="text-xl font-normal text-brand-ink/75 md:text-2xl">— {suffix}</span>
        </>
      );
    }
    if (course.id === 'v-ind') {
      const main = lang === 'FR' ? 'Visio individuel' : 'Visio individual';
      const suffix = lang === 'FR' ? '5 cours/mois' : '5 cursos/mes';
      return (
        <>
          {main}{' '}
          <span className="text-xl font-normal text-brand-ink/75 md:text-2xl">— {suffix}</span>
        </>
      );
    }
    return course.title;
  }

  const activeCourses = withLocalOfferImages(
    segment === 'VISIO'
      ? t.courses.visio
      : onsiteCity === 'NANTES'
        ? t.courses.nantes
        : t.courses.mexico,
  );
  const onboardingCourses = withLocalOfferImages([...t.courses.visio, ...t.courses.nantes]);

  useEffect(() => {
    if (!initialOfferId) return;
    const match =
      onboardingCourses.find((c) => c.id === initialOfferId) ??
      withLocalOfferImages([...t.courses.visio, ...t.courses.nantes, ...t.courses.mexico]).find((c) => c.id === initialOfferId);
    if (match) setSelectedCourse(match);
  }, [initialOfferId, lang]);
  const fallbackPilatesCards: { title: string; imageUrl: string; level: string }[] = [
    { title: 'Pilates Mat 1', imageUrl: t.courses.visio[0]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.beginner },
    { title: 'Pilates Mat 2', imageUrl: t.courses.visio[1]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.beginner },
    { title: 'Barre Flow Cardio', imageUrl: t.courses.nantes[0]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.intermediate },
    { title: 'Booty Power Sculpt', imageUrl: t.courses.nantes[1]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.intermediate },
    { title: 'Barre Sculpt', imageUrl: t.courses.visio[1]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.advanced },
    { title: 'Barre Full Body', imageUrl: t.courses.visio[0]?.imageUrl ?? HERO_IMAGE_URL, level: l.levels.advanced },
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
    { level: l.levels.beginner, video: findByKeywords(['1 mat pilates', 'pilates mat 1', 'mat 1']) },
    { level: l.levels.beginner, video: findByKeywords(['pilates mat 2', 'pilates mat']) },
    { level: l.levels.intermediate, video: findByKeywords(['booty power sculpt']) },
    { level: l.levels.intermediate, video: findByKeywords(['barre flow cardio']) },
    { level: l.levels.advanced, video: findByKeywords(['booty sculpt 2', 'booty sculpt']) },
    { level: l.levels.advanced, video: findByKeywords(['barre/pilates flow', 'barre pilates flow']) },
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
    <div className="min-h-screen overflow-x-clip bg-brand-beige text-brand-ink font-sans selection:bg-brand-accent/20">
      {/* Top Bar */}
      <div className="bg-white border-b border-brand-ink/[0.03] sticky top-0 z-50">
        <div className="relative mx-auto max-w-6xl px-5 py-3 md:px-10 md:py-4">
          <div className="flex items-center justify-center gap-4 md:gap-5">
            <button
              type="button"
              onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
              className={`${goldCtaClass} border-[#c45d3e] px-5 py-2 text-[10px] font-bold uppercase tracking-[0.18em]`}
            >
              {l.member}
            </button>
            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-brand-ink/15 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-ink/75 shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition hover:border-[#F8C890] hover:bg-[#F8C890]/88 hover:text-white hover:shadow-[0_12px_26px_rgba(248,200,144,0.28)]"
            >
              <UserCircle2 size={14} />
              {l.login}
            </button>
          </div>
          <div className="absolute right-4 top-1/2 hidden -translate-y-1/2 items-center gap-5 md:flex md:right-10">
            <button
              type="button"
              onClick={() => toggleLang('FR')}
              className={`text-[10px] tracking-[0.3em] uppercase transition-all ${
                lang === 'FR'
                  ? 'text-brand-accent font-bold border-b border-[#F5C58D] pb-1'
                  : 'text-brand-ink/30 hover:text-brand-ink'
              }`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => toggleLang('ES')}
              className={`text-[10px] tracking-[0.3em] uppercase transition-all ${
                lang === 'ES'
                  ? 'text-brand-accent font-bold border-b border-[#F5C58D] pb-1'
                  : 'text-brand-ink/30 hover:text-brand-ink'
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-2xl overflow-x-clip px-5 pb-24 pt-1 md:max-w-6xl md:px-8 md:pt-10">
        <div className="mb-2 flex justify-end gap-6 md:mb-6 md:hidden">
          <button 
            onClick={() => toggleLang('FR')}
            className={`text-[10px] tracking-[0.3em] uppercase transition-all ${lang === 'FR' ? 'text-brand-accent font-bold border-b border-[#F5C58D] pb-1' : 'text-brand-ink/30 hover:text-brand-ink'}`}
          >
            FR
          </button>
          <button 
            onClick={() => toggleLang('ES')}
            className={`text-[10px] tracking-[0.3em] uppercase transition-all ${lang === 'ES' ? 'text-brand-accent font-bold border-b border-[#F5C58D] pb-1' : 'text-brand-ink/30 hover:text-brand-ink'}`}
          >
            ES
          </button>
        </div>

        {/* Hero: texte gauche + carte droite */}
        <section className="mb-16 grid grid-cols-1 items-center gap-6 md:mb-28 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center md:items-start md:text-left"
          >
            <div className="flex flex-col items-center md:flex-col md:items-start md:gap-0">
              <Image
                src="/logo.png"
                alt="Logo FitMangas"
                width={58}
                height={58}
                priority
                className="mb-3 h-14 w-14 shrink-0 object-contain md:mb-5 md:h-14 md:w-14"
              />
              <h1 className="min-w-0 font-serif italic leading-[1.12] tracking-tight text-brand-ink text-[2.125rem] md:flex-none md:text-7xl md:leading-[1.02]">
                {l.heroTitleTop}
                <br />
                {l.heroTitleBottom}
              </h1>
            </div>
            <p className="mt-3 max-w-[22rem] text-[0.875rem] font-serif leading-[1.5] tracking-tight text-brand-ink/70 md:mt-6 md:max-w-xl md:text-[1.65rem] md:leading-[1.45] md:text-brand-ink/80">
              {l.heroBody}
            </p>

            {/* Bouton principal — pleine largeur sur mobile, terracotta plein */}
            <button
              type="button"
              onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
              className="btn-luxury-primary mt-6 w-full px-8 py-4 text-[12px] font-bold uppercase tracking-[0.2em] md:!hidden"
            >
              {l.start}
            </button>

            {/* Encadré stats — mobile : un seul cadre arrondi, 2 colonnes + séparateur */}
            <div className="mt-5 flex w-full items-stretch rounded-2xl border border-brand-ink/[0.06] bg-white/60 py-4 shadow-[0_4px_16px_rgba(0,0,0,0.03)] md:hidden">
              <div className="flex flex-1 flex-col items-center px-2">
                <span className="text-2xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  {count.toLocaleString()}
                </span>
                <span className="mt-1.5 text-[9px] font-sans font-medium uppercase tracking-[0.1em] text-brand-ink/50">
                  {l.proofGiven}
                </span>
              </div>
              <div className="my-1 w-px shrink-0 bg-brand-ink/10" />
              <div className="flex flex-1 flex-col items-center px-2">
                <span className="text-2xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  180
                </span>
                <span className="mt-1.5 inline-flex items-center justify-center gap-1 text-[9px] font-sans font-medium uppercase tracking-[0.1em] text-brand-ink/50">
                  {l.proofPeople}
                  <span className="relative group">
                    <span
                      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-brand-ink/20 text-[9px] text-brand-ink/60"
                      aria-label="Information"
                    >
                      <Info className="size-2" />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-[11px] normal-case tracking-normal text-brand-ink/75 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {l.proofTooltip}
                    </span>
                  </span>
                </span>
              </div>
            </div>

            {/* Bouton + communauté + stats — version DESKTOP inchangée */}
            <div className="mt-9 hidden flex-wrap items-center gap-6 md:flex">
              <button
                type="button"
                onClick={() => setSelectedCourse(t.courses.visio[0] ?? null)}
                className="btn-luxury-primary shrink-0 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em]"
              >
                {l.start}
              </button>
              <div className="h-14 w-[2px] rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
              <div className="flex flex-col items-center gap-1 text-center">
                <span className="text-[14px] font-medium tracking-[0.04em] text-brand-ink/70">{l.community}</span>
                <div className="flex items-center justify-center gap-4">
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
                    href={LANDING_INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center text-brand-ink/70 transition hover:text-brand-accent"
                    aria-label="Instagram"
                  >
                    <Instagram className="size-[19px]" />
                  </a>
                  <a
                    href={`mailto:${LANDING_CONTACT_EMAIL}`}
                    className="inline-flex h-8 w-8 items-center justify-center text-brand-ink/70 transition hover:text-brand-accent"
                    aria-label="Mail"
                  >
                    <Mail className="size-[19px]" />
                  </a>
                </div>
              </div>
            </div>
            <div className="mt-11 hidden items-start gap-14 md:flex">
              <div className="flex flex-col items-start">
                <span className="text-6xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  {count.toLocaleString()}
                </span>
                <span className="mt-3 text-[12px] font-sans font-medium uppercase tracking-[0.12em] text-brand-ink/55">
                  {l.proofGiven}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-6xl font-sans font-black leading-none tracking-[-0.02em] text-brand-ink">
                  180
                </span>
                <span className="mt-3 inline-flex items-center justify-start gap-2 text-[12px] font-sans font-medium uppercase tracking-[0.12em] text-brand-ink/55">
                  {l.proofPeople}
                  <span className="relative group">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-brand-ink/20 text-[11px] text-brand-ink/60"
                      aria-label="Information"
                    >
                      <Info className="size-[11px]" />
                    </span>
                    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-60 -translate-x-1/2 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 text-[11px] normal-case tracking-normal text-brand-ink/75 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                      {l.proofTooltip}
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
            className="overflow-hidden rounded-[32px] border border-brand-ink/[0.03] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] md:rounded-[40px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={HERO_IMAGE_URL}
                alt="Alejandra Mangas"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/8 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-7 pt-10 text-center md:p-10">
                <h2 className="mb-3 break-words font-serif text-4xl font-normal italic leading-none tracking-tighter sm:text-5xl md:text-7xl">{t.title}</h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-accent sm:tracking-[0.4em]">{t.subtitle}</p>
                <div className="mt-3 flex items-center justify-center gap-5 md:hidden">
                  <a
                    href={getWaLink(t.waMsg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center text-[#b35338] drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] transition hover:text-[#c45d3e]"
                    aria-label="WhatsApp"
                  >
                    <WhatsAppIcon size={18} />
                  </a>
                  <a
                    href={LANDING_INSTAGRAM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 w-9 items-center justify-center text-[#b35338] drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] transition hover:text-[#c45d3e]"
                    aria-label="Instagram"
                  >
                    <Instagram className="size-[18px]" />
                  </a>
                  <a
                    href={`mailto:${LANDING_CONTACT_EMAIL}`}
                    className="inline-flex h-9 w-9 items-center justify-center text-[#b35338] drop-shadow-[0_1px_3px_rgba(255,255,255,0.95)] transition hover:text-[#c45d3e]"
                    aria-label="Mail"
                  >
                    <Mail className="size-[18px]" />
                  </a>
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 md:p-8 md:pt-0" />
          </motion.section>
        </section>

        <section id="offers" className="scroll-mt-24">
        {/* Segment Toggle — même terracotta que « On démarre » */}
        <div className="mb-4 flex rounded-full border border-brand-ink/10 bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          <button 
            onClick={() => setSegment('VISIO')}
            className={`flex-1 rounded-full py-3 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all ${
              segment === 'VISIO'
                ? 'bg-[#c45d3e] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            {t.segVisio}
          </button>
          <button 
            onClick={() => setSegment('NANTES')}
            className={`flex-1 rounded-full py-3 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all ${
              segment === 'NANTES'
                ? 'bg-[#c45d3e] text-[#FFF8F0] shadow-[0_6px_18px_rgba(196,93,62,0.35)]'
                : 'text-brand-ink/60 hover:text-brand-ink'
            }`}
          >
            {lang === 'FR' ? 'Présentiel' : 'Presencial'}
          </button>
        </div>
        {segment === 'VISIO' ? (
          <div className="mb-10 text-center">
            <Link
              href="/cours-pilates-visio"
              className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c45d3e] underline-offset-4 transition hover:underline"
            >
              {lang === 'ES' ? '¿Por qué hacer Pilates en visio?' : 'Pourquoi faire du Pilates en visio ?'}
            </Link>
          </div>
        ) : null}
        {segment === 'NANTES' ? (
          <div className="mb-12 flex justify-center gap-2">
            <button
              onClick={() => setOnsiteCity('NANTES')}
              className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                onsiteCity === 'NANTES'
                  ? 'bg-[#c45d3e] text-white shadow-sm'
                  : 'border border-brand-ink/10 bg-white text-brand-ink/60 hover:text-brand-ink'
              }`}
            >
              Nantes
            </button>
            {SHOW_MEXICO ? (
              <button
                onClick={() => setOnsiteCity('MEXICO')}
                className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  onsiteCity === 'MEXICO'
                    ? 'bg-[#c45d3e] text-white shadow-sm'
                    : 'border border-brand-ink/10 bg-white text-brand-ink/60 hover:text-brand-ink'
                }`}
              >
                Mexico
              </button>
            ) : null}
          </div>
        ) : segment === 'VISIO' ? null : (
          <div className="mb-12" />
        )}

        {/* Offers Grid */}
        <div className="space-y-12 mb-20">
          <div className="text-center space-y-3">
            <span className="text-[12px] tracking-[0.2em] sm:tracking-[0.45em] uppercase text-brand-accent/90 font-semibold drop-shadow-[0_1px_1px_rgba(0,0,0,0.18)]">
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
                <div className="relative h-56 overflow-hidden sm:h-64">
                  <Image
                    src={course.imageUrl || '/landing/offer-v-coll.jpg'}
                    alt={course.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-ink/5 group-hover:bg-transparent transition-colors duration-500" />
                  {course.badge && (
                    <div className="absolute top-6 left-6">
                      <span className="rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-xl">
                        {course.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col bg-white p-6 md:p-10">
                  <div className="mb-4 md:mb-6">
                    {segment !== 'VISIO' ? (
                      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-brand-accent/80">
                        {`${lang === 'FR' ? 'Studio' : 'Studio'} ${onsiteCity === 'NANTES' ? 'Nantes' : 'Mexico'}`}
                      </span>
                    ) : null}
                    <h3 className="font-serif text-2xl font-normal leading-none tracking-tight text-brand-ink transition-colors duration-300 group-hover:text-brand-accent md:text-4xl">
                      {offerCardTitle(course)}
                    </h3>
                    {segment === 'VISIO' && course.id === 'v-ind' ? (
                      <p className="mt-2 text-sm leading-snug text-brand-ink/65 md:text-base">
                        {t.visioIndividuelCollectifExtra}
                      </p>
                    ) : null}
                  </div>

                  <OfferCardFeatures
                    course={course}
                    lang={lang}
                    onsiteCityLabel={onsiteCity === 'NANTES' ? 'Nantes' : 'Mexico'}
                  />

                  {/* Price & CTA Section */}
                  <div className="mt-5 flex items-end justify-between border-t border-brand-ink/[0.06] pt-4">
                    <div className="flex flex-col">
                      <span className="mb-1 text-[8px] font-bold uppercase tracking-[0.3em] text-brand-ink/30 md:mb-2 md:text-[9px]">
                        {segment === 'VISIO' ? l.subscriptionLabel : l.sessionLabel}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-sans font-bold tracking-tighter text-brand-ink md:text-4xl">
                          {course.price.split(' ')[0]}
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-brand-ink/40 md:text-xs">
                          {course.price.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#c45d3e_0%,#b35338_100%)] text-white shadow-lg transition-transform active:scale-95">
                        <ArrowRight size={20} className="text-white" strokeWidth={2} aria-hidden />
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
        </section>

        {/* Pilates styles inspiration section */}
        <section className="mb-28 rounded-[40px] border border-brand-ink/[0.04] bg-white p-6 shadow-[0_14px_40px_rgba(0,0,0,0.06)] md:p-10">
          <div className="mb-7 grid grid-cols-1 items-start gap-5 md:grid-cols-[1.2fr_1fr]">
            <h3 className="text-4xl md:text-5xl font-sans font-bold leading-[0.98] tracking-tight text-brand-ink">
              {l.stylesTitleTop}
              <br />
              {l.stylesTitleBottom}
            </h3>
            <p className="pt-1 text-sm md:text-base text-brand-ink/60 leading-relaxed md:max-w-[430px]">
              {l.stylesBody}
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
              className={`${goldCtaClass} px-9 py-3.5 text-[12px] font-bold uppercase tracking-[0.2em]`}
            >
              {l.start}
            </button>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-32">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.4em] uppercase text-brand-accent mb-3 block font-bold">{l.testimonialsLabel}</span>
            <h2 className="text-4xl font-serif font-normal italic tracking-tight mb-10">{l.reviews}</h2>
            
            {/* Grouped Avatars Row - Structural inspiration from Canva */}
            <div className="flex justify-center -space-x-5 mb-6 overflow-x-clip px-2">
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
              <span className="text-[8px] tracking-[0.2em] uppercase text-brand-ink/30 font-bold">{l.positiveReviews}</span>
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

        {visibleBlogPreviews.length > 0 ? (
          <section className="py-16 md:py-24">
            <div className="mb-10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">{l.blogLabel}</p>
              <h2 className="mt-3 font-serif text-4xl italic text-brand-ink">
                {l.blogTitle}
              </h2>
            </div>
            <div
              className={`grid gap-5 ${
                visibleBlogPreviews.length === 1
                  ? 'mx-auto max-w-sm'
                  : visibleBlogPreviews.length === 2
                    ? 'mx-auto max-w-3xl md:grid-cols-2'
                    : 'md:grid-cols-3'
              }`}
            >
              {visibleBlogPreviews.map((article) => {
                const title = lang === 'ES' ? article.titleEs?.trim() || article.titleFr : article.titleFr;
                const excerpt = lang === 'ES' ? article.excerptEs?.trim() || article.excerptFr : article.excerptFr;
                const categoryLabel = lang === 'ES' ? article.categoryLabelEs || article.categoryLabelFr : article.categoryLabelFr;
                return (
                <button
                  key={article.titleFr}
                  type="button"
                  onClick={() => setSelectedCourse(onboardingCourses.find((course) => course.id === 'v-coll') ?? onboardingCourses[0] ?? null)}
                  className="group overflow-hidden rounded-[28px] border border-brand-ink/[0.06] bg-white/70 text-left shadow-[0_18px_50px_rgba(48,35,28,0.08)] transition hover:-translate-y-1"
                >
                  <img src={article.coverImageUrl ?? HERO_IMAGE_URL} alt="" className="h-40 w-full object-cover opacity-90 transition group-hover:scale-[1.03]" />
                  <div className="p-5">
                    {categoryLabel ? (
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent/80">{categoryLabel}</p>
                    ) : null}
                    <h3 className="font-serif text-xl italic text-brand-ink">{title}</h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-ink/55">{excerpt}</p>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-accent">{l.blogArticleCta}</p>
                  </div>
                </button>
              );
              })}
            </div>
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setSelectedCourse(onboardingCourses.find((course) => course.id === 'v-coll') ?? onboardingCourses[0] ?? null)}
                className={`${goldCtaClass} px-7 py-4 text-[10px] font-bold uppercase tracking-[0.24em]`}
              >
                {l.blogCta}
              </button>
            </div>
          </section>
        ) : null}

        <section className="py-12 md:py-16">
          <div className="mb-8 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-brand-accent">
              {lang === 'ES' ? 'Guías Pilates' : 'Guides Pilates'}
            </p>
            <h2 className="mt-3 font-serif text-3xl italic text-brand-ink md:text-4xl">
              {lang === 'ES' ? 'Practicar mejor desde casa' : 'Mieux pratiquer depuis chez soi'}
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {SEO_PILLAR_PAGES.map((pillar) => (
              <Link
                key={pillar.slug}
                href={`/${pillar.slug}`}
                className="rounded-[28px] border border-brand-ink/[0.06] bg-white/65 p-5 text-left shadow-[0_18px_50px_rgba(48,35,28,0.07)] transition hover:-translate-y-1 hover:bg-white/85"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-brand-accent/80">
                  {lang === 'ES' ? 'Guía esencial' : 'Guide essentiel'}
                </p>
                <h3 className="mt-2 font-serif text-xl italic text-brand-ink">{pillar.shortTitle}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-brand-ink/55">{pillar.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center">
          <div className="h-px w-12 bg-brand-accent/30 mx-auto mb-8" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-brand-ink/30 mb-4">
            © {currentYear} {t.title} Studio
          </p>
          <div className="flex justify-center gap-6 text-[10px] tracking-widest uppercase text-brand-ink/30">
            <Link href="/privacy" className="hover:text-brand-ink transition-colors">{l.privacy}</Link>
            <Link href="/terms" className="hover:text-brand-ink transition-colors">{l.terms}</Link>
          </div>
          <div className="mt-6 flex justify-center">
            <Link
              href="/connexion"
              aria-label={lang === 'ES' ? 'Acceso cliente' : 'Espace client'}
              title={lang === 'ES' ? 'Acceso cliente' : 'Espace client'}
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
      <ClientLoginModal
        open={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        lang={lang}
        loginRequiredMessage={openLoginRequired ? loginRequiredMessage : undefined}
      />

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
