import { buildSocialWebhookPayload, type SocialVisualVariant } from './social-payload';
import { supabase } from './supabase';
import type { ShowcaseDeal } from './deal-showcase';

type SocialDeal = ShowcaseDeal & {
  booking_link?: string | null;
  posted_to_social?: boolean | null;
};

type MetaResponse = {
  id?: string;
  post_id?: string;
  creation_id?: string;
  error?: { message?: string };
  [key: string]: unknown;
};

const GRAPH_VERSION = import.meta.env.META_GRAPH_VERSION || process.env.META_GRAPH_VERSION || 'v19.0';
const PAGE_ID = import.meta.env.META_PAGE_ID || process.env.META_PAGE_ID || '100525161325639';
const INSTAGRAM_USER_ID = import.meta.env.META_INSTAGRAM_USER_ID || process.env.META_INSTAGRAM_USER_ID || '17841418564319174';
const ACCESS_TOKEN = import.meta.env.META_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
const SUPABASE_URL = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || '';

function env(name: string): string {
  return import.meta.env[name] || process.env[name] || '';
}

function requireConfig() {
  if (!ACCESS_TOKEN) {
    throw new Error('META_ACCESS_TOKEN is not configured. Add the renewed Meta token to Vercel before posting.');
  }
  if (!SUPABASE_URL) {
    throw new Error('SUPABASE_URL is not configured.');
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function metaPost(path: string, values: Record<string, string | number | boolean>): Promise<MetaResponse> {
  const form = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    form.set(key, String(value));
  }
  form.set('access_token', ACCESS_TOKEN);

  const response = await fetch('https://graph.facebook.com/' + GRAPH_VERSION + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const body = await response.json() as MetaResponse;

  if (!response.ok || body.error) {
    throw new Error('Meta API ' + path + ' failed: ' + (body.error?.message || response.statusText));
  }

  return body;
}

async function materializeImage(imageUrl: string, fileName: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error('Deal card request failed: ' + response.status);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const { error } = await supabase.storage
    .from('deal-cards')
    .upload(fileName, bytes, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) throw new Error('Supabase image upload failed: ' + error.message);
  return SUPABASE_URL + '/storage/v1/object/public/deal-cards/' + fileName;
}

function buildSocialCopy(deal: SocialDeal, variant: SocialVisualVariant) {
  const route = deal.origin + ' → ' + deal.destination;
  const price = deal.price ? '$' + deal.price : 'a low fare';
  const airline = deal.airline || 'multiple airlines';
  const dates = deal.travel_dates ? ' Dates: ' + deal.travel_dates + '.' : '';
  const localNote = deal.origin === 'MFE' || deal.origin === 'HRL' || deal.origin === 'BRO'
    ? 'The Valley should see this one.'
    : deal.origin === 'SAT'
      ? 'San Antonio travelers, this one is worth checking.'
      : deal.origin === 'DFW' || deal.origin === 'DAL'
        ? 'Dallas travelers, check both airports before booking.'
        : 'Texas travelers, check this before the fare moves.';

  const facebookTemplates = [
    '✈️ ' + route + ' for ' + price + ' roundtrip on ' + airline + '.' + localNote + dates + ' Verify the live fare before booking: ' + (deal.booking_link || 'https://texascheapflights.com'),
    'This is the kind of fare worth checking twice: ' + route + ' for ' + price + ' roundtrip.' + localNote + dates + ' See the deal details at texascheapflights.com.',
    'A Texas departure just hit our deal radar: ' + route + ' for ' + price + '.' + localNote + ' Fares can change, so verify the dates and final price before you book.',
  ];
  const index = variant === 'regional' ? 0 : variant === 'weekend' ? 1 : 2;

  return {
    facebook: facebookTemplates[index],
    instagram: price + ' roundtrip: ' + route + ' ✈️\n' + airline + '.' + (deal.travel_dates ? '\n' + deal.travel_dates + '.' : '') + '\nCheck the fare while it is available.\n\n#TexasCheapFlights #' + deal.origin + ' #FlightDeals #TravelTexas',
  };
}

async function publishInstagramImage(imageUrl: string, caption: string, mediaType = 'IMAGE', extra: Record<string, string> = {}) {
  const container = await metaPost('/' + INSTAGRAM_USER_ID + '/media', {
    image_url: imageUrl,
    caption,
    media_type: mediaType,
    ...extra,
  });

  if (!container.id) throw new Error('Instagram did not return a media container ID.');
  await sleep(8000);

  return metaPost('/' + INSTAGRAM_USER_ID + '/media_publish', {
    creation_id: container.id,
  });
}

export async function publishDealToSocial(deal: SocialDeal) {
  requireConfig();

  if (!deal.id) throw new Error('Deal is missing an ID.');
  if (deal.posted_to_social) {
    return { skipped: true, reason: 'already-posted', dealId: deal.id };
  }

  const adminPassword = env('ADMIN_PASSWORD') || 'tcf-admin-2026';
  const cardSecret = env('DEAL_CARD_SECRET') || adminPassword;
  const payload = buildSocialWebhookPayload(deal, cardSecret);
  const variant = payload.social_context.variant;
  const copy = buildSocialCopy(deal, variant);
  const filePrefix = deal.id + '-' + variant;

  const feedImageUrl = await materializeImage(payload.social_context.deal_card_url, filePrefix + '-feed.png');
  const instagramImageUrl = await materializeImage(payload.social_context.ig_deal_card_url, filePrefix + '-instagram.png');
  const storyImageUrl = await materializeImage(payload.social_context.story_deal_card_url, filePrefix + '-story.png');

  const facebook = await metaPost('/' + PAGE_ID + '/photos', {
    url: feedImageUrl,
    caption: copy.facebook,
  });

  const instagram = await publishInstagramImage(instagramImageUrl, copy.instagram);

  const result: Record<string, unknown> = {
    skipped: false,
    dealId: deal.id,
    variant,
    facebookPostId: facebook.post_id || facebook.id || null,
    instagramPostId: instagram.id || null,
  };

  if (env('META_PUBLISH_STORIES').toLowerCase() === 'true') {
    const facebookStoryPhoto = await metaPost('/' + PAGE_ID + '/photos', {
      url: storyImageUrl,
      published: false,
    });
    const facebookStory = facebookStoryPhoto.id
      ? await metaPost('/' + PAGE_ID + '/photo_stories', { photo_id: facebookStoryPhoto.id })
      : null;

    const instagramStory = await publishInstagramImage(
      storyImageUrl,
      '',
      'STORIES',
      {
        link_sticker: JSON.stringify({ link: deal.booking_link || 'https://texascheapflights.com/deal/' + deal.id }),
      },
    );

    result.facebookStoryId = facebookStory?.id || null;
    result.instagramStoryId = instagramStory.id || null;
  }

  if (
    env('META_COMMENT_SNAPSHOT').toLowerCase() === 'true'
    && result.facebookPostId
  ) {
    const comment = await metaPost('/' + result.facebookPostId + '/comments', {
      message: payload.social_context.google_flights_snapshot.comment_text,
      attachment_url: payload.social_context.savings_snapshot_card_url,
    });
    result.facebookCommentId = comment.id || null;
  }

  const { error: updateError } = await supabase
    .from('deals')
    .update({ posted_to_social: true })
    .eq('id', deal.id);

  if (updateError) {
    console.warn('Social post succeeded but deal status update failed:', updateError.message);
  }

  return result;
}
