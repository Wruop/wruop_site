// English copy. pt-br.ts must match this shape exactly (checked by TypeScript).
const en = {
  meta: {
    title: "Weider · Web developer for fixes, landing pages and small web apps",
    description:
      "Independent developer. Website fixes, landing pages, small web applications, creative frontend and game prototypes in Godot and Blender.",
    ogAlt: "W. — Weider's cat and claw-mark logo",
  },
  a11y: {
    skip: "Skip to content",
    home: "Weider, home",
    primaryNav: "Primary",
    language: "Language",
    switchTo: "Switch language to Brazilian Portuguese",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    newTab: "opens in a new tab",
  },
  nav: {
    services: "Services",
    work: "Work",
    lab: "Lab",
    about: "About",
    contact: "Contact",
  },
  hero: {
    eyebrow: "Weider · independent developer",
    title: "Built to work. Made to move.",
    lead:
      "I fix broken interfaces, build landing pages and small web apps, and prototype interactive ideas, from responsive CSS to Godot.",
    ctaPrimary: "Explore my work",
    ctaSecondary: "Start a project",
    stageLabel: "Particle cat",
    stageStatus: "Interactive 3D version in development",
    stageAlt: "The W. logo: a W drawn with claw marks and a cat's head, ivory with orange edges.",
  },
  services: {
    kicker: "Services & skills",
    title: "What I can help you build.",
    items: [
      {
        name: "Interface fixes",
        points: ["Responsive layout fixes", "CSS corrections", "Broken navigation", "Small JavaScript bugs"],
      },
      {
        name: "Landing pages",
        points: ["Responsive business websites", "Product and service pages", "Forms and interactive sections"],
      },
      {
        name: "Small web applications",
        points: ["Search tools", "Filters", "Dashboards", "Internal utilities"],
      },
      {
        name: "Creative frontend",
        points: ["Interactive visual systems", "Custom motion", "Real-time experiences"],
      },
      {
        name: "Game prototyping",
        points: ["Godot", "Gameplay mechanics", "Blender assets", "Interactive prototypes"],
      },
    ],
    stackLabel: "Tools I work with",
  },
  work: {
    kicker: "Featured projects",
    title: "Working demos, honest status.",
    intro:
      "Three demos built to show the work I offer. They use fictional data and are released one at a time, each with a case study.",
    stackLabel: "Stack",
    statusLabel: "Status",
    problemLabel: "Problem",
    status: { building: "In development", planned: "Planned", live: "Live" },
    projects: [
      {
        id: "interface-repair-lab",
        name: "Interface Repair Lab",
        kind: "Interface fixes",
        summary:
          "A before/after lab of broken layouts and their fixes: overflow, contrast, navigation and interaction bugs, viewed on desktop, tablet and phone.",
        problem: "Clients see a broken page but not what is wrong or what the fix costs.",
        status: "building",
      },
      {
        id: "fieldline-parts",
        name: "Fieldline Parts",
        kind: "Landing page",
        summary:
          "A landing page for a fictional agricultural parts company: products, services, a validated contact form and accessible navigation.",
        problem: "A small business needs a clear, fast page that turns visits into quote requests.",
        status: "planned",
      },
      {
        id: "parts-finder",
        name: "Parts Finder",
        kind: "Small web application",
        summary:
          "A parts catalog with search by name and code, filters, sorting, availability, and clear empty and error states.",
        problem: "Staff lose time finding the right part in spreadsheets.",
        status: "planned",
      },
    ],
  },
  lab: {
    kicker: "Creative lab",
    title: "Experiments that prove the technique.",
    intro: "Small self-initiated pieces. Each one shows a specific skill, explained in a line.",
    experiments: [
      {
        name: "Gravity · Experiment 001",
        what:
          "Thousands of particles on a 2D canvas with fixed-step physics: a skateboarding duck that breaks on impact, rebuilds, falls with gravity and reacts to the cursor.",
        tags: ["Canvas 2D", "Physics", "Performance budget"],
        cta: "Open the experiment",
        imageAlt: "A duck made of particles riding a skateboard on a dark background.",
      },
    ],
  },
  icf: {
    kicker: "Personal game project — In development",
    title: "ICF: Justa Causa",
    body:
      "A 3D game I am building on my own, with gameplay in Godot and models in Blender. Iracir is one of its characters.",
    tech: ["Godot", "Blender"],
    nextLabel: "Coming to this page",
    next: ["An interactive 3D viewer of Iracir", "A playable mini demo in the browser"],
  },
  about: {
    kicker: "About",
    title: "From commercial operations to software.",
    body: [
      "I'm Weider, an independent developer from Brazil. My background is in commercial operations and sales management, so I start from the business problem: what the page or tool has to achieve, for whom, and by when.",
      "I build practical software and keep learning. On the creative side I explore real-time graphics, particles and game prototypes in Godot and Blender.",
    ],
    strengthsLabel: "How I work",
    strengths: ["Clear communication", "Organized delivery", "Business-process sense", "Hands-on development", "Continuous learning"],
  },
  contact: {
    kicker: "Contact",
    title: "Let's talk about your project.",
    body: "Tell me what is broken or what you need built. I reply in English or Portuguese.",
    pending: "Contact channels are being set up. They will appear here soon.",
    upworkNote:
      "Found me on Upwork? Please keep our conversation on Upwork until a contract starts, as the platform requires.",
    github: "GitHub",
    upwork: "Upwork profile",
    email: "Email",
  },
  footer: {
    rights: "Weider. Built with Next.js and TypeScript.",
    top: "Back to top",
  },
};

export default en;
export type Dictionary = typeof en;
