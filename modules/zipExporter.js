/**
 * modules/zipExporter.js
 * DevAsset Studio • Dynamic Play Store Asset Packager & Standalone Step Exporters
 * 
 * Responsibilities:
 * 1. Smart Dynamic Bundle Export (Bottom Bar):
 *    - Dynamically detects generated assets across Step 1 to Step 5.
 *    - If user generated Step 1 & Step 3 only, packages only those generated assets into proper subfolders.
 *    - Gracefully omits ungenerated steps without empty/corrupted files or errors.
 *    - If all steps are completed, packages the full production structure:
 *        - res/mipmap-density/ic_launcher.png (5 densities)
 *        - playstore/ic_launcher-512.png
 *        - playstore/feature_graphic.png (1024x500)
 *        - store_screenshots/screenshot_*.png (1080x1920 / 1920x1080)
 *        - metadata/listing_metadata.json & playstore/metadata.txt
 *        - legal/PRIVACY_POLICY.md & legal/privacy_policy.html
 * 
 * 2. Standalone Step Downloads:
 *    - Step 1: "Download Mipmaps (.ZIP)" -> devasset-android-mipmaps.zip
 *    - Step 2: "Download Banner (.PNG - 1024x500)" -> feature_graphic.png
 *    - Step 3: "Download Mockups (.ZIP)" -> devasset-screenshots-bundle.zip
 *    - Step 4: "Download Metadata (.TXT / .JSON)" -> devasset-store-metadata.zip
 *    - Step 5: "Download Policy (.MD / .HTML)" -> devasset-privacy-policy.zip
 * 
 * 3. Step Generation Tracking & Visual Pipeline Indicators
 *    - Real-time detection & sync across bottom bar badges and navigation status dots.
 *    - 100% client-side in-memory compression via JSZip and FileSaver.
 */

(function () {
  'use strict';

  window.DevAssetStudio = window.DevAssetStudio || {};

  // Step Status Registry: Tracks which steps have actively generated assets
  const stepStatus = {
    step1: false, // Master Icon & Mipmaps
    step2: false, // Feature Graphic Banner
    step3: false, // Screenshots Mockup
    step4: false, // ASO Policy Check
    step5: false, // Privacy Policy
  };

  window.DevAssetStudio.stepStatus = stepStatus;

  // Re-initialize Lucide vector icons
  function refreshIcons() {
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

  // Toast / Floating Notification
  function showNotification(message, type) {
    let toast = document.getElementById('devasset-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'devasset-toast';
      toast.className = 'fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl border font-mono text-xs transition-all duration-300 transform translate-y-[-10px] opacity-0';
      document.body.appendChild(toast);
    }

    if (type === 'success') {
      toast.className = 'fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl border border-emerald-500/50 bg-emerald-950/90 text-emerald-200 font-mono text-xs backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2';
      toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0"></i><span>${message}</span>`;
    } else {
      toast.className = 'fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 bg-amber-950/90 text-amber-200 font-mono text-xs backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2';
      toast.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0"></i><span>${message}</span>`;
    }

    refreshIcons();

    setTimeout(function () {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
    }, 3800);
  }

  /**
   * Update dynamic status badges in bottom bar and navigation
   */
  function updateStepStatus(stepKey, isReady) {
    if (stepStatus.hasOwnProperty(stepKey)) {
      stepStatus[stepKey] = Boolean(isReady);
    }

    // Update bottom bar badges
    const badgeMap = {
      step1: document.getElementById('badge-step-1'),
      step2: document.getElementById('badge-step-2'),
      step3: document.getElementById('badge-step-3'),
      step4: document.getElementById('badge-step-4'),
      step5: document.getElementById('badge-step-5'),
    };

    const labelMap = {
      step1: '01 Icon & Banner',
      step2: '01 Icon & Banner',
      step3: '02 Mockups',
      step4: '03 Metadata',
      step5: '04 Policy',
    };

    // Reflect Step 1 ready if either icon or banner is ready
    const step1CombinedReady = stepStatus.step1 || stepStatus.step2;
    const badgeStep1 = document.getElementById('badge-step-1');
    if (badgeStep1) {
      if (step1CombinedReady) {
        badgeStep1.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1';
        badgeStep1.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span><span>01 Icon & Banner: Ready ✓</span>`;
      } else {
        badgeStep1.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-slate-900 border-borderline text-slate-400 flex items-center gap-1';
        badgeStep1.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block"></span><span>01 Icon & Banner: Idle</span>`;
      }
    }

    const badgeStep2 = document.getElementById('badge-step-2');
    if (badgeStep2) {
      if (stepStatus.step3) {
        badgeStep2.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1';
        badgeStep2.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span><span>02 Mockups: Ready ✓</span>`;
      } else {
        badgeStep2.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-slate-900 border-borderline text-slate-400 flex items-center gap-1';
        badgeStep2.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block"></span><span>02 Mockups: Idle</span>`;
      }
    }

    const badgeStep3 = document.getElementById('badge-step-3');
    if (badgeStep3) {
      if (stepStatus.step4) {
        badgeStep3.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1';
        badgeStep3.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span><span>03 Metadata: Ready ✓</span>`;
      } else {
        badgeStep3.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-slate-900 border-borderline text-slate-400 flex items-center gap-1';
        badgeStep3.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block"></span><span>03 Metadata: Idle</span>`;
      }
    }

    const badgeStep4 = document.getElementById('badge-step-4');
    if (badgeStep4) {
      if (stepStatus.step5) {
        badgeStep4.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1';
        badgeStep4.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span><span>04 Policy: Ready ✓</span>`;
      } else {
        badgeStep4.className = 'px-2 py-0.5 rounded border text-[10px] font-mono bg-slate-900 border-borderline text-slate-400 flex items-center gap-1';
        badgeStep4.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block"></span><span>04 Policy: Idle</span>`;
      }
    }

    // Update nav dot indicators
    const navDotMap = {
      step1: document.getElementById('nav-status-step-1') || document.getElementById('nav-master-status'),
      step2: document.getElementById('nav-status-step-2'),
      step3: document.getElementById('nav-status-step-3'),
      step4: document.getElementById('nav-status-step-4'),
      step5: document.getElementById('nav-status-step-5'),
    };

    Object.keys(navDotMap).forEach(function (key) {
      const dot = navDotMap[key];
      if (dot) {
        if (stepStatus[key]) {
          dot.className = 'ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400/50';
          dot.title = 'Asset Ready';
        } else {
          dot.className = 'ml-auto w-2 h-2 rounded-full bg-slate-600';
          dot.title = 'Waiting for input';
        }
      }
    });

    // Count generated steps
    const activeCount = Object.values(stepStatus).filter(Boolean).length;
    const footerStatus = document.getElementById('footer-pipeline-status');
    if (footerStatus) {
      if (activeCount === 0) {
        footerStatus.textContent = 'No assets generated';
      } else if (activeCount === 5) {
        footerStatus.textContent = 'All 5 modules ready (Full Production)';
      } else {
        footerStatus.textContent = `${activeCount} of 5 modules generated (Dynamic ZIP)`;
      }
    }
  }

  window.DevAssetStudio.updateStepStatus = updateStepStatus;

  /**
   * Helper: Check if Step 1 (Master Icon & Mipmaps) is generated
   */
  function isStep1Generated() {
    return Boolean(
      (window.masterIconImage && window.generatedMipmaps && Object.keys(window.generatedMipmaps).length > 0) ||
      stepStatus.step1 ||
      (window.generatedMipmaps && Object.values(window.generatedMipmaps).some(function (m) {
        return m && m.blob;
      }))
    );
  }

  /**
   * Helper: Check if Step 2 (Feature Graphic Banner) is generated
   */
  function isStep2Generated() {
    return Boolean(
      stepStatus.step2 ||
      window.bannerWasGenerated ||
      window.bannerWasCustomized ||
      (typeof window.getFeatureGraphicBlob === 'function' && (window.bannerWasGenerated || window.masterIconImage))
    );
  }

  /**
   * Helper: Check if Step 3 (Screenshots Mockup) is generated
   */
  function isStep3Generated() {
    return Boolean(
      stepStatus.step3 ||
      window.screenshotsGenerated ||
      window.hasCustomScreenshots ||
      (window.DevAssetStudio && window.DevAssetStudio.screenshotEngine && typeof window.DevAssetStudio.screenshotEngine.hasScreenshots === 'function' && window.DevAssetStudio.screenshotEngine.hasScreenshots())
    );
  }

  /**
   * Helper: Check if Step 4 (ASO Policy Check) is generated
   */
  function isStep4Generated() {
    const titleInput = document.getElementById('input-aso-title');
    const hasCustomTitle = titleInput && titleInput.value.trim() && titleInput.value.trim() !== 'DevAsset Studio';
    return Boolean(
      stepStatus.step4 ||
      window.metadataGenerated ||
      hasCustomTitle
    );
  }

  /**
   * Helper: Check if Step 5 (Privacy Policy) is generated
   */
  function isStep5Generated() {
    const appNameInput = document.getElementById('privacy-app-name');
    const hasCustomName = appNameInput && appNameInput.value.trim() && appNameInput.value.trim() !== 'My Android App';
    return Boolean(
      stepStatus.step5 ||
      window.policyGenerated ||
      hasCustomName
    );
  }

  // =========================================================================
  // STANDALONE STEP 1 EXPORTER: Download Mipmaps (.ZIP)
  // =========================================================================
  async function exportMipmapsZip() {
    if (!isStep1Generated()) {
      showNotification('Please upload a 512×512 PNG master icon or click "Load Sample" first.', 'warning');
      return;
    }

    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const btn = document.getElementById('btn-download-mipmaps-zip');
    const label = document.getElementById('download-mipmaps-text') || document.getElementById('download-mipmaps-zip-text');
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Packaging Mipmaps...';

      const zip = new JSZip();
      const mipmaps = window.generatedMipmaps;

      const densityList = [
        { id: 'mipmap-mdpi', path: 'res/mipmap-mdpi/ic_launcher.png' },
        { id: 'mipmap-hdpi', path: 'res/mipmap-hdpi/ic_launcher.png' },
        { id: 'mipmap-xhdpi', path: 'res/mipmap-xhdpi/ic_launcher.png' },
        { id: 'mipmap-xxhdpi', path: 'res/mipmap-xxhdpi/ic_launcher.png' },
        { id: 'mipmap-xxxhdpi', path: 'res/mipmap-xxxhdpi/ic_launcher.png' },
        { id: 'playstore-icon', path: 'playstore/ic_launcher-512.png' },
      ];

      densityList.forEach(function (item) {
        const data = mipmaps[item.id];
        if (data && data.blob) {
          zip.file(item.path, data.blob);
        }
      });

      const readme = `# Android Launcher Mipmaps\n\nContents:\n- res/mipmap-mdpi/ic_launcher.png (48 × 48 px)\n- res/mipmap-hdpi/ic_launcher.png (72 × 72 px)\n- res/mipmap-xhdpi/ic_launcher.png (96 × 96 px)\n- res/mipmap-xxhdpi/ic_launcher.png (144 × 144 px)\n- res/mipmap-xxxhdpi/ic_launcher.png (192 × 192 px)\n- playstore/ic_launcher-512.png (512 × 512 px 32-bit Alpha)\n\nPlace the 'res/' folder directly into your Android project under 'app/src/main/res/'.\n`;
      zip.file('res/README.txt', readme);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(zipBlob, 'android-mipmaps.zip');
      showNotification('Android Mipmaps (.ZIP) downloaded successfully!', 'success');
      updateStepStatus('step1', true);

      if (label) {
        label.textContent = 'Mipmaps Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Mipmaps (.ZIP)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Mipmaps export failed:', err);
      showNotification('Mipmaps export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Mipmaps (.ZIP)';
    }
  }

  // =========================================================================
  // STANDALONE STEP 1 EXPORTER: Download Step Assets (.ZIP - Mipmaps + Banner)
  // =========================================================================
  async function exportStep1Bundle() {
    if (!isStep1Generated()) {
      showNotification('Please upload a 512×512 PNG master icon or click "Load Sample" first.', 'warning');
      return;
    }

    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const btn = document.getElementById('btn-download-step1-zip') || document.getElementById('btn-download-mipmaps-zip');
    const label = document.getElementById('download-step1-zip-text') || document.getElementById('download-mipmaps-text');
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Packaging Step 1 Assets...';

      const zip = new JSZip();
      const mipmaps = window.generatedMipmaps;

      const densityList = [
        { id: 'mipmap-mdpi', path: 'res/mipmap-mdpi/ic_launcher.png' },
        { id: 'mipmap-hdpi', path: 'res/mipmap-hdpi/ic_launcher.png' },
        { id: 'mipmap-xhdpi', path: 'res/mipmap-xhdpi/ic_launcher.png' },
        { id: 'mipmap-xxhdpi', path: 'res/mipmap-xxhdpi/ic_launcher.png' },
        { id: 'mipmap-xxxhdpi', path: 'res/mipmap-xxxhdpi/ic_launcher.png' },
        { id: 'playstore-icon', path: 'playstore/ic_launcher-512.png' },
      ];

      densityList.forEach(function (item) {
        const data = mipmaps[item.id];
        if (data && data.blob) {
          zip.file(item.path, data.blob);
        }
      });

      // Also package the 1024x500 Feature Graphic banner if available
      if (typeof window.getFeatureGraphicBlob === 'function') {
        try {
          const bannerBlob = await window.getFeatureGraphicBlob();
          if (bannerBlob) {
            zip.file('playstore/feature_graphic.png', bannerBlob);
          }
        } catch (e) {
          console.warn('[DevAsset Studio] Banner blob capture skipped:', e);
        }
      }

      const readme = `# Android Launcher Mipmaps & Feature Banner\n\nContents:\n- res/mipmap-mdpi/ic_launcher.png (48 × 48 px)\n- res/mipmap-hdpi/ic_launcher.png (72 × 72 px)\n- res/mipmap-xhdpi/ic_launcher.png (96 × 96 px)\n- res/mipmap-xxhdpi/ic_launcher.png (144 × 144 px)\n- res/mipmap-xxxhdpi/ic_launcher.png (192 × 192 px)\n- playstore/ic_launcher-512.png (512 × 512 px 32-bit Alpha)\n- playstore/feature_graphic.png (1024 × 500 px Feature Banner)\n\nPlace 'res/' into 'app/src/main/res/' in your Android project.\nUpload 'playstore/' assets to Google Play Console Store Listing.\n`;
      zip.file('res/README.txt', readme);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(zipBlob, 'launcher-and-banner-assets.zip');
      showNotification('Step 1 Assets (.ZIP) downloaded successfully!', 'success');
      updateStepStatus('step1', true);
      updateStepStatus('step2', true);

      if (label) {
        label.textContent = 'Assets Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Step Assets (.ZIP)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Step 1 export failed:', err);
      showNotification('Step 1 export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Step Assets (.ZIP)';
    }
  }

  // =========================================================================
  // STANDALONE STEP 2 EXPORTER: Download Banner (.PNG - 1024x500)
  // =========================================================================
  async function exportBannerPng() {
    if (typeof window.getFeatureGraphicBlob !== 'function') {
      showNotification('Banner engine is still initializing. Please wait.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-download-banner');
    const label = document.getElementById('download-banner-text');
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Rendering 1024x500 PNG...';

      const blob = await window.getFeatureGraphicBlob();
      if (!blob) throw new Error('Failed to generate PNG blob from banner canvas');

      saveAs(blob, 'feature_graphic.png');
      showNotification('Feature Graphic Banner (.PNG - 1024x500) downloaded!', 'success');
      updateStepStatus('step2', true);

      if (label) {
        label.textContent = 'Banner Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Banner (.PNG - 1024x500)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Banner export failed:', err);
      showNotification('Banner export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Banner (.PNG - 1024x500)';
    }
  }

  // =========================================================================
  // STANDALONE STEP 3 EXPORTER: Download Mockups (.ZIP)
  // =========================================================================
  async function exportScreenshotBundle() {
    if (typeof window.getAllScreenshotBlobs !== 'function') {
      showNotification('Screenshot mockup studio is still initializing. Please wait.', 'warning');
      return;
    }

    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const btn = document.getElementById('btn-download-mockups-zip') || document.getElementById('btn-download-all-screens') || document.getElementById('btn-grid-download-zip');
    const label = document.getElementById('download-mockups-text') || (btn ? btn.querySelector('span') : null);
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Packaging Mockups...';

      const screens = await window.getAllScreenshotBlobs();
      if (!screens || screens.length === 0) {
        showNotification('No screenshots available to package. Please load demo screens or upload your images.', 'warning');
        if (btn) btn.disabled = false;
        if (label) label.textContent = originalText || 'Download Mockups (.ZIP)';
        return;
      }

      const zip = new JSZip();
      screens.forEach(function (item) {
        if (item && item.blob) {
          zip.file(`store_screenshots/${item.filename}`, item.blob);
        }
      });

      const specsText = `# Play Store Mockup Screenshots\n\nSpecs:\n- Resolution: 1080 × 1920 px (or 1920 × 1080 px Landscape)\n- Total slides: ${screens.length}\n- Formats: Google Play Console Store Listing Mockup PNGs\n`;
      zip.file('store_screenshots/SPECS.txt', specsText);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      saveAs(zipBlob, 'store-screenshots-bundle.zip');
      showNotification('Screenshots Mockup (.ZIP) downloaded successfully!', 'success');
      updateStepStatus('step3', true);

      if (label) {
        label.textContent = 'Mockups Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Mockups (.ZIP)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Screenshot mockups export failed:', err);
      showNotification('Screenshot export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Mockups (.ZIP)';
    }
  }

  // =========================================================================
  // STANDALONE STEP 4 EXPORTER: Download Metadata (.TXT / .JSON)
  // =========================================================================
  async function exportMetadataZip() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const btn = document.getElementById('btn-download-metadata-standalone');
    const label = document.getElementById('download-metadata-text');
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Packaging Metadata...';

      const asoText = (typeof window.getAsoMetadataText === 'function')
        ? window.getAsoMetadataText()
        : `App Title:\n${(document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'DevAsset Studio'}\n\nShort Description:\n${(document.getElementById('input-aso-short') && document.getElementById('input-aso-short').value.trim()) || 'Fast, secure Android developer asset studio.'}\n`;

      const asoData = (typeof window.getAsoMetadataJson === 'function')
        ? window.getAsoMetadataJson()
        : {
            title: (document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'Mobile App',
            short_description: (document.getElementById('input-aso-short') && document.getElementById('input-aso-short').value.trim()) || '',
            category: 'DEVELOPER_TOOLS',
            timestamp: new Date().toISOString(),
          };

      const zip = new JSZip();
      zip.file('playstore/metadata.txt', asoText);
      zip.file('metadata/listing_metadata.json', JSON.stringify(asoData, null, 2));

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
      });

      saveAs(zipBlob, 'store-listing-metadata.zip');
      showNotification('ASO Metadata (.TXT / .JSON) downloaded successfully!', 'success');
      updateStepStatus('step4', true);

      if (label) {
        label.textContent = 'Metadata Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Metadata (.TXT / .JSON)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Metadata export failed:', err);
      showNotification('Metadata export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Metadata (.TXT / .JSON)';
    }
  }

  // =========================================================================
  // STANDALONE STEP 5 EXPORTER: Download Policy (.MD / .HTML)
  // =========================================================================
  async function exportPolicyBundle() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const btn = document.getElementById('btn-download-policy-standalone');
    const label = document.getElementById('download-policy-text') || document.getElementById('download-policy-standalone-text');
    const originalText = label ? label.textContent : '';

    try {
      if (btn) btn.disabled = true;
      if (label) label.textContent = 'Packaging Legal Policy...';

      const markdownText = (typeof window.getPrivacyPolicyText === 'function')
        ? window.getPrivacyPolicyText()
        : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy\n\nContact developer for policy details.';

      const htmlDocument = (typeof window.getPrivacyPolicyHtml === 'function')
        ? window.getPrivacyPolicyHtml()
        : `<!DOCTYPE html><html><head><title>Privacy Policy</title></head><body><pre>${markdownText}</pre></body></html>`;

      const zip = new JSZip();
      zip.file('legal/PRIVACY_POLICY.md', markdownText);
      zip.file('legal/PRIVACY_POLICY.html', htmlDocument);
      zip.file('playstore/privacy_policy.txt', markdownText);
      zip.file('legal/README_HOSTING_GUIDE.txt', `HOW TO HOST YOUR GOOGLE PLAY PRIVACY POLICY:
1. Host PRIVACY_POLICY.html on GitHub Pages, Netlify, or your developer domain.
2. Verify the URL is publicly reachable over HTTPS without requiring user authentication.
3. In Google Play Console, navigate to: App Content > Privacy Policy.
4. Paste the public HTTPS URL and submit.`);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
      });

      saveAs(zipBlob, 'privacy-policy-bundle.zip');
      showNotification('Privacy Policy (.MD / .HTML) downloaded successfully!', 'success');
      updateStepStatus('step5', true);

      if (label) {
        label.textContent = 'Policy Downloaded!';
        setTimeout(function () {
          label.textContent = originalText || 'Download Policy (.MD / .HTML)';
          if (btn) btn.disabled = false;
        }, 2500);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Policy export failed:', err);
      showNotification('Policy export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) btn.disabled = false;
      if (label) label.textContent = originalText || 'Download Policy (.MD / .HTML)';
    }
  }

  // =========================================================================
  // 3. SMART DYNAMIC BUNDLE EXPORT (PERSISTENT BOTTOM BAR)
  // =========================================================================
  async function exportPlayStoreBundle() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    // Dynamic Asset Detection: Determine which steps have generated assets
    const hasStep1 = isStep1Generated();
    const hasStep2 = isStep2Generated();
    const hasStep3 = isStep3Generated();
    const hasStep4 = isStep4Generated();
    const hasStep5 = isStep5Generated();

    const activeSteps = [];
    if (hasStep1) activeSteps.push('01. Master Icon & Mipmaps');
    if (hasStep2) activeSteps.push('02. Feature Graphic Banner');
    if (hasStep3) activeSteps.push('03. Screenshots Mockup');
    if (hasStep4) activeSteps.push('04. ASO Policy Check');
    if (hasStep5) activeSteps.push('05. Privacy Policy');

    // If 0 steps generated, alert user gently
    if (activeSteps.length === 0) {
      showNotification('No assets have been generated yet. Please generate at least one step (e.g. Master Icon or Screenshots) before downloading.', 'warning');
      return;
    }

    const btn = document.getElementById('btn-download-bundle');
    const originalBtnHtml = btn ? btn.innerHTML : '';

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span>Packaging ${activeSteps.length} Generated Module${activeSteps.length > 1 ? 's' : ''}...</span>
        `;
      }

      const zip = new JSZip();
      const manifestLines = [
        '====================================================================',
        'Play Store Production Asset Bundle Manifest',
        'Export Date: ' + new Date().toISOString(),
        'Package Type: Google Play Console Store Listing Release Assets',
        '====================================================================',
        '',
        'DYNAMIC ASSET DETECTION SUMMARY:',
      ];

      // Step 1: Pack Android Mipmaps if generated
      if (hasStep1) {
        manifestLines.push('[✓] Step 1: Master Icon & Android Mipmaps (res/mipmap-*/ic_launcher.png, playstore/ic_launcher-512.png)');
        const mipmaps = window.generatedMipmaps;
        const densityList = [
          { id: 'mipmap-mdpi', path: 'res/mipmap-mdpi/ic_launcher.png' },
          { id: 'mipmap-hdpi', path: 'res/mipmap-hdpi/ic_launcher.png' },
          { id: 'mipmap-xhdpi', path: 'res/mipmap-xhdpi/ic_launcher.png' },
          { id: 'mipmap-xxhdpi', path: 'res/mipmap-xxhdpi/ic_launcher.png' },
          { id: 'mipmap-xxxhdpi', path: 'res/mipmap-xxxhdpi/ic_launcher.png' },
          { id: 'playstore-icon', path: 'playstore/ic_launcher-512.png' },
        ];
        densityList.forEach(function (item) {
          const mData = mipmaps[item.id];
          if (mData && mData.blob) {
            zip.file(item.path, mData.blob);
          }
        });
      } else {
        manifestLines.push('[-] Step 1: Master Icon & Android Mipmaps (Not generated - omitted)');
      }

      // Step 2: Pack Feature Graphic if generated
      if (hasStep2) {
        if (typeof window.getFeatureGraphicBlob === 'function') {
          try {
            const bannerBlob = await window.getFeatureGraphicBlob();
            if (bannerBlob) {
              zip.file('playstore/feature_graphic.png', bannerBlob);
              manifestLines.push('[✓] Step 2: Feature Graphic Banner (playstore/feature_graphic.png - 1024x500)');
            }
          } catch (bErr) {
            console.warn('[DevAsset Studio] Feature graphic error:', bErr);
          }
        }
      } else {
        manifestLines.push('[-] Step 2: Feature Graphic Banner (Not generated - omitted)');
      }

      // Step 3: Pack Screenshots Mockup if generated
      if (hasStep3) {
        if (typeof window.getAllScreenshotBlobs === 'function') {
          try {
            const screens = await window.getAllScreenshotBlobs();
            if (Array.isArray(screens) && screens.length > 0) {
              screens.forEach(function (s) {
                if (s && s.blob) {
                  zip.file(`store_screenshots/${s.filename}`, s.blob);
                }
              });
              manifestLines.push(`[✓] Step 3: Mockup Screenshots (store_screenshots/ - ${screens.length} slides packaged)`);
            }
          } catch (sErr) {
            console.warn('[DevAsset Studio] Screenshots error:', sErr);
          }
        }
      } else {
        manifestLines.push('[-] Step 3: Screenshots Mockup (Not generated - omitted)');
      }

      // Step 4: Pack ASO Metadata if generated
      if (hasStep4) {
        const asoText = (typeof window.getAsoMetadataText === 'function')
          ? window.getAsoMetadataText()
          : `App Title:\n${(document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'DevAsset Studio'}\n`;
        const asoData = (typeof window.getAsoMetadataJson === 'function')
          ? window.getAsoMetadataJson()
          : { title: 'DevAsset Studio', timestamp: new Date().toISOString() };

        zip.file('playstore/metadata.txt', asoText);
        zip.file('metadata/listing_metadata.json', JSON.stringify(asoData, null, 2));
        manifestLines.push('[✓] Step 4: ASO Listing Metadata (playstore/metadata.txt & metadata/listing_metadata.json)');
      } else {
        manifestLines.push('[-] Step 4: ASO Listing Metadata (Not generated - omitted)');
      }

      // Step 5: Pack Privacy Policy if generated
      if (hasStep5) {
        const privacyText = (typeof window.getPrivacyPolicyText === 'function')
          ? window.getPrivacyPolicyText()
          : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy';
        const privacyHtml = (typeof window.getPrivacyPolicyHtml === 'function')
          ? window.getPrivacyPolicyHtml()
          : `<!DOCTYPE html><html><head><title>Privacy Policy</title></head><body><pre>${privacyText}</pre></body></html>`;

        zip.file('legal/PRIVACY_POLICY.md', privacyText);
        zip.file('legal/PRIVACY_POLICY.html', privacyHtml);
        zip.file('playstore/privacy_policy.txt', privacyText);
        manifestLines.push('[✓] Step 5: Privacy Policy & Legal (legal/PRIVACY_POLICY.md, legal/PRIVACY_POLICY.html & playstore/privacy_policy.txt)');
      } else {
        manifestLines.push('[-] Step 5: Privacy Policy & Legal (Not generated - omitted)');
      }

      // Include Manifest in root of bundle
      manifestLines.push('');
      manifestLines.push('Instructions:');
      manifestLines.push('1. Upload res/ directly into app/src/main/res/ in your Android Studio project.');
      manifestLines.push('2. Upload playstore/ assets to Google Play Console Store Listing.');
      manifestLines.push('3. Host legal/PRIVACY_POLICY.md on GitHub Pages or your developer website.');
      zip.file('BUNDLE_MANIFEST.txt', manifestLines.join('\n'));

      // Generate asynchronous ZIP blob in browser memory
      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        function updateCallback(meta) {
          if (btn) {
            const span = btn.querySelector('span');
            if (span) span.textContent = `Compressing ${Math.round(meta.percent)}%...`;
          }
        }
      );

      saveAs(zipBlob, 'playstore-production-bundle.zip');

      const msg = activeSteps.length === 5
        ? 'Complete Play Store Bundle (.ZIP) downloaded (All 5 modules)!'
        : `Dynamic Play Store Bundle (.ZIP) downloaded with ${activeSteps.length} generated module${activeSteps.length > 1 ? 's' : ''}!`;

      showNotification(msg, 'success');

      if (btn) {
        btn.innerHTML = `
          <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
          <span>Dynamic Bundle Downloaded!</span>
        `;
        refreshIcons();
        setTimeout(function () {
          btn.innerHTML = originalBtnHtml;
          btn.disabled = false;
          refreshIcons();
        }, 3000);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Dynamic ZIP Export failed:', err);
      showNotification('Bundle export failed: ' + (err.message || 'Unknown error'), 'warning');
      if (btn) {
        btn.innerHTML = originalBtnHtml;
        btn.disabled = false;
        refreshIcons();
      }
    }
  }

  // =========================================================================
  // 3.5 CENTRAL SMART BUNDLE EXPORT (.ZIP) ENGINE
  // Dynamic Inspection & Collection: Step 01 to Step 04 for Active Store Mode
  // Produces: [Store]_[AppName]_Asset_Bundle.zip
  // Gracefully ignores ungenerated steps and preserves individual downloads
  // =========================================================================

  function getBundleNaming(curEco) {
    let storeTag = 'GooglePlay';
    let storeDisplay = 'Google Play';

    if (curEco === 'apple') {
      storeTag = 'Apple';
      storeDisplay = 'Apple App Store';
    } else if (curEco === 'samsung') {
      storeTag = 'Samsung';
      storeDisplay = 'Samsung Galaxy Store';
    } else if (curEco === 'amazon') {
      storeTag = 'Amazon';
      storeDisplay = 'Amazon Appstore';
    }

    // Inspect inputs across modules to resolve application name
    let rawName = '';
    const asoTitle = document.getElementById('input-aso-title');
    const bannerTitle = document.getElementById('banner-title-input');
    const policyName = document.getElementById('privacy-app-name') || document.getElementById('input-policy-appname');
    const samsungTitle = document.getElementById('samsung-banner-title');
    const amazonTitle = document.getElementById('amazon-banner-title');

    if (curEco === 'samsung' && samsungTitle && samsungTitle.value.trim()) {
      rawName = samsungTitle.value.trim();
    } else if (curEco === 'amazon' && amazonTitle && amazonTitle.value.trim()) {
      rawName = amazonTitle.value.trim();
    } else if (asoTitle && asoTitle.value.trim()) {
      rawName = asoTitle.value.trim();
    } else if (bannerTitle && bannerTitle.value.trim()) {
      rawName = bannerTitle.value.trim();
    } else if (policyName && policyName.value.trim()) {
      rawName = policyName.value.trim();
    }

    if (!rawName || rawName === 'DevAsset Studio' || rawName === 'My Android App') {
      rawName = 'DevAsset';
    }

    const cleanAppName = rawName
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    const finalAppName = cleanAppName || 'DevAsset';
    const filename = `${storeTag}_${finalAppName}_Asset_Bundle.zip`;

    return { storeTag, storeDisplay, appName: finalAppName, filename };
  }

  async function exportSmartStoreBundle() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const curEco = (window.DevAssetStudio && typeof window.DevAssetStudio.getCurrentEcosystem === 'function')
      ? window.DevAssetStudio.getCurrentEcosystem()
      : 'google';

    const { storeTag, storeDisplay, appName, filename } = getBundleNaming(curEco);

    // Target buttons to indicate loading & check states
    const actionBtns = [
      document.getElementById('btn-export-smart-bundle'),
      document.getElementById('btn-download-bundle'),
      document.getElementById('btn-step4-next')
    ].filter(Boolean);

    const origHtmls = actionBtns.map(b => b.innerHTML);
    actionBtns.forEach(b => {
      b.disabled = true;
      b.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        <span>Packaging ${storeDisplay} Bundle...</span>
      `;
    });

    try {
      const zip = new JSZip();
      const manifestLines = [
        '====================================================================',
        `${storeDisplay.toUpperCase()} ASSET BUNDLE MANIFEST`,
        `Export Date: ${new Date().toISOString()}`,
        `Application: ${appName}`,
        `Package Filename: ${filename}`,
        '====================================================================',
        '',
        'DYNAMIC SESSION ASSET INSPECTION & COLLECTION SUMMARY:'
      ];

      let packagedCount = 0;

      // =======================================================================
      // 1. GOOGLE PLAY ECOSYSTEM
      // =======================================================================
      if (curEco === 'google') {
        const hasStep1 = isStep1Generated();
        const hasStep2 = isStep2Generated();
        const hasStep3 = isStep3Generated();
        const hasStep4 = isStep4Generated();
        const hasStep5 = isStep5Generated();

        // Step 01: Master Icon & Android Mipmaps
        if (hasStep1 && window.generatedMipmaps) {
          manifestLines.push('[✓] Step 01: Master Icon & Android Mipmaps (res/mipmap-*/ic_launcher.png, playstore/ic_launcher-512.png)');
          const densityList = [
            { id: 'mipmap-mdpi', path: 'res/mipmap-mdpi/ic_launcher.png' },
            { id: 'mipmap-hdpi', path: 'res/mipmap-hdpi/ic_launcher.png' },
            { id: 'mipmap-xhdpi', path: 'res/mipmap-xhdpi/ic_launcher.png' },
            { id: 'mipmap-xxhdpi', path: 'res/mipmap-xxhdpi/ic_launcher.png' },
            { id: 'mipmap-xxxhdpi', path: 'res/mipmap-xxxhdpi/ic_launcher.png' },
            { id: 'playstore-icon', path: 'playstore/ic_launcher-512.png' },
          ];
          densityList.forEach(item => {
            const mData = window.generatedMipmaps[item.id];
            if (mData && mData.blob) {
              zip.file(item.path, mData.blob);
              packagedCount++;
            }
          });
          zip.file('res/README.txt', 'Directly copy the res/ contents into app/src/main/res/ of your Android Studio project.');
        } else {
          manifestLines.push('[-] Step 01: Master Icon & Android Mipmaps (Omitted - Not generated in active session)');
        }

        // Step 01 (Feature Graphic Banner - 1024x500)
        if (hasStep2 && typeof window.getFeatureGraphicBlob === 'function') {
          try {
            const bannerBlob = await window.getFeatureGraphicBlob();
            if (bannerBlob) {
              zip.file('playstore/feature_graphic.png', bannerBlob);
              packagedCount++;
              manifestLines.push('[✓] Step 01 (Feature Graphic): playstore/feature_graphic.png (1024x500 px)');
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Banner blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 01 (Feature Graphic): (Omitted - Not generated in active session)');
        }

        // Step 02: Screenshots Mockup Studio
        if (hasStep3 && typeof window.getAllScreenshotBlobs === 'function') {
          try {
            const screens = await window.getAllScreenshotBlobs();
            if (Array.isArray(screens) && screens.length > 0) {
              screens.forEach(s => {
                if (s && s.blob) {
                  zip.file(`store_screenshots/${s.filename}`, s.blob);
                  packagedCount++;
                }
              });
              manifestLines.push(`[✓] Step 02: Screenshots Mockup Studio (store_screenshots/ - ${screens.length} slides packaged)`);
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Screenshots blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 02: Screenshots Mockup Studio (Omitted - Not generated in active session)');
        }

        // Step 03: ASO Policy Check & Metadata
        if (hasStep4) {
          const asoText = (typeof window.getAsoMetadataText === 'function')
            ? window.getAsoMetadataText()
            : `App Title:\n${(document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'DevAsset Studio'}\n`;
          const asoData = (typeof window.getAsoMetadataJson === 'function')
            ? window.getAsoMetadataJson()
            : { title: 'DevAsset Studio', timestamp: new Date().toISOString() };

          zip.file('playstore/metadata.txt', asoText);
          zip.file('metadata/listing_metadata.json', JSON.stringify(asoData, null, 2));
          packagedCount += 2;
          manifestLines.push('[✓] Step 03: ASO Listing Metadata (playstore/metadata.txt & metadata/listing_metadata.json)');
        } else {
          manifestLines.push('[-] Step 03: ASO Listing Metadata (Omitted - Not generated in active session)');
        }

        // Step 04: Privacy Policy document
        if (hasStep5) {
          const privacyText = (typeof window.getPrivacyPolicyText === 'function')
            ? window.getPrivacyPolicyText()
            : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy';
          const privacyHtml = (typeof window.getPrivacyPolicyHtml === 'function')
            ? window.getPrivacyPolicyHtml()
            : `<!DOCTYPE html><html><head><title>Privacy Policy</title></head><body><pre>${privacyText}</pre></body></html>`;

          zip.file('legal/PRIVACY_POLICY.md', privacyText);
          zip.file('legal/PRIVACY_POLICY.html', privacyHtml);
          zip.file('playstore/privacy_policy.txt', privacyText);
          packagedCount += 3;
          manifestLines.push('[✓] Step 04: Privacy Policy Document (legal/PRIVACY_POLICY.md & legal/PRIVACY_POLICY.html)');
        } else {
          manifestLines.push('[-] Step 04: Privacy Policy Document (Omitted - Not generated in active session)');
        }

      // =======================================================================
      // 2. APPLE / iOS ECOSYSTEM
      // =======================================================================
      } else if (curEco === 'apple') {
        const iosEngine = window.DevAssetStudio.iosEngine;
        let hasIosIcons = false;

        if (iosEngine) {
          if ((!iosEngine.state.sourceImage && window.masterIconImage) || (Object.keys(iosEngine.state.appIconBlobs).length === 0 && window.masterIconImage)) {
            await iosEngine.processIosMaster(window.masterIconImage);
          }

          if (Object.keys(iosEngine.state.appIconBlobs).length > 0 || iosEngine.state.master1024Blob) {
            hasIosIcons = true;
            const iconFolder = zip.folder('AppIcon.appiconset');
            const contentsJson = iosEngine.generateContentsJson();
            iconFolder.file('Contents.json', contentsJson);
            packagedCount++;

            Object.keys(iosEngine.state.appIconBlobs).forEach(name => {
              const b = iosEngine.state.appIconBlobs[name];
              if (b) {
                iconFolder.file(name, b.blob);
                packagedCount++;
              }
            });

            if (iosEngine.state.master1024Blob) {
              zip.file('app_store/AppStore_1024x1024_0percent_alpha.png', iosEngine.state.master1024Blob);
              packagedCount++;
            }

            zip.file('XCODE_SETUP_GUIDE.txt', `XCODE APPICON SETUP GUIDE:
1. Open your project in Xcode.
2. Navigate to Assets.xcassets.
3. Drag and drop the AppIcon.appiconset directory from this bundle directly into Assets.xcassets.
4. Upload app_store/AppStore_1024x1024_0percent_alpha.png into App Store Connect.`);
            packagedCount++;
            manifestLines.push('[✓] Step 01: Xcode AppIcon.appiconset (14 Retina resolutions) & 1024px App Store Master (0% Alpha)');
          }
        }
        if (!hasIosIcons) {
          manifestLines.push('[-] Step 01: Apple Master Icon & AppIcon Suite (Omitted - Not generated in active session)');
        }

        // Apple Mockups
        const iosMockCanvas = document.getElementById('ios-mockup-canvas');
        if (iosMockCanvas && iosEngine && iosEngine.state.mockupImage) {
          try {
            const mBlob = await new Promise(r => iosMockCanvas.toBlob(r, 'image/png'));
            if (mBlob) {
              const preset = iosEngine.state.mockupPreset || '1290x2796';
              zip.file(`screenshots/ios_appstore_mockup_${preset}.png`, mBlob);
              packagedCount++;
              manifestLines.push(`[✓] Step 02: App Store Mockup Screenshot (screenshots/ios_appstore_mockup_${preset}.png)`);
            }
          } catch (e) {
            console.warn('[DevAsset Studio] iOS Mockup blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 02: App Store Mockups (Omitted - Not generated in active session)');
        }

        // Apple Privacy Policy if generated
        if (isStep5Generated()) {
          const privacyText = (typeof window.getPrivacyPolicyText === 'function')
            ? window.getPrivacyPolicyText()
            : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy';
          zip.file('legal/PRIVACY_POLICY.md', privacyText);
          packagedCount++;
          manifestLines.push('[✓] Step 04: Privacy Policy (legal/PRIVACY_POLICY.md)');
        } else {
          manifestLines.push('[-] Step 04: Privacy Policy Document (Omitted - Not generated in active session)');
        }

      // =======================================================================
      // 3. SAMSUNG GALAXY ECOSYSTEM
      // =======================================================================
      } else if (curEco === 'samsung') {
        const samsungEngine = window.DevAssetStudio.samsungEngine;
        let hasSamsungIcons = false;

        if (samsungEngine) {
          if (!samsungEngine.state.sourceIcon && window.masterIconImage) {
            await samsungEngine.processSamsungIcon(window.masterIconImage);
          }

          if (samsungEngine.state.rawIconBlob || samsungEngine.state.squircleIconBlob) {
            hasSamsungIcons = true;
            if (samsungEngine.state.rawIconBlob) {
              zip.file('icon_512x512.png', samsungEngine.state.rawIconBlob);
              packagedCount++;
            }
            if (samsungEngine.state.squircleIconBlob) {
              zip.file('icon_oneui_squircle_512x512.png', samsungEngine.state.squircleIconBlob);
              packagedCount++;
            }
            zip.file('SAMSUNG_GALAXY_STORE_GUIDE.txt', `SAMSUNG GALAXY STORE ASSET SPECIFICATIONS:
1. icon_512x512.png: Upload to Galaxy Store Seller Portal.
2. icon_oneui_squircle_512x512.png: Formatted with One UI continuous squircle curvature for preview/promotional testing.
3. promo_banner_1024x500.png: High-contrast 1024x500 banner.`);
            packagedCount++;
            manifestLines.push('[✓] Step 01: Samsung Galaxy Store Icons (512x512 Master & One UI Squircle)');
          }
        }
        if (!hasSamsungIcons) {
          manifestLines.push('[-] Step 01: Samsung Galaxy Icons (Omitted - Not generated in active session)');
        }

        // Samsung Promo Banner
        const sBannerCanvas = document.getElementById('samsung-banner-canvas');
        if (sBannerCanvas && (samsungEngine.state.sourceIcon || window.masterIconImage)) {
          try {
            const bBlob = await new Promise(r => sBannerCanvas.toBlob(r, 'image/png'));
            if (bBlob) {
              zip.file('promo_banner_1024x500.png', bBlob);
              packagedCount++;
              manifestLines.push('[✓] Step 02: Promo Banner (promo_banner_1024x500.png - 1024x500 px)');
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Samsung banner blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 02: Promo Banner (Omitted - Not generated in active session)');
        }

        // Samsung Screenshots
        const sScreenCanvas = document.getElementById('samsung-screenshot-canvas');
        if (sScreenCanvas && (samsungEngine.state.sourceIcon || window.masterIconImage)) {
          try {
            const scBlob = await new Promise(r => sScreenCanvas.toBlob(r, 'image/png'));
            if (scBlob) {
              zip.file('screenshots/screenshot_galaxy_1080x1920.png', scBlob);
              packagedCount++;
              manifestLines.push('[✓] Step 03: Galaxy Screenshot (screenshots/screenshot_galaxy_1080x1920.png - 1080x1920 px)');
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Samsung screenshot blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 03: Galaxy Screenshots (Omitted - Not generated in active session)');
        }

        // Samsung Privacy Policy
        if (isStep5Generated()) {
          const privacyText = (typeof window.getPrivacyPolicyText === 'function')
            ? window.getPrivacyPolicyText()
            : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy';
          zip.file('legal/PRIVACY_POLICY.md', privacyText);
          packagedCount++;
          manifestLines.push('[✓] Step 04: Privacy Policy (legal/PRIVACY_POLICY.md)');
        } else {
          manifestLines.push('[-] Step 04: Privacy Policy Document (Omitted - Not generated in active session)');
        }

      // =======================================================================
      // 4. AMAZON APPSTORE ECOSYSTEM
      // =======================================================================
      } else if (curEco === 'amazon') {
        const amazonEngine = window.DevAssetStudio.amazonEngine;
        let hasAmazonIcons = false;

        if (amazonEngine) {
          if (!amazonEngine.state.sourceIcon && window.masterIconImage) {
            await amazonEngine.processAmazonIcon(window.masterIconImage);
          }

          if (amazonEngine.state.largeIconBlob || amazonEngine.state.smallIconBlob) {
            hasAmazonIcons = true;
            if (amazonEngine.state.largeIconBlob) {
              zip.file('icon_large_512x512.png', amazonEngine.state.largeIconBlob);
              packagedCount++;
            }
            if (amazonEngine.state.smallIconBlob) {
              zip.file('icon_small_114x114.png', amazonEngine.state.smallIconBlob);
              packagedCount++;
            }
            zip.file('AMAZON_APPSTORE_GUIDE.txt', `AMAZON APPSTORE ASSET SPECIFICATIONS:
1. icon_large_512x512.png: Required 512x512 PNG, 32-bit with alpha.
2. icon_small_114x114.png: Required 114x114 PNG icon for legacy Fire devices and search grids.
3. promo_banner_1024x500.png: Recommended 1024x500 banner for Fire TV & Fire tablet listings.`);
            packagedCount++;
            manifestLines.push('[✓] Step 01: Amazon Appstore Icons (512x512 Large & 114x114 Small)');
          }
        }
        if (!hasAmazonIcons) {
          manifestLines.push('[-] Step 01: Amazon Appstore Icons (Omitted - Not generated in active session)');
        }

        // Amazon Promo Banner
        const aBannerCanvas = document.getElementById('amazon-banner-canvas');
        if (aBannerCanvas && (amazonEngine.state.sourceIcon || window.masterIconImage)) {
          try {
            const bBlob = await new Promise(r => aBannerCanvas.toBlob(r, 'image/png'));
            if (bBlob) {
              zip.file('promo_banner_1024x500.png', bBlob);
              packagedCount++;
              manifestLines.push('[✓] Step 02: Promo Banner (promo_banner_1024x500.png - 1024x500 px)');
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Amazon banner blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 02: Promo Banner (Omitted - Not generated in active session)');
        }

        // Amazon Tablet Screenshot
        const aTabletCanvas = document.getElementById('amazon-tablet-canvas');
        if (aTabletCanvas && (amazonEngine.state.sourceIcon || window.masterIconImage)) {
          try {
            const tBlob = await new Promise(r => aTabletCanvas.toBlob(r, 'image/png'));
            if (tBlob) {
              const preset = amazonEngine.state.tabletPreset || '800x1280';
              zip.file(`screenshots/fire_tablet_${preset}.png`, tBlob);
              packagedCount++;
              manifestLines.push(`[✓] Step 03: Fire Tablet Screenshot (screenshots/fire_tablet_${preset}.png)`);
            }
          } catch (e) {
            console.warn('[DevAsset Studio] Amazon tablet blob error:', e);
          }
        } else {
          manifestLines.push('[-] Step 03: Fire Tablet Screenshots (Omitted - Not generated in active session)');
        }

        // Amazon Privacy Policy
        if (isStep5Generated()) {
          const privacyText = (typeof window.getPrivacyPolicyText === 'function')
            ? window.getPrivacyPolicyText()
            : (document.getElementById('privacy-markdown-preview') && document.getElementById('privacy-markdown-preview').textContent) || '# Privacy Policy';
          zip.file('legal/PRIVACY_POLICY.md', privacyText);
          packagedCount++;
          manifestLines.push('[✓] Step 04: Privacy Policy (legal/PRIVACY_POLICY.md)');
        } else {
          manifestLines.push('[-] Step 04: Privacy Policy Document (Omitted - Not generated in active session)');
        }
      }

      // If 0 assets were packaged, alert the user gently and exit cleanly
      if (packagedCount === 0) {
        showNotification(`No generated assets found for ${storeDisplay}. Please generate at least one step (e.g. upload an icon) before exporting.`, 'warning');
        actionBtns.forEach((b, idx) => {
          b.innerHTML = origHtmls[idx];
          b.disabled = false;
        });
        refreshIcons();
        return;
      }

      // Add BUNDLE_MANIFEST.txt
      manifestLines.push('');
      manifestLines.push(`TOTAL ASSETS PACKAGED: ${packagedCount} files`);
      manifestLines.push('Generated locally by DevAsset Studio client-side pipeline. Zero server dependencies.');
      zip.file('BUNDLE_MANIFEST.txt', manifestLines.join('\n'));

      // Generate asynchronous ZIP blob in browser memory
      const zipBlob = await zip.generateAsync(
        {
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        },
        function updateCallback(meta) {
          actionBtns.forEach(b => {
            const span = b.querySelector('span');
            if (span) span.textContent = `Compressing ${Math.round(meta.percent)}%...`;
          });
        }
      );

      // Save file with exact requested naming: [Store]_[AppName]_Asset_Bundle.zip
      saveAs(zipBlob, filename);

      showNotification(`Exported ${filename} successfully (${packagedCount} assets bundled)!`, 'success');

      actionBtns.forEach(b => {
        b.innerHTML = `
          <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
          <span>Bundle Exported!</span>
        `;
      });
      refreshIcons();

      setTimeout(() => {
        actionBtns.forEach((b, idx) => {
          b.innerHTML = origHtmls[idx];
          b.disabled = false;
        });
        refreshIcons();
      }, 3000);

    } catch (err) {
      console.error('[DevAsset Studio] Smart Store Bundle Export failed:', err);
      showNotification('Bundle export failed: ' + (err.message || 'Unknown error'), 'warning');
      actionBtns.forEach((b, idx) => {
        b.innerHTML = origHtmls[idx];
        b.disabled = false;
      });
      refreshIcons();
    }
  }

  // Alias for ecosystem router
  async function exportActiveEcosystemBundle() {
    await exportSmartStoreBundle();
  }

  // =========================================================================
  // 4. UNIVERSAL MASTER EXPORT: Download All Ecosystems (.ZIP)
  // Bundles Google Play, Apple/iOS, Samsung Galaxy Store, & Amazon Appstore
  // =========================================================================
  async function exportAllEcosystemsBundle() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries (JSZip/FileSaver) are loading. Please wait.');
      return;
    }

    const downloadButtons = [
      document.getElementById('btn-top-download-all'),
      document.getElementById('dock-download-all-btn'),
      document.getElementById('btn-universal-download-all')
    ].filter(Boolean);

    const originalHtmls = downloadButtons.map(b => b.innerHTML);
    downloadButtons.forEach(b => {
      b.disabled = true;
      b.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin inline-block"></i><span>Packaging 4 Ecosystems...</span>`;
    });
    refreshIcons();

    try {
      const masterZip = new JSZip();

      // 1. Google Play Folder
      const playFolder = masterZip.folder('01_google_play');
      if (window.generatedMipmaps) {
        const densityList = [
          { id: 'mipmap-mdpi', path: 'res/mipmap-mdpi/ic_launcher.png' },
          { id: 'mipmap-hdpi', path: 'res/mipmap-hdpi/ic_launcher.png' },
          { id: 'mipmap-xhdpi', path: 'res/mipmap-xhdpi/ic_launcher.png' },
          { id: 'mipmap-xxhdpi', path: 'res/mipmap-xxhdpi/ic_launcher.png' },
          { id: 'mipmap-xxxhdpi', path: 'res/mipmap-xxxhdpi/ic_launcher.png' },
          { id: 'playstore-icon', path: 'playstore/ic_launcher-512.png' },
        ];
        densityList.forEach(item => {
          const mData = window.generatedMipmaps[item.id];
          if (mData && mData.blob) {
            playFolder.file(item.path, mData.blob);
          }
        });
      }

      if (typeof window.getFeatureGraphicBlob === 'function') {
        try {
          const bannerBlob = await window.getFeatureGraphicBlob();
          if (bannerBlob) playFolder.file('playstore/feature_graphic.png', bannerBlob);
        } catch (e) {
          console.warn('[DevAsset Studio] Play feature banner skipped:', e);
        }
      }

      if (typeof window.getAllScreenshotBlobs === 'function') {
        try {
          const screens = await window.getAllScreenshotBlobs();
          if (Array.isArray(screens)) {
            screens.forEach(s => {
              if (s && s.blob) playFolder.file(`store_screenshots/${s.filename}`, s.blob);
            });
          }
        } catch (e) {
          console.warn('[DevAsset Studio] Play screenshots skipped:', e);
        }
      }

      const asoText = (typeof window.getAsoMetadataText === 'function')
        ? window.getAsoMetadataText()
        : `App Title:\n${(document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'DevAsset Studio'}\n`;
      playFolder.file('playstore/metadata.txt', asoText);

      const privacyText = (typeof window.getPrivacyPolicyText === 'function')
        ? window.getPrivacyPolicyText()
        : '# Privacy Policy\n\nContact developer for details.';
      playFolder.file('legal/PRIVACY_POLICY.md', privacyText);

      // 2. Apple / iOS Folder
      const iosFolder = masterZip.folder('02_apple_ios');
      const iosEngine = window.DevAssetStudio.iosEngine;
      if (iosEngine && iosEngine.state) {
        const appIconSet = iosFolder.folder('AppIcon.appiconset');
        appIconSet.file('Contents.json', iosEngine.getContentsJson());
        for (const [filename, data] of Object.entries(iosEngine.state.appIconBlobs || {})) {
          if (data && data.blob) appIconSet.file(filename, data.blob);
        }
        if (iosEngine.state.master1024Blob) {
          iosFolder.file('app_store/AppStore_1024x1024_0percent_alpha.png', iosEngine.state.master1024Blob);
        }

        const iosMockupCanvas = document.getElementById('ios-mockup-canvas');
        if (iosMockupCanvas) {
          const mBlob = await new Promise(r => iosMockupCanvas.toBlob(r, 'image/png'));
          iosFolder.file(`screenshots/ios_appstore_mockup_${iosEngine.state.mockupPreset || '1290x2796'}.png`, mBlob);
        }
        iosFolder.file('XCODE_SETUP_GUIDE.txt', `HOW TO IMPORT ASSETS INTO XCODE:
1. Open your project in Xcode.
2. Select Assets.xcassets in the Project Navigator.
3. Drag and drop "AppIcon.appiconset" directly into Assets.xcassets.`);
      }

      // 3. Samsung Galaxy Store Folder
      const samsungFolder = masterZip.folder('03_samsung_galaxy');
      const samsungEngine = window.DevAssetStudio.samsungEngine;
      if (samsungEngine && samsungEngine.state) {
        if (samsungEngine.state.rawIconBlob) {
          samsungFolder.file('icon_512x512.png', samsungEngine.state.rawIconBlob);
        }
        if (samsungEngine.state.squircleIconBlob) {
          samsungFolder.file('icon_oneui_squircle_512x512.png', samsungEngine.state.squircleIconBlob);
        }

        const sBannerCanvas = document.getElementById('samsung-banner-canvas');
        if (sBannerCanvas) {
          const bBlob = await new Promise(r => sBannerCanvas.toBlob(r, 'image/png'));
          samsungFolder.file('promo_banner_1024x500.png', bBlob);
        }

        const sScreenCanvas = document.getElementById('samsung-screenshot-canvas');
        if (sScreenCanvas) {
          const scBlob = await new Promise(r => sScreenCanvas.toBlob(r, 'image/png'));
          samsungFolder.file('screenshots/screenshot_galaxy_1080x1920.png', scBlob);
        }
        samsungFolder.file('SAMSUNG_GALAXY_STORE_GUIDE.txt', `SAMSUNG GALAXY STORE ASSET SPECIFICATIONS:
- Master Icon: 512x512 PNG with One UI squircle preview.
- Banner: 1024x500 PNG.
- Screenshots: 9:16 vertical standard (1080x1920).`);
      }

      // 4. Amazon Appstore Folder
      const amazonFolder = masterZip.folder('04_amazon_fireos');
      const amazonEngine = window.DevAssetStudio.amazonEngine;
      if (amazonEngine && amazonEngine.state) {
        if (amazonEngine.state.largeIconBlob) {
          amazonFolder.file('icon_large_512x512.png', amazonEngine.state.largeIconBlob);
        }
        if (amazonEngine.state.smallIconBlob) {
          amazonFolder.file('icon_small_114x114.png', amazonEngine.state.smallIconBlob);
        }

        const aBannerCanvas = document.getElementById('amazon-banner-canvas');
        if (aBannerCanvas) {
          const abBlob = await new Promise(r => aBannerCanvas.toBlob(r, 'image/png'));
          amazonFolder.file('promo_banner_1024x500.png', abBlob);
        }

        const aTabletCanvas = document.getElementById('amazon-tablet-canvas');
        if (aTabletCanvas) {
          const atBlob = await new Promise(r => aTabletCanvas.toBlob(r, 'image/png'));
          amazonFolder.file(`screenshots/fire_tablet_${amazonEngine.state.tabletPreset || '800x1280'}.png`, atBlob);
        }
        amazonFolder.file('AMAZON_APPSTORE_GUIDE.txt', `AMAZON APPSTORE ASSET SPECIFICATIONS:
- Large Icon: 512x512 PNG.
- Small Icon: 114x114 PNG.
- Promo Banner: 1024x500 PNG.
- Screenshots: 800x1280 & 1200x1920 Fire tablet standards.`);
      }

      // Master Manifest & README
      masterZip.file('README_ALL_ECOSYSTEMS.txt', `====================================================================
DevAsset Studio • Multi-Ecosystem Master Production Release Bundle
Generated: ${new Date().toISOString()}
Studio: TarkStudio / DevAsset Studio (Lucknow, UP, India)
====================================================================

INCLUDED STORES & ARCHITECTURE:
1. 01_google_play/
   - Android mipmaps (mdpi to xxxhdpi)
   - 512x512 playstore icon & 1024x500 feature graphic
   - Mockup screenshots, ASO metadata, & legal privacy policy

2. 02_apple_ios/
   - AppIcon.appiconset with standard Xcode Contents.json
   - iPhone & iPad Retina suite (@2x, @3x)
   - 1024x1024 App Store icon with strictly 0% alpha flattening
   - App Store mockups (1290x2796 / 1242x2688)

3. 03_samsung_galaxy/
   - 512x512 master icon with One UI squircle continuous curvature
   - 1024x500 high-contrast promo banner
   - 1080x1920 9:16 vertical standard screenshots

4. 04_amazon_fireos/
   - 512x512 large icon & 114x114 small icon
   - 1024x500 promo banner
   - 800x1280 & 1200x1920 Fire tablet screenshots

All assets were generated 100% locally in browser memory with zero cloud telemetry.`);

      const masterBlob = await masterZip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(masterBlob, 'devasset-all-ecosystems-master.zip');
      showNotification('All 4 Ecosystems bundled into master ZIP successfully!', 'success');

      downloadButtons.forEach((b, idx) => {
        b.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400 inline-block"></i><span>All Ecosystems Downloaded!</span>`;
        setTimeout(() => {
          b.innerHTML = originalHtmls[idx];
          b.disabled = false;
          refreshIcons();
        }, 3500);
      });
      refreshIcons();
    } catch (err) {
      console.error('[DevAsset Studio] Universal master export error:', err);
      alert('Universal master export failed: ' + err.message);
      downloadButtons.forEach((b, idx) => {
        b.innerHTML = originalHtmls[idx];
        b.disabled = false;
        refreshIcons();
      });
    }
  }

  // Helper: Sync current master icon to all other ecosystems
  function syncMasterIconToAllEcosystems() {
    if (!window.masterIconImage) {
      showNotification('Please upload or load a master icon first to sync across ecosystems.', 'warning');
      return;
    }

    const img = window.masterIconImage;
    if (window.DevAssetStudio.iosEngine && typeof window.DevAssetStudio.iosEngine.processIosMaster === 'function') {
      window.DevAssetStudio.iosEngine.processIosMaster(img);
    }
    if (window.DevAssetStudio.samsungEngine && typeof window.DevAssetStudio.samsungEngine.processSamsungIcon === 'function') {
      window.DevAssetStudio.samsungEngine.processSamsungIcon(img);
    }
    if (window.DevAssetStudio.amazonEngine && typeof window.DevAssetStudio.amazonEngine.processAmazonIcon === 'function') {
      window.DevAssetStudio.amazonEngine.processAmazonIcon(img);
    }

    showNotification('Master Icon synced to Apple/iOS, Samsung Galaxy, and Amazon Appstore!', 'success');
  }

  // =========================================================================
  // INITIALIZATION & EVENT LISTENERS
  // =========================================================================
  function initZipExporter() {
    // Top & Dock Universal All-Ecosystem Download buttons
    const btnTopAll = document.getElementById('btn-top-download-all');
    if (btnTopAll) {
      btnTopAll.addEventListener('click', function (e) {
        e.preventDefault();
        exportAllEcosystemsBundle();
      });
    }

    const btnDockAll = document.getElementById('dock-download-all-btn');
    if (btnDockAll) {
      btnDockAll.addEventListener('click', function (e) {
        e.preventDefault();
        exportAllEcosystemsBundle();
      });
    }

    const btnSyncAll = document.getElementById('btn-sync-all-ecosystems');
    if (btnSyncAll) {
      btnSyncAll.addEventListener('click', function (e) {
        e.preventDefault();
        syncMasterIconToAllEcosystems();
      });
    }
    // 1. Central Smart Bundle Export (.ZIP) Engine Button & Bottom Dock Button
    const smartExportBtns = [
      document.getElementById('btn-export-smart-bundle'),
      document.getElementById('btn-download-bundle'),
      document.getElementById('btn-step4-next')
    ].filter(Boolean);

    smartExportBtns.forEach(btn => {
      if (!btn.dataset.smartBound) {
        btn.dataset.smartBound = 'true';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          exportSmartStoreBundle();
        });
      }
    });

    // 2. Step 1: Standalone Download Mipmaps & Step 1 Bundle (.ZIP)
    const btnDownloadStep1 = document.getElementById('btn-download-step1-zip');
    if (btnDownloadStep1) {
      btnDownloadStep1.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportStep1Bundle();
      });
    }

    const btnDownloadMipmaps = document.getElementById('btn-download-mipmaps-zip');
    if (btnDownloadMipmaps) {
      btnDownloadMipmaps.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportStep1Bundle();
      });
    }

    // 3. Step 2: Standalone Download Banner (.PNG - 1024x500)
    const btnDownloadBanner = document.getElementById('btn-download-banner');
    if (btnDownloadBanner) {
      btnDownloadBanner.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportBannerPng();
      });
    }

    // 4. Step 3 (Screenshots): Standalone Download Mockups (.ZIP)
    const btnDownloadMockups = document.getElementById('btn-download-mockups-zip');
    if (btnDownloadMockups) {
      btnDownloadMockups.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportScreenshotBundle();
      });
    }

    const btnDownloadScreens = document.getElementById('btn-download-all-screens');
    if (btnDownloadScreens) {
      btnDownloadScreens.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportScreenshotBundle();
      });
    }

    const btnGridDownloadZip = document.getElementById('btn-grid-download-zip');
    if (btnGridDownloadZip) {
      btnGridDownloadZip.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportScreenshotBundle();
      });
    }

    // 5. Step 4: Standalone Download Metadata (.TXT / .JSON)
    const btnDownloadMetadata = document.getElementById('btn-download-metadata-standalone');
    if (btnDownloadMetadata) {
      btnDownloadMetadata.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportMetadataZip();
      });
    }

    // 6. Step 5: Standalone Download Policy (.MD / .HTML)
    const btnDownloadPolicy = document.getElementById('btn-download-policy-standalone');
    if (btnDownloadPolicy) {
      btnDownloadPolicy.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportPolicyBundle();
      });
    }

    // Legacy support for Core Bundle
    const btnDownloadCore = document.getElementById('btn-download-core-bundle');
    if (btnDownloadCore) {
      btnDownloadCore.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        exportMipmapsZip();
      });
    }

    // Listen for mipmaps generated event
    window.addEventListener('devasset:mipmaps-ready', function () {
      updateStepStatus('step1', true);
    });

    // Expose methods globally on DevAssetStudio namespace
    window.DevAssetStudio.exportSmartStoreBundle = exportSmartStoreBundle;
    window.DevAssetStudio.exportPlayStoreBundle = exportSmartStoreBundle;
    window.DevAssetStudio.exportActiveEcosystemBundle = exportSmartStoreBundle;
    window.DevAssetStudio.exportAllEcosystemsBundle = exportAllEcosystemsBundle;
    window.DevAssetStudio.syncMasterIconToAllEcosystems = syncMasterIconToAllEcosystems;
    window.DevAssetStudio.exportStep1Bundle = exportStep1Bundle;
    window.DevAssetStudio.exportMipmapsZip = exportMipmapsZip;
    window.DevAssetStudio.exportBannerPng = exportBannerPng;
    window.DevAssetStudio.exportScreenshotBundle = exportScreenshotBundle;
    window.DevAssetStudio.exportMetadataZip = exportMetadataZip;
    window.DevAssetStudio.exportPolicyBundle = exportPolicyBundle;

    // Check initial status
    if (isStep1Generated()) updateStepStatus('step1', true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initZipExporter);
  } else {
    initZipExporter();
  }
})();
