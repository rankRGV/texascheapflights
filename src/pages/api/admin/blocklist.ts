import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

// Simple admin auth check
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD ?? 'tcf-admin-2026';

function isAdmin(request: Request): boolean {
    const cookie = request.headers.get('cookie') ?? '';
    const match = cookie.match(/tcf_admin=([^;]+)/);
    return match?.[1] === ADMIN_PASSWORD;
}

export const POST: APIRoute = async ({ request }) => {
    if (!isAdmin(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();
        const { type, value, reason } = body;

        if (!type || !value) {
            return new Response(JSON.stringify({ error: 'type and value are required' }), { status: 400 });
        }

        const { error } = await supabase.from('blocklist').insert({
            type: type.trim(),
            value: value.trim(),
            reason: reason?.trim() || null,
            active: true,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        console.error('Blocklist POST error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};

export const PATCH: APIRoute = async ({ request }) => {
    if (!isAdmin(request)) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const { id, active } = await request.json();
        if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });

        const { error } = await supabase.from('blocklist').update({ active }).eq('id', id);
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        console.error('Blocklist PATCH error:', err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
