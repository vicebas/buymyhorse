import "dotenv/config";
import path from "path";
import fs from "fs/promises";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  UserRole,
  BarnPlan,
  BillingCadence,
  BarnBillingStatus,
  HorseSaleStatus,
} from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import { uploadPublicAsset } from "../src/lib/storage/s3";
import { seedListingOptions } from "../src/lib/horses/listing-options";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Barn definitions — each maps to one logo file
// ---------------------------------------------------------------------------
const BARNS = [
  {
    logoFile: "logo_01_monogram_barn_stables.png",
    slug: "monogram-barn-stables",
    email: "monogram@demo.horseroster.com",
    displayName: "Monogram Barn & Stables",
    headline: "Exceptional Sport Horses, Bred for Champions",
    bio: "Monogram Barn & Stables has been producing and selecting elite sport horses in Wellington for over 15 years. Our focus is on careful development from young horse prospects through grand prix, ensuring every horse we place is truly ready for its next partner.",
    location: "Wellington, FL",
    website: "https://monogrambarn.demo",
    phone: "+1 561-555-0101",
  },
  {
    logoFile: "logo_02_line_horse_equestrian.png",
    slug: "line-horse-equestrian",
    email: "lineequestrian@demo.horseroster.com",
    displayName: "Line Horse Equestrian",
    headline: "Hunter/Jumper Specialists — From Green to Grand Prix",
    bio: "Line Horse Equestrian is a boutique hunter/jumper operation based in Ocala's horse country. We pride ourselves on matching the right horse to the right rider, whether you're looking for a confident children's hunter or a serious 1.40m campaigner.",
    location: "Ocala, FL",
    website: "https://linehorseequestrian.demo",
    phone: "+1 352-555-0202",
  },
  {
    logoFile: "logo_03_crest_equestrian_stables.png",
    slug: "crest-equestrian-stables",
    email: "crest@demo.horseroster.com",
    displayName: "Crest Equestrian Stables",
    headline: "European Warmbloods & Dressage Prospects",
    bio: "Crest Equestrian Stables imports and trains European warmblood dressage horses from the Netherlands, Germany, and Portugal. Our riders compete through the FEI levels, and every horse offered for sale is fully evaluated under saddle in our program.",
    location: "Middleburg, VA",
    website: "https://crestequestrian.demo",
    phone: "+1 540-555-0303",
  },
  {
    logoFile: "logo_04_horizontal_greenfield_stables.png",
    slug: "greenfield-stables",
    email: "greenfield@demo.horseroster.com",
    displayName: "Greenfield Stables",
    headline: "Versatile Eventers & All-Around Athletes",
    bio: "Nestled in the heart of Lexington's bluegrass country, Greenfield Stables specializes in thoroughbreds, Irish Sport Horses, and warmblood crosses with the scope and temperament to excel across all three phases of eventing.",
    location: "Lexington, KY",
    website: "https://greenfieldstables.demo",
    phone: "+1 859-555-0404",
  },
  {
    logoFile: "logo_05_abstract_barn_farm_stable.png",
    slug: "abstract-barn-farm",
    email: "abstract@demo.horseroster.com",
    displayName: "Abstract Barn & Farm",
    headline: "Western Performance & Ranch Horses",
    bio: "Abstract Barn & Farm in Scottsdale breeds and trains Quarter Horses and Paint Horses for cutting, reining, and ranch versatility. Our horses have earned top placings at the NRHA Futurity and AQHA World Show, and we take pride in starting every horse with a solid foundation.",
    location: "Scottsdale, AZ",
    website: "https://abstractbarn.demo",
    phone: "+1 480-555-0505",
  },
];

// ---------------------------------------------------------------------------
// Horse definitions — 26 entries (one per image, assigned round-robin by index)
// ---------------------------------------------------------------------------
const HORSES: Array<{
  name: string;
  breed: string;
  age: number;
  gender: string;
  height: string;
  discipline: string;
  level: string;
  location: string;
  price: number;
  saleStatus: HorseSaleStatus;
  description: string;
  keyDetails: string;
}> = [
  // ---- Monogram Barn & Stables (indices 0, 5, 10, 15, 20, 25) ----
  {
    name: "Celestial Wind",
    breed: "KWPN",
    age: 7,
    gender: "Mare",
    height: "16.1",
    discipline: "Show Jumping",
    level: "1.20m",
    location: "Wellington, FL",
    price: 85000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Celestial Wind is a talented 7-year-old KWPN mare with exceptional scope and a careful, careful jump. She has been competing at 1.20m with consistent double-clear rounds and is ready to step up to 1.30m. Easy on the ground, great in the barn, and uncomplicated to ride — she suits an ambitious amateur or a developing junior.",
    keyDetails: "Clean X-rays, up to date on vaccines, no vices, excellent trail record",
  },
  // index 1 → Line Horse Equestrian
  {
    name: "Fireside Dream",
    breed: "Dutch Warmblood",
    age: 8,
    gender: "Mare",
    height: "16.1",
    discipline: "Hunter",
    level: "3'6\" Hunters",
    location: "Ocala, FL",
    price: 72000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Fireside Dream is a picture-perfect Dutch Warmblood hunter mare with a long, ground-covering stride and a naturally light, round jump. She's been campaigned successfully on the A-circuit at 3'6\" and turns heads every time she enters the ring. An exceptional mover with a quiet, willing disposition.",
    keyDetails: "USEF registered, sound vet check, excellent cooler, braids beautifully",
  },
  // index 2 → Crest Equestrian Stables
  {
    name: "Vivaldi's Song",
    breed: "Oldenburg",
    age: 8,
    gender: "Stallion",
    height: "16.2",
    discipline: "Dressage",
    level: "FEI Intermediate I",
    location: "Middleburg, VA",
    price: 130000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Vivaldi's Song is a licensed Oldenburg stallion competing at Intermediate I. His expressive gaits and natural collection make him a standout in any dressage ring. He has three correct, trainable paces with a particularly notable extended trot. Currently preparing for the Inter II tour with his rider.",
    keyDetails: "Licensed Oldenburg stallion, ISF approved, 5 clean PPE, 8+ year competition record",
  },
  // index 3 → Greenfield Stables
  {
    name: "Storm Chaser",
    breed: "Thoroughbred",
    age: 7,
    gender: "Gelding",
    height: "16.1",
    discipline: "Eventing",
    level: "Preliminary",
    location: "Lexington, KY",
    price: 68000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Storm Chaser is a blood bay Thoroughbred gelding with the heart and athleticism typical of the breed. He competes confidently at Preliminary and has the scope and boldness to advance further. Forward and scopey across country, adjustable and obedient on the flat, and tidy over stadium fences.",
    keyDetails: "USEA registered, OTB with 4 years of eventing training, great with farrier/vet",
  },
  // index 4 → Abstract Barn & Farm
  {
    name: "Reigning Supreme",
    breed: "Quarter Horse",
    age: 6,
    gender: "Mare",
    height: "14.3",
    discipline: "Reining",
    level: "Intermediate Non-Pro",
    location: "Scottsdale, AZ",
    price: 62000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Reigning Supreme is a stunning 6-year-old Quarter Horse mare bred for the reining pen. She executes smooth, ground-covering lead changes, deep, stopping stops, and fluid spins with minimal rider input. NRHA money earner and a joy to ride at every level. Suitable for non-pro or amateur competitor.",
    keyDetails: "NRHA registered, AQHA papers, sire is a world champion, full training history available",
  },
  // index 5 → Monogram Barn & Stables
  {
    name: "Royal Crest",
    breed: "Hanoverian",
    age: 9,
    gender: "Gelding",
    height: "16.3",
    discipline: "Show Jumping",
    level: "1.30m",
    location: "Wellington, FL",
    price: 120000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Royal Crest is a powerful Hanoverian gelding with a brilliant, uphill technique and tremendous scope. He has been competing consistently at 1.30m with multiple top-three finishes. He is brave to all fence types and well-traveled on the A-circuit. A genuine professional's horse ready for a partner who wants to move up.",
    keyDetails: "Hanoverian registered, FEI passport, complete competition record available, 5-star vet",
  },
  // index 6 → Line Horse Equestrian
  {
    name: "Copper Ridge",
    breed: "Thoroughbred",
    age: 11,
    gender: "Gelding",
    height: "16.0",
    discipline: "Hunter",
    level: "Amateur Owner Hunter",
    location: "Ocala, FL",
    price: 45000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Copper Ridge is the consummate amateur hunter — steady, consistent, and kind. This 11-year-old OTB gelding has been in a hunter program for five years and knows his job. He leads around the ring, picks up both leads, and forgives the occasional mistake. The perfect partner for an adult amateur looking to show with confidence.",
    keyDetails: "OTB 6 years ago, clean joints, no vices, great in trailer, suitable for adult amateur",
  },
  // index 7 → Crest Equestrian Stables
  {
    name: "Beethoven's Legacy",
    breed: "Dutch Warmblood",
    age: 10,
    gender: "Gelding",
    height: "16.3",
    discipline: "Dressage",
    level: "Grand Prix",
    location: "Middleburg, VA",
    price: 110000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Beethoven's Legacy is a confirmed Grand Prix dressage gelding who knows every test. His piaffe and passage are expressive and confirmed, and his canter pirouettes are balanced and secure. He's competed at CDI level and is an honest, willing partner for a serious amateur or professional looking for a schoolmaster to develop from.",
    keyDetails: "Grand Prix confirmed, CDI competitor, European import, full medical and training records",
  },
  // index 8 → Greenfield Stables
  {
    name: "Clover's Edge",
    breed: "Irish Sport Horse",
    age: 8,
    gender: "Gelding",
    height: "16.2",
    discipline: "Eventing",
    level: "Training Level",
    location: "Lexington, KY",
    price: 58000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Clover's Edge is a genuine Irish Sport Horse gelding that brings classic Irish warmth, courage, and athleticism to every outing. He's been carefully produced through Training level eventing and has the character to advance. Bold and brave cross-country, with a naturally adjustable canter that makes stadium work straightforward.",
    keyDetails: "ISH registered, clean pre-purchase exam, brave cross country, well-mannered in hand",
  },
  // index 9 → Abstract Barn & Farm
  {
    name: "Cut Above the Rest",
    breed: "Quarter Horse",
    age: 7,
    gender: "Gelding",
    height: "15.1",
    discipline: "Cutting",
    level: "Open",
    location: "Scottsdale, AZ",
    price: 45000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Cut Above the Rest is a natural athlete in the cutting pen. This 7-year-old sorrel Quarter Horse gelding has deep cow sense and a smooth, powerful stop. He's been shown in Open cutting events and consistently places. Quiet to ride outside the pen and easy to manage at shows.",
    keyDetails: "AQHA registered, NCHA money earner, excellent cow sense, ridden by amateurs and pros",
  },
  // index 10 → Monogram Barn & Stables
  {
    name: "Morning Glory",
    breed: "Warmblood",
    age: 5,
    gender: "Mare",
    height: "16.2",
    discipline: "Hunter",
    level: "3' Hunters",
    location: "Wellington, FL",
    price: 65000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Morning Glory is a beautiful young warmblood mare with the movement, type, and attitude to develop into an exceptional hunter. At 5 years old she is already showing at 3' with consistent, relaxed rounds. She has a soft, willing mouth and a professional demeanor well beyond her years. A genuine investment piece.",
    keyDetails: "Young horse, 5-year-old prospect, showing at 3', eligible for young hunter classes",
  },
  // index 11 → Line Horse Equestrian
  {
    name: "Emerald Isle",
    breed: "Irish Sport Horse",
    age: 7,
    gender: "Mare",
    height: "16.2",
    discipline: "Show Jumping",
    level: "1.20m–1.30m",
    location: "Ocala, FL",
    price: 88000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Emerald Isle is a striking gray Irish Sport Horse mare with all the talent, blood, and bravery to excel at the top levels. She competes confidently at 1.20m and has the scope for 1.40m. Her careful, snappy front end and powerful canter make her a crowd favorite. She's currently being pointed toward the 1.30m classes.",
    keyDetails: "ISH registered, EU passport, vet clear, travels well, excellent competition record",
  },
  // index 12 → Crest Equestrian Stables
  {
    name: "Aria Bella",
    breed: "Hanoverian",
    age: 6,
    gender: "Mare",
    height: "16.1",
    discipline: "Dressage",
    level: "Prix St. Georges",
    location: "Middleburg, VA",
    price: 78000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Aria Bella is a beautifully moving Hanoverian mare currently competing at Prix St. Georges. She has correct, elastic gaits and a natural tendency to be over the back. Her trot half-passes and flying changes are confirmed and expressive. An ideal partner for an ambitious amateur dressage rider ready to compete at the FEI levels.",
    keyDetails: "Hanoverian mare book, PSG confirmed, 3 correct paces, elastic through the back",
  },
  // index 13 → Greenfield Stables
  {
    name: "Maple Lane",
    breed: "Connemara Cross",
    age: 10,
    gender: "Mare",
    height: "15.2",
    discipline: "Eventing",
    level: "Beginner Novice",
    location: "Lexington, KY",
    price: 32000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Maple Lane is a 10-year-old Connemara cross mare with all the brains, durability, and heart that makes the breed legendary. She's a proven beginner novice eventer with a long career ahead of her. Perfect for the adult amateur or young rider looking to get started in eventing with a safe, experienced partner.",
    keyDetails: "Suitable for ammies and juniors, safe and sane, cross-country schooled, great to hack",
  },
  // index 14 → Abstract Barn & Farm
  {
    name: "Dusty Trail Boss",
    breed: "Paint",
    age: 9,
    gender: "Gelding",
    height: "15.2",
    discipline: "Ranch Versatility",
    level: "Open",
    location: "Scottsdale, AZ",
    price: 28000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Dusty Trail Boss is a striking tobiano Paint gelding built for ranch work. He sorts cattle, works gates, drags logs, and trail rides as comfortably as he shows in ranch horse versatility classes. His kind eye and calm disposition make him a trusted partner for long days. An honest, foot-perfect horse that delivers every single time.",
    keyDetails: "APHA registered, ranch-broke, loads, clips, bathes, excellent feet, no shoes needed",
  },
  // index 15 → Monogram Barn & Stables
  {
    name: "Titan's Son",
    breed: "Belgian Warmblood",
    age: 10,
    gender: "Gelding",
    height: "17.0",
    discipline: "Show Jumping",
    level: "Grand Prix 1.45m",
    location: "Wellington, FL",
    price: 150000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Titan's Son is a proven grand prix jumper with a wealth of experience at 1.45m. This 17-hand Belgian Warmblood gelding has competed at international classes and has the scope, scope, and temperament to continue for many more years. A true professional's horse that is also genuine and honest in training.",
    keyDetails: "FEI passport, international competition record, confirmed GP, 5 clean vettings on file",
  },
  // index 16 → Line Horse Equestrian
  {
    name: "Black Diamond",
    breed: "KWPN",
    age: 9,
    gender: "Gelding",
    height: "16.3",
    discipline: "Show Jumping",
    level: "1.35m",
    location: "Ocala, FL",
    price: 175000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Black Diamond is the kind of horse you don't often find. A jet-black KWPN gelding with an enormous canter and a careful, athletic jump, he is currently competing at 1.35m and has the potential for the grand prix. Tractable in the barn and a confident competitor, he is suitable for a professional or a very experienced amateur.",
    keyDetails: "KWPN registered, FEI passport, competitive record at 1.35m, proven on grass and sand",
  },
  // index 17 → Crest Equestrian Stables
  {
    name: "Don Corleone",
    breed: "Lusitano",
    age: 9,
    gender: "Stallion",
    height: "16.0",
    discipline: "Dressage",
    level: "FEI / Haute École",
    location: "Middleburg, VA",
    price: 95000,
    saleStatus: HorseSaleStatus.CONSIDERING_OFFERS,
    description:
      "Don Corleone is an acclaimed Lusitano stallion with exceptional collection and a rare talent for the airs above the ground. He has been trained through all FEI movements including piaffe, passage, and one-time changes, and has begun work in levade. A once-in-a-decade horse for the dressage enthusiast who values artistry.",
    keyDetails: "Licensed Lusitano stallion, ApHC approved, 3 airs above the ground, extensive show record",
  },
  // index 18 → Greenfield Stables
  {
    name: "Highland Spirit",
    breed: "Warmblood Cross",
    age: 6,
    gender: "Gelding",
    height: "17.0",
    discipline: "Eventing",
    level: "Novice Prospect",
    location: "Lexington, KY",
    price: 55000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Highland Spirit is an exciting young warmblood cross gelding with all the tools to become an upper-level eventer. At 17 hands he has the scope to jump anything, and his bold, forward temperament and natural balance suggest a bright future. He's currently competing at Novice and is ready to move up to Training with the right rider.",
    keyDetails: "6yo prospect with scope, brave XC, athletic jump, suitable for experienced junior or pro",
  },
  // index 19 → Abstract Barn & Farm
  {
    name: "Loping Leo",
    breed: "Quarter Horse",
    age: 5,
    gender: "Stallion",
    height: "15.0",
    discipline: "Ranch Cutting",
    level: "Open Futurity",
    location: "Scottsdale, AZ",
    price: 55000,
    saleStatus: HorseSaleStatus.CONSIDERING_OFFERS,
    description:
      "Loping Leo is a striking buckskin Quarter Horse stallion bred for the cutting pen. At just 5 years old, he has already earned checks in the Open Futurity and shows exceptional cow sense and athleticism. For the right program, he could be a foundational breeding stallion while continuing his cutting career.",
    keyDetails: "AQHA registered, futurity record, proven cow breeding, outstanding conformation, breeding inquiries welcome",
  },
  // index 20 → Monogram Barn & Stables
  {
    name: "Silver Streak",
    breed: "KWPN",
    age: 6,
    gender: "Stallion",
    height: "16.2",
    discipline: "Sport Horse",
    level: "1.10m–1.20m",
    location: "Wellington, FL",
    price: 95000,
    saleStatus: HorseSaleStatus.CONSIDERING_OFFERS,
    description:
      "Silver Streak is a licensed KWPN stallion with outstanding conformation and an expressive, ground-covering trot. He is currently competing at 1.10m–1.20m and developing toward the higher levels. His offspring are beginning to show in young horse classes with excellent results. Ideal for a breeding program or for a professional rider developing a sport horse.",
    keyDetails: "Licensed KWPN stallion, IBOP tested, breeding record available, clear hereditary evaluation",
  },
  // index 21 → Line Horse Equestrian
  {
    name: "Prairie Moon",
    breed: "Quarter Horse",
    age: 6,
    gender: "Mare",
    height: "15.3",
    discipline: "Hunter Under Saddle",
    level: "Lope classes / AQHA",
    location: "Ocala, FL",
    price: 38000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Prairie Moon is a stunning palomino Quarter Horse mare with an effortless, ground-covering lope that turns heads in the hunter under saddle pen. She is quiet, easy to catch, and handles like a dream. Showing successfully in AQHA hunter under saddle classes, she would also make a beautiful pleasure or all-around mount.",
    keyDetails: "AQHA registered, hunter under saddle record, easy to ride, suitable for non-pro and youth",
  },
  // index 22 → Crest Equestrian Stables
  {
    name: "Rhapsody Blue",
    breed: "Westphalian",
    age: 7,
    gender: "Mare",
    height: "16.2",
    discipline: "Dressage",
    level: "FEI Intermediate II",
    location: "Middleburg, VA",
    price: 145000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Rhapsody Blue is a superb Westphalian mare competing at Intermediate II. Her piaffe is expressive and well-developed, her canter pirouettes are balanced and secure, and her half-passes are sweeping and elastic. She has been a consistent top finisher at CDI competitions and is ready to step into the Grand Prix frame.",
    keyDetails: "Westphalian mare book, CDIO record, Inter II confirmed, video library available on request",
  },
  // index 23 → Greenfield Stables
  {
    name: "Meadow Song",
    breed: "Irish Draught Cross",
    age: 9,
    gender: "Mare",
    height: "16.0",
    discipline: "Trail / Pleasure",
    level: "Recreational",
    location: "Lexington, KY",
    price: 28000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Meadow Song is a 9-year-old Irish Draught cross mare who is the definition of a genuine, no-fuss horse. She trail rides alone or in company, crosses water, walks through mud, and handles all kinds of terrain without batting an eye. She's been used as a lesson horse and has a long record of carrying beginners safely.",
    keyDetails: "Family-safe, beginner-friendly, handles trail alone or in company, great with kids",
  },
  // index 24 → Abstract Barn & Farm
  {
    name: "Golden Sage",
    breed: "Quarter Horse",
    age: 11,
    gender: "Mare",
    height: "14.2",
    discipline: "Trail / Pleasure",
    level: "Novice / Youth",
    location: "Scottsdale, AZ",
    price: 22000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Golden Sage is a beloved palomino Quarter Horse mare with a heart of gold and a flawless safety record with youth and beginner riders. She's been a 4-H mount, a trail horse, and a family companion for years. Her small size makes her accessible for younger and smaller riders, and her experience means they'll be in safe hands.",
    keyDetails: "Youth and beginner safe, 4-H record, loads, clips, no shoes, excellent for beginner families",
  },
  // index 25 → Monogram Barn & Stables
  {
    name: "Baroness of Gold",
    breed: "Hanoverian",
    age: 8,
    gender: "Mare",
    height: "16.1",
    discipline: "Hunter / Jumper",
    level: "3'6\" / 1.10m",
    location: "Wellington, FL",
    price: 78000,
    saleStatus: HorseSaleStatus.FOR_SALE,
    description:
      "Baroness of Gold is a classic-type Hanoverian mare with the movement and style for hunters and the scope for the jumpers. She has shown both disciplines successfully and can win in either ring. Her rich chestnut coat and chrome make her stunning in the show ring. A versatile, competitive mare for the AA or professional.",
    keyDetails: "Shown hunters and jumpers, A-circuit record, Hanoverian registered, easy to adapt between disciplines",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

async function readImageFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir);
  return entries
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🌱  Starting demo seed...\n");
  await seedListingOptions();

  const DEMO_PASSWORD = "Demo1234!";
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const barnDir = path.resolve(__dirname, "../docs/template-barns");
  const horseDir = path.resolve(__dirname, "../docs/template-horses");

  // ---- Step 1: Create barns ----
  const createdBarns: Array<{ id: string; slug: string }> = [];

  for (const barn of BARNS) {
    console.log(`🏠  Creating barn: ${barn.displayName}`);

    // Upload logo
    const logoPath = path.join(barnDir, barn.logoFile);
    const logoBuffer = await fs.readFile(logoPath);
    const logoKey = `sellers/logos/demo-seed-${barn.slug}.png`;
    await uploadPublicAsset({
      key: logoKey,
      body: logoBuffer,
      contentType: "image/png",
    });
    console.log(`    ↑ logo uploaded → ${logoKey}`);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: barn.email,
        password: passwordHash,
        role: UserRole.SELLER,
        emailVerified: new Date(),
        name: barn.displayName,
      },
    });

    // Create seller profile — billingStatus ACTIVE so barn is publicly visible
    const seller = await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        displayName: barn.displayName,
        slug: barn.slug,
        headline: barn.headline,
        bio: barn.bio,
        location: barn.location,
        website: barn.website,
        phone: barn.phone,
        logo: logoKey,
        plan: BarnPlan.ACTIVATION,
        billingCadence: BillingCadence.MONTHLY,
        billingStatus: BarnBillingStatus.ACTIVE,
      },
    });

    console.log(`    ✔ seller profile created (id: ${seller.id})\n`);
    createdBarns.push({ id: seller.id, slug: barn.slug });
  }

  // ---- Step 2: Read horse images ----
  const horseImages = await readImageFiles(horseDir);
  console.log(`🐴  Found ${horseImages.length} horse images, creating ${HORSES.length} horses...\n`);

  // ---- Step 3: Create horses distributed round-robin ----
  for (let i = 0; i < HORSES.length; i++) {
    const horseDef = HORSES[i];
    const imageFile = horseImages[i % horseImages.length];
    const barn = createdBarns[i % createdBarns.length];

    console.log(`🐴  [${i + 1}/${HORSES.length}] ${horseDef.name} → ${barn.slug}`);

    // Upload image
    const imagePath = path.join(horseDir, imageFile);
    const imageBuffer = await fs.readFile(imagePath);
    // Use index so duplicate filenames across horses don't collide in S3
    const imageKey = `horses/main/${barn.id}/demo-${i}-${imageFile.replace(/\s+/g, "_")}`;
    await uploadPublicAsset({
      key: imageKey,
      body: imageBuffer,
      contentType: getContentType(imageFile),
    });
    console.log(`    ↑ image uploaded → ${imageKey}`);

    await prisma.horse.create({
      data: {
        sellerProfileId: barn.id,
        name: horseDef.name,
        breed: horseDef.breed,
        age: horseDef.age,
        gender: horseDef.gender,
        height: horseDef.height,
        discipline: horseDef.discipline,
        level: horseDef.level,
        location: horseDef.location,
        description: horseDef.description,
        keyDetails: horseDef.keyDetails,
        price: horseDef.price,
        saleStatus: horseDef.saleStatus,
        image: imageKey,
        isPublished: true,
        isActive: true,
      },
    });

    console.log(`    ✔ horse created\n`);
  }

  console.log("✅  Demo seed complete!");
  console.log(`\n   5 barns created. Login with any barn email / "Demo1234!"`);
  console.log("   Barn emails:");
  for (const barn of BARNS) {
    console.log(`     ${barn.email}`);
  }
  console.log(`\n   ${HORSES.length} horses created and published.`);
}

main()
  .catch((err) => {
    console.error("❌  Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
