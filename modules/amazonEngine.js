/**
 * modules/amazonEngine.js
 * DevAsset Studio • Amazon Appstore (Fire OS) Asset Engine
 * 
 * Features:
 * 1. Icons:
 *    - Large Icon: 512x512 px PNG (Standard Amazon Developer Console requirement).
 *    - Small Icon: 114x114 px PNG (Fire OS carousel & launcher thumbnail).
 * 2. Promo Banner: 1024x500 px PNG (Fire TV & Appstore spotlight placement).
 * 3. Device Presets for Fire Tablets:
 *    - 800x1280 px (Fire 7 / Fire HD 8)
 *    - 1200x1920 px (Fire HD 10 / Fire Max 11)
 *    - Live canvas tablet compositor with Fire OS bezels and headline overlay.
 * 4. Dedicated export: Download Amazon Assets (.zip).
 */

(function () {
  'use strict';

  window.DevAssetStudio = window.DevAssetStudio || {};

  const state = {
    sourceIcon: null,
    largeIconBlob: null,
    smallIconBlob: null,
    bannerTitle: 'Engineered for Fire OS',
    bannerSubtitle: 'Rich entertainment and productivity on Fire Tablets',
    bannerTheme: 'amazon_amber', // 'amazon_amber', 'slate_dark', 'fire_crimson'
    tabletPreset: '800x1280', // '800x1280' or '1200x1920'
    tabletHeadline: 'All Your Favorites in HD',
    tabletSubhead: 'Optimized for Amazon Fire HD & Max Tablets',
    tabletScreenshot: null,
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
   * Process Amazon Large Icon (512x512) and Small Icon (114x114)
   */
  async function processAmazonIcon(img) {
    state.sourceIcon = img;

    // 1. Large Icon (512x512)
    const largeCanvas = document.createElement('canvas');
    largeCanvas.width = 512;
    largeCanvas.height = 512;
    const lCtx = largeCanvas.getContext('2d');
    lCtx.imageSmoothingEnabled = true;
    lCtx.imageSmoothingQuality = 'high';
    lCtx.drawImage(img, 0, 0, 512, 512);
    state.largeIconBlob = await new Promise(r => largeCanvas.toBlob(r, 'image/png'));

    // 2. Small Icon (114x114)
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = 114;
    smallCanvas.height = 114;
    const sCtx = smallCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(img, 0, 0, 114, 114);
    state.smallIconBlob = await new Promise(r => smallCanvas.toBlob(r, 'image/png'));

    // Update Previews
    const previewLarge = document.getElementById('amazon-icon-large-canvas');
    if (previewLarge) {
      const pCtx = previewLarge.getContext('2d');
      previewLarge.width = 256;
      previewLarge.height = 256;
      pCtx.drawImage(img, 0, 0, 256, 256);
    }

    const previewSmall = document.getElementById('amazon-icon-small-canvas');
    if (previewSmall) {
      const pCtx = previewSmall.getContext('2d');
      previewSmall.width = 114;
      previewSmall.height = 114;
      pCtx.drawImage(img, 0, 0, 114, 114);
    }

    renderAmazonBanner();
    renderAmazonTablet();
  }

  let amazonBannerRafId = null;
  let amazonTabletRafId = null;

  function scheduleAmazonBanner() {
    if (amazonBannerRafId) cancelAnimationFrame(amazonBannerRafId);
    amazonBannerRafId = requestAnimationFrame(function () {
      renderAmazonBanner();
      amazonBannerRafId = null;
    });
  }

  function scheduleAmazonTablet() {
    if (amazonTabletRafId) cancelAnimationFrame(amazonTabletRafId);
    amazonTabletRafId = requestAnimationFrame(function () {
      renderAmazonTablet();
      amazonTabletRafId = null;
    });
  }

  /**
   * Renders the 1024x500 Promo Banner for Amazon Appstore
   */
  function renderAmazonBanner() {
    const canvas = document.getElementById('amazon-banner-canvas');
    if (!canvas) return;

    canvas.width = 1024;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const bg = ctx.createLinearGradient(0, 0, 1024, 500);
    if (state.bannerTheme === 'fire_crimson') {
      bg.addColorStop(0, '#7f1d1d');
      bg.addColorStop(0.5, '#450a0a');
      bg.addColorStop(1, '#0c0a09');
    } else if (state.bannerTheme === 'slate_dark') {
      bg.addColorStop(0, '#1c1917');
      bg.addColorStop(0.6, '#0c0a09');
      bg.addColorStop(1, '#000000');
    } else { // amazon_amber
      bg.addColorStop(0, '#d97706');
      bg.addColorStop(0.4, '#78350f');
      bg.addColorStop(1, '#1c1917');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 500);

    // Subtle atmospheric glow
    const radial = ctx.createRadialGradient(850, 250, 60, 850, 250, 420);
    radial.addColorStop(0, 'rgba(251, 191, 36, 0.2)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, 1024, 500);

    // Icon on left
    if (state.sourceIcon) {
      const iconSize = 180;
      const iconX = 80;
      const iconY = 160;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.roundRect(iconX, iconY, iconSize, iconSize, 36);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(iconX, iconY, iconSize, iconSize, 36);
      ctx.clip();
      ctx.drawImage(state.sourceIcon, iconX, iconY, iconSize, iconSize);
      ctx.restore();
    }

    // Typography
    const textStartX = state.sourceIcon ? 300 : 80;
    ctx.textAlign = 'left';

    // Badge Pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.roundRect(textStartX, 150, 185, 34, 17);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('AMAZON APPSTORE', textStartX + 14, 173);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px system-ui, sans-serif';
    ctx.fillText(state.bannerTitle || 'Engineered for Fire OS', textStartX, 240);

    // Subtitle
    ctx.fillStyle = '#e7e5e4';
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillText(state.bannerSubtitle || 'Rich entertainment and productivity on Fire Tablets', textStartX, 285);

    // Fire Tablet badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.fillText('Compatible with Fire HD 8, 10 & Fire Max 11', textStartX, 340);
  }

  /**
   * Renders the Fire Tablet Screenshot Mockup (800x1280 or 1200x1920)
   */
  function renderAmazonTablet() {
    const canvas = document.getElementById('amazon-tablet-canvas');
    if (!canvas) return;

    const [w, h] = state.tabletPreset.split('x').map(Number);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    // Background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#1c1917');
    bg.addColorStop(0.5, '#0c0a09');
    bg.addColorStop(1, '#000000');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Glow
    const glow = ctx.createRadialGradient(w / 2, h * 0.4, 50, w / 2, h * 0.4, w * 0.6);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.15)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Typography (Top)
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.055)}px system-ui, sans-serif`;
    ctx.fillText(state.tabletHeadline || 'All Your Favorites in HD', w / 2, Math.round(h * 0.11));

    ctx.fillStyle = '#d6d3d1';
    ctx.font = `500 ${Math.round(w * 0.03)}px system-ui, sans-serif`;
    ctx.fillText(state.tabletSubhead || 'Optimized for Amazon Fire Tablets', w / 2, Math.round(h * 0.15));

    // Fire Tablet Frame
    const frameW = w * 0.82;
    const frameH = h * 0.72;
    const frameX = (w - frameW) / 2;
    const frameY = h * 0.20;
    const frameRadius = 32;

    // Outer Bezel Shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 50;
    ctx.shadowOffsetY = 25;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, frameRadius);
    ctx.fillStyle = '#292524';
    ctx.fill();
    ctx.restore();

    // Frame Border
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#44403c';
    ctx.stroke();

    // Screen Area
    const margin = 20;
    const sX = frameX + margin;
    const sY = frameY + margin;
    const sW = frameW - margin * 2;
    const sH = frameH - margin * 2;
    const sRadius = frameRadius - 10;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(sX, sY, sW, sH, sRadius);
    ctx.clip();

    if (state.tabletScreenshot) {
      ctx.drawImage(state.tabletScreenshot, sX, sY, sW, sH);
    } else {
      // Default screen artwork
      const scrBg = ctx.createLinearGradient(sX, sY, sX, sY + sH);
      scrBg.addColorStop(0, '#0c0a09');
      scrBg.addColorStop(1, '#1c1917');
      ctx.fillStyle = scrBg;
      ctx.fillRect(sX, sY, sW, sH);

      if (state.sourceIcon) {
        const iconSize = Math.round(sW * 0.35);
        const iconX = sX + (sW - iconSize) / 2;
        const iconY = sY + (sH - iconSize) / 2 - 40;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, 28);
        ctx.clip();
        ctx.drawImage(state.sourceIcon, iconX, iconY, iconSize, iconSize);
        ctx.restore();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.round(sW * 0.07)}px system-ui, sans-serif`;
        ctx.fillText('Fire OS Ready', sX + sW / 2, iconY + iconSize + 60);
      }
    }

    // Top Tablet Front Camera
    ctx.beginPath();
    ctx.arc(sX + sW / 2, frameY + margin / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#1c1917';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Export Amazon Assets (.zip)
   */
  async function exportAmazonZip() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries are loading. Please wait.');
      return;
    }

    if (!state.sourceIcon && !window.masterIconImage) {
      alert('Please upload or load a master icon first.');
      return;
    }

    if (!state.sourceIcon && window.masterIconImage) {
      await processAmazonIcon(window.masterIconImage);
    }

    const btn = document.getElementById('btn-download-amazon-zip');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Packaging Amazon Assets...</span>`;
      refreshIcons();
    }

    try {
      const zip = new JSZip();
      const folder = zip.folder('amazon_appstore');

      if (state.largeIconBlob) {
        folder.file('icon_large_512x512.png', state.largeIconBlob);
      }
      if (state.smallIconBlob) {
        folder.file('icon_small_114x114.png', state.smallIconBlob);
      }

      const bannerCanvas = document.getElementById('amazon-banner-canvas');
      if (bannerCanvas) {
        const bBlob = await new Promise(r => bannerCanvas.toBlob(r, 'image/png'));
        folder.file('promo_banner_1024x500.png', bBlob);
      }

      const tabletCanvas = document.getElementById('amazon-tablet-canvas');
      if (tabletCanvas) {
        const tBlob = await new Promise(r => tabletCanvas.toBlob(r, 'image/png'));
        const scFolder = folder.folder('screenshots');
        scFolder.file(`fire_tablet_${state.tabletPreset}.png`, tBlob);
      }

      folder.file('AMAZON_APPSTORE_GUIDE.txt', `AMAZON APPSTORE ASSET SPECIFICATIONS:
1. Large Icon:
   - File: icon_large_512x512.png
   - Requirement: 512x512 PNG (32-bit with alpha). Appears on product detail page.
2. Small Icon:
   - File: icon_small_114x114.png
   - Requirement: 114x114 PNG (32-bit with alpha). Appears in Fire OS search & carousel.
3. Promo Banner:
   - File: promo_banner_1024x500.png
   - Requirement: 1024x500 PNG. Used for featured carousel placements across Fire TV & Fire Tablets.
4. Screenshots:
   - File: screenshots/fire_tablet_${state.tabletPreset}.png
   - Supported resolutions: 800x1280 (Fire 7/8) and 1200x1920 (Fire HD 10 / Max 11).`);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, 'devasset-amazon-appstore-assets.zip');

      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>Amazon Assets Downloaded!</span>`;
        refreshIcons();
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.disabled = false;
          refreshIcons();
        }, 3000);
      }
    } catch (err) {
      console.error('[DevAsset Studio] Amazon export failed:', err);
      alert('Amazon export failed: ' + err.message);
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
        refreshIcons();
      }
    }
  }

  function createSampleAmazonIcon() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#f59e0b');
    g.addColorStop(0.5, '#d97706');
    g.addColorStop(1, '#78350f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(256, 256, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 120px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 256, 256);

    const img = new Image();
    img.onload = function () {
      processAmazonIcon(img);
    };
    img.src = c.toDataURL('image/png');
  }

  function initAmazonUi() {
    const uploadInput = document.getElementById('amazon-icon-upload');
    const btnSample = document.getElementById('btn-amazon-sample');
    const titleInput = document.getElementById('amazon-banner-title');
    const subInput = document.getElementById('amazon-banner-subtitle');
    const themeSelect = document.getElementById('amazon-banner-theme');
    const presetSelect = document.getElementById('amazon-tablet-preset');
    const headInput = document.getElementById('amazon-tablet-headline');
    const subheadInput = document.getElementById('amazon-tablet-subhead');
    const screenUpload = document.getElementById('amazon-tablet-upload');
    const btnDownloadZip = document.getElementById('btn-download-amazon-zip');

    if (uploadInput) {
      uploadInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            processAmazonIcon(img);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnSample) {
      btnSample.addEventListener('click', createSampleAmazonIcon);
    }

    if (titleInput) {
      titleInput.addEventListener('input', function (e) {
        state.bannerTitle = e.target.value;
        scheduleAmazonBanner();
      });
    }
    if (subInput) {
      subInput.addEventListener('input', function (e) {
        state.bannerSubtitle = e.target.value;
        scheduleAmazonBanner();
      });
    }
    if (themeSelect) {
      themeSelect.addEventListener('change', function (e) {
        state.bannerTheme = e.target.value;
        scheduleAmazonBanner();
      });
    }

    if (presetSelect) {
      presetSelect.addEventListener('change', function (e) {
        state.tabletPreset = e.target.value;
        scheduleAmazonTablet();
      });
    }
    if (headInput) {
      headInput.addEventListener('input', function (e) {
        state.tabletHeadline = e.target.value;
        scheduleAmazonTablet();
      });
    }
    if (subheadInput) {
      subheadInput.addEventListener('input', function (e) {
        state.tabletSubhead = e.target.value;
        scheduleAmazonTablet();
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
            state.tabletScreenshot = img;
            scheduleAmazonTablet();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnDownloadZip) {
      btnDownloadZip.addEventListener('click', exportAmazonZip);
    }

    createSampleAmazonIcon();
  }

  window.DevAssetStudio.amazonEngine = {
    state,
    processAmazonIcon,
    exportAmazonZip,
    renderAmazonBanner,
    renderAmazonTablet,
    initAmazonUi
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmazonUi);
  } else {
    initAmazonUi();
  }
})();
