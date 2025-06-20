import { openAiClient } from "@/lib/openAiClient";

export async function POST(request: Request) {
    try {
        const { mood, length, editorContent, language } = await request.json();

        if (!editorContent || !mood || !length || !language) {
            return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
        }

        const response = await openAiClient.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "user", content: `Describe a group in this criteria - mood: ${mood}, length: ${length}, language: ${language}: ${editorContent}` }
            ],
        });

        const groupDescription = response.choices?.[0]?.message?.content;

        if (!groupDescription) {
            throw new Error("No description returned from OpenAI");
        }

        return new Response(JSON.stringify({ groupDescription }), { status: 200 });

    } catch (error: any) {
        console.error("Error in generateRequest:", error?.message || error);
        return new Response(JSON.stringify({ error: "Generation failed", details: error?.message }), { status: 500 });
    }
}
