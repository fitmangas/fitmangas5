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
  ChevronUp
} from 'lucide-react';
import { Language, Segment, translations, WHATSAPP_PHONE } from './types';

const HERO_IMAGE_URL = "https://www.dropbox.com/scl/fi/vmq043zpcjkehh6rsyn7n/DSC_3488.PNG?rlkey=gladkol1foebum7jcagsz1mf3&st=awo05ygo&raw=1";

export default function App() {
  const [lang, setLang] = useState<Language>('FR');
  const [segment, setSegment] = useState<Segment>('VISIO');
  const [showTooltip, setShowTooltip] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [count, setCount] = useState(2496);

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
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[9px] tracking-[0.3em] uppercase font-bold text-brand-accent leading-none">{t.proofLabel}</span>
              <span className="text-[9px] tracking-widest uppercase text-brand-ink/30 leading-none">{lang === 'ES' ? 'al ' : 'au '} {formattedDate}</span>
            </div>
            <div className="h-10 w-px bg-brand-ink/[0.06]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-2xl font-serif italic leading-none tracking-tighter">{count.toLocaleString()}</span>
              <span className="text-[9px] tracking-[0.15em] uppercase text-brand-ink/40 leading-none">{t.proofGiven}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden sm:flex flex-col items-end gap-0.5">
              <span className="text-2xl font-serif italic leading-none tracking-tighter">150</span>
              <span className="text-[9px] tracking-[0.15em] uppercase text-brand-ink/40 leading-none">{t.proofPeople}</span>
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
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-10 pb-24">
        {/* Language Switcher */}
        <div className="flex justify-end mb-12 gap-6">
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
          className="text-center mb-12 px-4"
        >
          <p className="text-lg md:text-xl font-serif italic leading-relaxed text-brand-ink/70 max-w-md mx-auto">
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
              <a href={`mailto:info@casamangas.fr`} className="group flex flex-col items-center gap-2">
                <div className="w-12 h-12 flex items-center justify-center bg-brand-sand/20 rounded-full group-hover:bg-brand-sand transition-all">
                  <MessageCircle size={20} />
                </div>
                <span className="text-[8px] tracking-widest uppercase opacity-40">Contact</span>
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
        <div className="space-y-6 mb-12">
          <h2 className="text-xs tracking-[0.4em] uppercase text-brand-accent text-center mb-8">{t.sectionTitle}</h2>
          <div className="grid grid-cols-1 gap-6">
            {activeCourses.map((course, i) => (
              <motion.a
                key={course.id}
                href={course.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white p-8 rounded-[24px] border border-brand-ink/5 hover:border-brand-accent transition-all flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-serif italic">{course.title}</h3>
                    {course.badge && (
                      <span className="bg-brand-accent/10 text-brand-accent text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full">
                        {course.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-ink/40 tracking-wider">{course.price}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-sand/20 flex items-center justify-center group-hover:bg-brand-accent group-hover:text-white transition-all">
                  <ArrowRight size={16} />
                </div>
              </motion.a>
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
            <MessageCircle size={28} />
          </div>
          <div>
            <h4 className="text-2xl font-serif italic mb-2">{t.helpTitle}</h4>
            <p className="text-xs text-brand-ink/40 tracking-wide leading-relaxed max-w-[240px] mx-auto">{t.helpSub}</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] tracking-[0.2em] uppercase font-bold text-brand-accent">
            {lang === 'FR' ? 'Discuter' : 'Chatear'}
            <ArrowRight size={14} />
          </div>
        </motion.a>

        {/* Testimonials */}
        <section className="mb-32">
          <div className="text-center mb-16">
            <span className="text-[10px] tracking-[0.4em] uppercase text-brand-accent mb-3 block font-bold">Community</span>
            <h2 className="text-4xl font-serif italic tracking-tight">{lang === 'FR' ? 'Vos retours' : 'Vuestras opiniones'}</h2>
          </div>
          <div className="space-y-12">
            {t.testimonials.map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden mb-6 border-4 border-white shadow-md">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.author} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex gap-1 text-brand-accent mb-6">
                  {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={12} fill="currentColor" />)}
                </div>
                <p className="text-2xl font-serif italic leading-relaxed mb-6 text-brand-ink/80 max-w-lg">
                  {testimonial.text}
                </p>
                <div className="flex flex-col items-center gap-1">
                  <div className="h-px w-8 bg-brand-accent/30 mb-2" />
                  <p className="text-[10px] tracking-[0.2em] uppercase text-brand-ink/40 font-bold">
                    {testimonial.author}
                  </p>
                </div>
              </motion.div>
            ))}
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
