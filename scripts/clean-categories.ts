import { getCategories } from "../src/lib/wp-api";
import { updateCategory, deleteCategory } from "../src/lib/wp-admin-api";

// Helper to remove HTML tags or just clear it
function cleanDescription(desc: string) {
    if (desc.includes("global-ui-fix-start")) {
        return "";
    }
    return desc;
}

async function main() {
    console.log("Fetching categories...");
    const categories = await getCategories();

    console.log(`Found ${categories.length} categories.`);

    // 1. Clean Descriptions
    for (const cat of categories) {
        if (cat.description && cat.description.includes("global-ui-fix-start")) {
            console.log(`Cleaning description for [${cat.name}] (ID: ${cat.id})...`);
            try {
                await updateCategory(cat.id, { description: "" });
                console.log("  -> Cleaned.");
            } catch (e) {
                console.error("  -> Failed:", e);
            }
        }
    }

    // 2. Identify Duplicates (Name based match: English vs Korean)
    // We want to keep: Tech, Gadgets, Apps, Software, AI (English preferred for slug)
    // Mapping:
    // 앱 -> Apps
    // 소프트웨어 -> Software
    // 테크 -> Tech
    // 가젯 -> Gadgets

    // Let's just list them first so the user can approve the merge plan.
    console.log("\n--- Category List ---");
    categories.forEach(c => {
        console.log(`[${c.id}] Name: ${c.name} / Slug: ${c.slug} / Count: ${c.count} / Parent: ${c.parent}`);
    });
}

main();
