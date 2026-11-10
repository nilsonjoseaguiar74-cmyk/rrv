import { AdminSessionShell } from "@/components/admin/AdminSessionShell";

export const dynamic = "force-dynamic";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminSessionShell>{children}</AdminSessionShell>;
}
