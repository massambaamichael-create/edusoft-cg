import WorkspaceGuard from "@/components/WorkspaceGuard";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function SanteLayout({children}:{children:React.ReactNode}) {
 return <WorkspaceGuard allowedRoles={["Directeur","Infirmerie"]}><div className="min-h-screen bg-slate-50"><WorkspaceSidebar space="sante"/><div className="ml-[270px] min-h-screen">{children}</div></div></WorkspaceGuard>;
}
