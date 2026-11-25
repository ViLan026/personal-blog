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
  images: string[];
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
  "Information Technology graduate seeking a Backend Developer position specializing in Java and Spring Boot. Experienced in developing REST APIs, implementing authentication and authorization, working with relational databases, and integrating AI services through academic and personal projects.",
  contact: {
    phone: "+84345694029",
    location: "Tan Thoi Hiep, Ho Chi Minh City",
    email: "vil782991@gmail.com",
    github: "https://github.com/ViLan026",
  },

education: {
  university: "University of Transport Ho Chi Minh City",
  major: "Information Technology",
  status: "Graduated",
  period: "2023–2026",
  gpa: "3.62",
},

  projects: [
    {
      name: "History Social Platform",
      tags: ["Graduation Project", "Individual Project"],
      period: "March – July 2026",
      description:
  "A social platform for sharing and discussing Vietnamese historical topics. The system supports post and comment interactions, content reporting and moderation, and AI-assisted content checking.",
   technologies: [
        "Java",
        "Spring Boot",
        "PostgreSQL",
        "Next.js",
        "Qdrant",
        "Cloudinary",
        "Postman",
      ],
      responsibilities: [
        "Designed a Modular Monolith architecture to organize backend functionality into business-oriented modules, improving code organization and separation of concerns",
        "Implemented JWT-based authentication and role-based access control with Spring Security, including refresh token rotation and revocation to manage authenticated sessions.",
        "Developed a personalized feed ranking algorithm combining post popularity, recency, and user-author affinity to prioritize relevant content in users' feeds.",
        "Built concurrent media upload workflows using Java thread pools and Cloudinary, with compensating cleanup to remove uploaded files when database persistence fails.",
      ],
      github: "https://github.com/ViLan026/history_social_backend",
      images: [
          "/images/projects/history-social1.png",
          "/images/projects/history-social2.png",
          "/images/projects/history-social3.png",
          "/images/projects/history-social4.png",
        ],
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
      images: [
        "/images/projects/findTutor1.png",
        "/images/projects/findTutor2.png",
        "/images/projects/findTutor3.png",
      ],  
    },
    {
  name: "ViCiHistory",
  tags: ["AI Riser Vietnam 2026", "Top 500 Participant"],
  period: "2026",
  description:
    "An AI-powered historical claim verification system that extracts claims and retrieves supporting evidence from Vietnamese historical sources. It uses hybrid retrieval to connect claims with relevant passages from source documents.",
  technologies: [
    "Python",
    "FastAPI",
    "Ollama",
    "Qwen2.5-3B",
    "Qdrant",
    "Hybrid Retrieval",
  ],
  responsibilities: [
    "Developed an AI-powered historical evidence retrieval system that extracts claims from text and retrieves relevant evidence from historical documents using hybrid search (semantic embeddings and BM25), Qdrant, and Google Gemini.",

  ],
  github: "https://github.com/ViLan026/ViCiHistory",
  images: [
    "/images/projects/semantic-search1.png",
    "/images/projects/semantic-search2.png",
  ],
},
    
  ] satisfies Project[],

  research: {
    paper: {
      title:
        "Source-Grounded Vietnamese Historical Claim Verification Using Evidence Retrieval and Large Language Models: A Study Based on Đại Việt Sử Ký Toàn Thư",
      highlights: [
        "First author",
        "Presented an oral report at AIIA 2026",
        "Revised and resubmitted after peer review",
      ],
      github: "https://github.com/ViLan026/ViHistFact",
    }
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
