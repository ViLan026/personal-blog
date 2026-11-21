/** Shared wrapper: a ruled, titled band of the About page. */
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="py-12 md:py-16"
    >
      <div className="container-page">
        <h2 id={`${id}-title`} className="section-title">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
