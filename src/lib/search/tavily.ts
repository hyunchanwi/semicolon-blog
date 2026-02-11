import { tavily } from "@tavily/core";
import { SearchProvider, SearchResult, SearchOptions } from "./interface";

export class TavilySearchProvider implements SearchProvider {
    private client;

    constructor(apiKey: string) {
        this.client = tavily({ apiKey });
    }

    async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
        try {
            const response = await this.client.search(query, {
                search_depth: "advanced",
                include_answer: true,
                include_images: true,
                max_results: options?.maxResults || 5,
                days: options?.days || 3,
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
