#!/usr/bin/env node

/**
 * Villa Engine - i18n Validation Script
 * 
 * Prevents structure drift between language variants by deep-comparing
 * English (master) JSON with all language variants.
 * 
 * Validates:
 * 1. All keys in English exist in variants (deep nested check)
 * 2. Array lengths match (amenities, testimonials, FAQ, images)
 * 3. Required fields present
 * 4. No leftover translation markers ([LANG: TRANSLATE])
 * 
 * Exit code 1 → Fails CI/CD build if issues detected
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTENT_DIR = path.join(__dirname, '../src/content/villas');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`${colors.bold}${colors.blue}${msg}${colors.reset}`)
};

// Required top-level fields
const REQUIRED_FIELDS = [
  'slug',
  'name',
  'summary',
  'hero',
  'hero.title',
  'hero.subtitle',
  'images',
  'headlines',
  'headlines.overview',
  'headlines.location',
  'content',
  'content.overview',
  'content.location',
  'content.hosts',
  'content.hosts.names',
  'content.hosts.bio',
  'content.testimonials',
  'content.faq',
  'amenities',
  'specs',
  'seasons'
];

/**
 * Get value from nested object using dot notation path
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Deep comparison of object structures
 * Returns array of missing key paths
 */
function findMissingKeys(master, variant, prefix = '') {
  const missing = [];
  
  if (typeof master !== 'object' || master === null) {
    return missing;
  }
  
  if (Array.isArray(master)) {
    // For arrays, just check if variant is also an array
    if (!Array.isArray(variant)) {
      missing.push(prefix);
    }
    return missing;
  }
  
  // Check all keys in master exist in variant
  for (const key in master) {
    const currentPath = prefix ? `${prefix}.${key}` : key;
    
    if (!(key in variant)) {
      missing.push(currentPath);
    } else {
      // Recursively check nested objects
      const masterValue = master[key];
      const variantValue = variant[key];
      
      if (typeof masterValue === 'object' && masterValue !== null && !Array.isArray(masterValue)) {
        const nestedMissing = findMissingKeys(masterValue, variantValue, currentPath);
        missing.push(...nestedMissing);
      }
    }
  }
  
  return missing;
}

/**
 * Check array lengths match between master and variant
 */
function checkArrayLengths(master, variant, villaName, lang) {
  const issues = [];
  
  const arrays = [
    { path: 'images', name: 'Images' },
    { path: 'amenities', name: 'Amenities' },
    { path: 'content.testimonials', name: 'Testimonials' },
    { path: 'content.faq', name: 'FAQ' },
    { path: 'seasons', name: 'Seasons' }
  ];
  
  for (const { path, name } of arrays) {
    const masterArray = getNestedValue(master, path);
    const variantArray = getNestedValue(variant, path);
    
    if (Array.isArray(masterArray) && Array.isArray(variantArray)) {
      if (masterArray.length !== variantArray.length) {
        issues.push({
          field: path,
          name: name,
          masterLength: masterArray.length,
          variantLength: variantArray.length
        });
      }
    }
  }
  
  return issues;
}

/**
 * Check for leftover translation markers
 */
function findTranslationMarkers(obj, lang, prefix = '') {
  const markers = [];
  const markerRegex = new RegExp(`\\[${lang.toUpperCase()}:\\s*TRANSLATE\\]`, 'i');
  
  if (typeof obj === 'string') {
    if (markerRegex.test(obj)) {
      markers.push(prefix);
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const currentPath = `${prefix}[${index}]`;
      markers.push(...findTranslationMarkers(item, lang, currentPath));
    });
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      const currentPath = prefix ? `${prefix}.${key}` : key;
      markers.push(...findTranslationMarkers(obj[key], lang, currentPath));
    }
  }
  
  return markers;
}

/**
 * Validate a single villa across all languages
 */
function validateVilla(slug) {
  log.header(`\n${'='.repeat(60)}`);
  log.header(`Validating: ${slug}`);
  log.header('='.repeat(60));
  
  // Find all language files for this villa
  const files = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.startsWith(`${slug}.`) && f.endsWith('.json'))
    .sort();
  
  if (files.length === 0) {
    log.warn(`No JSON files found for villa: ${slug}`);
    return { valid: true, warnings: 0, errors: 0 };
  }
  
  log.info(`Found ${files.length} language variant(s): ${files.map(f => f.split('.')[1]).join(', ')}`);
  
  // Find English (master) file
  const enFile = files.find(f => f.includes('.en.json'));
  if (!enFile) {
    log.error(`No English master file found for ${slug}`);
    return { valid: false, warnings: 0, errors: 1 };
  }
  
  // Load master
  const masterPath = path.join(CONTENT_DIR, enFile);
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  log.success(`Loaded master: ${enFile}`);
  
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Validate each variant
  const variants = files.filter(f => f !== enFile);
  
  for (const variantFile of variants) {
    const lang = variantFile.split('.')[1];
    const variantPath = path.join(CONTENT_DIR, variantFile);
    const variant = JSON.parse(fs.readFileSync(variantPath, 'utf8'));
    
    console.log(`\n${colors.cyan}Checking ${lang.toUpperCase()}:${colors.reset} ${variantFile}`);
    
    let errors = 0;
    let warnings = 0;
    
    // 1. Check required fields
    for (const field of REQUIRED_FIELDS) {
      const value = getNestedValue(variant, field);
      if (value === undefined || value === null) {
        log.error(`  Missing required field: ${field}`);
        errors++;
      }
    }
    
    // 2. Check structure matches master
    const missingKeys = findMissingKeys(master, variant);
    if (missingKeys.length > 0) {
      log.error(`  Missing ${missingKeys.length} key(s) from master structure:`);
      missingKeys.slice(0, 10).forEach(key => {
        console.log(`    ${colors.red}→ ${key}${colors.reset}`);
      });
      if (missingKeys.length > 10) {
        console.log(`    ${colors.red}... and ${missingKeys.length - 10} more${colors.reset}`);
      }
      errors += missingKeys.length;
    }
    
    // 3. Check array lengths
    const arrayIssues = checkArrayLengths(master, variant, slug, lang);
    if (arrayIssues.length > 0) {
      log.error(`  Array length mismatches:`);
      arrayIssues.forEach(issue => {
        console.log(`    ${colors.red}→ ${issue.name}: EN has ${issue.masterLength}, ${lang.toUpperCase()} has ${issue.variantLength}${colors.reset}`);
      });
      errors += arrayIssues.length;
    }
    
    // 4. Check for translation markers (warning, not error)
    const markers = findTranslationMarkers(variant, lang);
    if (markers.length > 0) {
      log.warn(`  Found ${markers.length} untranslated field(s):`);
      markers.slice(0, 5).forEach(marker => {
        console.log(`    ${colors.yellow}→ ${marker}${colors.reset}`);
      });
      if (markers.length > 5) {
        console.log(`    ${colors.yellow}... and ${markers.length - 5} more${colors.reset}`);
      }
      warnings += markers.length;
    }
    
    // Summary for this language
    if (errors === 0 && warnings === 0) {
      log.success(`  ${lang.toUpperCase()}: Perfect structure ✨`);
    } else if (errors === 0) {
      log.warn(`  ${lang.toUpperCase()}: ${warnings} warning(s)`);
    } else {
      log.error(`  ${lang.toUpperCase()}: ${errors} error(s), ${warnings} warning(s)`);
    }
    
    totalErrors += errors;
    totalWarnings += warnings;
  }
  
  // Villa summary
  console.log(`\n${colors.bold}Summary for ${slug}:${colors.reset}`);
  if (totalErrors === 0 && totalWarnings === 0) {
    log.success(`All ${variants.length} language variant(s) validated successfully! 🎉`);
  } else if (totalErrors === 0) {
    log.warn(`${totalWarnings} warning(s) - please review translation markers`);
  } else {
    log.error(`${totalErrors} error(s), ${totalWarnings} warning(s) - FIX BEFORE DEPLOYMENT`);
  }
  
  return {
    valid: totalErrors === 0,
    warnings: totalWarnings,
    errors: totalErrors
  };
}

/**
 * Main validation function
 */
function main() {
  console.log(`\n${colors.bold}${colors.magenta}🌍 Villa Engine - i18n Validation${colors.reset}`);
  console.log(`${colors.cyan}Checking structure consistency across all language variants...${colors.reset}\n`);
  
  // Get all unique villa slugs (skip files starting with underscore - disabled villas)
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  const slugs = [...new Set(files.map(f => f.split('.')[0]))];
  
  if (slugs.length === 0) {
    log.error('No villa JSON files found in src/content/villas/');
    process.exit(1);
  }
  
  log.info(`Found ${slugs.length} villa(s): ${slugs.join(', ')}`);
  
  let totalValid = 0;
  let totalInvalid = 0;
  let totalWarnings = 0;
  
  // Validate each villa
  for (const slug of slugs) {
    const result = validateVilla(slug);
    if (result.valid) {
      totalValid++;
    } else {
      totalInvalid++;
    }
    totalWarnings += result.warnings;
  }
  
  // Final summary
  console.log(`\n${colors.bold}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}${colors.magenta}FINAL VALIDATION REPORT${colors.reset}`);
  console.log(`${colors.bold}${'='.repeat(60)}${colors.reset}\n`);
  
  console.log(`Total villas checked: ${slugs.length}`);
  console.log(`${colors.green}✅ Valid: ${totalValid}${colors.reset}`);
  if (totalInvalid > 0) {
    console.log(`${colors.red}❌ Invalid: ${totalInvalid}${colors.reset}`);
  }
  if (totalWarnings > 0) {
    console.log(`${colors.yellow}⚠️  Warnings: ${totalWarnings}${colors.reset}`);
  }
  
  if (totalInvalid > 0) {
    console.log(`\n${colors.red}${colors.bold}BUILD FAILED${colors.reset} ${colors.red}— Fix structure drift before deployment!${colors.reset}\n`);
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(`\n${colors.yellow}${colors.bold}BUILD PASSED${colors.reset} ${colors.yellow}— but please complete translations${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}${colors.bold}BUILD PASSED${colors.reset} ${colors.green}— All validations successful! 🚀${colors.reset}\n`);
    process.exit(0);
  }
}

// Run validation
main();
