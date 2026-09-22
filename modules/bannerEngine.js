/**
 * modules/bannerEngine.js
 * DevAsset Studio • Step 2 & 3 Canvas Engine
 * 
 * Responsibilities:
 * - HTML5 Canvas Compositor for 1024x500 Google Play Store Feature Graphic
 * - Real-time re-rendering on text/tagline changes, theme presets, and studio controls
 * - Listens for 'masterImageUpdated' to sync the master app icon
 * - Supports custom background image upload with cover-mode aspect ratio scaling
 * - Supports custom gradient color overrides (Start & End pickers)
 * - Supports Dark Overlay / Dimmer slider (0% to 80%)
 * - Supports Logo Scale slider (50% to 200%) and Layout Alignment (Center vs Left-Split)
 * - Supports Title font size slider (24px to 64px), Text Color, and Hide Text toggle
 * - Standalone "Download 1024x500 PNG" button export
 * - Exposes window.getFeatureGraphicBlob for JSZip packaging and direct downloads
 */

(function () {
  'use strict';

  let bannerCanvas = null;
  let bannerCtx = null;
  let renderRafId = null;

  // State Management
  let currentTheme = 'indigo';
  let isCustomGradient = false;
  let customBgImage = null;
  let customGradStart = '#0F172A';
  let customGradEnd = '#31104B';
  let darkOverlayOpacity = 0; // 0 to 0.8
  let logoScale = 1.0; // 0.5 to 2.0
  let layoutMode = 'center'; // 'center' | 'left-split'
  let titleFontSize = 42; // 24 to 64
  let textColor = '#FFFFFF';
  let hideText = false;

  // Theme Gradient Palettes (1024x500)
  const THEME_PRESETS = {
    indigo: {
      from: '#0F172A',
      mid: '#1E1B4B',
      to: '#31104B',
      accent: '#818CF8',
      spotlight: 'rgba(99, 102, 241, 0.22)',
      taglineColor: '#C7D2FE',
    },
    emerald: {
      from: '#064E3B',
      mid: '#022C22',
      to: '#0F172A',
      accent: '#34D399',
      spotlight: 'rgba(16, 185, 129, 0.22)',
      taglineColor: '#A7F3D0',
    },
    amber: {
      from: '#78350F',
      mid: '#451A03',
      to: '#0F172A',
      accent: '#FBBF24',
      spotlight: 'rgba(245, 158, 11, 0.22)',
      taglineColor: '#FDE68A',
    },
    midnight: {
      from: '#030712',
      mid: '#111827',
      to: '#1F2937',
      accent: '#9CA3AF',
      spotlight: 'rgba(156, 163, 175, 0.15)',
      taglineColor: '#94A3B8',
    },
  };

  function refreshLucideIcons() {
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

  // Setup / Mount the 1024x500 HTML5 Canvas inside Card 2
  function setupBannerCanvas() {
    const previewContainer = document.getElementById('feature-banner-preview');
    if (!previewContainer) return;

    bannerCanvas = document.getElementById('feature-graphic-canvas');
    if (!bannerCanvas) {
      bannerCanvas = document.createElement('canvas');
      bannerCanvas.id = 'feature-graphic-canvas';
      bannerCanvas.width = 1024;
      bannerCanvas.height = 500;
      bannerCanvas.className = 'w-full h-auto aspect-[1024/500] rounded-xl object-contain block shadow-xl border border-borderline';
      bannerCanvas.title = 'Google Play Store Feature Graphic (1024 × 500 px)';

      previewContainer.innerHTML = '';
      previewContainer.className = 'w-full aspect-[1024/500] rounded-xl overflow-hidden relative shadow-xl bg-transparent';
      previewContainer.appendChild(bannerCanvas);
    }

    bannerCtx = bannerCanvas.getContext('2d');
    window.featureGraphicCanvas = bannerCanvas;
  }

  // Draw rounded squircle / rect path
  function drawRoundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // Debounced Render via requestAnimationFrame
  function scheduleRender() {
    if (renderRafId) {
      cancelAnimationFrame(renderRafId);
    }
    renderRafId = requestAnimationFrame(function () {
      renderFeatureGraphic();
      renderRafId = null;
    });
  }

  // Main Compositing Routine (1024x500 px strictly)
  function renderFeatureGraphic() {
    if (!bannerCanvas || !bannerCtx) {
      setupBannerCanvas();
      if (!bannerCanvas || !bannerCtx) return;
    }

    const ctx = bannerCtx;
    const width = 1024;
    const height = 500;

    // Read live input values
    const headlineInput = document.getElementById('input-banner-title');
    const taglineInput = document.getElementById('input-banner-tagline');

    const headline = (headlineInput && headlineInput.value.trim()) || 'App Showcase';
    const tagline = (taglineInput && taglineInput.value.trim()) || 'Modern mobile experience';

    const theme = THEME_PRESETS[currentTheme] || THEME_PRESETS.indigo;

    // Broadcast current background state for auto-inheritance in other studio cards
    broadcastBackgroundState();

    // =========================================================================
    // 1. BASE BACKGROUND: Custom Image, Custom Gradient, or Selected Preset
    // =========================================================================
    if (customBgImage) {
      // Draw uploaded background artwork scaled to cover aspect ratio
      const imgRatio = customBgImage.width / customBgImage.height;
      const canvasRatio = width / height; // 2.048
      let drawW, drawH, drawX, drawY;

      if (imgRatio > canvasRatio) {
        drawH = height;
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
        drawY = 0;
      } else {
        drawW = width;
        drawH = width / imgRatio;
        drawX = 0;
        drawY = (height - drawH) / 2;
      }
      ctx.drawImage(customBgImage, drawX, drawY, drawW, drawH);
    } else if (isCustomGradient) {
      // Custom 2-Color Gradient
      const customGrad = ctx.createLinearGradient(0, 0, width, height);
      customGrad.addColorStop(0, customGradStart);
      customGrad.addColorStop(1, customGradEnd);
      ctx.fillStyle = customGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial center light
      const ambientLight = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, 450);
      ambientLight.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      ambientLight.addColorStop(1, 'transparent');
      ctx.fillStyle = ambientLight;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Default Preset Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, theme.from);
      bgGrad.addColorStop(0.5, theme.mid);
      bgGrad.addColorStop(1, theme.to);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient Radial Spotlight
      const spotGrad = ctx.createRadialGradient(512, 175, 10, 512, 175, 420);
      spotGrad.addColorStop(0, theme.spotlight);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Developer Tech Grid Overlay
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // =========================================================================
    // 2. DARK OVERLAY / DIMMER
    // =========================================================================
    if (darkOverlayOpacity > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${darkOverlayOpacity})`;
      ctx.fillRect(0, 0, width, height);
    }

    // =========================================================================
    // 3. LOGO & TYPOGRAPHY LAYOUT COMPOSITION
    // =========================================================================
    if (layoutMode === 'left-split') {
      // -----------------------------------------------------------------------
      // LAYOUT: LEFT ALIGN LOGO + RIGHT ALIGNED TEXT
      // -----------------------------------------------------------------------
      const baseIconSize = Math.round(160 * logoScale);
      const iconSize = Math.max(50, Math.min(320, baseIconSize));
      const iconRadius = Math.round(iconSize * (30 / 136));
      const iconX = 85;
      const iconY = Math.round((height - iconSize) / 2);

      // Render Logo Squircle with Shadow
      renderIconSquircle(ctx, iconX, iconY, iconSize, iconRadius);

      // Render Text on the Right (if not hidden)
      if (!hideText) {
        const textStartX = iconX + iconSize + 60;
        const maxTextWidth = width - textStartX - 50;

        const effectiveTitleSize = titleFontSize;
        const effectiveTaglineSize = Math.max(14, Math.round(effectiveTitleSize * 0.48));
        const totalTextHeight = effectiveTitleSize + 16 + effectiveTaglineSize;
        const headlineY = Math.round((height - totalTextHeight) / 2 + effectiveTitleSize / 2);
        const taglineY = Math.round(headlineY + effectiveTitleSize / 2 + 16 + effectiveTaglineSize / 2);

        // Headline
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = textColor;
        ctx.font = `bold ${effectiveTitleSize}px "Inter", system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(headline, textStartX, headlineY, maxTextWidth);
        ctx.restore();

        // Tagline
        ctx.save();
        ctx.fillStyle = isCustomGradient || customBgImage ? textColor : theme.taglineColor;
        ctx.globalAlpha = isCustomGradient || customBgImage ? 0.85 : 1.0;
        ctx.font = `500 ${effectiveTaglineSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagline, textStartX, taglineY, maxTextWidth);
        ctx.restore();
      }
    } else {
      // -----------------------------------------------------------------------
      // LAYOUT: CENTERED LOGO + CENTERED TEXT (Default Standard)
      // -----------------------------------------------------------------------
      const baseIconSize = Math.round(136 * logoScale);
      const iconSize = Math.max(50, Math.min(280, baseIconSize));
      const iconRadius = Math.round(iconSize * (30 / 136));
      const iconX = Math.round((width - iconSize) / 2);

      if (hideText) {
        // Center the icon vertically and horizontally
        const iconY = Math.round((height - iconSize) / 2);
        renderIconSquircle(ctx, iconX, iconY, iconSize, iconRadius);
      } else {
        // Distribute icon and text in a balanced vertical stack
        const effectiveTitleSize = titleFontSize;
        const effectiveTaglineSize = Math.max(13, Math.round(effectiveTitleSize * 0.48));
        const gap1 = 20;
        const gap2 = 14;
        const totalStackHeight = iconSize + gap1 + effectiveTitleSize + gap2 + effectiveTaglineSize;

        // Calculate starting top position clamped to safe canvas bounds
        const startY = Math.max(28, Math.round((height - totalStackHeight) / 2));
        const iconY = startY;
        const headlineY = Math.round(iconY + iconSize + gap1 + effectiveTitleSize / 2);
        const taglineY = Math.round(headlineY + effectiveTitleSize / 2 + gap2 + effectiveTaglineSize / 2);

        // Render Icon Squircle
        renderIconSquircle(ctx, iconX, iconY, iconSize, iconRadius);

        // Render Headline
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = textColor;
        ctx.font = `bold ${effectiveTitleSize}px "Inter", system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(headline, 512, headlineY, 920);
        ctx.restore();

        // Render Tagline
        ctx.save();
        ctx.fillStyle = isCustomGradient || customBgImage ? textColor : theme.taglineColor;
        ctx.globalAlpha = isCustomGradient || customBgImage ? 0.85 : 1.0;
        ctx.font = `500 ${effectiveTaglineSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(tagline, 512, taglineY, 920);
        ctx.restore();
      }
    }
  }

  // Helper: Draw Icon Squircle with Drop Shadow & Inner Border
  function renderIconSquircle(ctx, iconX, iconY, iconSize, iconRadius) {
    ctx.save();
    // Drop shadow on the icon
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 14;

    // Squircle path for shadow & clipping
    drawRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius);
    ctx.fillStyle = '#111827';
    ctx.fill();

    // Clip to rounded squircle
    ctx.clip();
    ctx.shadowColor = 'transparent';

    if (window.masterIconImage) {
      // Draw actual loaded or generated master icon
      ctx.drawImage(window.masterIconImage, iconX, iconY, iconSize, iconSize);
    } else {
      // Placeholder squircle with gradient and </> emblem
      const phGrad = ctx.createLinearGradient(iconX, iconY, iconX + iconSize, iconY + iconSize);
      phGrad.addColorStop(0, '#4F46E5');
      phGrad.addColorStop(1, '#7C3AED');
      ctx.fillStyle = phGrad;
      ctx.fillRect(iconX, iconY, iconSize, iconSize);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(iconSize * 0.36)}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('</>', iconX + iconSize / 2, iconY + iconSize / 2);
    }
    ctx.restore();

    // Crisp inner/outer border around squircle
    ctx.save();
    drawRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.stroke();
    ctx.restore();
  }

  // Expose function to obtain feature graphic as Blob (used by zipExporter & direct download)
  window.getFeatureGraphicBlob = function () {
    return new Promise(function (resolve, reject) {
      if (!bannerCanvas) {
        setupBannerCanvas();
        renderFeatureGraphic();
      }
      if (!bannerCanvas) {
        reject(new Error('Feature Graphic canvas not initialized'));
        return;
      }
      bannerCanvas.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from Feature Graphic canvas'));
        }
      }, 'image/png');
    });
  };

  // Broadcast background state to other studio modules (such as screenshotEngine)
  function broadcastBackgroundState() {
    window.bannerBackgroundState = {
      currentTheme,
      isCustomGradient,
      customGradStart,
      customGradEnd,
      customBgImage,
      themePresets: THEME_PRESETS
    };
    try {
      window.dispatchEvent(new CustomEvent('bannerBackgroundChanged', {
        detail: window.bannerBackgroundState
      }));
    } catch (e) {
      console.warn('Unable to dispatch bannerBackgroundChanged', e);
    }
  }

  // Expose getter for current background configuration
  window.getBannerBackgroundState = function () {
    return {
      currentTheme,
      isCustomGradient,
      customGradStart,
      customGradEnd,
      customBgImage,
      themePresets: THEME_PRESETS
    };
  };

  // Wire event listeners for real-time reactivity
  function initBannerEngine() {
    setupBannerCanvas();

    // Listen for master icon update from iconEngine.js
    window.addEventListener('masterImageUpdated', function () {
      scheduleRender();
    });

    // 1. Text Inputs (Headline & Tagline)
    const headlineInput = document.getElementById('input-banner-title');
    const taglineInput = document.getElementById('input-banner-tagline');

    if (headlineInput) {
      headlineInput.addEventListener('input', scheduleRender);
    }
    if (taglineInput) {
      taglineInput.addEventListener('input', scheduleRender);
    }

    // 2. Preset Theme Buttons
    const themeContainer = document.getElementById('banner-theme-selectors');
    if (themeContainer) {
      const buttons = themeContainer.querySelectorAll('button');
      buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const selectedTheme = this.getAttribute('data-theme') || 'indigo';
          currentTheme = selectedTheme;
          isCustomGradient = false;

          const statusEl = document.getElementById('custom-colors-status');
          if (statusEl) statusEl.textContent = 'Overrides presets';

          buttons.forEach(function (b) {
            b.className = 'theme-pill px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-borderline text-slate-400 hover:text-white';
          });
          this.className = 'theme-pill px-2 py-0.5 rounded text-[10px] bg-indigo-950 border border-indigo-500 text-indigo-300';

          scheduleRender();
        });
      });
    }

    // 3. Custom Studio Controls Drawer Toggle
    const btnToggleCustom = document.getElementById('btn-toggle-custom-controls');
    const customDrawer = document.getElementById('custom-designer-drawer');
    const iconToggleCustom = document.getElementById('icon-toggle-custom');

    if (btnToggleCustom && customDrawer) {
      btnToggleCustom.addEventListener('click', function () {
        const isHidden = customDrawer.classList.contains('hidden');
        if (isHidden) {
          customDrawer.classList.remove('hidden');
          btnToggleCustom.setAttribute('aria-expanded', 'true');
          if (iconToggleCustom) iconToggleCustom.style.transform = 'rotate(180deg)';
        } else {
          customDrawer.classList.add('hidden');
          btnToggleCustom.setAttribute('aria-expanded', 'false');
          if (iconToggleCustom) iconToggleCustom.style.transform = 'rotate(0deg)';
        }
      });
    }

    // 4. Custom Background Artwork File Input
    const inputCustomBgFile = document.getElementById('input-custom-bg-file');
    const labelCustomBgName = document.getElementById('label-custom-bg-name');
    const btnRemoveCustomBg = document.getElementById('btn-remove-custom-bg');

    if (inputCustomBgFile) {
      inputCustomBgFile.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (event) {
          const img = new Image();
          img.onload = function () {
            customBgImage = img;
            if (labelCustomBgName) labelCustomBgName.textContent = file.name;
            if (btnRemoveCustomBg) btnRemoveCustomBg.classList.remove('hidden');

            // Auto-bump dimmer slightly if overlay is at 0 so text pops over photo
            const sliderDarkOverlay = document.getElementById('slider-dark-overlay');
            const valDarkOverlay = document.getElementById('val-dark-overlay');
            if (sliderDarkOverlay && darkOverlayOpacity === 0) {
              sliderDarkOverlay.value = '25';
              darkOverlayOpacity = 0.25;
              if (valDarkOverlay) valDarkOverlay.textContent = '25%';
            }

            scheduleRender();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnRemoveCustomBg) {
      btnRemoveCustomBg.addEventListener('click', function () {
        customBgImage = null;
        if (inputCustomBgFile) inputCustomBgFile.value = '';
        if (labelCustomBgName) labelCustomBgName.textContent = 'Upload Image (Cover Scale)';
        btnRemoveCustomBg.classList.add('hidden');
        scheduleRender();
      });
    }

    // 5. Custom Background Colors (Start & End)
    const inputBgGradStart = document.getElementById('input-bg-grad-start');
    const inputBgGradEnd = document.getElementById('input-bg-grad-end');
    const valBgGradStart = document.getElementById('val-bg-grad-start');
    const valBgGradEnd = document.getElementById('val-bg-grad-end');
    const customColorsStatus = document.getElementById('custom-colors-status');

    function onCustomGradientChange() {
      if (inputBgGradStart) {
        customGradStart = inputBgGradStart.value;
        if (valBgGradStart) valBgGradStart.textContent = customGradStart.toUpperCase();
      }
      if (inputBgGradEnd) {
        customGradEnd = inputBgGradEnd.value;
        if (valBgGradEnd) valBgGradEnd.textContent = customGradEnd.toUpperCase();
      }
      isCustomGradient = true;
      if (customColorsStatus) customColorsStatus.textContent = 'Active (Custom)';

      // Unselect preset theme buttons
      if (themeContainer) {
        themeContainer.querySelectorAll('button').forEach(function (b) {
          b.className = 'theme-pill px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-borderline text-slate-400 hover:text-white';
        });
      }

      scheduleRender();
    }

    if (inputBgGradStart) inputBgGradStart.addEventListener('input', onCustomGradientChange);
    if (inputBgGradEnd) inputBgGradEnd.addEventListener('input', onCustomGradientChange);

    // 6. Dark Overlay / Dimmer Slider
    const sliderDarkOverlay = document.getElementById('slider-dark-overlay');
    const valDarkOverlay = document.getElementById('val-dark-overlay');

    if (sliderDarkOverlay) {
      sliderDarkOverlay.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 0;
        darkOverlayOpacity = val / 100;
        if (valDarkOverlay) valDarkOverlay.textContent = `${val}%`;
        scheduleRender();
      });
    }

    // 7. Logo Scale Slider
    const sliderLogoScale = document.getElementById('slider-logo-scale');
    const valLogoScale = document.getElementById('val-logo-scale');

    if (sliderLogoScale) {
      sliderLogoScale.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 100;
        logoScale = val / 100;
        if (valLogoScale) valLogoScale.textContent = `${val}%`;
        scheduleRender();
      });
    }

    // 8. Layout Alignment Toggle
    const layoutOptionsContainer = document.getElementById('banner-layout-options');
    if (layoutOptionsContainer) {
      const layoutButtons = layoutOptionsContainer.querySelectorAll('button');
      layoutButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const selectedLayout = this.getAttribute('data-layout') || 'center';
          layoutMode = selectedLayout;

          layoutButtons.forEach(function (b) {
            b.className = 'layout-btn px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1.5 bg-slate-900 border border-transparent text-slate-400 hover:text-white';
          });
          this.className = 'layout-btn px-2 py-1 rounded text-[10px] flex items-center justify-center gap-1.5 bg-indigo-950 border border-indigo-500 text-indigo-300 font-semibold';

          scheduleRender();
        });
      });
    }

    // 9. Title Font Size Slider
    const sliderTitleSize = document.getElementById('slider-title-size');
    const valTitleSize = document.getElementById('val-title-size');

    if (sliderTitleSize) {
      sliderTitleSize.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 42;
        titleFontSize = val;
        if (valTitleSize) valTitleSize.textContent = `${val}px`;
        scheduleRender();
      });
    }

    // 10. Text Color Picker
    const inputTextColor = document.getElementById('input-text-color');
    const valTextColor = document.getElementById('val-text-color');

    if (inputTextColor) {
      inputTextColor.addEventListener('input', function () {
        textColor = this.value;
        if (valTextColor) valTextColor.textContent = textColor.toUpperCase();
        scheduleRender();
      });
    }

    // 11. Hide Text Toggle
    const toggleHideText = document.getElementById('toggle-hide-text');
    if (toggleHideText) {
      toggleHideText.addEventListener('change', function () {
        hideText = !!this.checked;
        scheduleRender();
      });
    }

    // 12. Standalone "Download 1024x500 PNG" Button
    const btnDownloadBanner = document.getElementById('btn-download-banner');
    const downloadBannerText = document.getElementById('download-banner-text');

    if (btnDownloadBanner) {
      btnDownloadBanner.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();

        try {
          const blob = await window.getFeatureGraphicBlob();
          const headlineVal = (headlineInput && headlineInput.value.trim()) || 'app';
          const cleanName = headlineVal.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const fileName = `${cleanName}_feature_graphic_1024x500.png`;

          if (window.saveAs) {
            window.saveAs(blob, fileName);
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
          }

          if (downloadBannerText) {
            downloadBannerText.textContent = 'Downloaded!';
            setTimeout(function () {
              downloadBannerText.textContent = 'Download 1024x500 PNG';
            }, 2000);
          }
        } catch (err) {
          console.error('Failed to download banner PNG:', err);
        }
      });
    }

    // Initial render
    scheduleRender();
    refreshLucideIcons();
  }

  // Initialize once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBannerEngine);
  } else {
    initBannerEngine();
  }
})();
