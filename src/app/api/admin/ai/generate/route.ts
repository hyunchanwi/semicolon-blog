import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { generateBlogPost } from "@/lib/gemini";
import { searchYouTubeVideos, YouTubeVideo, generateRecommendedVideosHtml } from "@/lib/youtube";
import { isAdminEmail } from "@/lib/admin-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const session = await getServerSession(authOptions);
        if (!session || !isAdminEmail(session.user?.email)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { topic } = await request.json();
        if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

        // 2. Search (Tavily - 텍스트 소스)
        const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
        const searchResults = await searcher.search(topic);

        if (searchResults.length === 0) {
            return NextResponse.json({ error: "No related news found." }, { status: 404 });
        }

        // 3. Write (Gemini)
        let htmlContent = await generateBlogPost(topic, searchResults);

        // 4. YouTube 추천 영상 검색
        let youtubeVideos: YouTubeVideo[] = [];
        try {
            youtubeVideos = await searchYouTubeVideos(topic, 5);
            console.log(`[AI] Found ${youtubeVideos.length} YouTube videos`);
        } catch (ytError) {
            console.log("[AI] YouTube search failed, continuing without videos");
        }

        // 5. 추천 영상을 글 하단에 추가 (선택적)
        // 여기서는 영상 목록만 반환하고, 관리자가 선택하도록 함

        // 6. Return result
        return NextResponse.json({
            content: htmlContent,
            sources: searchResults,
            youtubeVideos: youtubeVideos,
        });

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
    }
}
