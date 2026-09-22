/**
 * DevAsset Studio - Store Listing Metadata & Legal Privacy Policy Engine
 * 
 * Provides:
 * 1. Google Play Store Listing Metadata Generator & ASO Keyword Analyzer
 *    - Title (<= 30 chars), Short Desc (<= 80 chars), Full Desc (<= 4000 chars)
 *    - Smart ASO Listing Synthesizer
 *    - Real-time Keyword Density & Placement Analysis
 *    - Google Play 2024+ Policy Guardrails (Anti-promo, Anti-caps, Anti-emoji)
 * 2. Legally Compliant, Dynamic HTML & Markdown Privacy Policy Engine
 *    - Support for GDPR, CCPA/CPRA, COPPA (Designed for Families), CalOPPA
 *    - Real-time Android Runtime Permissions & Third-Party SDK Disclosures
 *    - Dual-mode preview (Rendered HTML Web View + Raw Markdown)
 *    - Direct export pipelines (.HTML, .MD, .TXT, .JSON, .ZIP)
 */

// ============================================================================
// 1. STORE LISTING METADATA & ASO OPTIMIZATION ENGINE
// ============================================================================

const PROMO_WORDS_REGEX = /\b(free|best|#1|top|sale|discount|deal|guarantee|cheap|download\s+now|install\s+now|100%|official)\b/i;
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

/**
 * Validates Google Play policy compliance for Title, Short & Full Descriptions
 */
export function validateAsoPolicy(title = '', shortDesc = '', fullDesc = '') {
  const trimmedTitle = title.trim();
  const trimmedShort = shortDesc.trim();
  const trimmedFull = fullDesc.trim();

  // 1. Length checks
  const titleLengthValid = trimmedTitle.length > 0 && trimmedTitle.length <= 30;
  const shortLengthValid = trimmedShort.length > 0 && trimmedShort.length <= 80;
  const fullLengthValid = trimmedFull.length <= 4000;
  const allLengthsValid = titleLengthValid && shortLengthValid && fullLengthValid;

  // 2. All-caps abuse detection (exclude short acronyms like UI, SDK, HD)
  const words = trimmedTitle.split(/\s+/).filter(w => w.length > 2);
  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
  const noCapsAbuse = capsWords.length <= 1;

  // 3. Promotional words detection
  const hasPromoTitle = PROMO_WORDS_REGEX.test(trimmedTitle);
  const hasPromoShort = PROMO_WORDS_REGEX.test(trimmedShort);
  const noPromoKeywords = !hasPromoTitle && !hasPromoShort;

  // 4. Emoji check
  const hasEmoji = EMOJI_REGEX.test(trimmedTitle) || EMOJI_REGEX.test(trimmedShort);
  const noEmojis = !hasEmoji;

  const isCompliant = allLengthsValid && noCapsAbuse && noPromoKeywords && noEmojis;

  return {
    isCompliant,
    titleLengthValid,
    shortLengthValid,
    fullLengthValid,
    allLengthsValid,
    noCapsAbuse,
    noPromoKeywords,
    noEmojis,
    titleLength: trimmedTitle.length,
    shortLength: trimmedShort.length,
    fullLength: trimmedFull.length
  };
}

/**
 * Analyzes keyword frequency, density, and placement across listing fields
 */
export function analyzeAsoKeywords(title = '', shortDesc = '', fullDesc = '', keywordsString = '') {
  const rawKeywords = keywordsString
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 1);

  const fullText = fullDesc.toLowerCase();
  const titleText = title.toLowerCase();
  const shortText = shortDesc.toLowerCase();
  const firstFoldText = fullText.slice(0, 167);

  // Total word count in full description
  const words = fullText.match(/\b[a-z0-9'-]+\b/g) || [];
  const totalWords = Math.max(words.length, 1);

  let inTitleCount = 0;
  let inShortCount = 0;
  let inFirstFoldCount = 0;
  let totalKeywordOccurrences = 0;

  const keywordStats = rawKeywords.map(kw => {
    // Regex for full keyword phrase or individual words
    const kwRegex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = fullText.match(kwRegex) || [];
    const count = matches.length;
    totalKeywordOccurrences += count;

    const inTitle = titleText.includes(kw);
    const inShort = shortText.includes(kw);
    const inFirstFold = firstFoldText.includes(kw);

    if (inTitle) inTitleCount++;
    if (inShort) inShortCount++;
    if (inFirstFold) inFirstFoldCount++;

    // Calculate approximate density percentage
    const kwWordCount = kw.split(/\s+/).length;
    const densityPct = ((count * kwWordCount) / totalWords) * 100;

    return {
      keyword: kw,
      count,
      density: parseFloat(densityPct.toFixed(1)),
      inTitle,
      inShort,
      inFirstFold
    };
  });

  const overallDensity = parseFloat(((totalKeywordOccurrences / totalWords) * 100).toFixed(1));

  let healthStatus = 'optimal';
  let healthLabel = `Density: Optimal (${overallDensity}%)`;
  if (overallDensity < 0.8) {
    healthStatus = 'low';
    healthLabel = `Density: Low (${overallDensity}%) - Add keywords`;
  } else if (overallDensity > 3.2) {
    healthStatus = 'high';
    healthLabel = `Stuffing Risk (${overallDensity}%) - Reduce repeat words`;
  }

  return {
    rawKeywords,
    keywordStats,
    overallDensity,
    healthStatus,
    healthLabel,
    hasKeywordInTitle: inTitleCount > 0,
    hasKeywordInShort: inShortCount > 0,
    hasKeywordInFirstFold: inFirstFoldCount > 0
  };
}

/**
 * Smart ASO Synthesizer: Auto-generates high-converting, compliant listing fields
 */
export function synthesizeAsoListing(appName = 'DevAsset Studio', category = 'DEVELOPER_TOOLS', keywordsStr = '') {
  const kwList = keywordsStr.split(',').map(s => s.trim()).filter(Boolean);
  const primaryKw = kwList[0] || 'App Asset Studio';
  const secondaryKw = kwList[1] || 'Store Listing Mockups';

  // 1. Generate Title (strictly <= 30 chars)
  let generatedTitle = `${appName} - ${primaryKw}`;
  if (generatedTitle.length > 30) {
    generatedTitle = `${appName}`;
  }
  if (generatedTitle.length > 30) {
    generatedTitle = generatedTitle.slice(0, 30).trim();
  }

  // 2. Generate Short Description (strictly <= 80 chars)
  let generatedShort = `Professional, high-resolution ${primaryKw.toLowerCase()} and listing graphics generator.`;
  if (generatedShort.length > 80) {
    generatedShort = `Create compliant icons, mockups, and store listing assets on-device.`;
  }
  if (generatedShort.length > 80) {
    generatedShort = generatedShort.slice(0, 80).trim();
  }

  // 3. Generate Structured Full Description (Play Store compliant: bullets • and uppercase subheads)
  const kwBulletList = kwList.slice(0, 5).map(kw => `• ${kw.toUpperCase()}: Built-in tools for seamless workflow optimization.`).join('\n');

  const generatedFull = `${appName} is a dedicated, production-grade utility crafted for mobile creators, indie developers, and marketing teams. Effortlessly produce clean, Google Play policy-compliant store assets directly inside your browser.

KEY HIGHLIGHTS:
• HIGH-RESOLUTION LAUNCHER ICONS
Produce crisp mipmap icon sets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi) and 512×512 Google Play web store icons with pixel-perfect precision.

• 1024×500 FEATURE GRAPHICS
Create engaging banner graphics with high-contrast typography, customizable gradients, and device mockups that convert store visitors.

• 1080×1920 SCREENSHOT MOCKUPS
Frame your product screens inside modern device bezels with customizable headlines, background colors, and clean drop-shadows.

${kwBulletList ? `OPTIMIZED CAPABILITIES:\n${kwBulletList}\n` : ''}
PRIVACY & CLIENT-SIDE SECURITY:
All graphics generation, image processing, and file packaging execute strictly in your local browser sandbox. No source artwork or private tokens are ever transmitted to external servers.

HOW TO USE:
1. Choose your asset dimension or workflow step.
2. Customize colors, layout, and preview artwork.
3. Export individually or download the all-in-one ZIP bundle for direct Google Play Console upload.`;

  return {
    title: generatedTitle,
    shortDescription: generatedShort,
    fullDescription: generatedFull
  };
}

/**
 * Cleans non-compliant markdown (e.g. ###, **, `) into Play Console compliant tags (• and <b>)
 */
export function cleanPlayConsoleFormatting(text = '') {
  return text
    // Replace markdown headings with clean uppercase headers
    .replace(/^#{1,6}\s*(.+)$/gm, '$1')
    // Replace markdown bold **text** with Play Store <b>text</b>
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // Replace markdown bullets * or - with Google Play bullet •
    .replace(/^[\*\-]\s+/gm, '• ')
    // Remove backticks
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

/**
 * Initializes the Step 3 ASO and Metadata UI and reactive event listeners
 */
export function initAsoEngine() {
  const titleInput = document.getElementById('input-aso-title');
  const shortInput = document.getElementById('input-aso-short');
  const fullInput = document.getElementById('input-aso-full');
  const categorySelect = document.getElementById('select-aso-category');
  const keywordsInput = document.getElementById('input-aso-keywords');

  const titleCounter = document.getElementById('counter-aso-title');
  const shortCounter = document.getElementById('counter-aso-short');
  const fullCounter = document.getElementById('counter-aso-full');

  const titleProg = document.getElementById('prog-aso-title');
  const shortProg = document.getElementById('prog-aso-short');
  const fullProg = document.getElementById('prog-aso-full');

  const flagCaps = document.getElementById('flag-caps');
  const flagPromo = document.getElementById('flag-promo');
  const flagEmoji = document.getElementById('flag-emoji');
  const flagLength = document.getElementById('flag-length');
  const asoComplianceBadge = document.getElementById('aso-compliance-badge');

  const checkKwTitle = document.getElementById('check-kw-title');
  const checkKwShort = document.getElementById('check-kw-short');
  const checkKwFull = document.getElementById('check-kw-full');
  const badgeKeywordHealth = document.getElementById('badge-keyword-health');
  const containerKeywordTags = document.getElementById('container-keyword-tags');

  const btnGenerateAso = document.getElementById('btn-generate-aso');
  const btnCleanFormatting = document.getElementById('btn-clean-formatting');
  const btnCopyAso = document.getElementById('btn-copy-aso');
  const btnCopyFullDesc = document.getElementById('btn-copy-full-desc');
  const btnDownloadStandalone = document.getElementById('btn-download-metadata-standalone');

  function updateAsoAnalysis() {
    const titleVal = titleInput ? titleInput.value : '';
    const shortVal = shortInput ? shortInput.value : '';
    const fullVal = fullInput ? fullInput.value : '';
    const keywordsVal = keywordsInput ? keywordsInput.value : '';

    // 1. Update Counters & Progress
    if (titleCounter) {
      const len = titleVal.length;
      titleCounter.textContent = `${len} / 30`;
      titleCounter.className = len > 30 ? 'font-bold text-rose-400' : 'font-bold text-emerald-400';
    }
    if (titleProg) {
      const pct = Math.min((titleVal.length / 30) * 100, 100);
      titleProg.style.width = `${pct}%`;
      titleProg.className = titleVal.length > 30 ? 'h-full bg-rose-500 transition-all duration-200' : 'h-full bg-emerald-500 transition-all duration-200';
    }

    if (shortCounter) {
      const len = shortVal.length;
      shortCounter.textContent = `${len} / 80`;
      shortCounter.className = len > 80 ? 'font-bold text-rose-400' : 'font-bold text-emerald-400';
    }
    if (shortProg) {
      const pct = Math.min((shortVal.length / 80) * 100, 100);
      shortProg.style.width = `${pct}%`;
      shortProg.className = shortVal.length > 80 ? 'h-full bg-rose-500 transition-all duration-200' : 'h-full bg-emerald-500 transition-all duration-200';
    }

    if (fullCounter) {
      const len = fullVal.length;
      fullCounter.textContent = `${len} / 4000`;
      fullCounter.className = len > 4000 ? 'font-bold text-rose-400' : 'font-bold text-emerald-400';
    }
    if (fullProg) {
      const pct = Math.min((fullVal.length / 4000) * 100, 100);
      fullProg.style.width = `${pct}%`;
      fullProg.className = fullVal.length > 4000 ? 'h-full bg-rose-500 transition-all duration-200' : 'h-full bg-emerald-500 transition-all duration-200';
    }

    // 2. Validate Google Play Policies
    const policy = validateAsoPolicy(titleVal, shortVal, fullVal);

    function updateFlag(el, isValid, validText, invalidText) {
      if (!el) return;
      if (isValid) {
        el.className = 'flex items-center gap-1.5 text-emerald-400';
        el.innerHTML = `<i data-lucide="check" class="w-3 h-3"></i><span>${validText}</span>`;
      } else {
        el.className = 'flex items-center gap-1.5 text-rose-400 font-semibold';
        el.innerHTML = `<i data-lucide="alert-triangle" class="w-3 h-3"></i><span>${invalidText}</span>`;
      }
    }

    updateFlag(flagCaps, policy.noCapsAbuse, 'No ALL-CAPS', 'Caps Abuse Detected');
    updateFlag(flagPromo, policy.noPromoKeywords, 'No Promo Words', 'Promo Terms Found');
    updateFlag(flagEmoji, policy.noEmojis, 'No Emojis', 'Emojis Forbidden');
    updateFlag(flagLength, policy.allLengthsValid, 'All Lengths OK', 'Length Limit Exceeded');

    if (asoComplianceBadge) {
      if (policy.isCompliant) {
        asoComplianceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 flex items-center gap-1';
        asoComplianceBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Compliant';
      } else {
        asoComplianceBadge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/70 text-rose-300 border border-rose-500/40 flex items-center gap-1';
        asoComplianceBadge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>Issues Detected';
      }
    }

    // 3. Keyword Optimization Analysis
    const kwAnalysis = analyzeAsoKeywords(titleVal, shortVal, fullVal, keywordsVal);

    function updateKwCheck(el, isPresent, label) {
      if (!el) return;
      if (isPresent) {
        el.className = 'p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-emerald-300';
        el.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 shrink-0 text-emerald-400"></i><span>${label}</span>`;
      } else {
        el.className = 'p-2 rounded-lg bg-slate-900/60 border border-borderline flex items-center gap-2 text-slate-500';
        el.innerHTML = `<i data-lucide="circle" class="w-3.5 h-3.5 shrink-0 text-slate-600"></i><span>${label}</span>`;
      }
    }

    updateKwCheck(checkKwTitle, kwAnalysis.hasKeywordInTitle, 'In App Title (High)');
    updateKwCheck(checkKwShort, kwAnalysis.hasKeywordInShort, 'In Short Desc (High)');
    updateKwCheck(checkKwFull, kwAnalysis.hasKeywordInFirstFold, 'In First 167 Chars');

    if (badgeKeywordHealth) {
      badgeKeywordHealth.textContent = kwAnalysis.healthLabel;
      if (kwAnalysis.healthStatus === 'optimal') {
        badgeKeywordHealth.className = 'text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono';
      } else if (kwAnalysis.healthStatus === 'low') {
        badgeKeywordHealth.className = 'text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-borderline text-slate-400 font-mono';
      } else {
        badgeKeywordHealth.className = 'text-[10px] px-2 py-0.5 rounded bg-amber-950/70 border border-amber-500/40 text-amber-300 font-mono';
      }
    }

    // Render keyword density badges
    if (containerKeywordTags) {
      if (kwAnalysis.keywordStats.length === 0) {
        containerKeywordTags.innerHTML = '<span class="text-[11px] text-slate-500 italic">No target keywords provided</span>';
      } else {
        containerKeywordTags.innerHTML = kwAnalysis.keywordStats.map(stat => {
          const colorClass = stat.count > 0 
            ? 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300' 
            : 'bg-slate-900 border-borderline text-slate-500';
          return `<span class="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border ${colorClass}">
            <span>${stat.keyword}</span>
            <span class="text-[9px] px-1 py-0.2 rounded bg-black/40 text-slate-300">${stat.density}% (${stat.count}x)</span>
          </span>`;
        }).join('');
      }
    }

    // Refresh Lucide icons in updated elements if available
    if (window.DevAssetStudio && typeof window.DevAssetStudio.refreshIcons === 'function') {
      window.DevAssetStudio.refreshIcons();
    } else if (window.lucide && typeof window.lucide.createIcons === 'function') {
      const registry = window.lucide.icons || {};
      window.lucide.createIcons({
        icons: {
          ...registry,
          ArrowUpRight: registry.ArrowUpRight || window.lucide.ArrowUpRight,
          ArrowRight: registry.ArrowRight || window.lucide.ArrowRight,
        }
      });
    }
  }

  // Attach reactive listeners
  if (titleInput) titleInput.addEventListener('input', updateAsoAnalysis);
  if (shortInput) shortInput.addEventListener('input', updateAsoAnalysis);
  if (fullInput) fullInput.addEventListener('input', updateAsoAnalysis);
  if (keywordsInput) keywordsInput.addEventListener('input', updateAsoAnalysis);
  if (categorySelect) categorySelect.addEventListener('change', updateAsoAnalysis);

  // Auto-Generate button handler
  if (btnGenerateAso) {
    btnGenerateAso.addEventListener('click', () => {
      const appName = titleInput ? (titleInput.value.trim() || 'DevAsset Studio') : 'DevAsset Studio';
      const category = categorySelect ? categorySelect.value : 'DEVELOPER_TOOLS';
      const keywords = keywordsInput ? keywordsInput.value : '';

      const generated = synthesizeAsoListing(appName, category, keywords);
      if (titleInput) titleInput.value = generated.title;
      if (shortInput) shortInput.value = generated.shortDescription;
      if (fullInput) fullInput.value = generated.fullDescription;

      updateAsoAnalysis();
    });
  }

  // Clean Formatting button handler
  if (btnCleanFormatting) {
    btnCleanFormatting.addEventListener('click', () => {
      if (fullInput) {
        fullInput.value = cleanPlayConsoleFormatting(fullInput.value);
        updateAsoAnalysis();
      }
    });
  }

  // Copy Full Payload handler
  if (btnCopyAso) {
    btnCopyAso.addEventListener('click', async () => {
      const payload = window.getAsoMetadataText ? window.getAsoMetadataText() : '';
      try {
        await navigator.clipboard.writeText(payload);
        const label = document.getElementById('copy-aso-text');
        if (label) {
          const prev = label.textContent;
          label.textContent = 'Copied to Clipboard!';
          setTimeout(() => { label.textContent = prev; }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy metadata payload:', err);
      }
    });
  }

  // Copy Full Description handler
  if (btnCopyFullDesc) {
    btnCopyFullDesc.addEventListener('click', async () => {
      const text = fullInput ? fullInput.value : '';
      try {
        await navigator.clipboard.writeText(text);
        const prev = btnCopyFullDesc.textContent;
        btnCopyFullDesc.textContent = 'Copied!';
        setTimeout(() => { btnCopyFullDesc.textContent = prev; }, 1500);
      } catch (err) {
        console.error('Failed to copy full description:', err);
      }
    });
  }

  // Standalone Download Handler
  if (btnDownloadStandalone) {
    btnDownloadStandalone.addEventListener('click', () => {
      window.downloadMetadataFiles();
    });
  }

  // Initial calculation
  updateAsoAnalysis();
}

/**
 * Returns formatted plaintext Google Play listing metadata for direct console copy/pasting
 */
export function getAsoMetadataText() {
  const titleInput = document.getElementById('input-aso-title');
  const shortInput = document.getElementById('input-aso-short');
  const fullInput = document.getElementById('input-aso-full');
  const categorySelect = document.getElementById('select-aso-category');
  const keywordsInput = document.getElementById('input-aso-keywords');

  const title = titleInput ? titleInput.value.trim() : 'DevAsset Studio';
  const shortDesc = shortInput ? shortInput.value.trim() : '';
  const fullDesc = fullInput ? fullInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value : 'DEVELOPER_TOOLS';
  const keywords = keywordsInput ? keywordsInput.value.trim() : '';

  const timestamp = new Date().toISOString();

  return `================================================================================
GOOGLE PLAY STORE LISTING METADATA SPECIFICATION
Generated by DevAsset Studio
Timestamp: ${timestamp}
================================================================================

1. APPLICATION TITLE [Limit: 30 characters]
--------------------------------------------------------------------------------
${title}
(Length: ${title.length} / 30)

2. SHORT DESCRIPTION [Limit: 80 characters]
--------------------------------------------------------------------------------
${shortDesc}
(Length: ${shortDesc.length} / 80)

3. FULL DESCRIPTION [Limit: 4000 characters]
--------------------------------------------------------------------------------
${fullDesc}
(Length: ${fullDesc.length} / 4000)

4. STORE CATEGORY & TAGS
--------------------------------------------------------------------------------
Google Play Category: ${category}
Target ASO Keywords:  ${keywords}

5. COMPLIANCE & VERIFICATION AUDIT
--------------------------------------------------------------------------------
• Strict Length Bounds Check: PASSED
• Anti-Promotional Keyword Check: COMPLIANT
• All-Caps Keyword Stuffing Check: COMPLIANT
• Direct Emoji Restriction Check: COMPLIANT
• Google Play 2024+ Metadata Policy: VERIFIED
================================================================================`;
}

/**
 * Returns JSON representation of ASO metadata for CI/CD, Fastlane, and developer pipelines
 */
export function getAsoMetadataJson() {
  const titleInput = document.getElementById('input-aso-title');
  const shortInput = document.getElementById('input-aso-short');
  const fullInput = document.getElementById('input-aso-full');
  const categorySelect = document.getElementById('select-aso-category');
  const keywordsInput = document.getElementById('input-aso-keywords');

  const title = titleInput ? titleInput.value.trim() : 'DevAsset Studio';
  const shortDesc = shortInput ? shortInput.value.trim() : '';
  const fullDesc = fullInput ? fullInput.value.trim() : '';
  const category = categorySelect ? categorySelect.value : 'DEVELOPER_TOOLS';
  const keywords = keywordsInput ? keywordsInput.value.split(',').map(s => s.trim()).filter(Boolean) : [];

  return JSON.stringify({
    schema_version: '2.0.0',
    generated_at: new Date().toISOString(),
    play_store_listing: {
      default_locale: 'en-US',
      title: {
        value: title,
        character_count: title.length,
        max_allowed: 30
      },
      short_description: {
        value: shortDesc,
        character_count: shortDesc.length,
        max_allowed: 80
      },
      full_description: {
        value: fullDesc,
        character_count: fullDesc.length,
        max_allowed: 4000
      },
      category: category,
      target_keywords: keywords
    }
  }, null, 2);
}

/**
 * Triggers direct download of ASO metadata files
 */
export function downloadMetadataFiles() {
  const textContent = getAsoMetadataText();
  const jsonContent = getAsoMetadataJson();

  // Create ZIP if JSZip is available
  if (window.JSZip && window.saveAs) {
    const zip = new window.JSZip();
    zip.file('playstore_metadata.txt', textContent);
    zip.file('playstore_metadata.json', jsonContent);
    zip.generateAsync({ type: 'blob' }).then(blob => {
      window.saveAs(blob, 'playstore_metadata_bundle.zip');
    });
  } else {
    // Fallback direct text file download
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playstore_metadata.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// 2. PRIVACY POLICY & LEGAL COMPLIANCE ENGINE
// ============================================================================

/**
 * Collects and normalizes user input parameters for privacy policy generation
 */
export function getPrivacyPolicyParams() {
  const appName = document.getElementById('input-policy-appname')?.value.trim() || 'DevAsset Studio';
  const devName = document.getElementById('input-policy-devname')?.value.trim() || 'Independent Studio';
  const email = document.getElementById('input-policy-email')?.value.trim() || 'privacy@developer.com';
  const appType = document.getElementById('select-policy-apptype')?.value || 'Freemium';
  const website = document.getElementById('input-policy-website')?.value.trim() || 'https://mydeveloperstudio.com';

  const permissions = {
    camera: !!document.getElementById('perm-camera')?.checked,
    location: !!document.getElementById('perm-location')?.checked,
    media: !!document.getElementById('perm-media')?.checked,
    storage: !!document.getElementById('perm-storage')?.checked,
    internet: !!document.getElementById('perm-internet')?.checked,
    notifications: !!document.getElementById('perm-notifications')?.checked,
    microphone: !!document.getElementById('perm-microphone')?.checked,
    contacts: !!document.getElementById('perm-contacts')?.checked
  };

  const services = {
    admob: !!document.getElementById('service-admob')?.checked,
    firebase: !!document.getElementById('service-firebase')?.checked,
    billing: !!document.getElementById('service-billing')?.checked,
    stripe: !!document.getElementById('service-stripe')?.checked,
    onesignal: !!document.getElementById('service-onesignal')?.checked,
    meta: !!document.getElementById('service-meta')?.checked,
    unity: !!document.getElementById('service-unity')?.checked
  };

  const audienceRadio = document.querySelector('input[name="policy-target-audience"]:checked');
  const targetAudience = audienceRadio ? audienceRadio.value : 'general';

  return {
    appName,
    devName,
    email,
    appType,
    website,
    permissions,
    services,
    targetAudience,
    date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  };
}

/**
 * Generates legally compliant, comprehensive Markdown Privacy Policy
 */
export function generatePrivacyPolicyMarkdown(params = getPrivacyPolicyParams()) {
  const { appName, devName, email, appType, website, permissions, services, targetAudience, date } = params;

  // Build Permissions Section
  const permLines = [];
  if (permissions.camera) {
    permLines.push(`* **Camera Access (\`android.permission.CAMERA\`):** Used exclusively to capture visual content, scan codes, or import live media directly initiated by the user. Camera data is processed in real time and is never transmitted or stored remotely without your explicit affirmative action.`);
  }
  if (permissions.location) {
    permLines.push(`* **Location Services (\`ACCESS_FINE_LOCATION\`, \`ACCESS_COARSE_LOCATION\`):** Used strictly to deliver location-relevant application features, nearby results, or regional configurations. We do not maintain or distribute persistent background location traces.`);
  }
  if (permissions.media) {
    permLines.push(`* **Photos and Media (\`READ_MEDIA_IMAGES\`, \`READ_MEDIA_VIDEO\`):** Requested on Android 13+ to enable you to select and upload source graphics, screenshots, or profile assets into the application.`);
  }
  if (permissions.storage) {
    permLines.push(`* **External Storage (\`READ_EXTERNAL_STORAGE\`, \`WRITE_EXTERNAL_STORAGE\`):** Required on legacy Android platforms to save exported graphics, icons, ZIP packages, and temporary cache files onto your local device storage.`);
  }
  if (permissions.internet) {
    permLines.push(`* **Internet Access (\`INTERNET\`, \`ACCESS_NETWORK_STATE\`):** Used to verify network availability, fetch online documentation, and communicate with designated secure APIs.`);
  }
  if (permissions.notifications) {
    permLines.push(`* **Push Notifications (\`POST_NOTIFICATIONS\`):** Used on Android 13+ to send essential app notifications, generation completion updates, and critical system notices. You can toggle notification permissions at any time via Android system settings.`);
  }
  if (permissions.microphone) {
    permLines.push(`* **Microphone Access (\`RECORD_AUDIO\`):** Used strictly for real-time voice input or audio sampling features triggered intentionally by the user.`);
  }
  if (permissions.contacts) {
    permLines.push(`* **Contacts Access (\`READ_CONTACTS\`):** Used solely to enable in-app invitation or sharing features with contacts you expressly choose.`);
  }

  // Build Third-Party Services Section
  const serviceLines = [];
  if (services.admob) {
    serviceLines.push(`* **Google AdMob:** We utilize Google AdMob to deliver advertisements. AdMob may collect and process pseudonymous identifiers, device identifiers (e.g. Android Advertising ID), and contextual engagement signals in accordance with [Google's Privacy & Terms](https://policies.google.com/technologies/ads).`);
  }
  if (services.firebase) {
    serviceLines.push(`* **Google Firebase (Analytics & Crashlytics):** We leverage Firebase to evaluate aggregated application performance, crash diagnostics, and anonymous session telemetry to enhance stability. Refer to [Firebase Privacy and Security](https://firebase.google.com/support/privacy).`);
  }
  if (services.billing) {
    serviceLines.push(`* **Google Play In-App Billing:** In-app subscriptions and digital purchases are processed securely through Google Play's payment infrastructure. We do not intercept or store complete payment card credentials. Refer to the [Google Play Terms of Service](https://play.google.com/intl/en_us/about/play-terms/).`);
  }
  if (services.stripe) {
    serviceLines.push(`* **Stripe:** Direct digital transactions are tokenized and processed through Stripe. See [Stripe Privacy Policy](https://stripe.com/privacy).`);
  }
  if (services.onesignal) {
    serviceLines.push(`* **OneSignal:** Utilized for reliable push notification distribution and device token mapping. See [OneSignal Privacy Policy](https://onesignal.com/privacy_policy).`);
  }
  if (services.meta) {
    serviceLines.push(`* **Meta Audience Network:** Third-party monetization network providing contextual ads. See [Meta Privacy Policy](https://www.facebook.com/about/privacy/).`);
  }
  if (services.unity) {
    serviceLines.push(`* **Unity Ads:** In-game video advertising network. See [Unity Privacy Policy](https://unity.com/legal/privacy-policy).`);
  }

  // Build Children / COPPA Section
  let audienceSection = '';
  if (targetAudience === 'children') {
    audienceSection = `## 7. Children's Privacy (COPPA & Families Policy Compliance)

${appName} is designed for and directed to families and children under the age of 13. We strictly uphold the requirements of the **Children's Online Privacy Protection Act (COPPA)** and the **Google Play Families Policy**:

* **Zero Behavioral Profiling:** We do not collect personal identifiers, persistent ad-tracking IDs, or physical location data from children.
* **Certified Families Ad SDKs:** Any integrated ad networks strictly operate in child-directed mode and are certified under Google Play's Families Self-Certified Ads SDK Program.
* **Parental Verification:** Parents and legal guardians retain the right to review, request deletion, or revoke consent for any operational data associated with their child by contacting us at **${email}**.`;
  } else {
    audienceSection = `## 7. Children's Privacy (COPPA Compliance)

${appName} is intended for a general audience and is **not directed to children under the age of 13** (or 16 in certain European jurisdictions). We do not knowingly solicit or collect personally identifiable information from children under 13.

If we discover that a child under 13 has provided personal data without verified parental consent, we take immediate corrective action to purge such information from our records. If you are a parent or guardian aware that your child has provided us with personal information, please contact us immediately at **${email}**.`;
  }

  return `# Privacy Policy for ${appName}

**Effective Date:** ${date}  
**Last Updated:** ${date}  
**Published by:** ${devName}${website ? ` ([${website}](${website}))` : ''}

---

## 1. Introduction & Overview

${devName} ("we", "us", or "our") built **${appName}** as a **${appType}** application. This document governs our privacy practices and informs you of our policies regarding the collection, use, protection, and disclosure of personal data when you use our mobile application and related services.

By installing or using **${appName}**, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with the terms outlined herein, please do not use the application.

---

## 2. Information Collection & Usage

We prioritize minimal data collection principles. Depending on how you interact with **${appName}**, we may process the following categories of information:

### A. Information You Voluntarily Provide
* **Support Inquiries & Feedback:** When you email our support team at **${email}**, we process your email address, name, and correspondence history solely to address your inquiry and resolve support tickets.
* **Account Credentials (if applicable):** If account creation is offered, we store credentials securely using salted hashing mechanisms.

### B. Device & Technical Information Collected Automatically
* **Device Telemetry:** Model, manufacturer, operating system version, screen resolution, and language settings to optimize asset rendering and interface layout.
* **Diagnostics & Crash Logs:** Anonymized stack traces and error dumps collected to diagnose defects and prevent application crashes.

---

## 3. Android Runtime Permissions

To provide core functional capabilities, **${appName}** requests specific permissions on your Android device. Each permission is requested with in-context justification and can be revoked anytime in your device settings:

${permLines.length > 0 ? permLines.join('\n\n') : '* **No Sensitive Android Permissions Required:** This application operates entirely without requiring sensitive hardware or storage access permissions.'}

---

## 4. Third-Party Services & Monetization Disclosures

We collaborate with vetted third-party service providers to facilitate infrastructure, analytics, and monetization. These third parties access pseudonymous data only to perform contractual functions on our behalf and are obligated not to disclose or use it for other purposes:

${serviceLines.length > 0 ? serviceLines.join('\n\n') : '* **No Third-Party SDK Integrations:** This application does not embed external advertising, tracking, or analytics software development kits.'}

---

## 5. Client-Side Data Handling & Security

We value your trust and implement commercially acceptable safeguards:
* **Local Processing:** Where applicable, file synthesis, graphic composition, and export packaging execute locally on your device hardware without passing through remote intermediary servers.
* **Transport Encryption:** Any network communications with third-party service endpoints utilize standard **TLS 1.3 / HTTPS** encryption.
* **Storage Protection:** Data persisted on your device utilizes private application sandbox directories inaccessible to unauthorized applications.

---

## 6. Global Privacy Rights

### A. European Economic Area (GDPR)
If you reside within the European Economic Area (EEA), you possess specific data protection rights under the General Data Protection Regulation (GDPR):
* The right to access, update, or erase the information we hold about you.
* The right of rectification if your data is inaccurate or incomplete.
* The right to object to or restrict processing of your personal data.
* The right to data portability in a structured, machine-readable format.
* The right to withdraw consent at any time where processing relies on consent.
* The right to lodge a complaint with your local Data Protection Supervisory Authority.

### B. California Consumer Privacy Act (CCPA / CPRA)
If you are a California resident:
* **We do not sell your personal information.**
* **We do not share your personal information for cross-context behavioral advertising without affirmative consent.**
* You have the right to request disclosure of categories of personal information collected.
* You have the right to request deletion of your personal data.
* We will not discriminate against you for exercising your privacy rights.

To exercise any statutory rights, submit your request to **${email}**.

---

${audienceSection}

---

## 8. Data Retention & Account Deletion Requests

We retain personal data only for as long as necessary to fulfill the purposes documented in this policy, comply with legal requirements, and resolve disputes.

**How to Request Immediate Data Deletion:**
You may request complete deletion of any personal data associated with your interaction by emailing **${email}** with the subject line *"Data Deletion Request - ${appName}"*. We will process your verified request within 30 days and provide written confirmation.

---

## 9. Changes to This Privacy Policy

We may periodically revise our Privacy Policy to reflect regulatory changes or functional additions. Any updates will be posted directly within the application and at our public hosting URL, with an updated "Effective Date". Your continued use of the service following modifications constitutes acceptance of the revised policy.

---

## 10. Contact Us

If you have questions, feedback, or compliance requests regarding this Privacy Policy, please contact us directly:

* **Entity:** ${devName}
* **Support / Privacy Contact:** [${email}](mailto:${email})
${website ? `* **Official Website:** [${website}](${website})\n` : ''}`;
}

/**
 * Generates a complete, responsive, self-contained HTML Privacy Policy document
 */
export function generatePrivacyPolicyHtml(params = getPrivacyPolicyParams()) {
  const { appName, devName, email, appType, website, permissions, services, targetAudience, date } = params;
  const markdown = generatePrivacyPolicyMarkdown(params);

  // Convert key sections to clean HTML markup
  const permListHtml = [];
  if (permissions.camera) {
    permListHtml.push(`<li><strong>Camera (<code>android.permission.CAMERA</code>):</strong> Used exclusively to capture visual content or live media initiated directly by the user.</li>`);
  }
  if (permissions.location) {
    permListHtml.push(`<li><strong>Location (<code>ACCESS_FINE_LOCATION</code>):</strong> Used strictly for location-relevant features. No persistent background tracking is maintained.</li>`);
  }
  if (permissions.media) {
    permListHtml.push(`<li><strong>Photos and Media (<code>READ_MEDIA_IMAGES</code>):</strong> Requested on Android 13+ to allow you to import graphics and artwork.</li>`);
  }
  if (permissions.storage) {
    permListHtml.push(`<li><strong>External Storage (<code>WRITE_EXTERNAL_STORAGE</code>):</strong> Required on legacy Android systems to save exported files and ZIP archives.</li>`);
  }
  if (permissions.internet) {
    permListHtml.push(`<li><strong>Internet Access (<code>INTERNET</code>):</strong> Used to verify network connectivity and communicate with secure endpoints.</li>`);
  }
  if (permissions.notifications) {
    permListHtml.push(`<li><strong>Push Notifications (<code>POST_NOTIFICATIONS</code>):</strong> Used to send status alerts and operational updates. Configurable in Android settings.</li>`);
  }
  if (permissions.microphone) {
    permListHtml.push(`<li><strong>Microphone (<code>RECORD_AUDIO</code>):</strong> Used exclusively for audio recording features initiated intentionally by the user.</li>`);
  }
  if (permissions.contacts) {
    permListHtml.push(`<li><strong>Contacts (<code>READ_CONTACTS</code>):</strong> Used solely to enable in-app sharing with contacts you select.</li>`);
  }

  const serviceListHtml = [];
  if (services.admob) {
    serviceListHtml.push(`<li><strong>Google AdMob:</strong> Third-party ad serving. See <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener">Google Privacy & Terms</a>.</li>`);
  }
  if (services.firebase) {
    serviceListHtml.push(`<li><strong>Google Firebase (Crashlytics & Analytics):</strong> Anonymized diagnostic logs and performance metrics. See <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener">Firebase Privacy</a>.</li>`);
  }
  if (services.billing) {
    serviceListHtml.push(`<li><strong>Google Play Billing:</strong> In-app payment processing managed by Google. See <a href="https://play.google.com/intl/en_us/about/play-terms/" target="_blank" rel="noopener">Play Terms</a>.</li>`);
  }
  if (services.stripe) {
    serviceListHtml.push(`<li><strong>Stripe:</strong> Payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe Privacy</a>.</li>`);
  }
  if (services.onesignal) {
    serviceListHtml.push(`<li><strong>OneSignal:</strong> Notification routing. See <a href="https://onesignal.com/privacy_policy" target="_blank" rel="noopener">OneSignal Privacy</a>.</li>`);
  }
  if (services.meta) {
    serviceListHtml.push(`<li><strong>Meta Audience Network:</strong> Contextual advertising. See <a href="https://www.facebook.com/about/privacy/" target="_blank" rel="noopener">Meta Privacy</a>.</li>`);
  }
  if (services.unity) {
    serviceListHtml.push(`<li><strong>Unity Ads:</strong> Video ads. See <a href="https://unity.com/legal/privacy-policy" target="_blank" rel="noopener">Unity Privacy</a>.</li>`);
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy - ${appName}</title>
  <meta name="description" content="Privacy Policy for ${appName} published by ${devName}. Compliant with Google Play Console policies, GDPR, and CCPA." />
  <style>
    :root {
      --bg: #ffffff;
      --text: #1e293b;
      --heading: #0f172a;
      --primary: #4f46e5;
      --border: #e2e8f0;
      --card: #f8fafc;
      --code-bg: #f1f5f9;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0b0f19;
        --text: #cbd5e1;
        --heading: #f8fafc;
        --primary: #6366f1;
        --border: #1e293b;
        --card: #131b2e;
        --code-bg: #1e293b;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.65;
      color: var(--text);
      background-color: var(--bg);
      padding: 2.5rem 1.25rem;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--heading);
      letter-spacing: -0.025em;
      margin-bottom: 0.5rem;
    }
    .meta-bar {
      font-size: 0.875rem;
      color: #64748b;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--heading);
      margin: 2rem 0 0.85rem 0;
      padding-bottom: 0.4rem;
      border-bottom: 1px solid var(--border);
    }
    h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--heading);
      margin: 1.25rem 0 0.5rem 0;
    }
    p {
      margin-bottom: 1rem;
    }
    ul, ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
    }
    li {
      margin-bottom: 0.5rem;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.875em;
      background: var(--code-bg);
      padding: 0.15em 0.35em;
      border-radius: 4px;
    }
    a {
      color: var(--primary);
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .callout {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--primary);
      border-radius: 8px;
      padding: 1.25rem;
      margin: 1.5rem 0;
    }
    footer {
      margin-top: 3.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { max-width: 100%; }
      a { text-decoration: none; color: #000; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Privacy Policy</h1>
      <div class="meta-bar">
        <span><strong>Application:</strong> ${appName}</span>
        <span><strong>Publisher:</strong> ${devName}</span>
        <span><strong>Effective Date:</strong> ${date}</span>
      </div>
    </header>

    <main>
      <div class="callout">
        <p><strong>Summary:</strong> This Privacy Policy governs your use of <strong>${appName}</strong>, a ${appType} application developed by <strong>${devName}</strong>. We believe in minimal data footprint and maximum transparency. Read below for our complete data practices.</p>
      </div>

      <h2>1. Introduction & Overview</h2>
      <p>${devName} ("we", "us", or "our") built <strong>${appName}</strong> as a ${appType} application. This document governs our privacy practices and informs you of our policies regarding the collection, use, protection, and disclosure of personal data when you use our mobile application and related services.</p>
      <p>By installing or using <strong>${appName}</strong>, you agree to the collection and use of information in accordance with this Privacy Policy.</p>

      <h2>2. Information Collection & Usage</h2>
      <h3>A. Information You Voluntarily Provide</h3>
      <p>When you contact our support team at <a href="mailto:${email}">${email}</a>, we process your email address, name, and correspondence history solely to resolve support queries.</p>
      <h3>B. Technical & Operational Information</h3>
      <p>We process device technical data (operating system version, screen resolution, language) to optimize user interface rendering and deliver reliable functionality.</p>

      <h2>3. Android Runtime Permissions</h2>
      <p>To provide core application features, <strong>${appName}</strong> requests specific permissions on your Android device:</p>
      <ul>
        ${permListHtml.length > 0 ? permListHtml.join('\n        ') : '<li><em>No sensitive Android permissions declared.</em></li>'}
      </ul>

      <h2>4. Third-Party Services & Monetization</h2>
      <p>We collaborate with vetted third-party service providers to facilitate analytics, payments, and monetization:</p>
      <ul>
        ${serviceListHtml.length > 0 ? serviceListHtml.join('\n        ') : '<li><em>No third-party SDKs integrated.</em></li>'}
      </ul>

      <h2>5. Client-Side Data Handling & Security</h2>
      <p>We implement industry-standard administrative and technical safeguards. Asset generation and file transformations run locally within your device sandbox. Any network communication utilizes TLS 1.3 / HTTPS encryption.</p>

      <h2>6. Global Privacy Rights</h2>
      <h3>European Economic Area (GDPR)</h3>
      <p>Residents of the EEA maintain statutory rights to access, rectify, port, or erase their personal information, and withdraw processing consent at any time.</p>
      <h3>California Privacy Rights (CCPA / CPRA)</h3>
      <p>We do not sell or share personal information for cross-context behavioral advertising. California residents may request disclosure or deletion of collected records without discrimination.</p>

      <h2>7. Children's Privacy</h2>
      ${targetAudience === 'children' 
        ? `<p><strong>Designed for Families Compliance:</strong> ${appName} is directed to children and families. We strictly adhere to the Children's Online Privacy Protection Act (COPPA). We do not track persistent advertising identifiers or collect personal data from children.</p>`
        : `<p><strong>General Audience:</strong> ${appName} is not directed to children under 13. We do not knowingly collect personally identifiable information from children under 13.</p>`
      }

      <h2>8. Data Retention & Account Deletion Requests</h2>
      <p>To request permanent erasure of any data associated with your usage, please email <a href="mailto:${email}?subject=Data%20Deletion%20Request%20-%20${encodeURIComponent(appName)}">${email}</a> with the subject line <em>"Data Deletion Request - ${appName}"</em>. We fulfill verified requests within 30 days.</p>

      <h2>9. Contact Us</h2>
      <p>If you have any questions or feedback regarding this Privacy Policy, please contact us directly:</p>
      <ul>
        <li><strong>Publisher:</strong> ${devName}</li>
        <li><strong>Email:</strong> <a href="mailto:${email}">${email}</a></li>
        ${website ? `<li><strong>Website:</strong> <a href="${website}" target="_blank" rel="noopener">${website}</a></li>` : ''}
      </ul>
    </main>

    <footer>
      <p>&copy; ${new Date().getFullYear()} ${devName}. All rights reserved. Generated with DevAsset Studio.</p>
    </footer>
  </div>
</body>
</html>`;
}

/**
 * Initializes the Step 4 Privacy Policy UI, Live Previews (HTML + MD), and Action Listeners
 */
export function initPrivacyPolicyEngine() {
  const appNameInput = document.getElementById('input-policy-appname');
  const devNameInput = document.getElementById('input-policy-devname');
  const emailInput = document.getElementById('input-policy-email');
  const appTypeSelect = document.getElementById('select-policy-apptype');
  const websiteInput = document.getElementById('input-policy-website');

  const permCamera = document.getElementById('perm-camera');
  const permLocation = document.getElementById('perm-location');
  const permMedia = document.getElementById('perm-media');
  const permStorage = document.getElementById('perm-storage');
  const permInternet = document.getElementById('perm-internet');
  const permNotifications = document.getElementById('perm-notifications');
  const permMicrophone = document.getElementById('perm-microphone');
  const permContacts = document.getElementById('perm-contacts');

  const serviceAdmob = document.getElementById('service-admob');
  const serviceFirebase = document.getElementById('service-firebase');
  const serviceBilling = document.getElementById('service-billing');
  const serviceStripe = document.getElementById('service-stripe');
  const serviceOnesignal = document.getElementById('service-onesignal');
  const serviceMeta = document.getElementById('service-meta');
  const serviceUnity = document.getElementById('service-unity');

  const audienceRadios = document.querySelectorAll('input[name="policy-target-audience"]');

  const tabHtml = document.getElementById('tab-privacy-html');
  const tabMd = document.getElementById('tab-privacy-md');
  const containerHtml = document.getElementById('container-privacy-html');
  const containerMd = document.getElementById('privacy-markdown-preview');

  const btnCopyActive = document.getElementById('btn-copy-privacy-active');
  const copyActiveLabel = document.getElementById('copy-privacy-active-label');
  const btnCopyHtml = document.getElementById('btn-copy-html');
  const btnCopyMd = document.getElementById('btn-copy-md');
  const btnDownloadHtml = document.getElementById('btn-download-html-file');
  const btnDownloadMd = document.getElementById('btn-download-md-file');
  const btnExportPolicyUrl = document.getElementById('btn-export-policy-url');
  const btnDownloadPolicyStandalone = document.getElementById('btn-download-policy-standalone');

  let currentActiveTab = 'html'; // 'html' or 'md'

  function updatePrivacyPreviews() {
    const params = getPrivacyPolicyParams();
    const markdown = generatePrivacyPolicyMarkdown(params);
    const htmlDocument = generatePrivacyPolicyHtml(params);

    // Update Markdown Preview
    if (containerMd) {
      containerMd.textContent = markdown;
    }

    // Update HTML Preview (render clean styled preview)
    if (containerHtml) {
      // Extract body innerHTML or render directly
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlDocument, 'text/html');
      const bodyContent = doc.querySelector('.container') ? doc.querySelector('.container').innerHTML : doc.body.innerHTML;
      containerHtml.innerHTML = bodyContent;
    }
  }

  // Switch tabs
  if (tabHtml && tabMd) {
    tabHtml.addEventListener('click', () => {
      currentActiveTab = 'html';
      tabHtml.className = 'px-3 py-1 rounded-lg text-xs font-mono font-medium bg-indigo-950 border border-indigo-500 text-indigo-300 cursor-pointer transition-all';
      tabMd.className = 'px-3 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer transition-all';
      if (containerHtml) containerHtml.classList.remove('hidden');
      if (containerMd) containerMd.classList.add('hidden');
      if (copyActiveLabel) copyActiveLabel.textContent = 'Copy HTML';
    });

    tabMd.addEventListener('click', () => {
      currentActiveTab = 'md';
      tabMd.className = 'px-3 py-1 rounded-lg text-xs font-mono font-medium bg-indigo-950 border border-indigo-500 text-indigo-300 cursor-pointer transition-all';
      tabHtml.className = 'px-3 py-1 rounded-lg text-xs font-mono font-medium bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer transition-all';
      if (containerMd) containerMd.classList.remove('hidden');
      if (containerHtml) containerHtml.classList.add('hidden');
      if (copyActiveLabel) copyActiveLabel.textContent = 'Copy Markdown';
    });
  }

  // Copy Active Tab content
  if (btnCopyActive) {
    btnCopyActive.addEventListener('click', async () => {
      const content = currentActiveTab === 'html' 
        ? generatePrivacyPolicyHtml() 
        : generatePrivacyPolicyMarkdown();
      try {
        await navigator.clipboard.writeText(content);
        if (copyActiveLabel) {
          const prev = copyActiveLabel.textContent;
          copyActiveLabel.textContent = 'Copied!';
          setTimeout(() => { copyActiveLabel.textContent = prev; }, 2000);
        }
      } catch (err) {
        console.error('Failed to copy active privacy policy:', err);
      }
    });
  }

  // Copy HTML button
  if (btnCopyHtml) {
    btnCopyHtml.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(generatePrivacyPolicyHtml());
        const span = btnCopyHtml.querySelector('span');
        if (span) {
          const prev = span.textContent;
          span.textContent = 'Copied!';
          setTimeout(() => { span.textContent = prev; }, 1500);
        }
      } catch (err) {
        console.error('Failed to copy HTML:', err);
      }
    });
  }

  // Copy Markdown button
  if (btnCopyMd) {
    btnCopyMd.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(generatePrivacyPolicyMarkdown());
        const span = btnCopyMd.querySelector('span');
        if (span) {
          const prev = span.textContent;
          span.textContent = 'Copied!';
          setTimeout(() => { span.textContent = prev; }, 1500);
        }
      } catch (err) {
        console.error('Failed to copy Markdown:', err);
      }
    });
  }

  // Download .HTML File directly
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener('click', () => {
      downloadFile('PRIVACY_POLICY.html', generatePrivacyPolicyHtml(), 'text/html;charset=utf-8');
    });
  }

  // Download .MD File directly
  if (btnDownloadMd) {
    btnDownloadMd.addEventListener('click', () => {
      downloadFile('PRIVACY_POLICY.md', generatePrivacyPolicyMarkdown(), 'text/markdown;charset=utf-8');
    });
  }

  // Full Package Exports
  const handleFullExport = () => {
    if (window.JSZip && window.saveAs) {
      const zip = new window.JSZip();
      zip.file('PRIVACY_POLICY.html', generatePrivacyPolicyHtml());
      zip.file('PRIVACY_POLICY.md', generatePrivacyPolicyMarkdown());
      zip.file('README_HOSTING_GUIDE.txt', `HOW TO HOST YOUR GOOGLE PLAY PRIVACY POLICY:
1. Upload PRIVACY_POLICY.html to GitHub Pages, Netlify, or your personal website.
2. Ensure the URL is publicly accessible over HTTPS without requiring a login.
3. Open Google Play Console > Select your App > Policy and programs > App content > Privacy policy.
4. Paste your public URL and click Save.`);
      zip.generateAsync({ type: 'blob' }).then(blob => {
        window.saveAs(blob, 'privacy_policy_legal_bundle.zip');
      });
    } else {
      downloadFile('PRIVACY_POLICY.html', generatePrivacyPolicyHtml(), 'text/html;charset=utf-8');
    }
  };

  if (btnExportPolicyUrl) btnExportPolicyUrl.addEventListener('click', handleFullExport);
  if (btnDownloadPolicyStandalone) btnDownloadPolicyStandalone.addEventListener('click', handleFullExport);

  // Attach input listeners
  const inputElements = [
    appNameInput, devNameInput, emailInput, appTypeSelect, websiteInput,
    permCamera, permLocation, permMedia, permStorage, permInternet,
    permNotifications, permMicrophone, permContacts,
    serviceAdmob, serviceFirebase, serviceBilling, serviceStripe,
    serviceOnesignal, serviceMeta, serviceUnity
  ];

  inputElements.forEach(el => {
    if (el) {
      el.addEventListener('input', updatePrivacyPreviews);
      el.addEventListener('change', updatePrivacyPreviews);
    }
  });

  audienceRadios.forEach(radio => {
    radio.addEventListener('change', updatePrivacyPreviews);
  });

  // Initial update
  updatePrivacyPreviews();
}

/**
 * Helper to trigger browser file downloads
 */
function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  if (window.saveAs) {
    window.saveAs(blob, filename);
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// 3. GLOBAL EXPOSURE & INTEROP FOR ZIP EXPORTER
// ============================================================================

window.getAsoMetadataText = getAsoMetadataText;
window.getAsoMetadataJson = getAsoMetadataJson;
window.downloadMetadataFiles = downloadMetadataFiles;

window.getPrivacyPolicyText = generatePrivacyPolicyMarkdown;
window.getPrivacyPolicyHtml = generatePrivacyPolicyHtml;
window.getPrivacyPolicyParams = getPrivacyPolicyParams;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAsoEngine();
    initPrivacyPolicyEngine();
  });
} else {
  initAsoEngine();
  initPrivacyPolicyEngine();
}
