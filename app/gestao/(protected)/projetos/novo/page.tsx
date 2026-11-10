import Link from "next/link";
import { ProjectEditor } from "@/components/management/ProjectEditor";

export default function NewProjectPage() {
  return (
    <div className="mgmt-page">
      <div className="mgmt-kicker"><Link href="/gestao/projetos">Projects</Link><span>New project</span></div>
      <div className="mgmt-title"><div><span>Editorial record</span><h1>New project.</h1></div><p>Provisional form structure. Persistence, authentication and real uploads belong to the next phase.</p></div>
      <ProjectEditor />
    </div>
  );
}
