import { Section } from "@/components/about/Section";
import { Icon } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

export function Education() {
  const { education } = profile;

  return (
    <Section id="education" title="Education">
      <article className="flex gap-4 p-2 md:gap-6 md:p-4">
        <Icon name="graduation" size={32} className="mt-1 text-primary" />
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-snug md:text-2xl">{education.university}</h3>
          <p className="mt-2 text-lg">{education.major}</p>
          <p className="mt-1 font-medium">
            {education.status}
            <span aria-hidden="true"> · </span>
            <span className="sr-only">, </span>
            {education.period}
          </p>
          <p className="mt-4 inline-block border-2 border-primary px-3 py-1 font-semibold text-primary">
            GPA {education.gpa}
          </p>
        </div>
      </article>
    </Section>
  );
}
