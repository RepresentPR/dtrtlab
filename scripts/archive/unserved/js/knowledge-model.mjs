const routes = {
  services: { title: 'Help with your business', text: 'Start with the existing free office map or AI check. Job Desk and AI Visibility Fix remain DTRT Lab service paths. Scope and delivery must be agreed before paid work.', href: '/map/', link: 'Explore the free office map', orderable: false },
  products: { title: 'A product for everyday use', text: 'Ecommerce is in research and preparation. Physical products are not available to order here. Product selection, seller access and fulfillment still need verification.', href: '/#campaign', link: 'View the preparation status', orderable: false },
  software: { title: 'Explore software', text: 'The Job Desk demo is a fictional example you can explore. The demonstration is not a connected business account or a finished software product for sale.', href: '/demo/', link: 'Explore the fictional demo', orderable: false },
  ventures: { title: 'See what we are building', text: 'Browse the company record: service work, product research, software experiments and lessons. An idea or prototype is not a successful business until evidence supports it.', href: '/#knowledge', link: 'Read the company overview', orderable: false }
};
export function getRoute(topic) { return Object.hasOwn(routes, topic) ? { ...routes[topic] } : null; }
export function prepareRequest({ topic, need, consent } = {}) {
  if (consent !== true) throw new Error('Please give explicit consent to prepare this request.');
  if (!getRoute(topic)) throw new Error('Choose one of the listed topics.');
  if (typeof need !== 'string' || !need.trim()) throw new Error('Describe what you need.');
  if (need.trim().length > 600) throw new Error('Keep your request to 600 characters.');
  return { topic, need: need.trim(), purpose: 'Local idea draft for possible weekly review', consentVersion: 'local-draft-2026-10-24', publicationConsent: false, deliveryStatus: 'not_sent' };
}
