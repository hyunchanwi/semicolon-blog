import { tavily } from "@tavily/core";
import { SearchProvider, SearchResult, SearchOptions } from "./interface";

export class TavilySearchProvider implements SearchProvider {
    private apiKeys: string[];

    constructor(apiKeysString: string) {
        this.apiKeys = apiKeysString.split(',').map(k => k.trim()).filter(Boolean);
        if (this.apiKeys.length === 0) {
            console.warn("[Tavily] No API keys provided to provider!");
        }
    }

    async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
        let lastError: any = null;

        for (let i = 0; i < this.apiKeys.length; i++) {
            const apiKey = this.apiKeys[i];
            const client = tavily({ apiKey });

            try {
                const response = await client.search(query, {
                    search_depth: "advanced",
                    include_answer: true,
                    include_images: true,
                    max_results: options?.maxResults || 5,
                    days: options?.days || 3,
                });

                if (i > 0) {
                    console.log(`[Tavily] 🔄 Retried and succeeded using fallback key (Index: ${i})`);
                }

                return response.results.map((result: any) => ({
                    title: result.title,
                    url: result.url,
                    content: result.content,
                    publishedDate: result.published_date,
                    images: response.images ? response.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
                }));
            } catch (error: any) {
                lastError = error;
                const errMsg = error?.message || String(error);
                const isQuotaError = errMsg.includes("exceed") || errMsg.includes("429") || errMsg.includes("limit") || errMsg.includes("invalid API key") || errMsg.includes("Unauthorized");

                console.warn(`[Tavily] ⚠️ Search failed with key index ${i}: ${errMsg}`);

                if (isQuotaError && i < this.apiKeys.length - 1) {
                    console.log(`[Tavily] 🔄 Falling back to next available API key...`);
                    continue; // Switch to the next key
                } else {
                    break; // If not a quota error or out of keys, give up
                }
            }
        }

        console.error("[Tavily] ❌ All available Tavily keys failed.");
        throw new Error(lastError?.message || "Failed to fetch search results");
    }
}
