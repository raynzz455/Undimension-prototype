import { db } from "../src/lib/db";
import { MEMBERS } from "../src/lib/undimension/data";

const SEED_GUESTBOOK = [
  { name: "Wanderer_07", message: "Across dimensions, the orbit holds. Salam chaos dari ujung galaksi.", color: "#ff4d4d" },
  { name: "Pixel Phantom", message: "Situs ini bikin nostalgia SMK banget. Neo-brutalism for the win.", color: "#00e5ff" },
  { name: "Orbit Guest", message: "Seven souls, one gravity. Tetap bersama walau terpisah ratusan parsec.", color: "#d4ff00" },
  { name: "Void Walker", message: "Gallery of Chaos lives up to its name. Loved every frame.", color: "#ff00ff" },
];

async function main() {
  console.log("🌱 Seeding Undimension database...");

  for (let i = 0; i < MEMBERS.length; i++) {
    const m = MEMBERS[i];
    const memberData = {
      name: m.name,
      nick: m.nick,
      role: m.role,
      img: m.img,
      color: m.color,
      highlight: m.highlight,
      bio: m.bio,
      tagline: m.tagline || "",
      quote: m.quote || "",
      funFactsJson: JSON.stringify(m.funFacts || []),
      element: m.element || "",
      joinYear: m.joinYear || "2020",
      statsJson: JSON.stringify(m.stats),
      socialsJson: JSON.stringify(m.socials),
      taglineCareer: m.taglineCareer || "",
      location: m.location || "",
      availability: m.availability || "EMPLOYED",
      educationJson: JSON.stringify(m.education || []),
      workHistoryJson: JSON.stringify(m.workHistory || []),
      skillsJson: JSON.stringify(m.skills || []),
      order: i,
    };
    await db.member.upsert({
      where: { slug: m.id },
      update: memberData,
      create: { slug: m.id, ...memberData },
    });
    console.log(`  ✓ ${m.nick} (${m.role})${m.hidden ? " [HIDDEN]" : ""}`);
  }
  console.log(`\n✅ Seeded ${MEMBERS.length} members.`);

  // Seed guestbook if empty
  const existing = await db.guestbookEntry.count();
  if (existing === 0) {
    console.log("\n📝 Seeding guestbook...");
    for (const g of SEED_GUESTBOOK) {
      await db.guestbookEntry.create({ data: g });
      console.log(`  ✓ ${g.name}`);
    }
    console.log(`✅ Seeded ${SEED_GUESTBOOK.length} guestbook entries.`);
  } else {
    console.log(`\n📝 Guestbook already has ${existing} entries — skipping seed.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
