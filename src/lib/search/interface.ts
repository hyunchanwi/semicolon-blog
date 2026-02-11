export interface SearchResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
    images?: string[];
}


export interface SearchOptions {
    days?: number;
    maxResults?: number;
}

export interface SearchProvider {
    search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
}
