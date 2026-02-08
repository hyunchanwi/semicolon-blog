import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen">
                <AdminSidebar />
                <main className="flex-1 bg-slate-50 p-8">
                    {children}
                </main>
            </div>
        </AdminGuard>
    );
}
