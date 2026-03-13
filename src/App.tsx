import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Globe, ArrowRight, Instagram, Play, Sparkles } from 'lucide-react';
import { Language, translations } from './types';
import { generatePremiumImage } from './services/geminiService';

export default function App() {
  const [lang, setLang] = useState<Language>('FR');
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
      const [hero, bg, detail] = await Promise.all([
        generatePremiumImage("Editorial fashion photography, high-end Pilates studio, minimalist aesthetic, soft natural sunlight, graceful woman in beige activewear, 16:9", "16:9"),
        generatePremiumImage("Abstract macro photography of soft silk fabric in cream and sand tones, minimalist luxury wellness texture, 16:9", "16:9"),
        generatePremiumImage("Close-up of a wooden Pilates barre, soft linen curtains, neutral tones, luxury wellness aesthetic, 1:1", "1:1")
      ]);
      
      setImages({ hero, background: bg, detail });
      setLoading(false);
    };

    loadImages();
  }, []);

  const toggleLang = () => setLang(prev => prev === 'FR' ? 'ES' : 'FR');

  return (
    <div className="min-h-screen selection:bg-brand-accent/30">
      <div className="grain" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-8 flex justify-between items-center mix-blend-difference text-white">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-serif tracking-widest uppercase italic"
        >
          L'Équilibre
        </motion.div>
        
        <div className="flex items-center gap-8">
          <button 
            onClick={toggleLang}
            className="hidden md:flex items-center gap-2 text-xs tracking-[0.2em] uppercase hover:opacity-60 transition-opacity"
          >
            <Globe size={14} />
            {lang}
          </button>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 hover:opacity-60 transition-opacity"
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
                href="#"
                className="text-4xl font-serif italic hover:text-brand-accent transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item}
              </motion.a>
            ))}
            <button onClick={toggleLang} className="mt-8 text-xs tracking-widest uppercase flex items-center gap-2">
              <Globe size={14} /> {lang === 'FR' ? 'Español' : 'Français'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col justify-center overflow-hidden">
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
                {lang === 'FR' ? 'Maison de Bien-être' : 'Casa de Bienestar'}
              </span>
              <h1 className="text-7xl md:text-[120px] text-editorial font-serif italic mb-8">
                {t.hero.title}
              </h1>
              <p className="text-lg md:text-xl max-w-md text-brand-ink/70 font-light leading-relaxed mb-12">
                {t.hero.subtitle}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6">
                <button className="group relative px-10 py-5 bg-brand-ink text-white rounded-pill overflow-hidden transition-all hover:pr-14">
                  <span className="relative z-10 text-xs tracking-widest uppercase">{t.hero.cta}</span>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all">
                    <ArrowRight size={16} />
                  </div>
                </button>
                
                <button className="flex items-center gap-4 text-xs tracking-widest uppercase hover:opacity-60 transition-opacity">
                  <div className="w-12 h-12 rounded-full border border-brand-ink/20 flex items-center justify-center">
                    <Play size={14} fill="currentColor" />
                  </div>
                  {lang === 'FR' ? 'Voir le Film' : 'Ver la Película'}
                </button>
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
                <p className="text-xs tracking-widest uppercase opacity-80 mb-2">Signature Class</p>
                <h3 className="text-2xl font-serif italic">Barre Sculpt & Flow</h3>
              </div>
            </motion.div>
            
            {/* Decorative Element */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 w-32 h-32 glass rounded-full flex items-center justify-center p-4 text-center"
            >
              <span className="text-[10px] tracking-widest uppercase font-medium">Est. 2024</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-6">
                <motion.div 
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 40 }}
                  viewport={{ once: true }}
                  className="aspect-square rounded-3xl overflow-hidden"
                >
                  <img src="https://picsum.photos/seed/studio1/600/600" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
                </motion.div>
                <motion.div 
                  whileInView={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 40 }}
                  transition={{ delay: 0.2 }}
                  viewport={{ once: true }}
                  className="aspect-square rounded-3xl overflow-hidden mt-12"
                >
                  <img src={images.detail || "https://picsum.photos/seed/studio2/600/600"} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </motion.div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <motion.div
                whileInView={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: 40 }}
                viewport={{ once: true }}
              >
                <h2 className="text-5xl md:text-6xl font-serif italic mb-8">{t.philosophy.title}</h2>
                <p className="text-xl text-brand-ink/60 leading-relaxed mb-12">
                  {t.philosophy.description}
                </p>
                <div className="h-px w-24 bg-brand-accent mb-12" />
                <div className="grid grid-cols-2 gap-12">
                  <div>
                    <h4 className="text-xs tracking-widest uppercase mb-4">Précision</h4>
                    <p className="text-sm text-brand-ink/50">Chaque mouvement est une intention, chaque souffle une connexion.</p>
                  </div>
                  <div>
                    <h4 className="text-xs tracking-widest uppercase mb-4">Élégance</h4>
                    <p className="text-sm text-brand-ink/50">La grâce n'est pas un but, c'est notre point de départ.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Classes Section - Bento Grid Style */}
      <section className="py-32 bg-brand-sand/30">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="text-xs tracking-[0.4em] uppercase text-brand-accent mb-4 block">Collection</span>
              <h2 className="text-5xl font-serif italic">{t.classes.title}</h2>
            </div>
            <a href="#" className="hidden md:flex items-center gap-2 text-xs tracking-widest uppercase group">
              {lang === 'FR' ? 'Tout voir' : 'Ver todo'}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.classes.items.map((item, i) => (
              <motion.div
                key={item.name}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 30 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group bg-white p-10 rounded-card hover:bg-brand-ink hover:text-white transition-all duration-500 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-12">
                  <span className="text-[10px] tracking-widest uppercase opacity-50">{item.duration}</span>
                  <div className="w-10 h-10 rounded-full border border-brand-ink/10 flex items-center justify-center group-hover:border-white/20">
                    <ArrowRight size={14} className="-rotate-45 group-hover:rotate-0 transition-transform duration-500" />
                  </div>
                </div>
                <h3 className="text-3xl font-serif italic mb-4">{item.name}</h3>
                <p className="text-xs tracking-widest uppercase opacity-50">{item.level}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal Section */}
      <section className="py-32 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
            <div className="max-w-xl">
              <h2 className="text-6xl md:text-8xl font-serif italic mb-8 leading-tight">
                {lang === 'FR' ? 'Le Journal de l\'Équilibre' : 'El Diario del Equilibrio'}
              </h2>
              <p className="text-xl text-brand-ink/50 font-light">
                {lang === 'FR' 
                  ? 'Pensées sur le mouvement, la nutrition consciente et l\'art de vivre avec grâce.' 
                  : 'Pensamientos sobre el movimiento, la nutrición consciente y el arte de vivir con gracia.'}
              </p>
            </div>
            <button className="text-xs tracking-[0.3em] uppercase border-b border-brand-ink/20 pb-2 hover:border-brand-ink transition-colors">
              {lang === 'FR' ? 'Lire tous les articles' : 'Leer todos los artículos'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
            {[
              { title: "L'importance du souffle", category: "Mindset", img: "https://picsum.photos/seed/breath/800/1000" },
              { title: "Rituel du matin", category: "Lifestyle", img: "https://picsum.photos/seed/morning/800/1000" },
              { title: "Postures & Alignement", category: "Technique", img: "https://picsum.photos/seed/posture/800/1000" }
            ].map((article, i) => (
              <motion.div
                key={article.title}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 40 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] mb-8 overflow-hidden rounded-2xl">
                  <img 
                    src={article.img} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-ink/0 group-hover:bg-brand-ink/10 transition-colors" />
                </div>
                <span className="text-[10px] tracking-[0.3em] uppercase text-brand-accent mb-4 block">{article.category}</span>
                <h3 className="text-3xl font-serif italic group-hover:text-brand-accent transition-colors">{article.title}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 bg-brand-ink text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
            <div className="md:col-span-2">
              <h2 className="text-4xl font-serif italic mb-8">L'Équilibre</h2>
              <p className="text-white/50 max-w-xs leading-relaxed">
                Rejoignez notre communauté et recevez nos pensées sur le mouvement et le bien-être.
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
                <li><a href="#" className="hover:text-brand-accent transition-colors">Studio</a></li>
                <li><a href="#" className="hover:text-brand-accent transition-colors">Classes</a></li>
                <li><a href="#" className="hover:text-brand-accent transition-colors">Journal</a></li>
                <li><a href="#" className="hover:text-brand-accent transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] tracking-[0.3em] uppercase opacity-30 mb-8">Social</h4>
              <div className="flex gap-6">
                <a href="#" className="hover:text-brand-accent transition-colors"><Instagram size={20} /></a>
                <a href="#" className="hover:text-brand-accent transition-colors italic font-serif">Journal</a>
              </div>
            </div>
          </div>
          
          <div className="pt-12 border-t border-white/10 flex flex-col md:row justify-between items-center gap-8">
            <p className="text-[10px] tracking-widest uppercase opacity-30">
              © 2024 L'Équilibre Studio. All rights reserved.
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
