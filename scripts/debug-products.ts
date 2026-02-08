
import { getProducts } from "@/lib/coupang";

async function checkProducts() {
    console.log("Fetching products from DB...");
    const products = await getProducts();
    console.log(`Found ${products.length} products.`);
    products.forEach(p => {
        console.log(`- [${p.id}] ${p.name} (${p.category})`);
    });
}

checkProducts();
