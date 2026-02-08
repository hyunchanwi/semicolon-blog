
import Link from "next/link";
import Image from "next/image";
import { WPPost, getFeaturedImageUrl, stripHtml, decodeHtmlEntities } from "@/lib/wp-api";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface PostCardProps {
    post: WPPost;
}

export const PostCard = ({ post }: PostCardProps) => {
    // 1. Featured Image
    let imageUrl = getFeaturedImageUrl(post);

    // 2. Fallback: Content Image (First <img> tag)
    if (!imageUrl && post.content?.rendered) {
        // Match src inside img tag, supporting single or double quotes
        const imgMatch = post.content.rendered.match(/<img[^>]+src=['"]([^'"]+)['"]/);
        if (imgMatch) {
            imageUrl = imgMatch[1];
        }
    }

    const excerpt = stripHtml(post.excerpt.rendered).slice(0, 100) + "...";
    const date = new Date(post.date).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    // Extract category name with Korean mapping
    const rawCategoryName = post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Tech";
    const categoryNameMap: Record<string, string> = {
        'Uncategorized': '기타',
        'uncategorized': '기타',
        'Tech': '테크',
        'AI': 'AI',
        'Gadget': '가젯',
        'Software': '소프트웨어',
        'Apps': '앱',
    };
    const categoryName = categoryNameMap[rawCategoryName] || rawCategoryName;

    return (
        <Link href={`/blog/${post.slug}`}>
            <Card className="group h-full overflow-hidden rounded-2xl border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-slate-100">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={decodeHtmlEntities(stripHtml(post.title.rendered))}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                            <span className="text-2xl">Semicolon;</span>
                        </div>
                    )}

                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm z-10">
                        {categoryName}
                    </div>
                </div>

                {/* Content */}
                <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {decodeHtmlEntities(stripHtml(post.title.rendered))}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 mb-4">
                        {excerpt}
                    </p>
                </CardContent>
            </Card>
        </Link>
    );
};
