export interface SearchResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
    images?: string[];
}

export interface SearchProvider {
    search(query: string): Promise<SearchResult[]>;
}
