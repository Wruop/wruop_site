// Facts shared by both languages. Only real data goes here.

export const siteUrl = "https://w-3f.com";

/**
 * Contact channels. Fill each one with the real value to make its button appear.
 * While every value is null, the contact section shows an honest "being set up" note
 * and no contact button is rendered (no dead links).
 */
export const contact: { github: string | null; upwork: string | null; email: string | null } = {
  github: null, // e.g. "https://github.com/your-user"
  upwork: null, // e.g. "https://www.upwork.com/freelancers/~your-id"
  email: null, // e.g. "you@example.com"
};

/** Skills the developer can demonstrate. No levels on purpose. */
export const stack = [
  "HTML5",
  "CSS3",
  "JavaScript",
  "Responsive Design",
  "Web Development",
  "Front-End Development",
  "Landing Pages",
  "Web Applications",
  "React",
  "API Integration",
  "Git",
  "Supabase",
  "Godot",
  "Game Development",
  "Blender",
];

/** Stack per featured project, same order as the dictionaries' `work.projects`. */
export const projectStack: Record<string, string[]> = {
  "interface-repair-lab": ["HTML", "CSS", "TypeScript", "Playwright"],
  "fieldline-parts": ["Next.js", "TypeScript", "CSS Modules"],
  "parts-finder": ["React", "TypeScript"],
};

export const gravityExperimentPath = "/lab/gravity/";
