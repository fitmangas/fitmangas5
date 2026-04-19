'use client';

import { MessageCircle } from 'lucide-react';

/** Bouton WhatsApp — définir NEXT_PUBLIC_WHATSAPP_E164 (ex: 33612345678, sans +). */
export function FloatingWhatsApp() {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_E164?.replace(/\D/g, '') ?? '';
  if (!raw) return null;

  const href = `https://wa.me/${raw}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-[500] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_30px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:shadow-lg"
      aria-label="Support WhatsApp"
      title="Support WhatsApp"
    >
      <MessageCircle size={28} strokeWidth={2} aria-hidden />
    </a>
  );
}
