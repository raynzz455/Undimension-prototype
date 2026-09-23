export type WorkExperience = {
  company: string;
  role: string;
  period: string;
  description: string;
  current?: boolean;
};

export type Education = {
  school: string;
  degree: string;
  period: string;
  description?: string;
};

export type Skill = {
  name: string;
  level: number; // 0-100
  category: "LANGUAGE" | "FRAMEWORK" | "TOOL" | "SOFT";
};

export type Achievement = {
  title: string;
  year: string;
  description: string;
  icon?: string;
  images?: string[]; // Sertifikat, medali, foto kemenangan (carousel)
};

export type Member = {
  id: string;
  name: string;
  nick: string;
  role: string;
  img: string;
  color: string; // bg-* utility
  highlight: string; // text-* utility
  bio: string;
  bioPortfolio?: string;
  tagline: string; // short punchy one-liner for modal
  quote: string; // a personal quote shown in modal
  funFacts: string[]; // 3-4 bullet facts
  element: string; // thematic element (e.g. "FIRE", "VOID")
  joinYear: string;
  stats: { label: string; value: string }[];
  socials: { label: string; href: string }[];
  // Portfolio / CV fields
  taglineCareer: string; // career-focused one-liner
  location: string;
  availability: string; // e.g. "OPEN TO WORK", "EMPLOYED", "FREELANCE"
  education: Education[];
  workHistory: WorkExperience[];
  skills: Skill[];
  achievements: Achievement[];
  projects: PortfolioProject[];
  /** Hidden members are only visible in chaos mode, not on public pages. */
  hidden?: boolean;
};

export const MEMBERS: Member[] = [
  {
    id: "aldi",
    name: "Raynaldi",
    nick: "Aldi",
    role: "THE FOUNDER",
    img: "",
    color: "bg-[#ff4d4d]",
    highlight: "text-[#ff4d4d]",
    bio: "Titik nol dari mana semua orbit dimulai. Sang pendiri yang menyalakan percikan pertama dan tak pernah membiarkannya padam, sejauh apapun anggota lainnya pergi.",
    tagline: "Lit the first spark. Never let it die.",
    quote: "Sejauh apapun kita terbang, gravitasi pertemanan selalu menarik kita kembali ke orbit yang sama.",
    funFacts: [
      "Selalu jadi orang pertama yang online di grup",
      "Pemilik rekor 'paling sering ngajak nongkrong'",
      "Punya playlist spotify untuk tiap mood anggota",
      "Tidak pernah telat — kecuali sengaja",
    ],
    element: "FIRE",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "16" },
      { label: "DEX", value: "12" },
      { label: "CON", value: "15" },
      { label: "INT", value: "13" },
      { label: "WIS", value: "10" },
      { label: "CHA", value: "14" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "razka",
    name: "Muhammad Razka Faudzan",
    nick: "Rembo",
    role: "THE ARCHITECT",
    img: "/members/member-razka.webp",
    color: "bg-[#00e5ff]",
    highlight: "text-[#00e5ff]",
    bio: "Perancang struktur di balik kekacauan. Setiap blueprint yang dia buat ternyata jadi peta untuk petualangan yang tak terduga.",
    tagline: "Designs the chaos others call home.",
    quote: "Setiap struktur yang aku bangun punya pintu rahasia. Itu bukan bug — itu feature.",
    funFacts: [
      "Bisa ngoding sambil denger podcast true crime",
      "Arsip screenshot-nya punya 4000+ file",
      "Selalu bawa charger cadangan ke mana-mana",
      "Menghitung optimasi FPS sebelum beli HP",
    ],
    element: "ICE",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "8" },
      { label: "DEX", value: "14" },
      { label: "CON", value: "12" },
      { label: "INT", value: "18" },
      { label: "WIS", value: "15" },
      { label: "CHA", value: "16" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "reza",
    name: "Reza",
    nick: "Eja",
    role: "THE STRATEGIST",
    img: "/members/member-reza.webp",
    color: "bg-[#d4ff00]",
    highlight: "text-[#d4ff00]",
    bio: "Pikirannya selalu lima langkah di depan. Saat yang lain panik, dia sudah menyiapkan tiga rencana cadangan.",
    tagline: "Five moves ahead before you blink.",
    quote: "Rencana A gagal? Tenang. Aku punya rencana B sampai Z, dan dua di antaranya melibatkan ayam.",
    funFacts: [
      "Punya notes folder khusus berisi 'what-if scenarios'",
      "Menang ranked 1v3 dengan strategi mind-game",
      "Tidur 5 jam tapi terlihat segar (kecurigaan robot)",
      "Pernah invalidate sebuah patch game dalam 30 menit",
    ],
    element: "MIND",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "6" },
      { label: "DEX", value: "12" },
      { label: "CON", value: "10" },
      { label: "INT", value: "20" },
      { label: "WIS", value: "16" },
      { label: "CHA", value: "13" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "abyan",
    name: "Muhammad Abyan Riyadh Amal",
    nick: "Byan",
    role: "THE VANGUARD",
    img: "/members/member-abyan.webp",
    color: "bg-[#ff00ff]",
    highlight: "text-[#ff00ff]",
    bio: "Barisan depan yang tak pernah mundur. Kalau ada tembok, dia yang duluan nubruk — dan biasanya temboknya yang kalah.",
    tagline: "Runs headfirst. Walls lose.",
    quote: "Pikir dulu itu nanti. Sekarang, charge!",
    funFacts: [
      "Pernah push tower sendirian dan menang",
      "Reaksi dodge creeper: 0.2 detik",
      "Koleksi skin game lebih mahal dari motor",
      "Motto: 'lebih baik regret daripada penasaran'",
    ],
    element: "STORM",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "18" },
      { label: "DEX", value: "14" },
      { label: "CON", value: "17" },
      { label: "INT", value: "8" },
      { label: "WIS", value: "7" },
      { label: "CHA", value: "10" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "rasya",
    name: "Rasya Musyafa Ridwan",
    nick: "Acong",
    role: "THE MAVERICK",
    img: "/members/member-rasya.webp",
    color: "bg-[#ff8c00]",
    highlight: "text-[#ff8c00]",
    bio: "Yang tak pernah bisa ditebak. Strateginya? Tidak ada. Dan itu justru strategi paling mematikan yang pernah ada.",
    tagline: "No plan. That's the plan.",
    quote: "Kalau musuh bisa nebak langkahku, berarti aku belum cukup random.",
    funFacts: [
      "Pernah menang tournament pake pick random",
      "Punya 12 meme yang hanya dimengerti circle ini",
      "Spontan ngajak roadtrip tengah malam — berkali-kali",
      "Quote-nya di-pin di 5 server discord berbeda",
    ],
    element: "CHAOS",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "10" },
      { label: "DEX", value: "18" },
      { label: "CON", value: "12" },
      { label: "INT", value: "14" },
      { label: "WIS", value: "12" },
      { label: "CHA", value: "13" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "rifqi",
    name: "Muhammad Rifqi",
    nick: "Tipki",
    role: "THE ENIGMA",
    img: "",
    color: "bg-[#00ff00]",
    highlight: "text-[#00ff00]",
    bio: "Misteri berjalan. Kadang hadir, kadang hilang, tapi selalu muncul tepat saat dibutuhkan. Seperti glitch di matriks.",
    tagline: "Here when it matters. Gone otherwise.",
    quote: "Online status-ku tidak mencerminkan realita. Aku selalu ada — di latar.",
    funFacts: [
      "Pernah ghosting 3 bulan lalu balik seolah tak terjadi apa-apa",
      "Punya 6 alias di platform berbeda",
      "Reaction time-nya konstan di bawah 150ms (dicurigai AI)",
      "Hanya muncul di chat saat ada yang butuh di-save",
    ],
    element: "VOID",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "12" },
      { label: "DEX", value: "16" },
      { label: "CON", value: "14" },
      { label: "INT", value: "13" },
      { label: "WIS", value: "18" },
      { label: "CHA", value: "8" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "dudit",
    name: "Raditya Jundika Putra",
    nick: "Dudit",
    role: "THE CATALYST",
    img: "",
    color: "bg-[#8a2be2]",
    highlight: "text-[#8a2be2]",
    bio: "Elemen yang mempercepat reaksi. Tanpa dia, semuanya akan berjalan lambat. Dengan dia, semuanya jadi ledakan.",
    tagline: "Accelerator of every reaction.",
    quote: "Aku bukan pemicu masalah. Aku cuma yang bikin semuanya jadi lebih cepat — termasuk kelar-nya.",
    funFacts: [
      "Pernah convert 3 orang jadi main game baru dalam sehari",
      "Menyebar rekomendasi anime lebih cepat dari algoritma",
      "Penemu 'meta baru' yang 80% akurat",
      "Tanggung jawab atas 60% drama server",
    ],
    element: "ENERGY",
    joinYear: "2020",
    stats: [
      { label: "STR", value: "10" },
      { label: "DEX", value: "8" },
      { label: "CON", value: "14" },
      { label: "INT", value: "14" },
      { label: "WIS", value: "18" },
      { label: "CHA", value: "16" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
  },
  {
    id: "nayla",
    name: "Nayla",
    nick: "Naye",
    role: "THE PHANTOM",
    img: "",
    color: "bg-[#ff006e]",
    highlight: "text-[#ff006e]",
    bio: "Entitas misterius yang muncul hanya saat chaos mode aktif. Hadir di bayang-bayang, namun selalu ada saat dibutuhkan.",
    tagline: "Here when chaos calls. Gone when it fades.",
    quote: "Aku bukan glitch. Aku fitur yang belum kamu temukan.",
    funFacts: [
      "Muncul hanya dalam chaos mode",
      "Identitas sebenarnya tidak ada yang tahu",
      "Selalu hadir saat konami code diaktifkan",
      "Lebih mirip hantu daripada member",
    ],
    element: "PHANTOM",
    joinYear: "2026",
    stats: [
      { label: "STR", value: "10" },
      { label: "DEX", value: "20" },
      { label: "CON", value: "8" },
      { label: "INT", value: "18" },
      { label: "WIS", value: "16" },
      { label: "CHA", value: "20" },
    ],
    socials: [
      { label: "INSTAGRAM", href: "#" },
      { label: "X_TWITTER", href: "#" },
      { label: "DISCORD", href: "#" },
    ],
    hidden: true,
  },
];

export type HarapanCard = {
  id: string;
  title: string;
  img: string;
  stamp: string;
  quote: string;
  author: string;
  bg: string;
  shadow: string;
  rotate: string;
};

export const HARAPAN: HarapanCard[] = [
  {
    id: "mimpi",
    title: "MIMPI KAMI",
    img: "/gallery/harapan-mimpi.webp",
    stamp: "DREAM_01",
    quote: "Seperti bintang yang menerangi malam — mimpi kami abadi.",
    author: "BY REZA",
    bg: "bg-[#d4ff00]",
    shadow: "shadow-[12px_12px_0_#fff] dark:shadow-[12px_12px_0_#000]",
    rotate: "md:-rotate-3 md:-translate-y-4",
  },
  {
    id: "negeri",
    title: "HARAPAN NEGERI",
    img: "/gallery/harapan-negeri.webp",
    stamp: "VOICE_02",
    quote: "Our voices matter. Suara kami adalah kontribusi nyata.",
    author: "BY RAZKA",
    bg: "bg-[#00e5ff]",
    shadow: "shadow-[12px_12px_0_#fff] dark:shadow-[12px_12px_0_#000]",
    rotate: "md:rotate-2 md:translate-y-8",
  },
  {
    id: "kota",
    title: "HARAPAN KOTA",
    img: "/gallery/harapan-kota.webp",
    stamp: "UNITY_03",
    quote: "In unity, we find strength. Dalam kebersamaan ada kekuatan.",
    author: "BY RASYA",
    bg: "bg-[#ff4d4d]",
    shadow: "shadow-[12px_12px_0_#fff] dark:shadow-[12px_12px_0_#000]",
    rotate: "md:-rotate-1 md:-translate-y-2",
  },
  {
    id: "depan",
    title: "MASA DEPAN",
    img: "/gallery/harapan-depan.webp",
    stamp: "FUTURE_04",
    quote: "Tak ada yang tahu apa yang ada di depan — tapi kami hadapi bersama.",
    author: "BY ALDI",
    bg: "bg-[#ff00ff]",
    shadow: "shadow-[12px_12px_0_#d4ff00]",
    rotate: "md:rotate-4 md:translate-y-12",
  },
];

export type GameSection = {
  id: string;
  sector: string;
  title: string;
  subtitle: string;
  description: string;
  bg: string;
  accent: string;
  carouselTitle: string;
  images: string[];
  reverse?: boolean;
  fontClass?: string;
};

export const GAMES: GameSection[] = [
  {
    id: "minecraft",
    sector: "SEKTOR 01",
    title: "MINECRAFT",
    subtitle: "SURVIVAL OF THE FITTEST",
    description:
      "Dunia tanpa batas, tempat kami membangun dari nol. Satu blok tanah, satu pedang kayu, dan ratusan jam yang dihabiskan menambang diamond. (Dan ya, ada yang selalu mati kena creeper.)",
    bg: "/games/minecraft-bg.webp",
    accent: "#5d9e35",
    carouselTitle: "OUR WORLD",
    images: [
      "/members/member-razka.webp",
      "/members/member-reza.webp",
      "/members/member-abyan.webp",
      "/members/member-rasya.webp",
    ],
  },
  {
    id: "roblox",
    sector: "SEKTOR 02",
    title: "ROBLOX",
    subtitle: "PURE UNADULTERATED CHAOS",
    description:
      "Dari roleplay absurd sampai obby yang bikin emosi. Ini adalah kanvas imajinasi kolektif paling liar kami. Oof!",
    bg: "/games/roblox-bg.webp",
    accent: "#cc0000",
    carouselTitle: "CHAOS INC",
    images: [
      "/members/member-rasya.webp",
      "/members/member-abyan.webp",
      "/members/member-reza.webp",
      "/members/member-razka.webp",
    ],
    reverse: true,
  },
  {
    id: "ml",
    sector: "SEKTOR 03",
    title: "MOBILE LEGENDS",
    subtitle: "PUSH MID OR AFK",
    description:
      "Arena tempur harian. Kami menang bersama, atau kalah dengan gaya (dan saling menyalahkan). Koneksi merah, draft aneh, epic comeback.",
    bg: "/games/ml-bg.webp",
    accent: "#00e5ff",
    carouselTitle: "ARENA LOG",
    images: [
      "/members/member-reza.webp",
      "/members/member-rasya.webp",
      "/members/member-razka.webp",
      "/members/member-abyan.webp",
    ],
  },
  {
    id: "dnd",
    sector: "SEKTOR 04",
    title: "DUNGEONS & DRAGONS",
    subtitle: "NATURAL 20 OR CRITICAL FAIL",
    description:
      "Meja imajinasi tempat kami menjadi pahlawan (atau badut). Dunia yang terbentuk dari kata-kata, kertas, dan dadu 20 sisi. Roll for initiative!",
    bg: "/games/dnd-bg.webp",
    accent: "#ffebd2",
    carouselTitle: "TAVERN TALES",
    images: [
      "/members/member-abyan.webp",
      "/members/member-razka.webp",
      "/members/member-rasya.webp",
      "/members/member-reza.webp",
    ],
    reverse: true,
    fontClass: "font-cinzel",
  },
];

export type GalleryPhoto = {
  id: string;
  img: string;
  title: string;
  date: string;
  rotate: string;
  author: string;
};

export const GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "g1",
    img: "",
    title: "VISI AWAL",
    date: "2020",
    rotate: "-rotate-2",
    author: "ALDI",
  },
  {
    id: "g2",
    img: "/members/member-razka.webp",
    title: "MIMPI BINTANG",
    date: "2021",
    rotate: "rotate-2",
    author: "RAZKA",
  },
  {
    id: "g3",
    img: "/members/member-reza.webp",
    title: "IMPIAN NEGERI",
    date: "2022",
    rotate: "-rotate-1",
    author: "REZA",
  },
  {
    id: "g4",
    img: "/members/member-abyan.webp",
    title: "MALAM DI KOTA",
    date: "2022",
    rotate: "rotate-3",
    author: "ABYAN",
  },
  {
    id: "g5",
    img: "/members/member-rasya.webp",
    title: "MALAM PERMAINAN",
    date: "2023",
    rotate: "-rotate-3",
    author: "RASYA",
  },
  {
    id: "g6",
    img: "/gallery/gallery-1.webp",
    title: "GLITCH MOMENT",
    date: "2023",
    rotate: "rotate-1",
    author: "RIFQI",
  },
  {
    id: "g7",
    img: "/gallery/gallery-2.webp",
    title: "CHaos THEORY",
    date: "2024",
    rotate: "-rotate-2",
    author: "DUDIT",
  },
  {
    id: "g8",
    img: "/gallery/gallery-3.webp",
    title: "NIGHT SEQUENCE",
    date: "2024",
    rotate: "rotate-2",
    author: "ALDI",
  },
];

export type TimelineMilestone = {
  id: string;
  year: string;
  season: string;
  title: string;
  description: string;
  color: string;
  icon: string;
};

export const TIMELINE: TimelineMilestone[] = [
  {
    id: "t1",
    year: "2020",
    season: "AUTUMN",
    title: "THE SPARK",
    description:
      "Tujuh anak SMK dipertemukan oleh satu meja kosong di pojok kantin. Obrolan tentang game jadi jembatan, dan tanpa disadari, sebuah orbit terbentuk.",
    color: "#ff4d4d",
    icon: "✦",
  },
  {
    id: "t2",
    year: "2021",
    season: "WINTER",
    title: "FIRST DUNGEON",
    description:
      "Kampanye D&D pertama yang berakhir total party kill di ruang pertama. Bukan kegagalan — itu inisiasi. Dari sini lahir inside joke yang bertahan bertahun-tahun.",
    color: "#00e5ff",
    icon: "🎲",
  },
  {
    id: "t3",
    year: "2022",
    season: "SPRING",
    title: "MINECRAFT ERA",
    description:
      "Server survival private dibangun. Base utama digrebeg creeper 47 kali. Diamond pertama ditambang bareng pada jam 3 pagi. Kenangan itu tak tergantikan.",
    color: "#d4ff00",
    icon: "⛏",
  },
  {
    id: "t4",
    year: "2023",
    season: "SUMMER",
    title: "MOBILE LEGENDS GRIND",
    description:
      "Push rank sampai Mythic dengan komposisi draft penuh chaos. Persahabatan diuji oleh lag, afk, dan saling menyalahkan — tapi tidak pernah patah.",
    color: "#ff00ff",
    icon: "⚔",
  },
  {
    id: "t5",
    year: "2024",
    season: "AUTUMN",
    title: "THE ROBLOX CHAOS",
    description:
      "Era obby absurd dan roleplay yang nggak masuk akal. Oof terdengar ratusan kali sehari. collective imajinasi mencapai puncak kekacauan yang indah.",
    color: "#ff8c00",
    icon: "◉",
  },
  {
    id: "t6",
    year: "2025",
    season: "WINTER",
    title: "DIMENSIONAL DRIFT",
    description:
      "Satu per satu mulai sibuk: kuliah, kerja, hidup. Grup sepi. Tapi setiap ada yang butuh, orbit selalu menarik kita kembali. Gravitasi tidak pernah lemah.",
    color: "#8a2be2",
    icon: "∞",
  },
  {
    id: "t7",
    year: "2026",
    season: "NOW",
    title: "UNDIMENSION MANIFEST",
    description:
      "Web profile ini lahir sebagai konstanta digital. Tempat menyimpan kenangan, harapan, dan bukti bahwa tujuh orbit yang berbeda bisa tetap selaras.",
    color: "#00ff00",
    icon: "★",
  },
];

export const RANDOM_QUOTES: { text: string; author: string }[] = [
  { text: "Chaos is just order you haven't understood yet.", author: "THE COLLECTIVE" },
  { text: "Tujuh orbit, satu gravitasi. Itu cukup.", author: "ALDI" },
  { text: "Kalau kita tidak saling menyalahkan di ranked, kita bukan teman.", author: "REZA" },
  { text: "Build dulu, fikir nanti. Itu filosofi kami.", author: "RAZKA" },
  { text: "Yang penting bunyi 'oof'-nya keras.", author: "RASYA" },
  { text: "Roll for initiative. Roll for friendship. Critical hit.", author: "ABYAN" },
  { text: "Aku ghosting grup 3 bulan, balik dan seolah tak terjadi apa-apa. Itu persahabatan.", author: "RIFQI" },
  { text: "Tanpa drama, hidup terlalu sunyi. Aku sediakan dramanya.", author: "DUDIT" },
];

// Member × Game compatibility matrix (who plays what)
// Values: 3 = main/frequent, 2 = casual, 1 = rare, 0 = no
export const COMPATIBILITY: Record<string, Record<string, number>> = {
  aldi:  { minecraft: 3, roblox: 2, ml: 2, dnd: 1 },
  razka: { minecraft: 3, roblox: 1, ml: 2, dnd: 3 },
  reza:  { minecraft: 2, roblox: 1, ml: 3, dnd: 3 },
  abyan: { minecraft: 2, roblox: 2, ml: 3, dnd: 1 },
  rasya: { minecraft: 3, roblox: 3, ml: 2, dnd: 2 },
  rifqi: { minecraft: 1, roblox: 2, ml: 1, dnd: 2 },
  dudit: { minecraft: 2, roblox: 3, ml: 3, dnd: 2 },
};

export const GAME_LABELS: Record<string, string> = {
  minecraft: "MINECRAFT",
  roblox: "ROBLOX",
  ml: "MOBILE LEGENDS",
  dnd: "D&D",
};

// Cosmic coordinates for each member — their "position" on the collective star map.
// x/y in 0-100 range (percentage of the map), size = star magnitude, constellation = which group.
export type CosmicCoord = {
  id: string;
  nick: string;
  x: number;
  y: number;
  size: number;
  color: string;
  element: string;
};

export const COSMIC_COORDS: CosmicCoord[] = [
  { id: "aldi",  nick: "ALDI",   x: 50, y: 18, size: 5, color: "#ff4d4d", element: "FIRE" },
  { id: "razka", nick: "REMBO",  x: 22, y: 38, size: 4, color: "#00e5ff", element: "ICE" },
  { id: "reza",  nick: "EJA",    x: 78, y: 35, size: 4, color: "#d4ff00", element: "MIND" },
  { id: "abyan", nick: "BYAN",   x: 15, y: 62, size: 4.5, color: "#ff00ff", element: "STORM" },
  { id: "rasya", nick: "ACONG",  x: 85, y: 65, size: 4.5, color: "#ff8c00", element: "CHAOS" },
  { id: "rifqi", nick: "TIPKI",  x: 35, y: 82, size: 3.5, color: "#00ff00", element: "VOID" },
  { id: "dudit", nick: "DUDIT",  x: 65, y: 80, size: 4, color: "#8a2be2", element: "ENERGY" },
];

// Lines connecting the stars into a "constellation" (pairs of member ids)
export const CONSTELLATION_LINES: [string, string][] = [
  ["aldi", "razka"],
  ["aldi", "reza"],
  ["razka", "abyan"],
  ["reza", "rasya"],
  ["abyan", "rifqi"],
  ["rasya", "dudit"],
  ["rifqi", "dudit"],
  ["razka", "reza"],
];

// Portfolio projects — showcase of programming work by the collective
export type PortfolioProject = {
  id: string;
  title: string;
  description: string;
  tech: string[];
  category: "WEB" | "GAME" | "MOBILE" | "TOOL" | "BOT" | "OTHER";
  status: "LIVE" | "WIP" | "ARCHIVED";
  year: string;
  author: string;
  link?: string;
  repo?: string;
  color: string;
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  {
    id: "p1",
    title: "UNDIMENSION WEB",
    description: "Web profile collective ini. Neo-brutalism design, 11 section interaktif, chaos mode, synthesized SFX, dan paginated gallery carousel. Full-stack Next.js 16 + Prisma.",
    tech: ["Next.js 16", "TypeScript", "Tailwind 4", "Prisma", "sharp", "framer-motion"],
    category: "WEB",
    status: "LIVE",
    year: "2026",
    author: "RAZKA",
    link: "#",
    repo: "https://github.com/raynzz455/Undimesion-prototype",
    color: "#ff4d4d",
  },
  {
    id: "p2",
    title: "MINECRAFT MOD PACK",
    description: "Custom modpack untuk server private collective. Berisi 47 mod yang dipilih manual, config di-tune untuk survival chaos bareng.",
    tech: ["Java", "Forge", "JSON", "Minecraft"],
    category: "GAME",
    status: "ARCHIVED",
    year: "2022",
    author: "ALDI",
    color: "#00e5ff",
  },
  {
    id: "p3",
    title: "ML DRAFT ANALYZER",
    description: "Tool web untuk analisis draft Mobile Legends. Input composition musuh → output rekomendasi pick. Pakai data hero API.",
    tech: ["React", "Node.js", "REST API"],
    category: "TOOL",
    status: "ARCHIVED",
    year: "2023",
    author: "REZA",
    color: "#d4ff00",
  },
  {
    id: "p4",
    title: "DISCORD CHAOS BOT",
    description: "Bot Discord untuk server collective. Fitur: random game picker, schedule reminder, sound effect player, dan meme generator dari screenshot.",
    tech: ["Node.js", "discord.js", "SQLite"],
    category: "BOT",
    status: "LIVE",
    year: "2024",
    author: "DUDIT",
    color: "#ff00ff",
  },
  {
    id: "p5",
    title: "D&D DICE ROLLER PWA",
    description: "Progressive Web App untuk roll dadu D&D. Support d4/d6/d8/d10/d12/d20/d100, advantage/disadvantage, dan history log. Installable di HP.",
    tech: ["React", "PWA", "Service Worker"],
    category: "WEB",
    status: "LIVE",
    year: "2024",
    author: "ABYAN",
    color: "#ff8c00",
  },
  {
    id: "p6",
    title: "OBBY SPEEDRUN TRACKER",
    description: "Web app untuk track speedrun time obby Roblox. Leaderboard, video proof link, dan auto-timer. Kompetisi internal collective.",
    tech: ["Next.js", "Prisma", "YouTube API"],
    category: "WEB",
    status: "WIP",
    year: "2025",
    author: "RASYA",
    color: "#00ff00",
  },
  {
    id: "p7",
    title: "SCREENSHOT ARCHIVER",
    description: "CLI tool untuk auto-organize screenshot berdasarkan tanggal + game. Convert ke WebP, compress, upload ke cloud. Dipakai untuk arip 4000+ screenshot.",
    tech: ["Python", "Pillow", "CLI"],
    category: "TOOL",
    status: "LIVE",
    year: "2023",
    author: "RAZKA",
    color: "#8a2be2",
  },
  {
    id: "p8",
    title: "GHOST PRESENCE BOT",
    description: "Bot yang bikin akun Discord 'online' walau user ga main. Random status message, reaction time simulator, dan auto-reply chaos.",
    tech: ["Python", "discord.py", "cron"],
    category: "BOT",
    status: "ARCHIVED",
    year: "2024",
    author: "RIFQI",
    color: "#ff4d4d",
  },
  {
    id: "p9",
    title: "SMK REUNION INVITE SITE",
    description: "Landing page undangan reuni SMK. Countdown timer, RSVP form, gallery foto lama, dan peta lokasi. Dikirim ke 50+ alumni.",
    tech: ["HTML/CSS", "JavaScript", "Google Maps API"],
    category: "WEB",
    status: "ARCHIVED",
    year: "2025",
    author: "ALDI",
    color: "#00e5ff",
  },
];

export const PORTFOLIO_CATEGORIES = ["ALL", "WEB", "GAME", "MOBILE", "TOOL", "BOT", "OTHER"] as const;
