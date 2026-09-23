// Game detail data — expanders for each game section

export type GamePlayer = {
  memberId: string;
  nick: string;
  color: string;
  img: string;
  role?: string;        // ML role (Tank, Assassin, etc)
  favHero?: string;     // ML favorite hero
  rank?: string;        // ML rank
  kda?: string;         // ML KDA
  winRate?: string;     // ML win rate
  dndCharacter?: string; // D&D character name + class
  dndRace?: string;
  dndClass?: string;
  dndLevel?: number;
  dndCharacterImg?: string;
};

export type DnDCampaign = {
  id: string;
  name: string;
  dm: string;
  status: "ONGOING" | "COMPLETED" | "PAUSED";
  description: string;
  sessions: number;
  locationImages?: string[];
};

export type GameDetail = {
  players: GamePlayer[];
  moments?: { img: string; title: string; desc: string }[];
  // ML specific
  teamStats?: {
    rank: string;
    winRate: string;
    totalMatches: number;
    favoriteComp: string;
  };
  // D&D specific
  campaigns?: DnDCampaign[];
  storyOutline?: string;
  locationImages?: string[];
};

const MEMBER_COLORS: Record<string, string> = {
  aldi: "#ff4d4d", razka: "#00e5ff", reza: "#d4ff00",
  abyan: "#ff00ff", rasya: "#ff8c00", rifqi: "#00ff00", dudit: "#8a2be2", nayla: "#ff006e",
};

const MEMBER_IMGS: Record<string, string> = {
  aldi: "", razka: "/members/member-razka.webp",
  reza: "/members/member-reza.webp", abyan: "/members/member-abyan.webp",
  rasya: "/members/member-rasya.webp", rifqi: "",
  dudit: "", nayla: "",
};

export const GAME_DETAILS: Record<string, GameDetail> = {
  minecraft: {
    players: [
      { memberId: "aldi", nick: "Aldi", color: MEMBER_COLORS.aldi, img: MEMBER_IMGS.aldi },
      { memberId: "rasya", nick: "Acong", color: MEMBER_COLORS.rasya, img: MEMBER_IMGS.rasya },
      { memberId: "razka", nick: "Rembo", color: MEMBER_COLORS.razka, img: MEMBER_IMGS.razka },
      { memberId: "abyan", nick: "Byan", color: MEMBER_COLORS.abyan, img: MEMBER_IMGS.abyan },
    ],
    moments: [
      { img: "/gallery/gallery-1.webp", title: "FIRST DIAMOND", desc: "Diamond pertama ditambang bareng jam 3 pagi." },
      { img: "/gallery/gallery-2.webp", title: "CREEPER MASSACRE", desc: "Base digrebeg creeper 47 kali dalam satu malam." },
      { img: "/gallery/gallery-3.webp", title: "NETHER RAID", desc: "Raid fortress pertama — total party wipe di ruang pertama." },
    ],
  },
  roblox: {
    players: [
      { memberId: "rasya", nick: "Acong", color: MEMBER_COLORS.rasya, img: MEMBER_IMGS.rasya },
      { memberId: "dudit", nick: "Dudit", color: MEMBER_COLORS.dudit, img: MEMBER_IMGS.dudit },
      { memberId: "abyan", nick: "Byan", color: MEMBER_COLORS.abyan, img: MEMBER_IMGS.abyan },
      { memberId: "rifqi", nick: "Tipki", color: MEMBER_COLORS.rifqi, img: MEMBER_IMGS.rifqi },
    ],
    moments: [
      { img: "/gallery/gallery-1.webp", title: "OBBY HELL", desc: "Obby level 100 yang bikin emosi kolektif." },
      { img: "/gallery/gallery-2.webp", title: "ROLEPLAY CHAOS", desc: "Roleplay yang nggak masuk akal tapi bikin ketawa." },
      { img: "/gallery/gallery-3.webp", title: "OOF MONTAGE", desc: "Ratusan 'oof' dalam satu sesi. Klasik." },
    ],
  },
  ml: {
    players: [
      { memberId: "reza", nick: "Eja", color: MEMBER_COLORS.reza, img: MEMBER_IMGS.reza, role: "MIDLANER", favHero: "Lancelot", rank: "Mythic Glory", kda: "4.2/2.1/5.8", winRate: "68%" },
      { memberId: "abyan", nick: "Byan", color: MEMBER_COLORS.abyan, img: MEMBER_IMGS.abyan, role: "GOLD LANER", favHero: "Lesley", rank: "Mythic V", kda: "5.1/1.8/3.2", winRate: "61%" },
      { memberId: "dudit", nick: "Dudit", color: MEMBER_COLORS.dudit, img: MEMBER_IMGS.dudit, role: "JUNGLER", favHero: "Ling", rank: "Mythic III", kda: "6.3/2.5/4.1", winRate: "64%" },
      { memberId: "aldi", nick: "Aldi", color: MEMBER_COLORS.aldi, img: MEMBER_IMGS.aldi, role: "ROAMER", favHero: "Tigreal", rank: "Mythic V", kda: "2.1/1.5/8.2", winRate: "58%" },
      { memberId: "razka", nick: "Rembo", color: MEMBER_COLORS.razka, img: MEMBER_IMGS.razka, role: "EXP LANER", favHero: "Paquito", rank: "Mythic II", kda: "3.8/2.0/4.5", winRate: "60%" },
    ],
    teamStats: {
      rank: "Mythic Glory #1234",
      winRate: "63%",
      totalMatches: 847,
      favoriteComp: "Pick-off + Early Game",
    },
    moments: [
      { img: "/gallery/gallery-1.webp", title: "EPIC COMEBACK", desc: "1-12 di menit 8, menang di menit 22." },
      { img: "/gallery/gallery-2.webp", title: "PUSH MID OR AFK", desc: "Strategi klasik yang sebenarnya tidak pernah sesederhana itu." },
      { img: "/gallery/gallery-3.webp", title: "LAG SPIRAL", desc: "3 player lag merah, masih somehow menang teamfight." },
    ],
  },
  dnd: {
    players: [
      { memberId: "aldi", nick: "Aldi", color: MEMBER_COLORS.aldi, img: MEMBER_IMGS.aldi, dndCharacter: "Theron Blackwood", dndRace: "Human", dndClass: "Fighter (Battle Master)", dndLevel: 8, dndCharacterImg: "/gallery/harapan-mimpi.webp" },
      { memberId: "razka", nick: "Rembo", color: MEMBER_COLORS.razka, img: MEMBER_IMGS.razka, dndCharacter: "Zephyr Voidwalker", dndRace: "Tiefling", dndClass: "Warlock (Great Old One)", dndLevel: 8, dndCharacterImg: "/gallery/harapan-negeri.webp" },
      { memberId: "reza", nick: "Eja", color: MEMBER_COLORS.reza, img: MEMBER_IMGS.reza, dndCharacter: "Lyra Moonwhisper", dndRace: "Elf (High)", dndClass: "Wizard (Divination)", dndLevel: 8, dndCharacterImg: "/gallery/harapan-kota.webp" },
      { memberId: "abyan", nick: "Byan", color: MEMBER_COLORS.abyan, img: MEMBER_IMGS.abyan, dndCharacter: "Grommash Ironjaw", dndRace: "Half-Orc", dndClass: "Barbarian (Path of the Berserker)", dndLevel: 8, dndCharacterImg: "/gallery/harapan-depan.webp" },
      { memberId: "rasya", nick: "Acong", color: MEMBER_COLORS.rasya, img: MEMBER_IMGS.rasya, dndCharacter: "Finnick Quickfingers", dndRace: "Halfling", dndClass: "Rogue (Thief)", dndLevel: 8, dndCharacterImg: "/gallery/gallery-1.webp" },
      { memberId: "dudit", nick: "Dudit", color: MEMBER_COLORS.dudit, img: MEMBER_IMGS.dudit, dndCharacter: "Father Corvin", dndRace: "Human", dndClass: "Cleric (Life Domain)", dndLevel: 8, dndCharacterImg: "/gallery/gallery-2.webp" },
      { memberId: "rifqi", nick: "Tipki", color: MEMBER_COLORS.rifqi, img: MEMBER_IMGS.rifqi, dndCharacter: "The Stranger", dndRace: "??? (Unknown)", dndClass: "Ranger (Gloom Stalker)", dndLevel: 8, dndCharacterImg: "/gallery/gallery-3.webp" },
    ],
    campaigns: [
      { id: "c1", name: "SHADOWS OF EMBERFALL", dm: "Raynaldi (Aldi)", status: "COMPLETED", description: "Kampanye pertama collective. Investigasi hilangnya penduduk desa Emberfall yang ternyata terhubung ke kultus ancient. Berakhir dengan total party kill di ruang boss.", sessions: 12, locationImages: ["/gallery/harapan-mimpi.webp", "/gallery/gallery-1.webp"] },
      { id: "c2", name: "THE VOIDWALKER'S GAMBIT", dm: "Raynaldi (Aldi)", status: "ONGOING", description: "Kampanye kedua. Party diburu oleh entitas dari dimensi void. Zephyr (Rembo) membuat pact dengan Great Old One. Twist: dunia yang mereka kenal adalah ilusi.", sessions: 8, locationImages: ["/gallery/harapan-negeri.webp", "/gallery/gallery-2.webp"] },
    ],
    storyOutline: "Arc 1: Emberfall mystery → Arc 2: Voidwalker reveal → Arc 3: Illusion shatter → Arc 4: Final confrontation. Currently at Arc 3, session 20 total.",
    locationImages: [
      "/gallery/harapan-mimpi.webp",
      "/gallery/harapan-negeri.webp",
      "/gallery/harapan-kota.webp",
      "/gallery/harapan-depan.webp",
    ],
  },
};

// Full D&D 6-stat system (STR/DEX/CON/INT/WIS/CHA)
export type DnDStats = {
  STR: number;
  DEX: number;
  CON: number;
  INT: number;
  WIS: number;
  CHA: number;
};

export const MEMBER_DND_STATS: Record<string, DnDStats> = {
  aldi:  { STR: 16, DEX: 12, CON: 15, INT: 13, WIS: 10, CHA: 14 },
  razka: { STR: 8,  DEX: 14, CON: 12, INT: 18, WIS: 15, CHA: 16 },
  reza:  { STR: 6,  DEX: 12, CON: 10, INT: 20, WIS: 16, CHA: 13 },
  abyan: { STR: 18, DEX: 14, CON: 17, INT: 8,  WIS: 7,  CHA: 10 },
  rasya: { STR: 10, DEX: 18, CON: 12, INT: 14, WIS: 12, CHA: 13 },
  rifqi: { STR: 12, DEX: 16, CON: 14, INT: 13, WIS: 18, CHA: 8 },
  dudit: { STR: 10, DEX: 8,  CON: 14, INT: 14, WIS: 18, CHA: 16 },
};

export const DND_STAT_LABELS: Record<keyof DnDStats, { full: string; desc: string }> = {
  STR: { full: "STRENGTH", desc: "Physical power, lifting capacity, melee damage" },
  DEX: { full: "DEXTERITY", desc: "Agility, reflexes, stealth, ranged accuracy" },
  CON: { full: "CONSTITUTION", desc: "Health, stamina, hit points (HP)" },
  INT: { full: "INTELLIGENCE", desc: "Book smarts, memory, reasoning" },
  WIS: { full: "WISDOM", desc: "Perception, intuition, street smarts" },
  CHA: { full: "CHARISMA", desc: "Charm, persuasion, force of personality" },
};
