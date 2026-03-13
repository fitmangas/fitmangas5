export type Language = 'FR' | 'ES';
export type Segment = 'VISIO' | 'NANTES';

export interface Testimonial {
  text: string;
  author: string;
}

export interface Course {
  id: string;
  title: string;
  price: string;
  badge?: string;
  stripeUrl: string;
  isUnitPay?: boolean;
}

export interface Content {
  title: string;
  subtitle: string;
  accroche: string;
  microline: string;
  segVisio: string;
  segNantes: string;
  sectionTitle: string;
  trustLine: string;
  trustLine2: string;
  helpTitle: string;
  helpSub: string;
  waMsg: string;
  testimonials: Testimonial[];
  courses: {
    visio: Course[];
    nantes: Course[];
  };
}

export const STRIPE_LINKS = {
  visioCollectif: "https://buy.stripe.com/bJe7sL98Sdzla4af2L9bO00",
  visioIndividuel: "https://buy.stripe.com/cNicN50Cm9j56RY5sb9bO04",
  nantesCollectif: "https://buy.stripe.com/28E7sL0CmeDp906bQz9bO05",
  nantesIndividuel: "https://buy.stripe.com/aFa8wP1Gq7aX3FM9Ir9bO03",
};

export const WHATSAPP_PHONE = "33784835972";

export const translations: Record<Language, Content> = {
  FR: {
    title: "Alejandra",
    subtitle: "Barre & Pilates en visio",
    accroche: "J’aide les femmes à se sentir fortes et bien dans leur corps, en visio depuis chez elles. 👇",
    microline: "Réserve en 30 secondes.",
    segVisio: "Visio",
    segNantes: "Nantes",
    sectionTitle: "Choisis ton cours",
    trustLine: "Paiement sécurisé • Abonnements gérés par Stripe",
    trustLine2: "Paiement sécurisé • Confirmation immédiate",
    helpTitle: "Je t’aide à choisir (WhatsApp)",
    helpSub: "Conseil rapide et gratuit",
    waMsg: "Bonjour Alejandra, je viens d’Instagram. Peux-tu m’aider à choisir mon cours ? Objectif : ____ / Niveau : ____ / Dispos : ____",
    testimonials: [
      { text: "“Séances fluides, efficaces et agréables.”", author: "Karla — Mexico" },
      { text: "“Un accompagnement premium qui change tout.”", author: "Léa — Nantes" },
      { text: "“Le Pilates à la maison n’a jamais été aussi motivant.”", author: "Mélodie — Pornic" }
    ],
    courses: {
      visio: [
        { id: 'v-coll', title: "Visio collectif", price: "39€ / mois", badge: "7 jours gratuits", stripeUrl: STRIPE_LINKS.visioCollectif },
        { id: 'v-ind', title: "Visio individuel", price: "269€ / mois", stripeUrl: STRIPE_LINKS.visioIndividuel }
      ],
      nantes: [
        { id: 'n-coll', title: "Nantes collectif", price: "10€ / séance", isUnitPay: true, stripeUrl: STRIPE_LINKS.nantesCollectif },
        { id: 'n-ind', title: "Nantes individuel", price: "50€ / séance", isUnitPay: true, stripeUrl: STRIPE_LINKS.nantesIndividuel }
      ]
    }
  },
  ES: {
    title: "Alejandra",
    subtitle: "Barre & Pilates online",
    accroche: "Ayudo a las mujeres a sentirse fuertes y bien en su cuerpo, en clases online desde casa. 👇",
    microline: "Reserva en 30 segundos.",
    segVisio: "Online",
    segNantes: "Nantes",
    sectionTitle: "Elige tu clase",
    trustLine: "Pago seguro • Suscripciones gestionadas por Stripe",
    trustLine2: "Pago seguro • Confirmación inmediata",
    helpTitle: "Te ayudo a elegir (WhatsApp)",
    helpSub: "Consejo rápido y gratis",
    waMsg: "Hola Alejandra, vengo de Instagram. ¿Me ayudas a elegir mi clase? Objetivo: ____ / Nivel: ____ / Disponibilidad: ____",
    testimonials: [
      { text: "“Sesiones fluidas, eficaces y agradables.”", author: "Karla — México" },
      { text: "“Un acompañamiento premium que lo cambia todo.”", author: "Léa — Nantes" },
      { text: "“El Pilates en casa nunca fue tan motivador.”", author: "Mélodie — Pornic" }
    ],
    courses: {
      visio: [
        { id: 'v-coll', title: "Online grupal", price: "39€ / mes", badge: "7 días gratis", stripeUrl: STRIPE_LINKS.visioCollectif },
        { id: 'v-ind', title: "Online individual", price: "269€ / mes", stripeUrl: STRIPE_LINKS.visioIndividuel }
      ],
      nantes: [
        { id: 'n-coll', title: "Nantes grupal", price: "10€ / clase", isUnitPay: true, stripeUrl: STRIPE_LINKS.nantesCollectif },
        { id: 'n-ind', title: "Nantes individual", price: "50€ / clase", isUnitPay: true, stripeUrl: STRIPE_LINKS.nantesIndividuel }
      ]
    }
  }
};
