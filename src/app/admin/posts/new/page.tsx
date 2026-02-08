import { PostEditor } from "@/components/admin/PostEditor";
import { getCategories } from "@/lib/wp-api";

export default async function NewPostPage() {
    const categories = await getCategories();

    return (
        <PostEditor
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
    );
}
