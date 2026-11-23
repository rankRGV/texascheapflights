import type { APIRoute } from 'astro';
import { renderSocialCard } from '../../lib/social-card';

export const GET: APIRoute = ({ url }) => renderSocialCard(url, 'story');
