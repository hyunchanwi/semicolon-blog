import { tavily } from "@tavily/core";
import { SearchProvider, SearchResult } from "./interface";

export class TavilySearchProvider implements SearchProvider {
    private client;

    constructor(apiKey: string) {
        this.client = tavily({ apiKey });
    }

    async search(query: string): Promise<SearchResult[]> {
        try {
            const response = await this.client.search(query, {
                search_depth: "advanced",
                include_answer: true,
                include_images: true,
                max_results: 5,
                days: 1, // Restrict to last 24 hours for freshness
            });

            return response.results.map((result: any) => ({
                title: result.title,
                url: result.url,
                content: result.content,
                publishedDate: result.published_date,
                images: response.images ? response.images.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean) : [],
            }));
        } catch (error) {
            console.error("Tavily Search Error:", error);
            throw new Error("Failed to fetch search results");
        }
    }
}
