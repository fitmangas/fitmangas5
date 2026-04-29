export type Language = 'FR' | 'ES';
export type Segment = 'VISIO' | 'NANTES';

export interface Testimonial {
  text: string;
  author: string;
  avatar: string;
}

export interface Course {
  id: string;
  title: string;
  price: string;
  badge?: string;
  isUnitPay?: boolean;
  imageUrl?: string;
}

export interface Content {
  title: string;
  subtitle: string;
  accroche: string;
  microline: string;
  segVisio: string;
  segNantes: string;
  visioLabel: string;
  nantesLabel: string;
  sectionTitle: string;
  trustLine: string;
  trustLine2: string;
  helpTitle: string;
  helpSub: string;
  waMsg: string;
  proofLabel: string;
  proofGiven: string;
  proofPeople: string;
  proofTooltip: string;
  testimonials: Testimonial[];
  courses: {
    visio: Course[];
    nantes: Course[];
    mexico: Course[];
  };
}

export const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_LANDING_WHATSAPP_PHONE || "33784835972";

export const translations: Record<Language, Content> = {
  FR: {
    title: "Alejandra",
    subtitle: "Barre & Pilates en visio",
    accroche: "J’aide les femmes à se sentir fortes et bien dans leur corps, en visio depuis chez elles.",
    microline: "Réserve en 30 secondes.",
    segVisio: "Visio",
    segNantes: "Présentiel",
    visioLabel: "5 cours par mois",
    nantesLabel: "Studio Nantes",
    sectionTitle: "Choisis ton cours",
    trustLine: "Paiement sécurisé • Abonnements gérés par Stripe",
    trustLine2: "Paiement sécurisé • Confirmation immédiate",
    helpTitle: "Je t’aide à choisir (WhatsApp)",
    helpSub: "Conseil rapide et gratuit",
    waMsg: "Bonjour Alejandra, je viens d’Instagram. Peux-tu m’aider à choisir mon cours ? Objectif : ____ / Niveau : ____ / Dispos : ____",
    proofLabel: "PREUVES",
    proofGiven: "cours donnés",
    proofPeople: "personnes / semaine",
    proofTooltip: "Cours collectifs et cours individuels confondus.",
    testimonials: [
      { 
        text: "“Séances fluides, efficaces et agréables.”", 
        author: "Karla — Mexico",
        avatar: "https://www.dropbox.com/scl/fi/4cwoxuwzourdv5rw4q92b/Spreadshop-Logo-8.png?rlkey=ydnyy8emq627bwz132x9ds4wp&st=18y1w3jl&raw=1"
      },
      { 
        text: "“Un accompagnement premium qui change tout.”", 
        author: "Léa — Nantes",
        avatar: "https://www.dropbox.com/scl/fi/7zic5m7zizghd2rtk7xr7/Spreadshop-Logo-10.png?rlkey=5epsn6ajvskswrorvbf1btrd7&st=6l0241gr&raw=1"
      },
      { 
        text: "“Le Pilates à la maison n’a jamais été aussi motivant.”", 
        author: "Mélodie — Pornic",
        avatar: "https://www.dropbox.com/scl/fi/6pysu0buam1lvnkjxu7z5/Spreadshop-Logo-9.png?rlkey=mqkhpt6h2z3ejkq1u968okwz2&st=cx051en2&raw=1"
      }
    ],
    courses: {
      visio: [
        { id: 'v-coll', title: "Visio collectif", price: "39€ / mois", badge: "7 jours gratuits", imageUrl: "https://www.dropbox.com/scl/fi/9vvmbi2jvmbah0j4r366u/DSC_3270.PNG?rlkey=99b2xg904ulfsaci6ram80lqe&st=xqmz0ybd&raw=1" },
        { id: 'v-ind', title: "Visio individuel", price: "269€ / mois", badge: "7 jours gratuits", imageUrl: "https://www.dropbox.com/scl/fi/w5md19t7be4f0braotoa1/DSC_3543.PNG?rlkey=4n2herm6py2s705vfz6lom94l&st=44rscama&raw=1" }
      ],
      nantes: [
        { id: 'n-coll', title: "Cours collectif", price: "10€ / séance", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/p44ddxmz2cam9r0td9qgh/DSC_3531.PNG?rlkey=v19pwrg7xqmz4u8a4kw3btk61&st=v1weczk2&raw=1" },
        { id: 'n-ind', title: "Cours individuel", price: "50€ / séance", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/lp7d96yyag2hktokjalox/DSC_3458.PNG?rlkey=uit6ax5wrby3blng29i37iu33&st=y9p2ozj4&raw=1" }
      ],
      mexico: [
        { id: 'm-coll', title: "Cours collectif", price: "10€ / séance", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/p44ddxmz2cam9r0td9qgh/DSC_3531.PNG?rlkey=v19pwrg7xqmz4u8a4kw3btk61&st=v1weczk2&raw=1" },
        { id: 'm-ind', title: "Cours individuel", price: "50€ / séance", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/lp7d96yyag2hktokjalox/DSC_3458.PNG?rlkey=uit6ax5wrby3blng29i37iu33&st=y9p2ozj4&raw=1" }
      ]
    }
  },
  ES: {
    title: "Alejandra",
    subtitle: "Barre & Pilates online",
    accroche: "Ayudo a las mujeres a sentirse fuertes y bien en su cuerpo, en clases online desde casa.",
    microline: "Reserva en 30 segundos.",
    segVisio: "Online",
    segNantes: "Presencial",
    visioLabel: "5 clases al mes",
    nantesLabel: "Studio Nantes",
    sectionTitle: "Elige tu clase",
    trustLine: "Pago seguro • Suscripciones gestionadas por Stripe",
    trustLine2: "Pago seguro • Confirmación inmediata",
    helpTitle: "Te ayudo a elegir (WhatsApp)",
    helpSub: "Consejo rápido y gratis",
    waMsg: "Hola Alejandra, vengo de Instagram. ¿Me ayudas a elegir mi clase? Objetivo: ____ / Nivel: ____ / Disponibilidad: ____",
    proofLabel: "PRUEBAS",
    proofGiven: "clases dadas",
    proofPeople: "personas / semana",
    proofTooltip: "Clases grupales e individuales combinadas.",
    testimonials: [
      { 
        text: "“Sesiones fluidas, eficaces y agradables.”", 
        author: "Karla — México",
        avatar: "https://www.dropbox.com/scl/fi/4cwoxuwzourdv5rw4q92b/Spreadshop-Logo-8.png?rlkey=ydnyy8emq627bwz132x9ds4wp&st=18y1w3jl&raw=1"
      },
      { 
        text: "“Un acompañamiento premium que lo cambia todo.”", 
        author: "Léa — Nantes",
        avatar: "https://www.dropbox.com/scl/fi/7zic5m7zizghd2rtk7xr7/Spreadshop-Logo-10.png?rlkey=5epsn6ajvskswrorvbf1btrd7&st=6l0241gr&raw=1"
      },
      { 
        text: "“El Pilates en casa nunca fue tan motivador.”", 
        author: "Mélodie — Pornic",
        avatar: "https://www.dropbox.com/scl/fi/6pysu0buam1lvnkjxu7z5/Spreadshop-Logo-9.png?rlkey=mqkhpt6h2z3ejkq1u968okwz2&st=cx051en2&raw=1"
      }
    ],
    courses: {
      visio: [
        { id: 'v-coll', title: "Online grupal", price: "39€ / mes", badge: "7 días gratis", imageUrl: "https://www.dropbox.com/scl/fi/9vvmbi2jvmbah0j4r366u/DSC_3270.PNG?rlkey=99b2xg904ulfsaci6ram80lqe&st=xqmz0ybd&raw=1" },
        { id: 'v-ind', title: "Online individual", price: "269€ / mes", badge: "7 días gratis", imageUrl: "https://www.dropbox.com/scl/fi/w5md19t7be4f0braotoa1/DSC_3543.PNG?rlkey=4n2herm6py2s705vfz6lom94l&st=44rscama&raw=1" }
      ],
      nantes: [
        { id: 'n-coll', title: "Clase grupal", price: "10€ / clase", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/p44ddxmz2cam9r0td9qgh/DSC_3531.PNG?rlkey=v19pwrg7xqmz4u8a4kw3btk61&st=v1weczk2&raw=1" },
        { id: 'n-ind', title: "Clase individual", price: "50€ / clase", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/lp7d96yyag2hktokjalox/DSC_3458.PNG?rlkey=uit6ax5wrby3blng29i37iu33&st=y9p2ozj4&raw=1" }
      ],
      mexico: [
        { id: 'm-coll', title: "Clase grupal", price: "10€ / clase", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/p44ddxmz2cam9r0td9qgh/DSC_3531.PNG?rlkey=v19pwrg7xqmz4u8a4kw3btk61&st=v1weczk2&raw=1" },
        { id: 'm-ind', title: "Clase individual", price: "50€ / clase", isUnitPay: true, imageUrl: "https://www.dropbox.com/scl/fi/lp7d96yyag2hktokjalox/DSC_3458.PNG?rlkey=uit6ax5wrby3blng29i37iu33&st=y9p2ozj4&raw=1" }
      ]
    }
  }
};
