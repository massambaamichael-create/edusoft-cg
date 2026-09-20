import WorkspaceGuard from "@/components/WorkspaceGuard";
import WorkspaceSidebar from "@/components/WorkspaceSidebar";

export default function RHLayout({children}:{children:React.ReactNode}) {
 return <WorkspaceGuard allowedRoles={["Directeur","RH"]}><div className="min-h-screen bg-slate-50"><WorkspaceSidebar space="rh"/><div className="ml-[270px] min-h-screen">{children}</div></div></WorkspaceGuard>;
}
