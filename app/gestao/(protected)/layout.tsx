import { ManagementShell } from "@/components/management/ManagementShell";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return <ManagementShell>{children}</ManagementShell>;
}
