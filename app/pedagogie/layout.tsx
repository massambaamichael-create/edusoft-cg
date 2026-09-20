import WorkspaceGuard from "@/components/WorkspaceGuard";

export default function PedagogieLayout({children}:{children:React.ReactNode}) {
 return <WorkspaceGuard allowedRoles={["Directeur","Directeur des Études"]}>{children}</WorkspaceGuard>;
}
