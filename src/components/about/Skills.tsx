import { Section } from "@/components/about/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

const ICONS: Record<string, IconName> = {
  Backend: "code",
  Database: "database",
  Tools: "tools",
  Additional: "plus",
};

export function Skills() {
  return (
    <Section id="skills" title="Technical Skills">
      <ul className="grid gap-6 sm:grid-cols-2">
        {profile.skills.map((group) => (
          <li key={group.label} className="md:p-4 p-2">
            <h3 className="flex items-center gap-2 text-lg font-bold">
              <Icon name={ICONS[group.label] ?? "code"} className="text-primary" />
              {group.label}
            </h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item} className="tag">
                  {item}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Section>
  );
}
