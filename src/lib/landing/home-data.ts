import { uniqueBlogImageUrl } from '@/lib/blog/images';
import { createAdminClient } from '@/lib/supabase/admin';

export type LandingBlogPreview = {
  titleFr: string;
  titleEs: string | null;
  excerptFr: string | null;
  excerptEs: string | null;
  coverImageUrl: string | null;
  categoryLabelFr: string | null;
  categoryLabelEs: string | null;
};

export type LandingVimeoShowcaseItem = {
  title: string;
  thumbnailUrl: string | null;
};

export async function loadLandingHomeData(): Promise<{
  vimeoShowcase: LandingVimeoShowcaseItem[];
  blogPreviews: LandingBlogPreview[];
}> {
  let vimeoShowcase: LandingVimeoShowcaseItem[] = [];
  let blogPreviews: LandingBlogPreview[] = [];

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('standalone_vimeo_videos')
      .select('title, thumbnail_url')
      .eq('validation_status', 'published')
      .not('title', 'is', null)
      .not('thumbnail_url', 'is', null)
      .not('thumbnail_url', 'ilike', '%default-live%')
      .order('published_at', { ascending: false })
      .limit(12);

    vimeoShowcase = (data ?? [])
      .map((row) => ({
        title: typeof row.title === 'string' ? row.title : '',
        thumbnailUrl: typeof row.thumbnail_url === 'string' ? row.thumbnail_url : null,
      }))
      .filter((item) => item.title.trim().length > 0);

    const { data: articles } = await admin
      .from('blog_articles')
      .select(
        'title_fr, title_es, description_fr, description_es, featured_image_url, published_at, blog_categories ( label_fr, label_es, slug )',
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);
    const usedImages = new Set<string>();
    blogPreviews = (articles ?? []).map((row, index) => {
      const category = Array.isArray(row.blog_categories) ? row.blog_categories[0] : row.blog_categories;
      const categoryLabel =
        typeof category?.label_fr === 'string'
          ? category.label_fr
          : typeof category?.slug === 'string'
            ? category.slug
            : null;
      return {
        titleFr: String(row.title_fr ?? ''),
        titleEs: row.title_es ? String(row.title_es) : null,
        excerptFr: row.description_fr ? String(row.description_fr) : null,
        excerptEs: row.description_es ? String(row.description_es) : null,
        coverImageUrl: uniqueBlogImageUrl({
          coverImageUrl: row.featured_image_url ? String(row.featured_image_url) : null,
          categoryLabel,
          index,
          used: usedImages,
        }),
        categoryLabelFr: categoryLabel,
        categoryLabelEs: typeof category?.label_es === 'string' ? category.label_es : categoryLabel,
      };
    });
  } catch {
    vimeoShowcase = [];
    blogPreviews = [];
  }

  return { vimeoShowcase, blogPreviews };
}
