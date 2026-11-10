"use client";

import { SyntheticEvent, useState } from "react";

const textFields = [
  ["Title", "title", "text"],
  ["Slug", "slug", "text"],
  ["Eyebrow", "eyebrow", "text"],
  ["Case title", "caseTitle", "text"],
  ["Client", "client", "text"],
  ["Year", "year", "number"],
  ["Cover image", "coverImage", "url"],
  ["Secondary image", "secondaryImage", "url"],
  ["Home order", "homeOrder", "number"],
  ["SEO title", "seoTitle", "text"],
] as const;

const areaFields = [
  ["Summary", "summary"],
  ["Description", "description"],
  ["Challenge", "challenge"],
  ["Response", "response"],
  ["System", "system"],
  ["SEO description", "seoDescription"],
] as const;

export function ProjectEditor() {
  const [feedback, setFeedback] = useState("");

  function handleSubmit(event: SyntheticEvent, action: "draft" | "publish") {
    event.preventDefault();
    setFeedback(action === "publish" ? "Project prepared for publishing." : "Draft prepared locally.");
  }

  return (
    <form className="mgmt-editor">
      <section>
        <div className="mgmt-editor-index"><span>01</span><h2>Project data</h2></div>
        <div className="mgmt-form-grid">
          {textFields.slice(0, 3).map(([label, name, type]) => <label key={name}><span>{label}</span><input name={name} type={type} /></label>)}
          <label><span>Discipline</span><select name="discipline" defaultValue="growth"><option value="growth">Growth</option><option value="experience">Experience</option><option value="engineering">Engineering</option></select></label>
        </div>
      </section>

      <section>
        <div className="mgmt-editor-index"><span>02</span><h2>Case content</h2></div>
        <div className="mgmt-form-grid">
          {textFields.slice(3, 6).map(([label, name, type]) => <label key={name}><span>{label}</span><input name={name} type={type} /></label>)}
          {areaFields.slice(0, 5).map(([label, name]) => <label className="mgmt-field-wide" key={name}><span>{label}</span><textarea name={name} rows={4} /></label>)}
        </div>
      </section>

      <section>
        <div className="mgmt-editor-index"><span>03</span><h2>Media & display</h2></div>
        <div className="mgmt-form-grid">
          {textFields.slice(6, 9).map(([label, name, type]) => <label key={name}><span>{label}</span><input name={name} type={type} /></label>)}
          <label className="mgmt-check"><input type="checkbox" name="featured" /><span>Featured</span></label>
          <label><span>Status</span><select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        </div>
      </section>

      <section>
        <div className="mgmt-editor-index"><span>04</span><h2>SEO</h2></div>
        <div className="mgmt-form-grid">
          {textFields.slice(9).map(([label, name, type]) => <label key={name}><span>{label}</span><input name={name} type={type} /></label>)}
          {areaFields.slice(5).map(([label, name]) => <label className="mgmt-field-wide" key={name}><span>{label}</span><textarea name={name} rows={4} /></label>)}
        </div>
      </section>

      <div className="mgmt-editor-actions">
        <span role="status">{feedback}</span>
        <div>
          <button type="submit" onClick={(event) => handleSubmit(event, "draft")}>Save draft</button>
          <button className="mgmt-publish" type="submit" onClick={(event) => handleSubmit(event, "publish")}>Publish</button>
        </div>
      </div>
    </form>
  );
}
