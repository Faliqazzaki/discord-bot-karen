import { AIProvider } from "./AIProvider";

export class GeminiProvider implements AIProvider {
    readonly name = "gemini";

    constructor(private readonly apiKey: string, private readonly model: string) {}

    async generateText(prompt: string): Promise<string> {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": this.apiKey,
            },

            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
            }),
        });

        if(!response.ok){
            const errorBody = await response.text().catch(() => "");
            throw new Error(`Gemini API error (HTTP ${response.status}): ${errorBody.slice(0, 300)}`)
        }

        const data = (await response.json()) as any;
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if(!text || typeof text !== "string") {
            throw new Error("Gemini API mengembalikan response tanpa teks yang bisa dibaca.");
        }

        return text.trim();
    }
}