import { Section } from "@/components/about/Section";
import { Icon } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

export function Projects() {
  return (
    <Section id="projects" title="Projects">
      <ul className="grid gap-8">
        {profile.projects.map((project) => (
          <li key={project.name}>
            <article className="md:p-4 p-2">
              <header>
                <ul className="flex flex-wrap gap-2" aria-label="Project type">
                  {project.tags.map((tag) => (
                    <li key={tag} className="tag-solid">
                      {tag}
                    </li>
                  ))}
                </ul>
                <h3 className="mt-4 text-2xl font-bold leading-snug">{project.name}</h3>
                <p className="mt-1 font-medium">{project.period}</p>
              </header>

              <p className="mt-4 max-w-3xl leading-relaxed">{project.description}</p>

              <h4 className="mt-6 font-bold">Technologies</h4>
              <ul className="mt-2 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <li key={tech} className="tag">
                    {tech}
                  </li>
                ))}
              </ul>

              <h4 className="mt-6 font-bold">Responsibilities</h4>
              <ul className="mt-2 max-w-3xl list-disc space-y-2 pl-5 marker:text-primary">
                {project.responsibilities.map((item) => (
                  <li key={item} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>

              <a
                className="btn-outline btn-sm mt-6"
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="github" size={18} />
                <span>
                  View on GitHub<span className="sr-only">: {project.name}</span>
                </span>
                <Icon name="external" size={16} />
              </a>
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
