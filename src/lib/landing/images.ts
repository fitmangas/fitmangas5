/** Images landing hébergées localement (ex-Dropbox). */
export const LANDING_HERO_IMAGE = '/landing/hero.jpg';

export const LANDING_OFFER_IMAGES: Record<string, string> = {
  'v-coll': '/landing/offer-v-coll.jpg',
  'v-ind': '/landing/offer-v-ind.jpg',
  'n-coll': '/landing/offer-n-coll.jpg',
  'n-ind': '/landing/offer-n-ind.jpg',
  'm-coll': '/landing/offer-n-coll.jpg',
  'm-ind': '/landing/offer-n-ind.jpg',
};

export function landingOfferImageUrl(courseId: string): string | undefined {
  return LANDING_OFFER_IMAGES[courseId];
}
