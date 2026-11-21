import { profile } from "@/config/profile";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t-2 border-primary">
      <div className="container-page flex flex-col gap-3 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {profile.name}
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          <li>
            <a>
              Ho Chi Minh City, Vietnam
            </a>
          </li>
          <li>
            <a className="link link-target" href={`mailto:${profile.contact.email}`}>
              Email
            </a>
          </li>
          <li>
            <a
              className="link link-target"
              href={profile.contact.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
