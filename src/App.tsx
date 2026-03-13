import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, ArrowRight, Instagram, Play, Sparkles, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Language, Segment, translations, WHATSAPP_PHONE } from './types';
import { generatePremiumImage } from './services/geminiService';

export default function App() {
  const [lang, setLang] = useState<Language>('FR');
  const [segment, setSegment] = useState<Segment>('VISIO');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [images, setImages] = useState<{ [key: string]: string | null }>({
    hero: null,
    background: null,
    detail: null
  });
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    const loadImages = async () => {
      setLoading(true);
      try {
        const [hero, bg, detail] = await Promise.all([
          generatePremiumImage("Editorial fashion photography, high-end Pilates studio, minimalist aesthetic, soft natural sunlight, graceful woman in beige activewear, 16:9", "16:9"),
          generatePremiumImage("Abstract macro photography of soft silk fabric in cream and sand tones, minimalist luxury wellness texture, 16:9", "16:9"),
          generatePremiumImage("Close-up of a wooden Pilates barre, soft linen curtains, neutral tones, luxury wellness aesthetic, 1:1", "1:1")
        ]);
        setImages({ hero, background: bg, detail });
      } catch (error) {
        console.error("Image generation failed", error);
      } finally {
        setLoading(false);
      }
    };

    loadImages();
  }, []);

  const toggleLang = (newLang: Language) => {
    setLang(newLang);
    setIsMenuOpen(false);
  };

  const getWaLink = (msg: string) => {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(msg)}`;
  };

  const activeCourses = segment === 'VISIO' ? t.courses.visio : t.courses.nantes;

  return (
    <div className="min-h-screen selection:bg-brand-accent/30 bg-brand-beige">
      <div className="grain pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-between items-center mix-blend-difference text-white">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-serif tracking-widest uppercase italic cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          {t.title}
        </motion.div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => toggleLang('FR')}
              className={`text-xs tracking-[0.2em] uppercase transition-opacity ${lang === 'FR' ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-100'}`}
            >
              FR
            </button>
            <button 
              onClick={() => toggleLang('ES')}
              className={`text-xs tracking-[0.2em] uppercase transition-opacity ${lang === 'ES' ? 'opacity-100 font-bold' : 'opacity-40 hover:opacity-100'}`}
            >
              ES
            </button>
          </div>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:opacity-60 transition-opacity"
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-brand-beige flex flex-col items-center justify-center gap-8"
          >
            {['Studio', 'Classes', 'Philosophy', 'Contact'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase()}`}
                className="text-4xl font-serif italic hover:text-brand-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </motion.a>
            ))}
            <div className="flex gap-8 mt-8">
              <button onClick={() => toggleLang('FR')} className={`text-xs tracking-widest uppercase ${lang === 'FR' ? 'font-bold underline underline-offset-8' : 'opacity-50'}`}>Français</button>
              <button onClick={() => toggleLang('ES')} className={`text-xs tracking-widest uppercase ${lang === 'ES' ? 'font-bold underline underline-offset-8' : 'opacity-50'}`}>Español</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section id="studio" className="relative h-screen flex flex-col justify-center overflow-hidden">
        {/* Background Texture */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: images.background ? `url(${images.background})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-xs tracking-[0.4em] uppercase text-brand-accent mb-6 block">
                {t.subtitle}
              </span>
              <h1 className="text-7xl md:text-[120px] text-editorial font-serif italic mb-8">
                {t.title}
              </h1>
              <p className="text-lg md:text-xl max-w-md text-brand-ink/70 font-light leading-relaxed mb-12">
                {t.accroche}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <a 
                  href="#classes"
                  className="group relative px-10 py-5 bg-brand-ink text-white rounded-pill overflow-hidden transition-all hover:pr-14 text-center"
                >
                  <span className="relative z-10 text-xs tracking-widest uppercase">{lang === 'FR' ? 'Découvrir les cours' : 'Descubrir las clases'}</span>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </a>
                
                <a 
                  href={getWaLink(t.waMsg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity"
                >
                  <div className="w-12 h-12 rounded-full border border-brand-ink/20 flex items-center justify-center">
                    <MessageCircle size={14} fill="currentColor" />
                  </div>
                  {lang === 'FR' ? 'Contact WhatsApp' : 'Contacto WhatsApp'}
                </a>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 1.1, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative aspect-[3/4] rounded-[40px] overflow-hidden shadow-2xl"
            >
              {loading ? (
                <div className="absolute inset-0 bg-brand-sand animate-pulse flex items-center justify-center">
                  <Sparkles className="text-brand-accent animate-bounce" />
                </div>
              ) : (
                <img 
                  src={images.hero || 'https://picsum.photos/seed/pilates/800/1200'} 
                  alt="Hero" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/40 to-transparent" />
              
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-xs tracking-widest uppercase opacity-80 mb-2">{t.microline}</p>
                <h3 className="text-2xl font-serif italic">Barre Sculpt & Flow</h3>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Classes Section */}
      <section id="classes" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
            <div className="text-center md:text-left">
              <span className="text-xs tracking-[0.4em] uppercase text-brand-accent mb-4 block">Collection</span>
              <h2 className="text-5xl font-serif italic">{t.sectionTitle}</h2>
            </div>
            
            {/* Segment Toggle */}
            <div className="flex bg-brand-sand/30 p-1 rounded-pill">
              <button 
                onClick={() => setSegment('VISIO')}
                className={`px-8 py-3 rounded-pill text-xs tracking-widest uppercase transition-all ${segment === 'VISIO' ? 'bg-brand-ink text-white shadow-lg' : 'text-brand-ink/50 hover:text-brand-ink'}`}
              >
                {t.segVisio}
              </button>
              <button 
                onClick={() => setSegment('NANTES')}
                className={`px-8 py-3 rounded-pill text-xs tracking-widest uppercase transition-all ${segment === 'NANTES' ? 'bg-brand-ink text-white shadow-lg' : 'text-brand-ink/50 hover:text-brand-ink'}`}
              >
                {t.segNantes}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {activeCourses.map((course, i) => (
              <motion.a
                key={course.id}
                href={course.stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-brand-beige p-10 rounded-card hover:bg-brand-ink hover:text-white transition-all duration-500 flex flex-col justify-between h-[320px]"
              >
                <div>
                  <div className="flex justify-between items-start mb-8">
                    {course.badge && (
                      <span className="bg-brand-accent text-white text-[10px] tracking-widest uppercase px-3 py-1 rounded-full">
                        {course.badge}
                      </span>
                    )}
                    <div className="w-10 h-10 rounded-full border border-brand-ink/10 flex items-center justify-center group-hover:border-white/20 ml-auto">
                      <ArrowRight size={14} className="-rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                    </div>
                  </div>
                  <h3 className="text-4xl font-serif italic mb-4">{course.title}</h3>
                  <p className="text-xl font-light opacity-60">{course.price}</p>
                </div>
                
                <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase opacity-40 group-hover:opacity-80 transition-opacity">
                  <ShieldCheck size={14} />
                  {course.isUnitPay ? t.trustLine2 : t.trustLine}
                </div>
              </motion.a>
            ))}
          </div>

          {/* WhatsApp Help Card */}
          <motion.a
            href={getWaLink(t.waMsg)}
            target="_blank"
            rel="noopener noreferrer"
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
            className="mt-12 flex flex-col md:flex-row items-center justify-between bg-brand-sand/20 p-8 rounded-card border border-brand-ink/5 hover:border-brand-accent transition-colors max-w-5xl mx-auto group"
          >
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div className="w-16 h-16 rounded-full bg-brand-ink text-white flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <div>
                <h4 className="text-xl font-serif italic">{t.helpTitle}</h4>
                <p className="text-sm text-brand-ink/50">{t.helpSub}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs tracking-widest uppercase font-medium group-hover:text-brand-accent transition-colors">
              {lang === 'FR' ? 'Discuter sur WhatsApp' : 'Chatear en WhatsApp'}
              <ArrowRight size={16} />
            </div>
          </motion.a>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="philosophy" className="py-32 bg-brand-sand/10">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <span className="text-xs tracking-[0.4em] uppercase text-brand-accent mb-4 block">Testimonials</span>
            <h2 className="text-5xl md:text-6xl font-serif italic">Elles en parlent mieux que moi</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {t.testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 40 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="text-brand-accent mb-6">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-2xl font-serif italic leading-relaxed mb-8">
                  {testimonial.text}
                </p>
                <div className="h-px w-12 bg-brand-accent/30 mb-4" />
                <p className="text-xs tracking-widest uppercase text-brand-ink/50">
                  {testimonial.author}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-24 bg-brand-ink text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <h2 className="text-4xl font-serif italic mb-8">{t.title}</h2>
              <p className="text-white/50 max-w-xs leading-relaxed">
                {lang === 'FR' 
                  ? "Rejoignez notre communauté et recevez nos pensées sur le mouvement et le bien-être." 
                  : "Únete a nuestra comunidad y recibe nuestros pensamientos sobre el movimiento y el bienestar."}
              </p>
              <div className="mt-8 flex gap-4">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="bg-transparent border-b border-white/20 py-2 focus:border-white outline-none transition-colors w-full max-w-xs text-sm"
                />
                <button className="text-xs tracking-widest uppercase hover:text-brand-accent transition-colors">Join</button>
              </div>
            </div>
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-8">Navigation</h4>
              <ul className="space-y-4 text-sm tracking-wide">
                <li><a href="#studio" className="hover:text-brand-accent transition-colors">Studio</a></li>
                <li><a href="#classes" className="hover:text-brand-accent transition-colors">Classes</a></li>
                <li><a href="#philosophy" className="hover:text-brand-accent transition-colors">Philosophy</a></li>
                <li><a href="#contact" className="hover:text-brand-accent transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-8">Social</h4>
              <div className="flex gap-6">
                <a href="https://www.instagram.com/fit.mangas/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors"><Instagram size={20} /></a>
                <a href={getWaLink(t.waMsg)} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent transition-colors"><MessageCircle size={20} /></a>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] tracking-widest uppercase opacity-30">
              © 2024 {t.title} Studio. All rights reserved.
            </p>
            <div className="flex gap-8 text-[10px] tracking-widest uppercase opacity-30">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
