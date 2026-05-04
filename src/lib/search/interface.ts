// Shared interfaces for search provider abstraction

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
    images?: string[];
}

export interface SearchOptions {
    maxResults?: number;
    days?: number;
}

export interface SearchProvider {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
