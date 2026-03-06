import { processDeal } from './src/lib/engine';

async function triggerTest() {
    const testTitle = "✈️ ERROR FARE: McAllen (MFE) to Las Vegas (LAS) for $120!";
    const testContent = `
        Hey! Here is a test of the new Price Insight badge.
        Typical: $180-320
        Cheaper: $60
        
        This is a manually triggered test to verify the UI.
    `;

    console.log("🚀 Triggering Mock Deal Test...");
    try {
        const result = await processDeal(testTitle, testContent, "Manual Test Runner");
        console.log("✅ Test Result:", result);
        console.log("\n👉 Check your Resend Dashboard (Broadcasts) and Discord!");
    } catch (e) {
        console.error("❌ Test Failed:", e);
    }
}

triggerTest();
