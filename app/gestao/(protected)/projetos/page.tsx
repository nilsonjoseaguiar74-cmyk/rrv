import Link from "next/link";
import { ProjectTable } from "@/components/management/ProjectTable";
import { temporaryProjects } from "@/lib/management/projects";

export default function ProjectsPage() {
  return (
    <div className="mgmt-page">
      <div className="mgmt-kicker"><span>Projects</span><span>{temporaryProjects.length} temporary records</span></div>
      <div className="mgmt-title mgmt-title-row">
        <div><span>Content index</span><h1>Projects.</h1></div>
        <Link className="mgmt-primary-link" href="/gestao/projetos/novo">New project <b>＋</b></Link>
      </div>
      <ProjectTable projects={temporaryProjects} />
    </div>
  );
}
