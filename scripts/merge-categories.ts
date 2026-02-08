import { getCategories } from "../src/lib/wp-api";
import { updateCategory, deleteCategory } from "../src/lib/wp-admin-api";

async function main() {
    console.log("--- Category Merge Start ---");
    const categories = await getCategories();

    // 1. Define Targets
    // Empty KR categories to DELETE
    const emptyKrIds = [18, 19, 20, 21, 22, 23]; // From previous list
    // Parent Categories to DELETE (after moving children)
    const parentIds = [16, 17]; // EN, KR

    // Active English Categories to RENAME & MOVE TO ROOT
    const renameMap: Record<number, string> = {
        2: "앱",            // Apps
        4: "가젯",          // Gadget
        5: "게임",          // Games
        8: "소프트웨어",     // Software
        9: "테크",          // Technology
        15: "AI",          // AI (Keep as AI or AI 뉴스?) -> "AI" is fine
    };

    // 2. Delete Empty KR Categories
    console.log("1. Deleting empty KR categories...");
    for (const id of emptyKrIds) {
        try {
            await deleteCategory(id);
            console.log(`  -> Deleted ID ${id}`);
        } catch (e) {
            console.log(`  -> Failed to delete ${id} (might not exist):`, (e as any).message);
        }
    }

    // 3. Rename & Move Active Categories
    console.log("2. Renaming & Moving active categories...");
    for (const [idStr, newName] of Object.entries(renameMap)) {
        const id = parseInt(idStr);
        try {
            // Update Name to Korean, Parent to 0 (Root)
            await updateCategory(id, {
                name: newName,
                parent: 0,
                description: "" // Ensure description is clean
            });
            console.log(`  -> Updated ID ${id} to "${newName}" (Parent: 0)`);
        } catch (e) {
            console.error(`  -> Failed to update ID ${id}:`, (e as any).message);
        }
    }

    // 4. Delete Parents (EN, KR)
    console.log("3. Deleting Parent Containers (EN, KR)...");
    for (const id of parentIds) {
        try {
            // Determine if safe (check if children exist? updateCategory moves them, so should be safe)
            await deleteCategory(id);
            console.log(`  -> Deleted Parent ID ${id}`);
        } catch (e) {
            console.log(`  -> Failed/Skipped Parent ${id}:`, (e as any).message);
        }
    }

    console.log("--- Merge Complete ---");
}

main();
