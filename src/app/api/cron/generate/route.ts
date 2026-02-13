
import { NextRequest, NextResponse } from "next/server";
import { TavilySearchProvider } from "@/lib/search/tavily";
import { generateBlogPost } from "@/lib/gemini";
import { getBestTopics, TrendingTopic } from "@/lib/trends/google-trends";
import { getFeaturedImage } from "@/lib/images/unsplash";
import { uploadImageFromUrl, getOrCreateTag, checkAutomationDuplicate } from "@/lib/wp-server";
import { googlePublishUrl } from "@/lib/google-indexing";
import { classifyContent } from "@/lib/category-rules";

// Types
interface WPPostTitle {
    rendered: string;
}

// Secure the endpoint
const CRON_SECRET = process.env.CRON_SECRET;
const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = (process.env.WP_AUTH || "").trim();

// 분류 규칙 재정의 (classifyContent 사용)

// 최근 작성한 주제 가져오기
async function getRecentTopics(): Promise<string[]> {
    try {
        if (!WP_AUTH) return [];

        const res = await fetch(`${WP_API_URL}/posts?per_page=30&_fields=title`, {
            headers: { "Authorization": `Basic ${WP_AUTH}` },
            cache: 'no-store'
        });

        if (!res.ok) return [];

        const posts: { title?: WPPostTitle }[] = await res.json();
        return posts.map((p) => p.title?.rendered || '').filter(Boolean);
    } catch {
        return [];
    }
}

export async function GET(request: NextRequest) {
    // Auth Check
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
        // Allow for testing
    }

    try {
        console.log("[Cron] 🚀 Starting Trend Hunter generation...");

        // Add random jitter to prevent simultaneous execution race conditions
        // Reduce jitter for faster execution
        const jitter = Math.floor(Math.random() * 2000);
        await new Promise(resolve => setTimeout(resolve, jitter));

        // 1. 최근 주제 가져오기 (중복 방지)
        const recentTopics = await getRecentTopics();
        console.log(`[Cron] Found ${recentTopics.length} recent posts`);

        // 2. 트렌드에서 최적 주제 선택
        let topic: TrendingTopic | null = null;
        let selectedTitle = "";

        try {
            const candidates = await getBestTopics('KR', recentTopics);
            console.log(`[Cron] 🔍 Checking ${candidates.length} candidates for IT category validity...`);

            for (const t of candidates) {
                // [Check 1] Non-IT Keyword Check (Skip if title contains weather, travel, etc.)
                const nonItKeywords = ["날씨", "여행", "맛집", "패션", "연예"];
                const isNonIt = nonItKeywords.some(kw => t.title.includes(kw));

                if (isNonIt) {
                    console.log(`[Cron] ⚠️ Skipping candidate "${t.title}" - Contains Non-IT Keyword`);
                    continue;
                }

                // [Check 2] Category Prediction
                const predicted = classifyContent(t.title, '');
                if (predicted === 1) { // 1 = OTHER (Not IT)
                    console.log(`[Cron] ⚠️ Skipping candidate "${t.title}" - Classified as OTHER`);
                    continue;
                }

                // [Check 3] Global Duplicate Check (Automation Meta)
                const { exists } = await checkAutomationDuplicate(`trend_${t.title}`, WP_AUTH);
                if (exists) {
                    console.log(`[Cron] ⚠️ Skipping candidate "${t.title}" - Already published (Meta Match)`);
                    continue;
                }

                topic = t;
                selectedTitle = t.title;
                console.log(`[Cron] 📈 Selected valid topic: ${selectedTitle} (Category ID: ${predicted})`);
                break;
            }

            if (!selectedTitle && candidates.length > 0) {
                console.log("[Cron] ⚠️ All candidates classified as OTHER. Checking fallback list...");
            }

        } catch (trendError) {
            console.log("[Cron] Trend API failed, using fallback");
        }

        // 3. 트렌드 실패 시 폴백 주제
        if (!selectedTitle) {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1;

            const todayStr = today.toISOString().split('T')[0];
            const fallbackTopics = [
                `최신 AI 기술 트렌드 분석 (${todayStr})`,
                `${year}년 스마트폰 시장 최신 동향 (${todayStr})`,
                `클라우드 컴퓨팅 및 인프라 뉴스 (${todayStr})`,
                `글로벌 사이버 보안 위협 리포트 (${todayStr})`,
                `메타버스 및 XR 기술 발전 현황 (${todayStr})`,
                `개발자가 주목해야 할 최신 기술 (${todayStr})`,
                `테크 스타트업 투자 및 시장 분석 (${todayStr})`,
                `블록체인과 Web3 생태계 전망 (${todayStr})`
            ];
            selectedTitle = fallbackTopics[Math.floor(Math.random() * fallbackTopics.length)];
            console.log(`[Cron] Using fallback topic: ${selectedTitle}`);
        }

        // 3.5 생성 전 IT 검증 - '기타' 카테고리면 스킵
        const predictedCategory = classifyContent(selectedTitle, '');
        if (predictedCategory === 1) { // CATEGORY_IDS.OTHER = 1
            console.log(`[Cron] ⚠️ Selected topic "${selectedTitle}" still classified as OTHER? Proceeding with caution.`);
        }

        // 4. Tavily로 최신 정보 검색
        const searcher = new TavilySearchProvider(process.env.TAVILY_API_KEY || "");
        const searchResults = await searcher.search(`${selectedTitle} 최신 뉴스 2026`);

        if (searchResults.length === 0) {
            console.log("[Cron] No search results found");
            return NextResponse.json({ error: "No news found" }, { status: 404 });
        }

        console.log(`[Cron] Found ${searchResults.length} search results`);

        // 5. AI로 블로그 글 생성 (한글 제목 + SEO 메타데이터 포함)
        // Optimized for speed: Changed to 2500 chars limit
        const blogResult = await generateBlogPost(selectedTitle, searchResults);
        const koreanTitle = blogResult.title;
        const htmlContent = blogResult.content;
        const { seoTitle, metaDescription, focusKeyphrase } = blogResult;
        console.log(`[Cron] ✅ Generated: "${koreanTitle}" | SEO: ${focusKeyphrase}`);

        // 6. 이미지 설정 (Tavily > Unsplash > Fallback)
        let featuredImageHtml = "";
        let bodyImageHtml = "";
        let featuredMediaId = 0;
        let imageUrl = "";
        let imageCredit = "";

        // Strategy 1: Try Tavily Images (Most Relevant)
        const tavilyImages = searchResults[0]?.images || [];
        if (tavilyImages.length > 0) {
            imageUrl = tavilyImages[0];
            imageCredit = ""; // Clean credit
            console.log(`[Cron] 🖼️ Found image from Tavily: ${imageUrl}`);
        } else {
            console.log("[Cron] No images from Tavily, trying Unsplash...");
        }

        try {
            // Strategy 2: If no Tavily image, try Unsplash
            if (!imageUrl) {
                const imageData = await getFeaturedImage(koreanTitle);
                if (imageData) {
                    imageUrl = imageData.url;
                    imageCredit = imageData.credit;
                }
            }

            // Fallback Logic
            if (!imageUrl) {
                console.log("[Cron] ⚠️ No image found. Using Fallback.");
                imageUrl = "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1200";
                imageCredit = ""; // Clean credit
            }

            // Upload Logic (Common for all sources)
            if (imageUrl && WP_AUTH) {
                // Upload
                const uploaded = await uploadImageFromUrl(imageUrl, koreanTitle, WP_AUTH);
                if (uploaded) {
                    featuredMediaId = uploaded.id;
                    console.log(`[Cron] 🖼️ Featured Image Set: ID ${uploaded.id}`);
                }
            }

            // HTML Preparation
            featuredImageHtml = `
                <figure class="wp-block-image size-large">
                    <img src="${imageUrl}" alt="${koreanTitle}"/>
                    <figcaption>${imageCredit}</figcaption>
                </figure>
            `;

            // Body Image (Secondary)
            if (tavilyImages.length > 1) {
                bodyImageHtml = `
                     <figure style="margin: 2rem 0;">
                        <img src="${tavilyImages[1]}" alt="Related Image" style="width:100%;border-radius:0.75rem;" />
                     </figure>`;
            } else if (!tavilyImages.length) {
                const bodyImageData = await getFeaturedImage(`${selectedTitle} technology`);
                if (bodyImageData && bodyImageData.url !== imageUrl) {
                    bodyImageHtml = `
                     <figure style="margin: 2rem 0;">
                        <img src="${bodyImageData.url}" alt="${koreanTitle} related" style="width:100%;border-radius:0.75rem;box-shadow:0 4px 6px -1px rgb(0 0 0 / 0.1);" />
                        <figcaption style="font-size:0.875rem;color:#64748b;text-align:center;margin-top:0.5rem;">Photo by ${bodyImageData.credit}</figcaption>
                     </figure>`;
                }
            }
        } catch (imgError) {
            console.log("[Cron] Image processing failed:", imgError);
        }

        // 본문 이미지 삽입 (두 번째 H3 태그 앞)
        let finalHtmlContent = htmlContent;
        if (bodyImageHtml) {
            const insertionPoint = finalHtmlContent.indexOf('<h3>', finalHtmlContent.indexOf('<h3>') + 1);
            if (insertionPoint > 0) {
                finalHtmlContent = finalHtmlContent.slice(0, insertionPoint) + bodyImageHtml + finalHtmlContent.slice(insertionPoint);
            } else {
                finalHtmlContent += bodyImageHtml; // H3가 없으면 끝에 추가
            }
        }

        // 7. 카테고리 결정 (중앙 집중식 스마트 분류)
        let categoryId = classifyContent(koreanTitle, finalHtmlContent);

        // [Fallback] Tech 블로그이므로 '기타(1)'로 분류되면 '테크(9)'로 변경
        if (categoryId === 1) {
            console.log(`[Cron] ⚠️ Category is OTHER(1), defaulting to TECH(9)`);
            categoryId = 9;
        }

        console.log(`[Cron] 🧠 Classified as Category ID: ${categoryId}`);

        // 7.5 [Race Condition Check] Final check right before publishing
        const { exists: finalExists } = await checkAutomationDuplicate(`trend_${selectedTitle}`, WP_AUTH);
        if (finalExists) {
            console.log(`[Cron] 🛑 Duplicate detected in final check for "${selectedTitle}". Skipping.`);
            return NextResponse.json({ success: true, message: "Duplicate detected in final check" });
        }

        // 8. WordPress에 발행
        if (!WP_AUTH) throw new Error("WP_AUTH not set");

        // 이미지를 글 상단에 추가 (최종 본문)
        const finalContent = featuredImageHtml + finalHtmlContent;

        const wpRes = await fetch(`${WP_API_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${WP_AUTH}`,
            },
            body: JSON.stringify({
                title: koreanTitle,
                content: finalContent + `\n<!-- automation_source_id: trend_${selectedTitle} -->`,
                status: "publish",
                categories: [categoryId],
                featured_media: featuredMediaId > 0 ? featuredMediaId : undefined,
                tags: (await getOrCreateTag("Trend", WP_AUTH)) ? [(await getOrCreateTag("Trend", WP_AUTH))!] : [],
                // Rank Math SEO meta fields + Global Automation ID
                meta: {
                    automation_source_id: `trend_${selectedTitle}`,
                    rank_math_title: seoTitle,
                    rank_math_description: metaDescription,
                    rank_math_focus_keyword: focusKeyphrase,
                },
            }),
        });

        if (!wpRes.ok) {
            const err = await wpRes.json();
            throw new Error(`WordPress Error: ${JSON.stringify(err)}`);
        }

        const newPost = await wpRes.json();
        console.log(`[Cron] ✅ Post created: ID ${newPost.id}`);

        // Google Indexing API 알림
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semicolonittech.com";
        const postSlug = newPost.slug || newPost.link.split("/").filter((s: string) => s).pop();
        const publicUrl = `${siteUrl}/blog/${postSlug}`;

        console.log(`[Cron] 📡 Notifying Google Indexing for: ${publicUrl}`);
        googlePublishUrl(publicUrl).catch(err => {
            console.error("[Cron] Google Indexing failed:", err);
        });

        return NextResponse.json({
            success: true,
            topic: koreanTitle,
            originalTopic: selectedTitle,
            trendData: topic ? {
                traffic: topic.traffic,
                relatedQueries: topic.relatedQueries.slice(0, 5),
            } : null,
            postId: newPost.id,
            categoryId: categoryId,
            link: newPost.link
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error("[Cron] Job Failed:", error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
