import NextAuth, { NextAuthOptions, User, Account, Profile } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import NaverProvider from "next-auth/providers/naver";

// Extended types for WordPress integration
interface ExtendedUser extends User {
    wpId?: number;
}

interface ExtendedToken extends JWT {
    wpId?: number;
}

interface ExtendedSession extends Session {
    user: {
        id?: string;
        wpId?: number;
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

// Kakao profile type
interface KakaoProfile {
    id: number;
    properties?: {
        nickname?: string;
        profile_image?: string;
    };
    kakao_account?: {
        email?: string;
    };
}

// Kakao Provider (custom)
const KakaoProvider = {
    id: "kakao",
    name: "Kakao",
    type: "oauth" as const,
    authorization: {
        url: "https://kauth.kakao.com/oauth/authorize",
        params: { scope: "profile_nickname profile_image" },
    },
    token: "https://kauth.kakao.com/oauth/token",
    userinfo: "https://kapi.kakao.com/v2/user/me",
    clientId: process.env.KAKAO_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET,
    profile(profile: KakaoProfile) {
        return {
            id: String(profile.id),
            name: profile.properties?.nickname,
            email: profile.kakao_account?.email,
            image: profile.properties?.profile_image,
        };
    },
};

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        NaverProvider({
            clientId: process.env.NAVER_CLIENT_ID!,
            clientSecret: process.env.NAVER_CLIENT_SECRET!,
        }),
        KakaoProvider,
    ],
    callbacks: {
        async signIn({ user }: { user: ExtendedUser; account: Account | null; profile?: Profile }) {
            // When user signs in, sync with WordPress
            if (user?.email) {
                try {
                    const { getUserByEmail, createWPUser } = await import("@/lib/wp-admin-api");
                    let wpUser = await getUserByEmail(user.email);

                    if (!wpUser) {
                        console.log(`Creating new WP user for ${user.email}`);
                        wpUser = await createWPUser(user.email, user.name || "Member");
                    }

                    user.wpId = wpUser.id;
                    return true;
                } catch (e) {
                    console.error("WP Sync Error:", e);
                    return true; // Allow login even if sync fails (graceful degradation)
                }
            }
            return true;
        },
        async jwt({ token, user }: { token: ExtendedToken; user?: ExtendedUser }) {
            // Initial sign in, 'user' contains the wpId we attached above
            if (user?.wpId) {
                token.wpId = user.wpId;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: ExtendedToken }) {
            // Add user ID to session
            if (session.user && token.sub) {
                (session.user as ExtendedSession["user"]).id = token.sub; // Provider ID (Google/Kakao)
                (session.user as ExtendedSession["user"]).wpId = token.wpId; // WordPress ID
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

