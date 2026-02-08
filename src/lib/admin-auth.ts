// Admin email list for authorization
const ADMIN_EMAILS = [
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    "hyunchan09@gmail.com",
    "wihyunchan@naver.com",
    "contactsemicolonblog@gmail.com"
].filter((email): email is string => !!email);

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return ADMIN_EMAILS.includes(email);
}
