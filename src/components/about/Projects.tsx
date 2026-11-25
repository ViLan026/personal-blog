import { Section } from "@/components/about/Section";
import { Icon } from "@/components/ui/Icon";
import { profile } from "@/config/profile";
import Image from "next/image";
import { ProjectImageGallery } from "@/components/about/ProjectImageGallery";

export function Projects() {
    return (
        <Section id="projects" title="Projects">
            <ul className="grid gap-8">
                {profile.projects.map((project) => (
                    <li key={project.name}>
                        <article className="md:p-4 p-2">
                            <header className="flex flex-wrap items-center justify-between gap-4">
                                {/* Tên dự án bên trái */}
                                <h3 className="text-2xl font-bold leading-snug">
                                    {project.name}
                                </h3>

                                {/* Cụm thông tin bên phải: Tag | Period */}
                                <div className="flex items-center gap-3 font-medium">
                                    <ul className="flex flex-wrap items-center gap-2" aria-label="Project type">
                                        {project.tags.map((tag) => (
                                            // <li key={tag} className="tag-solid">
                                            <li key={tag}>
                                                
                                                {tag}
                                                <span className="pr-3 pl-6 text-gray-400" aria-hidden="true">|</span>
                                            </li>
                                        ))} 
                                    </ul>

                                    {/* Dấu gạch dọc ngăn cách */}
                                    {/* <span className="text-gray-400" aria-hidden="true">|</span> */}

                                    {/* Thời gian */}
                                    <p className="whitespace-nowrap">{project.period}</p>
                                </div>
                            </header>

                            <p className="mt-4   leading-relaxed">
                                {project.description}
                            </p>

                            <h4 className="mt-6 font-bold">Technologies</h4>
                            <ul className="mt-2 flex flex-wrap gap-2">
                                {project.technologies.map((tech) => (
                                    <li key={tech} className="tag">
                                        {tech}
                                    </li>
                                ))}
                            </ul>

                            <h4 className="mt-6 font-bold">Responsibilities</h4>
                            <ul className="mt-2   list-disc space-y-2 pl-5 marker:text-primary">
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
                                    View on GitHub
                                    <span className="sr-only"></span>
                                </span>
                                <Icon name="external" size={16} />
                            </a>
                            {project.images && (
                                <ProjectImageGallery
                                    projectName={project.name}
                                    images={project.images}
                                />
                            )}
                        </article>
                    </li>
                ))}
            </ul>
        </Section>
    );
}
