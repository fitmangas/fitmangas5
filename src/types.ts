export type Language = 'FR' | 'ES';

export interface Content {
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  philosophy: {
    title: string;
    description: string;
  };
  classes: {
    title: string;
    items: {
      name: string;
      duration: string;
      level: string;
    }[];
  };
}

export const translations: Record<Language, Content> = {
  FR: {
    hero: {
      title: "L'Art du Mouvement",
      subtitle: "Barre & Pilates de luxe pour une silhouette sculptée et un esprit serein.",
      cta: "Découvrir l'Expérience"
    },
    philosophy: {
      title: "Notre Philosophie",
      description: "Une approche holistique alliant la précision du Pilates à l'élégance de la Barre. Dans un sanctuaire de douceur, nous sculptons bien plus que votre corps."
    },
    classes: {
      title: "Les Séances",
      items: [
        { name: "Barre Sculpt", duration: "45 min", level: "Tous niveaux" },
        { name: "Pilates Flow", duration: "50 min", level: "Intermédiaire" },
        { name: "Core & Grace", duration: "30 min", level: "Avancé" }
      ]
    }
  },
  ES: {
    hero: {
      title: "El Arte del Movimiento",
      subtitle: "Barre y Pilates de lujo para una silueta esculpida y una mente serena.",
      cta: "Descubrir la Experiencia"
    },
    philosophy: {
      title: "Nuestra Filosofía",
      description: "Un enfoque holístico que combina la precisión del Pilates con la elegancia del Barre. En un santuario de suavidad, esculpimos mucho más que tu cuerpo."
    },
    classes: {
      title: "Las Sesiones",
      items: [
        { name: "Barre Sculpt", duration: "45 min", level: "Todos los niveles" },
        { name: "Pilates Flow", duration: "50 min", level: "Intermedio" },
        { name: "Core & Grace", duration: "30 min", level: "Avanzado" }
      ]
    }
  }
};
