import Link from "next/link";
import type { ManagementProject } from "@/lib/management/projects";

export function ProjectTable({ projects }: { projects: ManagementProject[] }) {
  return (
    <div className="mgmt-project-table" role="table" aria-label="Projects">
      <div className="mgmt-project-row mgmt-project-head" role="row">
        <span>Thumbnail</span><span>Title</span><span>Discipline</span><span>Status</span><span>Featured</span><span>Updated</span><span>Edit</span>
      </div>
      {projects.map((project) => (
        <div className="mgmt-project-row" role="row" key={project.id}>
          <span><img src={project.thumbnail} alt="" /></span>
          <strong>{project.title}</strong>
          <span>{project.discipline}</span>
          <span>{project.status}</span>
          <span>{project.featured ? "Yes" : "No"}</span>
          <time>{project.updated}</time>
          <Link href={`/gestao/projetos/novo?edit=${project.id}`}>Edit →</Link>
        </div>
      ))}
    </div>
  );
}
