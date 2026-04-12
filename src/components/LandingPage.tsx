'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  ArrowRight, 
  Instagram, 
  MessageCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Info,
  ChevronUp,
  Mail,
  Star
} from 'lucide-react';
import { SignupCheckoutModal } from './SignupCheckoutModal';
import type { Course } from '@/types';
import { Language, Segment, translations, WHATSAPP_PHONE } from '@/types';

const HERO_IMAGE_URL = "https://www.dropbox.com/scl/fi/vmq043zpcjkehh6rsyn7n/DSC_3488.PNG?rlkey=gladkol1foebum7jcagsz1mf3&st=awo05ygo&raw=1";

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

export function LandingPage() {
  const [lang, setLang] = useState<Language>('FR');
  const [segment, setSegment] = useState<Segment>('VISIO');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [count, setCount] = useState(2496);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

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

  const activeCourses = segment === 'VISIO' ? t.courses.visio : t.courses.nantes;

  const formattedDate = new Date().toLocaleDateString(lang === 'ES' ? 'es-ES' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-brand-beige text-brand-ink font-sans selection:bg-brand-accent/20">
      {/* Top Stats Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-brand-ink/[0.03] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-3 md:py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] tracking-[0.2em] uppercase font-bold text-brand-ink/20 leading-none">Status</span>
                <span className="text-[9px] tracking-widest uppercase text-brand-accent font-bold leading-none">{lang === 'ES' ? 'al ' : 'au '} {formattedDate}</span>
              </div>
              <div className="h-10 w-px bg-brand-ink/[0.06]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-sans font-semibold leading-none tracking-tight">{count.toLocaleString()}</span>
                <span className="text-[9px] tracking-[0.15em] uppercase text-brand-ink/40 leading-none font-medium">{t.proofGiven}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-2xl font-sans font-semibold leading-none tracking-tight">180</span>
                <span className="text-[9px] tracking-[0.15em] uppercase text-brand-ink/40 leading-none font-medium">{t.proofPeople}</span>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="w-8 h-8 flex items-center justify-center bg-brand-sand/30 hover:bg-brand-sand/60 rounded-full transition-all"
                >
                  <Info size={14} className="text-brand-accent" />
                </button>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-brand-ink text-white p-4 rounded-2xl text-[11px] leading-relaxed z-50 shadow-2xl border border-white/10"
                    >
                      {t.proofTooltip}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile Layout - Refined for balance */}
          <div className="md:hidden flex justify-between items-center gap-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[7px] tracking-[0.2em] uppercase font-bold text-brand-ink/20 leading-none">Status</span>
              <span className="text-[8px] tracking-widest uppercase text-brand-accent font-bold leading-none truncate">{lang === 'ES' ? 'al ' : 'au '} {formattedDate}</span>
            </div>
            
            <div className="flex flex-col items-center gap-0.5 px-4 border-x border-brand-ink/[0.06]">
              <span className="text-lg font-sans font-semibold leading-none tracking-tight">{count.toLocaleString()}</span>
              <span className="text-[7px] tracking-[0.1em] uppercase text-brand-ink/40 leading-none font-medium text-center whitespace-nowrap">{t.proofGiven}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-lg font-sans font-semibold leading-none tracking-tight">180</span>
                <span className="text-[7px] tracking-[0.1em] uppercase text-brand-ink/40 leading-none font-medium text-center whitespace-nowrap">{t.proofPeople}</span>
              </div>
              <button 
                onClick={() => setShowTooltip(!showTooltip)}
                className="w-5 h-5 flex items-center justify-center bg-brand-sand/30 rounded-full shrink-0"
              >
                <Info size={9} className="text-brand-accent" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-6 md:pt-10 pb-24">
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

        {/* Bio Sentence - Restored placement */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-12 px-2 sm:px-4"
        >
          <p className="text-[16.5px] sm:text-lg md:text-xl font-serif leading-snug md:leading-relaxed text-brand-ink/80 max-w-md mx-auto tracking-tight">
            {t.accroche}
          </p>
        </motion.div>

        {/* Hero Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[40px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-brand-ink/[0.03] mb-16"
        >
          <div className="aspect-[4/5] relative overflow-hidden">
            <img 
              src={HERO_IMAGE_URL} 
              alt="Alejandra Mangas" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-center">
              <h1 className="text-6xl md:text-7xl font-serif italic mb-3 tracking-tighter leading-none">{t.title}</h1>
              <p className="text-[10px] tracking-[0.4em] uppercase text-brand-accent font-bold">{t.subtitle}</p>
            </div>
          </div>
          <div className="p-10 pt-0 text-center">
            <div className="flex justify-center gap-8">
              <a href="https://www.instagram.com/fit.mangas/" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center bg-brand-sand/20 rounded-full group-hover:bg-brand-sand transition-all">
                  <Instagram size={20} />
                </div>
                <span className="text-[8px] tracking-widest uppercase opacity-40">Instagram</span>
              </a>
              <a href={getWaLink(t.waMsg)} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center bg-brand-sand/20 rounded-full group-hover:bg-brand-sand transition-all">
                  <WhatsAppIcon size={20} />
                </div>
                <span className="text-[8px] tracking-widest uppercase opacity-40">WhatsApp</span>
              </a>
              <a href={`mailto:info@casamangas.fr`} className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center bg-brand-sand/20 rounded-full group-hover:bg-brand-sand transition-all">
                  <Mail size={20} />
                </div>
                <span className="text-[8px] tracking-widest uppercase opacity-40">Mail</span>
              </a>
            </div>
          </div>
        </motion.section>

        {/* Segment Toggle */}
        <div className="flex bg-brand-sand/30 p-1 rounded-full mb-12">
          <button 
            onClick={() => setSegment('VISIO')}
            className={`flex-1 py-3 rounded-full text-[10px] tracking-widest uppercase transition-all ${segment === 'VISIO' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink/40 hover:text-brand-ink'}`}
          >
            {t.segVisio}
          </button>
          <button 
            onClick={() => setSegment('NANTES')}
            className={`flex-1 py-3 rounded-full text-[10px] tracking-widest uppercase transition-all ${segment === 'NANTES' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-ink/40 hover:text-brand-ink'}`}
          >
            {t.segNantes}
          </button>
        </div>

        {/* Offers Grid */}
        <div className="space-y-12 mb-20">
          <div className="text-center space-y-3">
            <span className="text-[10px] tracking-[0.6em] uppercase text-brand-accent font-bold">{t.sectionTitle}</span>
            <div className="h-px w-12 bg-brand-accent/20 mx-auto" />
          </div>
          <div className="grid grid-cols-1 gap-10">
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
                className="group cursor-pointer bg-white rounded-[40px] border border-brand-ink/[0.03] hover:border-brand-accent/20 transition-all duration-500 overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)] flex flex-col md:flex-row"
              >
                {/* Image Section */}
                <div className="md:w-64 h-64 md:h-auto relative overflow-hidden">
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
                      <span className="bg-brand-accent text-white text-[9px] tracking-[0.2em] uppercase px-4 py-2 rounded-full font-bold shadow-xl backdrop-blur-md">
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
                          {segment === 'VISIO' ? t.visioLabel : t.nantesLabel}
                        </span>
                        <h3 className="text-2xl md:text-4xl font-serif tracking-tight text-brand-ink group-hover:text-brand-accent transition-colors duration-300 leading-none">
                          {course.title}
                        </h3>
                      </div>
                      {/* Round CTA - Hidden on mobile, moved to bottom */}
                      <div className="hidden md:flex w-14 h-14 rounded-full border border-brand-ink/5 items-center justify-center group-hover:bg-brand-accent group-hover:text-white group-hover:border-brand-accent transition-all duration-500 shadow-sm">
                        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Info Blocks */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                      <div className="p-3 md:p-4 rounded-[20px] md:rounded-3xl bg-brand-sand/10 border border-brand-ink/[0.02] flex flex-col gap-1.5 md:gap-2">
                        <ShieldCheck size={16} className="text-brand-accent/60 md:w-[18px] md:h-[18px]" />
                        <div>
                          <p className="text-[9px] md:text-[10px] tracking-wider uppercase font-bold text-brand-ink/70">Direct et Replay</p>
                          <p className="text-[8px] md:text-[9px] text-brand-ink/30 uppercase tracking-widest font-medium">Disponible</p>
                        </div>
                      </div>
                      <div className="p-3 md:p-4 rounded-[20px] md:rounded-3xl bg-brand-sand/10 border border-brand-ink/[0.02] flex flex-col gap-1.5 md:gap-2">
                        <CheckCircle2 size={16} className="text-brand-accent/60 md:w-[18px] md:h-[18px]" />
                        <div>
                          <p className="text-[9px] md:text-[10px] tracking-wider uppercase font-bold text-brand-ink/70">Bibliothèque</p>
                          <p className="text-[8px] md:text-[9px] text-brand-ink/30 uppercase tracking-widest font-medium">+ de 25h disponible</p>
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
                    
                    {/* CTA - Round button on mobile, Text on desktop */}
                    <div className="flex items-center">
                      <div className="md:hidden w-12 h-12 rounded-full bg-brand-accent text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        <ArrowRight size={20} />
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-bold text-brand-accent group-hover:gap-4 transition-all duration-300">
                        <span>{lang === 'FR' ? 'Réserver' : 'Reservar'}</span>
                        <ArrowRight size={14} />
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
            <h4 className="text-2xl md:text-3xl font-serif tracking-tight text-brand-ink mb-2">{t.helpTitle}</h4>
            <p className="text-xs text-brand-ink/40 tracking-wide leading-relaxed max-w-[240px] mx-auto">{t.helpSub}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase font-bold text-brand-accent">
            {lang === 'FR' ? 'Discuter' : 'Chatear'}
            <ArrowRight size={14} />
          </div>
        </motion.a>

        {/* Testimonials */}
        <section className="mb-32">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.4em] uppercase text-brand-accent mb-3 block font-bold">Les adhérentes alias Mangitas</span>
            <h2 className="text-4xl font-serif italic tracking-tight mb-10">{lang === 'FR' ? 'Vos retours' : 'Vuestras opiniones'}</h2>
            
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
        </footer>
      </main>

      <SignupCheckoutModal
        course={selectedCourse}
        segment={segment}
        lang={lang}
        onClose={() => setSelectedCourse(null)}
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
