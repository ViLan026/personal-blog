/**
 * Everything shown on the About page lives here. Edit this file to update the
 * site; no component needs to change.
 *
 * Content comes from the owner's CV. Do not add qualifications, metrics or
 * rankings that the CV does not state.
 */

export interface Project {
  name: string;
  /** Short labels such as "Graduation Project" or "Team of 4". */
  tags: string[];
  period: string;
  description: string;
  technologies: string[];
  responsibilities: string[];
  github: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export const profile = {
  name: "VI THI LAN",
  title: "BACKEND DEVELOPER FRESHER",

  /** Static file in /public. Add the photo as public/me.png. */
  photo: {
    src: "/me.png",
    alt: "Portrait of Vi Thi Lan",
    initials: "VL",
  },

  /** Editable professional summary. */
  summary:
    "Information Technology student who has completed all coursework, seeking an entry-level Backend Developer position. Hands-on experience with Java, Spring Boot, REST APIs, relational databases, authentication/authorization, and AI service integration through academic projects.",

  contact: {
    phone: "+84345694029",
    location: "Tan Thoi Hiep, Ho Chi Minh City",
    email: "vil782991@gmail.com",
    github: "https://github.com/ViLan026",
  },

  education: {
    university: "University of Transport Ho Chi Minh City",
    major: "Information Technology",
    /** Update this before publishing if the situation has changed. */
    status: "Graduation Pending",
    period: "2023–2026",
    gpa: "3.62",
  },

  projects: [
    {
      name: "History Social Platform",
      tags: ["Graduation Project", "Individual Project"],
      period: "March 2026 – July 2026",
      description:
        "A social networking platform for sharing and discussing historical content, with user interaction features, content moderation, and AI-assisted content checking.",
      technologies: [
        "Java",
        "Spring Boot",
        "PostgreSQL",
        "Next.js",
        "FastAPI",
        "Qdrant",
        "Cloudinary",
        "Postman",
      ],
      responsibilities: [
        "Developed a modular Spring Boot backend by organizing business domains into feature-based modules and separating API, service, and data access layers.",
        "Developed RESTful APIs for core social features, including post creation, comments/replies, user reports, notifications, admin review actions, and content status management.",
        "Implemented JWT-based authentication and role-based authorization using Spring Security to protect user and admin APIs.",
        "Integrated the Spring Boot backend with a FastAPI AI service for background AI content checking.",
      ],
      github: "https://github.com/ViLan026/history_social_backend",
    },
    {
      name: "Online Private Tutors Finder System",
      tags: ["Team of 4"],
      period: "October 2025 – December 2025",
      description:
        "A web-based platform that connects learners/parents with tutors through tutor search, class booking, tutor approval, e-books, and real-time communication.",
      technologies: ["Java", "Spring Boot", "MySQL"],
      responsibilities: [
        "Designed a layered Spring Boot architecture with Controller, Service, Repository, DTO, Mapper, and Entity layers to keep APIs, business logic, and data access maintainable.",
        "Developed RESTful APIs for tutor approval, profile management, and e-book CRUD.",
        "Built admin APIs for managing user accounts and approving tutor profiles.",
      ],
      github:
        "https://github.com/VoDuyBao-dev/Online-Private-Tutors-Finder-System-Backend",
    },
  ] satisfies Project[],

  research: {
    paper: {
      title:
        "Source-Grounded Vietnamese Historical Claim Verification Using Evidence Retrieval and Large Language Models: A Study Based on Đại Việt Sử Ký Toàn Thư",
      year: "2026",
      highlights: [
        "First author",
        "Presented an oral report at AIIA 2026",
        "Revised and resubmitted after peer review",
      ],
    },
    activities: [
      {
        name: "AI Riser Vietnam 2026",
        result: "Top 500 Participant",
      },
    ],
  },

  skills: [
    {
      label: "Backend",
      items: [
        "Java",
        "Spring Boot",
        "Spring Security",
        "Spring Data JPA",
        "Hibernate",
        "REST API",
        "JWT",
      ],
    },
    { label: "Database", items: ["PostgreSQL", "MySQL"] },
    { label: "Tools", items: ["Git", "GitHub", "Postman"] },
    { label: "Additional", items: ["FastAPI", "Qdrant"] },
  ] satisfies SkillGroup[],
};

export type Profile = typeof profile;
