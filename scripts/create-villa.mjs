#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(PROJECT_ROOT, 'src/content/villas');
const PUBLIC_IMG_DIR = path.join(PROJECT_ROOT, 'public/images');
const TEMPLATE_SLUG = 'domaine-des-montarels'; // Master template

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createVilla() {
  console.log('\n🏗️  VILLA ENGINE: SCAFFOLDING NEW SITE\n');
  console.log('━'.repeat(60));

  // 1. Get Inputs
  const name = await question('1. Villa Name (e.g. "Villa Serenity"): ');
  if (!name.trim()) {
    console.error('❌ Error: Villa name is required');
    process.exit(1);
  }

  const defaultSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const slugInput = await question(`2. Slug (default: "${defaultSlug}"): `);
  const slug = slugInput.trim() || defaultSlug;
  
  const ownerEmail = await question('3. Owner Email (for inquiry routing): ');
  const location = await question('4. Location (e.g. "Cartagena, Colombia"): ');

  console.log('\n🚀 Generating assets for: ' + name + ' (' + slug + ')...\n');
  console.log('━'.repeat(60));

  // 2. Create JSON Data
  const templatePath = path.join(CONTENT_DIR, `${TEMPLATE_SLUG}.en.json`);
  const newJsonPath = path.join(CONTENT_DIR, `${slug}.en.json`);

  if (fs.existsSync(newJsonPath)) {
    console.error(`❌ Error: Villa JSON already exists at ${newJsonPath}`);
    console.error('   Delete it first or choose a different slug.');
    rl.close();
    process.exit(1);
  }

  try {
    const templateData = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
    
    // Customize the template with minimal viable data
    const newVillaData = {
      slug: slug,
      name: name,
      summary: `Exclusive luxury retreat in ${location} — awaiting full description...`,
      hero: {
        title: name,
        subtitle: `Secluded luxury in ${location}`,
        ctaText: 'Discover'
      },
      images: [
        { src: `/images/${slug}/001.webp`, alt: `${name} exterior view`, caption: 'Main villa view' },
        { src: `/images/${slug}/002.webp`, alt: `${name} pool area`, caption: 'Private pool' },
        { src: `/images/${slug}/003.webp`, alt: `${name} interior`, caption: 'Interior living space' }
      ],
      headlines: {
        overview: 'Discover Your Sanctuary',
        location: location
      },
      content: {
        overview: `${name} offers an unparalleled luxury experience. [TO BE COMPLETED]`,
        location: `Located in ${location}. [TO BE COMPLETED]`,
        hosts: {
          names: 'Villa Owner',
          bio: '[TO BE COMPLETED]'
        },
        testimonials: [],
        faq: [
          { q: 'How many guests can stay?', a: '[TO BE COMPLETED]' },
          { q: 'What amenities are included?', a: '[TO BE COMPLETED]' }
        ]
      },
      amenities: [
        'WiFi',
        'Pool',
        'Air Conditioning',
        '[ADD MORE]'
      ],
      specs: {
        bedrooms: 0,  // FILL IN
        baths: 0,     // FILL IN
        guests: 0,    // FILL IN
        poolSize: 'TBD'
      },
      seasons: [
        {
          id: 'year-round',
          label: 'Year Round',
          priceDisplay: 'Rate on Request',
          price: null,
          currency: 'USD'
        }
      ]
    };

    fs.writeFileSync(newJsonPath, JSON.stringify(newVillaData, null, 2));
    console.log(`✅ JSON created: src/content/villas/${slug}.en.json`);
  } catch (err) {
    console.error('❌ Failed to create JSON:', err.message);
    rl.close();
    process.exit(1);
  }

  // 3. Create Image Directory
  const newImgDir = path.join(PUBLIC_IMG_DIR, slug);
  if (!fs.existsSync(newImgDir)) {
    fs.mkdirSync(newImgDir, { recursive: true });
    console.log(`✅ Image folder created: public/images/${slug}/`);
  } else {
    console.log(`⚠️  Image folder already exists: public/images/${slug}/`);
  }

  // 4. Update [slug].astro getStaticPaths
  const slugAstroPath = path.join(PROJECT_ROOT, 'src/pages/villas/[slug].astro');
  try {
    let slugContent = fs.readFileSync(slugAstroPath, 'utf8');
    
    // Check if slug already exists in getStaticPaths
    if (!slugContent.includes(`{ params: { slug: '${slug}' } }`)) {
      // Add new slug to getStaticPaths array
      slugContent = slugContent.replace(
        /export async function getStaticPaths\(\) \{[\s\S]*?return \[([\s\S]*?)\];/,
        (match, paths) => {
          const newPath = `\n    { params: { slug: '${slug}' } },`;
          return match.replace(paths, paths + newPath);
        }
      );
      fs.writeFileSync(slugAstroPath, slugContent);
      console.log(`✅ Added '${slug}' to villas/[slug].astro routes`);
    } else {
      console.log(`⚠️  Slug '${slug}' already exists in routes`);
    }
  } catch (err) {
    console.log(`⚠️  Could not update routes automatically: ${err.message}`);
    console.log(`   → Manually add: { params: { slug: '${slug}' } } to getStaticPaths()`);
  }

  // 5. Output Checklist
  console.log('\n' + '━'.repeat(60));
  console.log('🎉 VILLA SCAFFOLDED SUCCESSFULLY');
  console.log('━'.repeat(60));
  console.log('\n📋 NEXT STEPS:\n');
  console.log('  1. 📸 Add images to: public/images/' + slug + '/');
  console.log('     → Name them: 001.webp, 002.webp, 003.webp, etc.');
  console.log('     → Minimum 3 images (preferably 20-40)');
  console.log('');
  console.log('  2. ✏️  Edit content: src/content/villas/' + slug + '.en.json');
  console.log('     → Fill in [TO BE COMPLETED] sections');
  console.log('     → Update specs (bedrooms, baths, guests)');
  console.log('     → Add amenities list');
  console.log('     → Complete testimonials & FAQ');
  console.log('');
  console.log('  3. 🌐 Test locally:');
  console.log('     → npm run dev');
  console.log('     → Visit: http://localhost:4322/villas/' + slug + '/');
  console.log('');
  console.log('  4. 🚀 Deploy to Vercel:');
  console.log('     → Set OWNER_EMAIL=' + ownerEmail);
  console.log('     → Deploy to: villa-' + slug + '.vercel.app');
  console.log('');
  console.log('  5. 📧 Cold email owner with live link');
  console.log('');
  console.log('━'.repeat(60));
  console.log('⏱️  Average completion time: 2-4 hours (manual)');
  console.log('🎯 Target: < 1 hour with automation');
  console.log('━'.repeat(60));

  rl.close();
}

createVilla().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
