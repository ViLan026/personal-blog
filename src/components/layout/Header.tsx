import Link from "next/link";
// import { MainNavigation } from "@/components/layout/MainNavigation";
import { profile } from "@/config/profile";
// import { siteConfig } from "@/config/site";

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-primary/90 backdrop-blur-sm">
      <div className="container-page relative flex min-h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="py-2 text-lg text-background font-extrabold tracking-tight hover:text-background/90"
        >
          {profile.name}
        </Link>
        {/* <MainNavigation items={siteConfig.nav} /> */}
      </div>
    </header>
  );
}
