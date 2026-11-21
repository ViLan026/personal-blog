import type { Metadata } from "next";
import { Contact } from "@/components/about/Contact";
import { Education } from "@/components/about/Education";
import { Hero } from "@/components/about/Hero";
import { Projects } from "@/components/about/Projects";
import { Research } from "@/components/about/Research";
import { Skills } from "@/components/about/Skills";
import { profile } from "@/config/profile";

// No page title: the root layout's default ("<name> | Backend Developer") applies.
export const metadata: Metadata = {
    description: profile.summary,
    alternates: { canonical: "/" },
    openGraph: { url: "/", description: profile.summary }
};

export default function AboutPage() {
    return (
        <>
            <Hero />
            <Projects />
            <Research />
            <Education />
            <Skills />
            {/* <Contact /> */}
        </>
    );
}
