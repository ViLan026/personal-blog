import { Section } from "@/components/about/Section";
import { Icon } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

export function Research() {
    // const { paper, activities } = profile.research;
    const { paper } = profile.research;

    return (
        <Section id="research" title="Research">
                <article className=" p-2 md:p-4">
                    <h3 className="text-xl font-bold leading-snug md:text-2xl">
                        {paper.title}
                    </h3>
                    <ul className="mt-4 list-disc space-y-1 pl-5 marker:text-primary">
                        {paper.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                        ))}
                    </ul>
                    <a
                        className="btn-outline btn-sm mt-6"
                        href={paper.github}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Icon name="github" size={18} />
                        <span>
                            View on GitHub<span className="sr-only"></span>
                        </span>
                        <Icon name="external" size={16} />
                    </a>
                </article>

                {/* {activities.map((activity) => (
          <article key={activity.name} className="p-2 md:p-4">
            <Icon name="award" size={32} className="text-primary" />
            <h3 className="mt-4 text-xl font-bold leading-snug">{activity.name}</h3>
            <p className="mt-2 font-semibold text-primary">{activity.result}</p>
          </article>
        ))} */}
        </Section>
    );
}
