import type { WorkExperience, Education, Skill, Achievement, PortfolioProject } from "./data";

// CV data for each member — keeps the main data.ts clean
export type MemberCV = {
  taglineCareer: string;
  location: string;
  availability: string;
  education: Education[];
  workHistory: WorkExperience[];
  skills: Skill[];
  achievements: Achievement[];
  projects: PortfolioProject[];
};

export const MEMBER_CV: Record<string, MemberCV> = {
  aldi: {
    taglineCareer: "Full-Stack Developer & Community Builder",
    location: "Jakarta, ID",
    availability: "EMPLOYED",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022", description: "Fokus web development & database" },
      { school: "Universitas Bina Sarana Informatika", degree: "S1 Teknik Informatika", period: "2022-2026", description: "Minat Software Engineering" },
    ],
    workHistory: [
      { company: "PT Tech Nusantara", role: "Junior Full-Stack Developer", period: "2022-2023", description: "Maintain web app internal pakai Laravel + Vue. Deploy ke server on-premise." },
      { company: "Startup XYZ", role: "Full-Stack Developer", period: "2023-Sekarang", description: "Bangun platform dari nol pakai Next.js + Prisma + PostgreSQL. Lead 2 developer junior.", current: true },
    ],
    skills: [
      { name: "JavaScript", level: 85, category: "LANGUAGE" },
      { name: "TypeScript", level: 80, category: "LANGUAGE" },
      { name: "PHP", level: 75, category: "LANGUAGE" },
      { name: "Next.js", level: 88, category: "FRAMEWORK" },
      { name: "Laravel", level: 78, category: "FRAMEWORK" },
      { name: "React", level: 85, category: "FRAMEWORK" },
      { name: "Prisma", level: 82, category: "TOOL" },
      { name: "Git", level: 80, category: "TOOL" },
      { name: "Leadership", level: 75, category: "SOFT" },
      { name: "Communication", level: 82, category: "SOFT" },
    ],
    achievements: [
      { title: "Best Student Project", year: "2022", description: "Juara 1 lomba project SMK se-Jakarta dengan app inventory", images: ["/gallery/harapan-mimpi.webp", "/gallery/gallery-1.webp"] },
      { title: "Undimension Founder", year: "2020", description: "Mendirikan circle collective yang bertahan 6+ tahun" },
      { title: "Hackathon Finalist", year: "2023", description: "Top 10 Hackathon ID dengan project EdTech" },
    ],
    projects: [
      { id: "a1", title: "UNDIMENSION WEB", description: "Web profile collective ini. Full-stack Next.js 16.", tech: ["Next.js", "TypeScript", "Prisma"], category: "WEB", status: "LIVE", year: "2026", author: "ALDI", link: "#", color: "#ff4d4d" },
      { id: "a2", title: "SMK REUNION SITE", description: "Landing page undangan reuni alumni.", tech: ["HTML", "JavaScript"], category: "WEB", status: "ARCHIVED", year: "2025", author: "ALDI", color: "#ff4d4d" },
    ],
  },
  razka: {
    taglineCareer: "Backend Engineer & DevOps Enthusiast",
    location: "Bandung, ID",
    availability: "OPEN TO WORK",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "Universitas Telkom", degree: "S1 Software Engineering", period: "2022-2026", description: "Fokus distributed systems & cloud" },
    ],
    workHistory: [
      { company: "PT Cloud Indonesia", role: "Backend Developer Intern", period: "2023-2024", description: "Bangun microservices pakai Go + Docker. Setup CI/CD pipeline." },
      { company: "Freelance", role: "DevOps Consultant", period: "2024-Sekarang", description: "Bantu startup setup infrastruktur cloud (AWS/GCP), Docker, Kubernetes.", current: true },
    ],
    skills: [
      { name: "Go", level: 82, category: "LANGUAGE" },
      { name: "Python", level: 88, category: "LANGUAGE" },
      { name: "JavaScript", level: 80, category: "LANGUAGE" },
      { name: "Node.js", level: 85, category: "FRAMEWORK" },
      { name: "Docker", level: 90, category: "TOOL" },
      { name: "Kubernetes", level: 75, category: "TOOL" },
      { name: "AWS", level: 82, category: "TOOL" },
      { name: "PostgreSQL", level: 85, category: "TOOL" },
      { name: "Problem Solving", level: 88, category: "SOFT" },
    ],
    achievements: [
      { title: "AWS Certified", year: "2024", description: "AWS Solutions Architect Associate", images: ["/gallery/harapan-negeri.webp", "/gallery/gallery-2.webp"] },
      { title: "Screenshot Archiver", year: "2023", description: "CLI tool untuk organize 4000+ screenshot" },
      { title: "Open Source Contributor", year: "2024", description: "10+ merged PR di berbagai repo Go" },
    ],
    projects: [
      { id: "r1", title: "SCREENSHOT ARCHIVER", description: "CLI tool Python untuk auto-organize screenshot.", tech: ["Python", "Pillow"], category: "TOOL", status: "LIVE", year: "2023", author: "RAZKA", color: "#00e5ff" },
      { id: "r2", title: "UNDIMENSION WEB", description: "Kontributor utama arsitektur backend.", tech: ["Next.js", "Prisma"], category: "WEB", status: "LIVE", year: "2026", author: "RAZKA", repo: "https://github.com/raynzz455/Undimesion-prototype", color: "#00e5ff" },
    ],
  },
  reza: {
    taglineCareer: "Data Analyst & ML Practitioner",
    location: "Jakarta, ID",
    availability: "EMPLOYED",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "Universitas Indonesia", degree: "S1 Statistika", period: "2022-2026", description: "Minat machine learning & data science" },
    ],
    workHistory: [
      { company: "PT Data Maju", role: "Data Analyst Intern", period: "2023", description: "Analisis data user, buat dashboard Tableau, automasi report." },
      { company: "E-commerce Startup", role: "Junior Data Scientist", period: "2024-Sekarang", description: "Bangun model recommendation system, churn prediction, A/B testing.", current: true },
    ],
    skills: [
      { name: "Python", level: 90, category: "LANGUAGE" },
      { name: "SQL", level: 88, category: "LANGUAGE" },
      { name: "R", level: 75, category: "LANGUAGE" },
      { name: "Pandas", level: 92, category: "FRAMEWORK" },
      { name: "Scikit-learn", level: 85, category: "FRAMEWORK" },
      { name: "TensorFlow", level: 72, category: "FRAMEWORK" },
      { name: "Tableau", level: 80, category: "TOOL" },
      { name: "Git", level: 78, category: "TOOL" },
      { name: "Analytical Thinking", level: 92, category: "SOFT" },
    ],
    achievements: [
      { title: "Kaggle Competition", year: "2024", description: "Top 5% di tabular playground series", images: ["/gallery/harapan-kota.webp", "/gallery/gallery-3.webp"] },
      { title: "ML Draft Analyzer", year: "2023", description: "Tool analisis draft game Mobile Legends" },
      { title: "Research Assistant", year: "2024", description: "Asisten dosen untuk penelitian NLP" },
    ],
    projects: [
      { id: "rz1", title: "ML DRAFT ANALYZER", description: "Tool web untuk analisis draft ML via API.", tech: ["React", "Node.js"], category: "TOOL", status: "ARCHIVED", year: "2023", author: "REZA", color: "#d4ff00" },
      { id: "rz2", title: "RECOMMENDATION ENGINE", description: "Model ML untuk e-commerce, production.", tech: ["Python", "TensorFlow"], category: "TOOL", status: "LIVE", year: "2024", author: "REZA", color: "#d4ff00" },
    ],
  },
  abyan: {
    taglineCareer: "Mobile Developer (React Native)",
    location: "Surabaya, ID",
    availability: "FREELANCE",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "ITS Surabaya", degree: "D4 Teknik Informatika", period: "2022-2026", description: "Fokus mobile development" },
    ],
    workHistory: [
      { company: "Startup Mobile", role: "Mobile Developer Intern", period: "2023-2024", description: "Bangun app React Native, publish ke Play Store." },
      { company: "Freelance", role: "Mobile Developer", period: "2024-Sekarang", description: "Terima project app mobile dari berbagai klien.", current: true },
    ],
    skills: [
      { name: "JavaScript", level: 85, category: "LANGUAGE" },
      { name: "Dart", level: 75, category: "LANGUAGE" },
      { name: "Kotlin", level: 70, category: "LANGUAGE" },
      { name: "React Native", level: 88, category: "FRAMEWORK" },
      { name: "Flutter", level: 75, category: "FRAMEWORK" },
      { name: "Firebase", level: 82, category: "TOOL" },
      { name: "Fastlane", level: 70, category: "TOOL" },
      { name: "Figma", level: 78, category: "TOOL" },
      { name: "UI/UX Design", level: 80, category: "SOFT" },
    ],
    achievements: [
      { title: "Play Store Launch", year: "2024", description: "Publish 3 app ke Play Store, 50K+ downloads", images: ["/gallery/harapan-depan.webp", "/gallery/gallery-1.webp"] },
      { title: "D&D Dice PWA", year: "2024", description: "PWA untuk D&D player, installable di HP" },
      { title: "Mobile Design Award", year: "2023", description: "Juara 2 lomba UI/UX mobile app" },
    ],
    projects: [
      { id: "ab1", title: "D&D DICE ROLLER PWA", description: "PWA untuk roll dadu D&D.", tech: ["React", "PWA"], category: "WEB", status: "LIVE", year: "2024", author: "ABYAN", color: "#ff00ff" },
      { id: "ab2", title: "FOOD DELIVERY APP", description: "App mobile freelance untuk klien F&B.", tech: ["React Native", "Firebase"], category: "MOBILE", status: "LIVE", year: "2024", author: "ABYAN", color: "#ff00ff" },
    ],
  },
  rasya: {
    taglineCareer: "Game Developer & Content Creator",
    location: "Bekasi, ID",
    availability: "FREELANCE",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "Universitas Binus", degree: "S1 Game Application & Technology", period: "2022-2026", description: "Fokus game design & development" },
    ],
    workHistory: [
      { company: "Game Studio Indie", role: "Game Developer", period: "2023-2024", description: "Bangun game 2D pakai Unity & Godot. Released 2 game di itch.io." },
      { company: "Content Creator / Freelance", role: "Game Dev & Streamer", period: "2024-Sekarang", description: "Stream game dev di Twitch, terima project game freelance.", current: true },
    ],
    skills: [
      { name: "C#", level: 85, category: "LANGUAGE" },
      { name: "GDScript", level: 80, category: "LANGUAGE" },
      { name: "Python", level: 70, category: "LANGUAGE" },
      { name: "Unity", level: 88, category: "FRAMEWORK" },
      { name: "Godot", level: 82, category: "FRAMEWORK" },
      { name: "Blender", level: 75, category: "TOOL" },
      { name: "Aseprite", level: 80, category: "TOOL" },
      { name: "OBS Studio", level: 85, category: "TOOL" },
      { name: "Creativity", level: 95, category: "SOFT" },
    ],
    achievements: [
      { title: "Game Jam Winner", year: "2023", description: "Juara 1 Ludum Dare local dengan game puzzle", images: ["/gallery/gallery-2.webp", "/gallery/gallery-3.webp"] },
      { title: "Twitch Affiliate", year: "2024", description: "Capai affiliate status dengan 500+ followers" },
      { title: "Itch.io Releases", year: "2024", description: "Publish 5 game di itch.io, 2K+ downloads total" },
    ],
    projects: [
      { id: "rs1", title: "OBBY SPEEDRUN TRACKER", description: "Web app track speedrun Roblox obby.", tech: ["Next.js", "Prisma"], category: "WEB", status: "WIP", year: "2025", author: "RASYA", color: "#ff8c00" },
      { id: "rs2", title: "PIXEL DUNGEON", description: "Game roguelike 2D buatan Godot.", tech: ["Godot", "GDScript"], category: "GAME", status: "LIVE", year: "2024", author: "RASYA", color: "#ff8c00" },
    ],
  },
  rifqi: {
    taglineCareer: "Backend Developer & Automation Specialist",
    location: "Depok, ID",
    availability: "EMPLOYED",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "Universitas Gunadarma", degree: "S1 Teknik Informatika", period: "2022-2026", description: "Fokus sistem otomasi & scripting" },
    ],
    workHistory: [
      { company: "PT Automasi Solusi", role: "Automation Engineer", period: "2023-2024", description: "Bangun bot & script otomasi pakai Python. Hemat 200+ jam kerja/bulan." },
      { company: "Fintech Startup", role: "Backend Developer", period: "2024-Sekarang", description: "Bangun API service pakai Node.js + Express. Handle 1M+ requests/hari.", current: true },
    ],
    skills: [
      { name: "Python", level: 92, category: "LANGUAGE" },
      { name: "Node.js", level: 85, category: "LANGUAGE" },
      { name: "Bash", level: 80, category: "LANGUAGE" },
      { name: "Express", level: 85, category: "FRAMEWORK" },
      { name: "FastAPI", level: 82, category: "FRAMEWORK" },
      { name: "Docker", level: 78, category: "TOOL" },
      { name: "Redis", level: 80, category: "TOOL" },
      { name: "Linux", level: 85, category: "TOOL" },
      { name: "Stealth Mode", level: 99, category: "SOFT" },
    ],
    achievements: [
      { title: "Automation Champion", year: "2023", description: "Hemat 200+ jam kerja/bulan dengan bot otomasi" },
      { title: "Ghost Presence Bot", year: "2024", description: "Bot Discord yang bikin akun 'online' walau ga main" },
      { title: "API Scale", year: "2024", description: "Handle 1M+ API requests/hari tanpa downtime" },
    ],
    projects: [
      { id: "rf1", title: "GHOST PRESENCE BOT", description: "Bot Discord untuk akun 'online' 24/7.", tech: ["Python", "discord.py"], category: "BOT", status: "ARCHIVED", year: "2024", author: "RIFQI", color: "#00ff00" },
      { id: "rf2", title: "FINTECH API GATEWAY", description: "Backend API untuk fintech, production.", tech: ["Node.js", "Redis"], category: "WEB", status: "LIVE", year: "2024", author: "RIFQI", color: "#00ff00" },
    ],
  },
  dudit: {
    taglineCareer: "DevOps Engineer & Community Manager",
    location: "Tangerang, ID",
    availability: "EMPLOYED",
    education: [
      { school: "SMK Negeri 4 Jakarta", degree: "Rekayasa Perangkat Lunak", period: "2019-2022" },
      { school: "Universitas Bina Nusantara", degree: "S1 Computer Science", period: "2022-2026", description: "Fokus DevOps & infrastructure" },
    ],
    workHistory: [
      { company: "PT Cloud Bersama", role: "DevOps Engineer Intern", period: "2023", description: "Setup CI/CD, monitoring, dan infrastructure as code pakai Terraform." },
      { company: "SaaS Company", role: "DevOps Engineer", period: "2024-Sekarang", description: "Manage Kubernetes cluster, 99.9% uptime, automated scaling.", current: true },
    ],
    skills: [
      { name: "Python", level: 80, category: "LANGUAGE" },
      { name: "Go", level: 72, category: "LANGUAGE" },
      { name: "YAML", level: 88, category: "LANGUAGE" },
      { name: "Kubernetes", level: 85, category: "FRAMEWORK" },
      { name: "Terraform", level: 82, category: "TOOL" },
      { name: "Grafana", level: 80, category: "TOOL" },
      { name: "Prometheus", level: 78, category: "TOOL" },
      { name: "Jenkins", level: 75, category: "TOOL" },
      { name: "Drama Management", level: 99, category: "SOFT" },
    ],
    achievements: [
      { title: "99.9% Uptime", year: "2024", description: "Maintain SLA untuk production Kubernetes cluster" },
      { title: "Discord Chaos Bot", year: "2024", description: "Bot untuk server collective, 100+ command" },
      { title: "CKA Certified", year: "2024", description: "Certified Kubernetes Administrator" },
    ],
    projects: [
      { id: "dd1", title: "DISCORD CHAOS BOT", description: "Bot Discord untuk server collective.", tech: ["Node.js", "discord.js"], category: "BOT", status: "LIVE", year: "2024", author: "DUDIT", color: "#8a2be2" },
      { id: "dd2", title: "K8S AUTOSCALER", description: "Custom autoscaler untuk Kubernetes.", tech: ["Go", "Kubernetes"], category: "TOOL", status: "LIVE", year: "2024", author: "DUDIT", color: "#8a2be2" },
    ],
  },
  nayla: {
    taglineCareer: "Phantom Developer & Digital Ghost",
    location: "Unknown",
    availability: "GHOST",
    education: [
      { school: "Institut Digital Phantom", degree: "S1 Ilmu Gaib Digital", period: "2024-2028", description: "Belajar cara exist tanpa terdeteksi" },
    ],
    workHistory: [
      { company: "Collective UNDIMENSION", role: "Phantom Member", period: "2026-Sekarang", description: "Muncul hanya saat chaos mode aktif. Bekerja di bayang-bayang.", current: true },
    ],
    skills: [
      { name: "Invisibility", level: 99, category: "SOFT" },
      { name: "JavaScript", level: 75, category: "LANGUAGE" },
      { name: "Python", level: 70, category: "LANGUAGE" },
      { name: "React", level: 65, category: "FRAMEWORK" },
      { name: "Mystery", level: 100, category: "SOFT" },
    ],
    achievements: [
      { title: "Hidden Member Unlocked", year: "2026", description: "Member pertama yang hidden — hanya muncul saat chaos mode" },
    ],
    projects: [
      { id: "ny1", title: "PHANTOM PROTOCOL", description: "Sistem yang membuat member bisa muncul/hilang sesuai kondisi.", tech: ["Next.js", "WebSocket"], category: "TOOL", status: "WIP", year: "2026", author: "NAYE", color: "#ff006e" },
    ],
  },
};
