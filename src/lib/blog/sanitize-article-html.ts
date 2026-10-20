import DOMPurify from 'isomorphic-dompurify';

const IFRAME_HOSTS = new Set([
  'player.vimeo.com',
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'www.instagram.com',
  'instagram.com',
]);

export function isAllowedIframeSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    const u = new URL(src, 'https://fitmangas.com');
    return u.protocol === 'https:' && IFRAME_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

let hooksInstalled = false;
function installHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName !== 'iframe') return;
    const el = node as Element;
    if (!isAllowedIframeSrc(el.getAttribute?.('src'))) {
      el.parentNode?.removeChild(el);
    }
  });
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    const el = node as Element;
    if (el.tagName === 'A' && el.getAttribute('target') === '_blank') {
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
}

/** HTML d’article (blog) : balises de mise en forme + iframes Vimeo / YouTube / Instagram uniquement. */
export function sanitizeArticleHtml(html: string): string {
  installHooks();
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'loading', 'referrerpolicy'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'object', 'embed'],
  });
}
