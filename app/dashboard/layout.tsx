import WorkspaceGuard from "@/components/WorkspaceGuard";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function DashboardLayout({children}:{children:React.ReactNode}) {
 return <WorkspaceGuard allowedRoles={["Directeur"]} fallbackPath="/enseignant"><div className="min-h-screen bg-[#080B16] text-white"><WorkspaceSidebar space="direction"/><div className="ml-[270px] min-h-screen">{children}</div></div></WorkspaceGuard>;
}
