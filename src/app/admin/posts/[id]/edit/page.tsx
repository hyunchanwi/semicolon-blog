import { PostEditor } from "@/components/admin/PostEditor";
import { getPostById } from "@/lib/wp-admin-api";
import { getCategories, decodeHtmlEntities, stripHtml } from "@/lib/wp-api";
import { notFound } from "next/navigation";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
    const { id } = await params;
    const postId = parseInt(id, 10);

    const [post, categories] = await Promise.all([
        getPostById(postId),
        getCategories(),
    ]);

    if (!post) {
        notFound();
    }

    return (
        <PostEditor
            initialData={{
                id: post.id,
                title: decodeHtmlEntities(post.title.rendered),
                content: post.content.rendered,
                excerpt: post.excerpt.rendered,
                status: post.status,
                categories: post.categories,
                featured_media_url: post._embedded?.['wp:featuredmedia']?.[0]?.source_url,
            }}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
    );
}
