import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';
import { publishDealToSocial } from '../../../lib/social-publisher';

export const POST: APIRoute = async ({ request, cookies }) => {
    // 1. Verify Authentication
    const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';

    // Verify via cookie (for dashboard clicks) or auth header (for API testing)
    const cookiePw = cookies.get('tcf_admin')?.value;
    const authHeader = request.headers.get('Authorization')?.replace('Bearer ', '');

    if (cookiePw !== ADMIN_PASSWORD && authHeader !== ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        // 2. Parse request body
        const body = await request.json();
        const { dealId } = body;

        if (!dealId) {
            return new Response(JSON.stringify({ error: 'Missing dealId' }), { status: 400 });
        }

        // 3. Fetch the deal and publish directly through the Meta API.



        const { data: deal, error: fetchError } = await supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .single();

        if (fetchError || !deal) {
            return new Response(JSON.stringify({ error: 'Deal not found in database' }), { status: 404 });
        }

        const result = await publishDealToSocial(deal);

        return new Response(JSON.stringify({
            success: true,
            message: result.skipped ? 'Deal was already posted.' : 'Published directly to Facebook and Instagram.',
            result,
        }), { status: 200 });

    } catch (error: any) {
        console.error('Error triggering social post:', error);
        return new Response(JSON.stringify({
            error: 'Failed to process social post trigger',
            details: error.message
        }), { status: 500 });
    }
};
