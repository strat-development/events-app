import { openAiClient } from "@/lib/openAiClient";

export async function POST(request: Request) {
    try {
        const { style, interests, editorContent, numImages = 4 } = await request.json();

        if (!style || !interests || !Array.isArray(interests) || interests.length === 0) {
            return new Response(JSON.stringify({ error: "Missing data" }), { status: 400 });
        }

        const imagePromises = [];
        for (let i = 0; i < Math.min(numImages, 4); i++) {
            imagePromises.push(
                openAiClient.images.generate({
                    model: "dall-e-3",
                    prompt: `Generate an image for an event with the style: ${style}. Include elements that reflect the interests of the attendees: ${interests.join(", ")}.`,
                    n: 1
                })
            );
        }

        const results = [];
        for (const promise of imagePromises) {
            try {
                const response = await promise;
                await new Promise(resolve => setTimeout(resolve, 500));
                const url = response.data?.[0]?.url;
                if (url) results.push(url);
            } catch (error) {
                console.error("Error generating image:", error);
            }
        }

        if (results.length === 0) {
            throw new Error("No images were generated");
        }

        return new Response(JSON.stringify({ imageURLs: results }), { status: 200 });

    } catch (error: any) {
        console.error("Error in generateRequest:", error?.message || error);
        return new Response(JSON.stringify({ error: "Generation failed", details: error?.message }), { status: 500 });
    }
}