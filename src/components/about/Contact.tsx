import { Section } from "@/components/about/Section";
import { Icon, type IconName } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

interface ContactItem {
  icon: IconName;
  label: string;
  text: string;
  href?: string;
  external?: boolean;
}

export function Contact() {
  const { contact } = profile;

  const items: ContactItem[] = [
    { icon: "mail", label: "Email", text: contact.email, href: `mailto:${contact.email}` },
    { icon: "phone", label: "Phone", text: contact.phone, href: `tel:${contact.phone}` },
    { icon: "pin", label: "Location", text: contact.location },
    {
      icon: "github",
      label: "GitHub",
      text: contact.github.replace(/^https?:\/\//, ""),
      href: contact.github,
      external: true,
    },
  ];

  return (
    <Section id="contact" title="Contact">
      <dl className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-4 p-5">
            <Icon name={item.icon} size={24} className="mt-0.5 text-primary" />
            <div className="min-w-0">
              <dt className="font-bold">{item.label}</dt>
              <dd className="mt-1 break-words">
                {item.href ? (
                  <a
                    className="link"
                    href={item.href}
                    {...(item.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {item.text}
                  </a>
                ) : (
                  item.text
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </Section>
  );
}
