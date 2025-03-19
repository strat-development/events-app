import { openAiClient } from "@/lib/openAiClient";

export async function POST(request: Request) {
    try {
        const { description } = await request.json();
        const acceptLanguage = request.headers.get("accept-language") || "en";
        const userLanguage = acceptLanguage.split(",")[0].split("-")[0];

        if (!description) {
            return new Response(JSON.stringify({ error: "Missing description" }), { status: 400 });
        }

        const response = await openAiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "user", content: `Translate the following text to ${userLanguage}: ${description}` }
            ],
        });

        const translatedText = response.choices?.[0]?.message?.content;

        if (!translatedText) {
            throw new Error("No translation returned from OpenAI");
        }

        return new Response(JSON.stringify({ translatedText }), { status: 200 });

    } catch (error: any) {
        console.error("Error in translateRequest:", error?.message || error);
        return new Response(JSON.stringify({ error: "Translation failed", details: error?.message }), { status: 500 });
    }
}
