interface SectionHeadingProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  inverse?: boolean;
}

export function SectionHeading({ id, eyebrow, title, description, inverse = false }: SectionHeadingProps) {
  return (
    <header className={`section-heading${inverse ? " section-heading--inverse" : ""}`}>
      <p className="eyebrow">{eyebrow}</p>
      <div>
        <h2 id={id}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
    </header>
  );
}
