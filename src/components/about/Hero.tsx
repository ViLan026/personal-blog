import { ProfilePhoto } from "@/components/about/ProfilePhoto";
import { Icon } from "@/components/ui/Icon";
import { profile } from "@/config/profile";

/** Introduction and professional summary on the left, photo on the right. */
export function Hero() {
  const { contact, photo } = profile;

  return (
    <section aria-labelledby="intro-title" className="py-12 md:py-20">
      <div className="container-page grid items-center gap-12 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
        <div>
          <p className="tag-solid font-mono uppercase tracking-widest">{profile.title}</p>
          <h1
            id="intro-title"
            className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          >
            {profile.name}
          </h1>

          <p className="mt-6 max-w-prose text-lg leading-relaxed">{profile.summary}</p>

          {/* <p className="mt-6 flex items-center gap-2 font-medium">
            <Icon name="pin" />
            <span>{contact.location}</span>
          </p> */}

          <div className="mt-8 flex flex-wrap gap-3">
            <a className="btn" href={`mailto:${contact.email}`}>
              <Icon name="mail" />
              Email me
            </a>
            <a
              className="btn-outline"
              href={contact.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="github" />
              GitHub profile
            </a>
            {/* <a className="btn-outline" href="#projects">
              View projects
            </a> */}
          </div>
        </div>

        <ProfilePhoto src={photo.src} alt={photo.alt} initials={photo.initials} />
      </div>
    </section>
  );
}
