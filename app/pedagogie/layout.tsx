import WorkspaceGuard from "@/components/WorkspaceGuard";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function PedagogieLayout({children}:{children:React.ReactNode}) {
 return <WorkspaceGuard allowedRoles={["Directeur","Directeur des Études"]}><div className="min-h-screen bg-slate-50"><WorkspaceSidebar space="pedagogie"/><div className="ml-[270px] min-h-screen">{children}</div></div></WorkspaceGuard>;
}
