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
      <div className="bg-white/80 backdrop-blur-sm border-b border-brand-ink/5 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-6 py-3 flex justify-between items-center text-[10px] tracking-[0.2em] uppercase font-medium">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-brand-accent">{t.proofLabel}</span>
              <span className="text-brand-ink/40">{lang === 'ES' ? 'al ' : 'au '} {formattedDate}</span>
            </div>
            <div className="h-8 w-px bg-brand-ink/10" />
            <div className="flex flex-col">
              <span className="text-lg font-serif italic leading-none">{count.toLocaleString()}</span>
              <span className="text-brand-ink/40">{t.proofGiven}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-lg font-serif italic leading-none">150</span>
              <span className="text-brand-ink/40">{t.proofPeople}</span>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowTooltip(!showTooltip)}
                className="p-2 hover:bg-brand-sand/50 rounded-full transition-colors"
              >
                <Info size={16} className="text-brand-accent" />
              </button>
              <AnimatePresence>
                {showTooltip && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-brand-ink text-white p-3 rounded-xl text-[10px] normal-case tracking-normal z-50 shadow-xl"
                  >
                    {t.proofTooltip}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-12 pb-24">
        {/* Language Switcher */}
        <div className="flex justify-end mb-8 gap-4">
          <button 
            onClick={() => toggleLang('FR')}
            className={`text-[10px] tracking-widest uppercase transition-all ${lang === 'FR' ? 'text-brand-accent font-bold' : 'text-brand-ink/40 hover:text-brand-ink'}`}
          >
            Français
          </button>
          <button 
            onClick={() => toggleLang('ES')}
            className={`text-[10px] tracking-widest uppercase transition-all ${lang === 'ES' ? 'text-brand-accent font-bold' : 'text-brand-ink/40 hover:text-brand-ink'}`}
          >
            Español
          </button>
        </div>

        {/* Hero Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-brand-ink/5 mb-12"
        >
          <div className="aspect-[4/5] relative overflow-hidden">
            <img 
              src={HERO_IMAGE_URL} 
              alt="Alejandra Mangas" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
              <h1 className="text-5xl font-serif italic mb-2">{t.title}</h1>
              <p className="text-xs tracking-[0.3em] uppercase text-brand-accent font-medium">{t.subtitle}</p>
            </div>
          </div>
          <div className="p-8 pt-0 text-center">
            <p className="text-brand-ink/60 leading-relaxed max-w-sm mx-auto mb-8">
              {t.accroche}
            </p>
            <div className="flex justify-center gap-6">
              <a href="https://www.instagram.com/fit.mangas/" target="_blank" rel="noopener noreferrer" className="p-3 bg-brand-sand/30 rounded-full hover:bg-brand-sand transition-colors">
                <Instagram size={20} />
              </a>
              <a href={`mailto:info@casamangas.fr`} className="p-3 bg-brand-sand/30 rounded-full hover:bg-brand-sand transition-colors">
                <MessageCircle size={20} />
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
          className="bg-brand-ink text-white p-8 rounded-[32px] flex flex-col items-center text-center gap-6 mb-24 hover:opacity-90 transition-opacity"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <MessageCircle size={24} />
          </div>
          <div>
            <h4 className="text-xl font-serif italic mb-2">{t.helpTitle}</h4>
            <p className="text-xs text-white/50 tracking-wide">{t.helpSub}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold text-brand-accent">
            {lang === 'FR' ? 'Discuter' : 'Chatear'}
            <ArrowRight size={14} />
          </div>
        </motion.a>

        {/* Testimonials */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <span className="text-[10px] tracking-[0.4em] uppercase text-brand-accent mb-2 block">Community</span>
            <h2 className="text-3xl font-serif italic">{lang === 'FR' ? 'Vos retours' : 'Vuestras opiniones'}</h2>
          </div>
          <div className="space-y-8">
            {t.testimonials.map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="bg-white/50 p-8 rounded-[24px] border border-brand-ink/5"
              >
                <div className="flex gap-1 text-brand-accent mb-4">
                  {[...Array(5)].map((_, i) => <CheckCircle2 key={i} size={12} />)}
                </div>
                <p className="text-lg font-serif italic leading-relaxed mb-4 text-brand-ink/80">
                  {testimonial.text}
                </p>
                <p className="text-[10px] tracking-widest uppercase text-brand-ink/40">
                  {testimonial.author}
                </p>
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
