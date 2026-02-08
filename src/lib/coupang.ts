/**
 * 쿠팡 파트너스 상품 관리 라이브러리
 * - 상품 CRUD 기능 (WordPress Custom Post Type 사용)
 * - 쿠팡 파트너스 링크 관리
 */

const WP_API_URL = process.env.WP_API_URL || "https://royalblue-anteater-980825.hostingersite.com/wp-json/wp/v2";
const WP_AUTH = process.env.WP_AUTH;

export interface Product {
    id?: number;
    name: string;
    price: number;
    imageUrl: string;
    affiliateUrl: string;
    category: string;
    description?: string;
    createdAt?: string;
}

// WordPress에서 상품은 일반 포스트의 특별한 카테고리로 저장
// "products" 카테고리 ID를 사용 (없으면 생성 필요)
const PRODUCTS_CATEGORY_SLUG = "products";

/**
 * 상품 목록 가져오기
 */
export async function getProducts(): Promise<Product[]> {
    try {
        // 먼저 products 카테고리 ID 찾기
        const categoryRes = await fetch(
            `${WP_API_URL}/categories?slug=${PRODUCTS_CATEGORY_SLUG}`,
            { cache: 'no-store' }
        );

        if (!categoryRes.ok) {
            console.error("[Products] Failed to fetch category");
            return [];
        }

        const categories = await categoryRes.json();
        if (categories.length === 0) {
            console.log("[Products] No products category found, returning empty");
            return [];
        }

        const categoryId = categories[0].id;

        // 해당 카테고리의 포스트 가져오기
        const res = await fetch(
            `${WP_API_URL}/posts?categories=${categoryId}&per_page=100&status=publish`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            console.error("[Products] Failed to fetch products");
            return [];
        }

        const posts = await res.json();

        return posts.map((post: any) => parseProductFromPost(post));
    } catch (error) {
        console.error("[Products] Error:", error);
        return [];
    }
}

/**
 * 단일 상품 가져오기
 */
export async function getProduct(id: number): Promise<Product | null> {
    try {
        const res = await fetch(`${WP_API_URL}/posts/${id}`, { cache: 'no-store' });

        if (!res.ok) return null;

        const post = await res.json();
        return parseProductFromPost(post);
    } catch {
        return null;
    }
}

/**
 * 상품 생성
 */
export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> {
    if (!WP_AUTH) {
        console.error("[Products] WP_AUTH not configured");
        return null;
    }

    try {
        // products 카테고리 ID 가져오기 (없으면 생성)
        const categoryId = await getOrCreateProductsCategory();

        if (!categoryId) {
            console.error("[Products] Failed to get/create products category");
            return null;
        }

        // 상품 정보를 포스트로 저장
        const res = await fetch(`${WP_API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${WP_AUTH}`
            },
            body: JSON.stringify({
                title: product.name,
                content: formatProductContent(product),
                status: 'publish',
                categories: [categoryId],
                meta: {
                    product_price: product.price,
                    product_image_url: product.imageUrl,
                    product_affiliate_url: product.affiliateUrl,
                    product_category: product.category
                }
            })
        });

        if (!res.ok) {
            const error = await res.text();
            console.error("[Products] Failed to create product:", error);
            return null;
        }

        const post = await res.json();
        return parseProductFromPost(post);
    } catch (error) {
        console.error("[Products] Error creating product:", error);
        return null;
    }
}

/**
 * 상품 수정
 */
export async function updateProduct(id: number, product: Partial<Product>): Promise<Product | null> {
    if (!WP_AUTH) return null;

    try {
        const updateData: any = {};

        if (product.name) updateData.title = product.name;
        if (product.price || product.imageUrl || product.affiliateUrl || product.category) {
            updateData.content = formatProductContent(product as Product);
        }

        const res = await fetch(`${WP_API_URL}/posts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${WP_AUTH}`
            },
            body: JSON.stringify(updateData)
        });

        if (!res.ok) return null;

        const post = await res.json();
        return parseProductFromPost(post);
    } catch {
        return null;
    }
}

/**
 * 상품 삭제
 */
export async function deleteProduct(id: number): Promise<boolean> {
    if (!WP_AUTH) return false;

    try {
        const res = await fetch(`${WP_API_URL}/posts/${id}?force=true`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Basic ${WP_AUTH}`
            }
        });

        return res.ok;
    } catch {
        return false;
    }
}

/**
 * 카테고리별 상품 가져오기
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
    const allProducts = await getProducts();
    return allProducts.filter(p => p.category === category);
}

// Helper: WordPress 포스트에서 상품 정보 파싱
function parseProductFromPost(post: any): Product {
    // content에서 메타 정보 추출 (HTML 파싱)
    const content = post.content?.rendered || '';

    // 정규식으로 데이터 추출
    const priceMatch = content.match(/data-price="(\d+)"/);
    const imageMatch = content.match(/data-image="([^"]+)"/);
    const urlMatch = content.match(/data-url="([^"]+)"/);
    const categoryMatch = content.match(/data-category="([^"]+)"/);

    return {
        id: post.id,
        name: post.title?.rendered || '',
        price: priceMatch ? parseInt(priceMatch[1]) : 0,
        imageUrl: imageMatch ? imageMatch[1] : '',
        affiliateUrl: urlMatch ? urlMatch[1] : '',
        category: categoryMatch ? categoryMatch[1] : 'general',
        createdAt: post.date
    };
}

// Helper: 상품 정보를 HTML content로 변환
function formatProductContent(product: Partial<Product>): string {
    return `
<!-- Product Data (DO NOT EDIT) -->
<div class="product-data" 
    data-price="${product.price || 0}"
    data-image="${product.imageUrl || ''}"
    data-url="${product.affiliateUrl || ''}"
    data-category="${product.category || 'general'}">
</div>

<div class="product-display">
    <img src="${product.imageUrl}" alt="${product.name}" />
    <p class="price">₩${(product.price || 0).toLocaleString()}</p>
    <a href="${product.affiliateUrl}" target="_blank" rel="noopener sponsored">쿠팡에서 보기</a>
</div>

${product.description || ''}
    `.trim();
}

// Helper: products 카테고리 ID 가져오기 (없으면 생성)
async function getOrCreateProductsCategory(): Promise<number | null> {
    try {
        // 먼저 기존 카테고리 확인
        const res = await fetch(`${WP_API_URL}/categories?slug=${PRODUCTS_CATEGORY_SLUG}`);
        const categories = await res.json();

        if (categories.length > 0) {
            return categories[0].id;
        }

        // 없으면 생성
        if (!WP_AUTH) return null;

        const createRes = await fetch(`${WP_API_URL}/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${WP_AUTH}`
            },
            body: JSON.stringify({
                name: 'Products',
                slug: PRODUCTS_CATEGORY_SLUG,
                description: '쿠팡 파트너스 상품'
            })
        });

        if (!createRes.ok) return null;

        const newCategory = await createRes.json();
        return newCategory.id;
    } catch {
        return null;
    }
}
