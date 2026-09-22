/**
 * modules/samsungEngine.js
 * DevAsset Studio • Samsung Galaxy Store (One UI) Asset Engine
 * 
 * Features:
 * 1. Master Icon: 512x512 px PNG with One UI squircle mask alignment.
 * 2. Promo Banner: 1024x500 px high-contrast promo banner conforming to Galaxy Store guidelines.
 * 3. Screenshots: 9:16 vertical standard (1080x1920 px) with Galaxy S24 Ultra frame & One UI styling.
 * 4. Dedicated export: Download Samsung Assets (.zip).
 */

(function () {
  'use strict';

  window.DevAssetStudio = window.DevAssetStudio || {};

  const state = {
    sourceIcon: null,
    rawIconBlob: null,
    squircleIconBlob: null,
    bannerBlob: null,
    screenshotBlob: null,
    bannerTitle: 'Galaxy Next-Gen',
    bannerSubtitle: 'Crafted for Samsung One UI 6 & 7 Experience',
    bannerTheme: 'galaxy_blue', // 'galaxy_blue', 'phantom_violet', 'onyx_black', 'cobalt'
    screenshotImage: null,
    screenshotHeadline: 'Peak Performance',
    screenshotSubhead: 'Optimized for Galaxy S24 Ultra & Fold',
  };

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

  /**
   * Generates a One UI squircle continuous curvature path on a 2D canvas context
   */
  function drawOneUiSquircle(ctx, x, y, size) {
    const r = size * 0.225; // One UI continuous squircle curvature ~22.5%
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, r);
  }

  /**
   * Processes the Samsung Master Icon (512x512 raw and squircle)
   */
  async function processSamsungIcon(img) {
    state.sourceIcon = img;

    // 1. Raw 512x512 Master Icon
    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = 512;
    rawCanvas.height = 512;
    const rawCtx = rawCanvas.getContext('2d');
    rawCtx.imageSmoothingEnabled = true;
    rawCtx.imageSmoothingQuality = 'high';
    rawCtx.drawImage(img, 0, 0, 512, 512);

    state.rawIconBlob = await new Promise(resolve => rawCanvas.toBlob(resolve, 'image/png'));

    // 2. Squircle 512x512 Icon
    const sqCanvas = document.createElement('canvas');
    sqCanvas.width = 512;
    sqCanvas.height = 512;
    const sqCtx = sqCanvas.getContext('2d');
    sqCtx.imageSmoothingEnabled = true;
    sqCtx.imageSmoothingQuality = 'high';
    drawOneUiSquircle(sqCtx, 0, 0, 512);
    sqCtx.clip();
    sqCtx.drawImage(img, 0, 0, 512, 512);

    state.squircleIconBlob = await new Promise(resolve => sqCanvas.toBlob(resolve, 'image/png'));

    // Update UI previews
    const rawPreview = document.getElementById('samsung-icon-raw-canvas');
    if (rawPreview) {
      const rCtx = rawPreview.getContext('2d');
      rawPreview.width = 256;
      rawPreview.height = 256;
      rCtx.clearRect(0, 0, 256, 256);
      rCtx.imageSmoothingEnabled = true;
      rCtx.imageSmoothingQuality = 'high';
      rCtx.drawImage(img, 0, 0, 256, 256);
    }

    const sqPreview = document.getElementById('samsung-icon-squircle-canvas');
    if (sqPreview) {
      const sCtx = sqPreview.getContext('2d');
      sqPreview.width = 256;
      sqPreview.height = 256;
      sCtx.clearRect(0, 0, 256, 256);
      sCtx.imageSmoothingEnabled = true;
      sCtx.imageSmoothingQuality = 'high';
      drawOneUiSquircle(sCtx, 0, 0, 256);
      sCtx.clip();
      sCtx.drawImage(img, 0, 0, 256, 256);
    }

    const legacyPreview = document.getElementById('samsung-icon-canvas');
    if (legacyPreview) {
      const pCtx = legacyPreview.getContext('2d');
      legacyPreview.width = 256;
      legacyPreview.height = 256;
      pCtx.clearRect(0, 0, 256, 256);
      drawOneUiSquircle(pCtx, 0, 0, 256);
      pCtx.clip();
      pCtx.drawImage(img, 0, 0, 256, 256);
    }

    renderSamsungBanner();
    renderSamsungScreenshot();
  }

  let samsungBannerRafId = null;
  let samsungScreenshotRafId = null;

  function scheduleSamsungBanner() {
    if (samsungBannerRafId) cancelAnimationFrame(samsungBannerRafId);
    samsungBannerRafId = requestAnimationFrame(function () {
      renderSamsungBanner();
      samsungBannerRafId = null;
    });
  }

  function scheduleSamsungScreenshot() {
    if (samsungScreenshotRafId) cancelAnimationFrame(samsungScreenshotRafId);
    samsungScreenshotRafId = requestAnimationFrame(function () {
      renderSamsungScreenshot();
      samsungScreenshotRafId = null;
    });
  }

  /**
   * Renders the 1024x500 Samsung High-Contrast Promo Banner
   */
  function renderSamsungBanner() {
    const canvas = document.getElementById('samsung-banner-canvas');
    if (!canvas) return;

    canvas.width = 1024;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // 1. High-Contrast Vibrant Background Gradient
    const bg = ctx.createLinearGradient(0, 0, 1024, 500);
    if (state.bannerTheme === 'phantom_violet') {
      bg.addColorStop(0, '#2e1065');
      bg.addColorStop(0.5, '#4c1d95');
      bg.addColorStop(1, '#0f172a');
    } else if (state.bannerTheme === 'onyx_black') {
      bg.addColorStop(0, '#18181b');
      bg.addColorStop(0.6, '#09090b');
      bg.addColorStop(1, '#000000');
    } else if (state.bannerTheme === 'cobalt') {
      bg.addColorStop(0, '#0284c7');
      bg.addColorStop(0.5, '#1e40af');
      bg.addColorStop(1, '#030712');
    } else { // galaxy_blue default
      bg.addColorStop(0, '#1d4ed8');
      bg.addColorStop(0.5, '#1e1b4b');
      bg.addColorStop(1, '#020617');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 500);

    // Dynamic geometric lighting
    ctx.save();
    const glow = ctx.createRadialGradient(800, 250, 50, 800, 250, 400);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1024, 500);
    ctx.restore();

    // 2. Icon Badge Placement (Left or Right)
    if (state.sourceIcon) {
      const iconSize = 180;
      const iconX = 80;
      const iconY = 160;

      // Squircle shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      drawOneUiSquircle(ctx, iconX, iconY, iconSize);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawOneUiSquircle(ctx, iconX, iconY, iconSize);
      ctx.clip();
      ctx.drawImage(state.sourceIcon, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    }

    // 3. Typography (Galaxy Store High-Contrast Style)
    const textStartX = state.sourceIcon ? 300 : 80;
    ctx.textAlign = 'left';

    // Badge Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(textStartX, 150, 190, 34, 17);
    ctx.fill();

    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('GALAXY STORE EXCLUSIVE', textStartX + 14, 173);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px system-ui, sans-serif';
    ctx.fillText(state.bannerTitle || 'Galaxy Next-Gen', textStartX, 240);

    // Subtitle
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText(state.bannerSubtitle || 'Crafted for Samsung One UI Experience', textStartX, 285);

    // Store Badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('Available on Galaxy Store', textStartX, 340);
  }

  /**
   * Renders the 9:16 vertical standard (1080x1920) Samsung Screenshot Mockup
   */
  function renderSamsungScreenshot() {
    const canvas = document.getElementById('samsung-screenshot-canvas');
    if (!canvas) return;

    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Sleek Background
    const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
    bg.addColorStop(0, '#090d16');
    bg.addColorStop(0.5, '#111827');
    bg.addColorStop(1, '#030712');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Soft glow
    const radial = ctx.createRadialGradient(540, 700, 100, 540, 700, 600);
    radial.addColorStop(0, 'rgba(37, 99, 235, 0.18)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Headlines (Top)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
    ctx.fillText(state.screenshotHeadline || 'Peak Performance', 540, 220);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 32px system-ui, -apple-system, sans-serif';
    ctx.fillText(state.screenshotSubhead || 'Optimized for Galaxy S24 Ultra & Fold', 540, 280);

    // 3. Galaxy S24 Ultra Device Frame (Square corners, ultra-thin bezels, punch hole)
    const phoneW = 760;
    const phoneH = 1460;
    const phoneX = (1080 - phoneW) / 2;
    const phoneY = 360;
    const frameRadius = 40; // Galaxy S24 Ultra sharp continuous corner

    // Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 60;
    ctx.shadowOffsetY = 30;
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, frameRadius);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.restore();

    // Titanium Frame Border
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#475569';
    ctx.stroke();

    // Inner Screen Display
    const margin = 16;
    const screenX = phoneX + margin;
    const screenY = phoneY + margin;
    const screenW = phoneW - margin * 2;
    const screenH = phoneH - margin * 2;
    const screenRadius = frameRadius - 8;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();

    if (state.screenshotImage) {
      ctx.drawImage(state.screenshotImage, screenX, screenY, screenW, screenH);
    } else {
      // Default screen art
      const scrBg = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
      scrBg.addColorStop(0, '#0f172a');
      scrBg.addColorStop(1, '#020617');
      ctx.fillStyle = scrBg;
      ctx.fillRect(screenX, screenY, screenW, screenH);

      if (state.sourceIcon) {
        const iconSize = 180;
        const iconX = screenX + (screenW - iconSize) / 2;
        const iconY = screenY + 400;
        ctx.save();
        drawOneUiSquircle(ctx, iconX, iconY, iconSize);
        ctx.clip();
        ctx.drawImage(state.sourceIcon, iconX, iconY, iconSize, iconSize);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px system-ui, sans-serif';
        ctx.fillText('Samsung Galaxy Ready', screenX + screenW / 2, iconY + iconSize + 60);
      }
    }

    // Centered Punch-Hole Camera (Infinity-O)
    ctx.beginPath();
    ctx.arc(screenX + screenW / 2, screenY + 36, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Export Samsung Assets (.zip)
   */
  async function exportSamsungZip() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries are loading. Please wait.');
      return;
    }

    if (!state.sourceIcon && !window.masterIconImage) {
      alert('Please upload or load a master icon first.');
      return;
    }

    if (!state.sourceIcon && window.masterIconImage) {
      await processSamsungIcon(window.masterIconImage);
    }

    const btn = document.getElementById('btn-download-samsung-zip');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Packaging Samsung Assets...</span>`;
      refreshIcons();
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder('samsung_galaxy_store');

      if (state.rawIconBlob) {
        folder.file('icon_512x512.png', state.rawIconBlob);
      }
      if (state.squircleIconBlob) {
        folder.file('icon_oneui_squircle_512x512.png', state.squircleIconBlob);
      }

      const bannerCanvas = document.getElementById('samsung-banner-canvas');
      if (bannerCanvas) {
        const bBlob = await new Promise(r => bannerCanvas.toBlob(r, 'image/png'));
        folder.file('promo_banner_1024x500.png', bBlob);
      }

      const screenCanvas = document.getElementById('samsung-screenshot-canvas');
      if (screenCanvas) {
        const sBlob = await new Promise(r => screenCanvas.toBlob(r, 'image/png'));
        const scFolder = folder.folder('screenshots');
        scFolder.file('screenshot_galaxy_1080x1920.png', sBlob);
      }

      folder.file('SAMSUNG_GALAXY_STORE_GUIDE.txt', `SAMSUNG GALAXY STORE ASSET SPECIFICATIONS:
1. Master Icon:
   - File: icon_512x512.png (Upload to Galaxy Store Console).
   - Format: 512x512 PNG, 32-bit with alpha.
   - One UI aligns the continuous squircle curvature automatically on devices.
2. Promo Banner:
   - File: promo_banner_1024x500.png
   - Requirement: 1024x500 PNG / JPEG, maximum 1MB. High-contrast, no fine text.
3. Screenshots:
   - File: screenshots/screenshot_galaxy_1080x1920.png
   - Standard 9:16 vertical orientation (minimum 1080x1920, maximum 2160x3840).`);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, 'devasset-samsung-galaxy-assets.zip');

      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Samsung Assets Downloaded!</span>`;
        refreshIcons();
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.disabled = false;
          refreshIcons();
        }, 3000);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Samsung export failed:', err);
      alert('Samsung export failed: ' + err.message);
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
        refreshIcons();
      }
    }
  }

  /**
   * Export Both Samsung Icons (.zip)
   */
  async function downloadBothSamsungIcons() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries are loading. Please wait.');
      return;
    }

    if (!state.sourceIcon && !window.masterIconImage) {
      alert('Please upload or load a master icon first.');
      return;
    }

    if (!state.sourceIcon && window.masterIconImage) {
      await processSamsungIcon(window.masterIconImage);
    }

    const btn = document.getElementById('btn-download-samsung-both-icons');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Zipping Both Samsung Icons...</span>`;
      refreshIcons();
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder('samsung_galaxy_icons');

      if (state.rawIconBlob) {
        folder.file('icon_512x512.png', state.rawIconBlob);
      }
      if (state.squircleIconBlob) {
        folder.file('icon_oneui_squircle_512x512.png', state.squircleIconBlob);
      }

      folder.file('README_SAMSUNG_ICONS.txt', `SAMSUNG GALAXY STORE ICON ASSETS:
1. icon_512x512.png:
   - Format: 512×512 32-bit PNG (with RGBA alpha channel).
   - Raw master graphic recommended for Galaxy Store Seller Portal submission.
2. icon_oneui_squircle_512x512.png:
   - Formatted with One UI continuous squircle corner curvature (~22.5% superellipse radius).
   - Ideal for mockups, promo placement, and direct device preview testing.`);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, 'samsung-galaxy-icons-512x512.zip');

      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-300"></i><span>Downloaded Both Icons (.zip)!</span>`;
        refreshIcons();
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.disabled = false;
          refreshIcons();
        }, 3000);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Samsung icons export failed:', err);
      alert('Samsung icons export failed: ' + err.message);
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
        refreshIcons();
      }
    }
  }

  function downloadRawSamsungIcon() {
    if (state.rawIconBlob && typeof saveAs !== 'undefined') {
      saveAs(state.rawIconBlob, 'samsung_icon_raw_512x512.png');
    } else {
      alert('Please upload or load a master icon first.');
    }
  }

  function downloadSquircleSamsungIcon() {
    if (state.squircleIconBlob && typeof saveAs !== 'undefined') {
      saveAs(state.squircleIconBlob, 'samsung_icon_oneui_squircle_512x512.png');
    } else {
      alert('Please upload or load a master icon first.');
    }
  }

  function createSampleSamsungIcon() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#1d4ed8');
    g.addColorStop(0.5, '#4338ca');
    g.addColorStop(1, '#0284c7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 120px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('S', 256, 256);

    const img = new Image();
    img.onload = function () {
      processSamsungIcon(img);
    };
    img.src = c.toDataURL('image/png');
  }

  function initSamsungUi() {
    const uploadInput = document.getElementById('samsung-icon-upload');
    const btnSample = document.getElementById('btn-samsung-sample');
    const titleInput = document.getElementById('samsung-banner-title');
    const subInput = document.getElementById('samsung-banner-subtitle');
    const themeSelect = document.getElementById('samsung-banner-theme');
    const headInput = document.getElementById('samsung-screen-headline');
    const screenSub = document.getElementById('samsung-screen-subhead');
    const screenUpload = document.getElementById('samsung-screen-upload');
    const btnDownloadZip = document.getElementById('btn-download-samsung-zip');

    if (uploadInput) {
      uploadInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            processSamsungIcon(img);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnSample) {
      btnSample.addEventListener('click', createSampleSamsungIcon);
    }

    if (titleInput) {
      titleInput.addEventListener('input', function (e) {
        state.bannerTitle = e.target.value;
        scheduleSamsungBanner();
      });
    }
    if (subInput) {
      subInput.addEventListener('input', function (e) {
        state.bannerSubtitle = e.target.value;
        scheduleSamsungBanner();
      });
    }
    if (themeSelect) {
      themeSelect.addEventListener('change', function (e) {
        state.bannerTheme = e.target.value;
        scheduleSamsungBanner();
      });
    }

    if (headInput) {
      headInput.addEventListener('input', function (e) {
        state.screenshotHeadline = e.target.value;
        scheduleSamsungScreenshot();
      });
    }
    if (screenSub) {
      screenSub.addEventListener('input', function (e) {
        state.screenshotSubhead = e.target.value;
        scheduleSamsungScreenshot();
      });
    }
    if (screenUpload) {
      screenUpload.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            state.screenshotImage = img;
            scheduleSamsungScreenshot();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnDownloadZip) {
      btnDownloadZip.addEventListener('click', exportSamsungZip);
    }

    const btnBothIcons = document.getElementById('btn-download-samsung-both-icons');
    if (btnBothIcons) {
      btnBothIcons.addEventListener('click', downloadBothSamsungIcons);
    }

    const btnRawIcon = document.getElementById('btn-download-samsung-raw');
    if (btnRawIcon) {
      btnRawIcon.addEventListener('click', downloadRawSamsungIcon);
    }

    const btnSquircleIcon = document.getElementById('btn-download-samsung-squircle');
    if (btnSquircleIcon) {
      btnSquircleIcon.addEventListener('click', downloadSquircleSamsungIcon);
    }

    createSampleSamsungIcon();
  }

  window.DevAssetStudio.samsungEngine = {
    state,
    processSamsungIcon,
    exportSamsungZip,
    downloadBothSamsungIcons,
    downloadRawSamsungIcon,
    downloadSquircleSamsungIcon,
    renderSamsungBanner,
    renderSamsungScreenshot,
    initSamsungUi
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSamsungUi);
  } else {
    initSamsungUi();
  }
})();
