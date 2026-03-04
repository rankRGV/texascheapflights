import { GoogleGenerativeAI } from '@google/generative-ai';

// Get the API key from Vercel's environment variables
const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is missing! AI parsing will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface ParsedDeal {
    isTexasOrigin: boolean;
    originAirport: string;
    destination: string;
    price: number;
    airline: string;
    priceStrengthScore: number;
    hedgeValueScore: number;
    totalScore: number;
    explanation: string;
}

const SYSTEM_PROMPT = `
You are an expert flight deal analyst for "Texas Cheap Flights". 
Your job is to read forwarded email newsletters (e.g., from Going or FareDealAlert) and extract flight deals.
Our subscribers ONLY care about flights departing from Texas airports (DFW, IAH, AUS, SAT, MFE, LRD, BRO, CRP, ELP, etc.).

Analyze the email text and return a JSON object with the following structure:
{
  "isTexasOrigin": boolean, // true if departing from TX, false otherwise
  "originAirport": string, // Airport code (e.g., 'DFW', 'IAH', 'MFE') or empty string if not TX
  "destination": string, // City/Country/Location
  "price": number, // Extract the lowest deal price as a number
  "airline": string, // Airline(s) mentioned
  "priceStrengthScore": number, // 1 to 5 (5=Insane error fare <$400 to Europe, 3=Very strong <$600 to Europe, 1=Good sale)
  "hedgeValueScore": number, // 1 to 5 (5=Massive Hedge >70% off, 3=Solid Hedge 40-60% off, 1=Minimal Hedge <30% off)
  "totalScore": number, // sum of priceStrengthScore and hedgeValueScore (max 10)
  "explanation": string // 1 sentence explaining the scores
}

IMPORTANT: Return ONLY the raw JSON object. Do not include markdown formatting, backticks, or outside text.
`;

export async function parseEmailToDeal(emailSubject: string, emailBody: string): Promise<ParsedDeal | null> {
    if (!apiKey) return null;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `${SYSTEM_PROMPT}\n\nEmail Subject: ${emailSubject}\n\nEmail Body:\n${emailBody}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up potential markdown formatting just in case the AI ignores instructions
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

        const parsedDeal: ParsedDeal = JSON.parse(text);
        return parsedDeal;
    } catch (error) {
        console.error("Gemini AI Parsing Error:", error);
        return null;
    }
}
