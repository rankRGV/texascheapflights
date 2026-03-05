import type { APIRoute } from 'astro';
import { processDeal } from '../../lib/engine';

export const POST: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const secret = url.searchParams.get('secret');
        const expectedSecret = import.meta.env.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET;

        // Simple security check for our test endpoint
        if (!expectedSecret || secret !== expectedSecret) {
            return new Response(JSON.stringify({ error: 'Unauthorized test' }), { status: 401 });
        }

        const testTitle = "✈️ ERROR FARE: McAllen (MFE) to Las Vegas (LAS) for $120!";
        const testContent = `
            Hey! Here is a test of the new Price Insight badge.
            Typical: $180-320
            Cheaper: $60
            
            This is a manually triggered test to verify the UI.
        `;

        console.log("🚀 Triggering Mock Deal Test via API...");
        const result = await processDeal(testTitle, testContent, "Manual API Trigger");

        return new Response(JSON.stringify({
            success: true,
            message: "Test triggered",
            engineResult: result
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err: any) {
        console.error("Test trigger error:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
