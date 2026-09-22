/**
 * modules/screenshotEngine.js
 * DevAsset Studio • Step 3 Play Store Screenshots Mockup Studio
 * 
 * Responsibilities:
 * - HTML5 Canvas Compositor for 1080x1920 px (Aspect 9:16 Portrait) App Store Screenshots
 * - Automatic background inheritance from Card 2 (Feature Graphic theme / custom gradient)
 * - Optional "Use Independent Background" override
 * - Multi-screen management with clickable tab switcher [ Screen 1 | Screen 2 | Screen 3 ... ]
 * - Per-screen headline, sub-headline, font size, text color, and text position (Top / Bottom)
 * - Sleek modern smartphone mockup frame with curved corners, bezel, camera punch hole & elevation shadow
 * - Real-time responsive live preview and standalone PNG download
 * - Exposes window.getAllScreenshotBlobs for JSZip packaging
 */

(function () {
  'use strict';

  let screenshotCanvas = null;
  let screenshotCtx = null;
  let renderRafId = null;

  // Multi-screen state (4 slots by default for Store Showcase)
  let activeScreenIndex = 0;
  let screens = [
    {
      id: 1,
      headline: 'Fast P2P Sharing',
      subheadline: 'Direct encrypted device-to-device transfers',
      image: null,
      fileName: null
    },
    {
      id: 2,
      headline: 'Seamless Performance',
      subheadline: 'Ultra-fast fluid native user experience',
      image: null,
      fileName: null
    },
    {
      id: 3,
      headline: 'Production Ready',
      subheadline: 'One-click compliant release asset bundles',
      image: null,
      fileName: null
    },
    {
      id: 4,
      headline: 'Store Listing ASO',
      subheadline: 'Optimized metadata & full store compliance',
      image: null,
      fileName: null
    }
  ];

  // Studio styling, orientation, and layout state
  let orientation = 'portrait'; // 'portrait' (1080x1920) | 'landscape' (1920x1080)
  let layoutMode = 'text-top'; // 'text-top' | 'text-bottom' | 'device-center' | 'side-split'
  let hideText = false; // boolean - omit headline/subheadline and center/enlarge device frame
  let frameStyle = 'modern'; // 'modern' | 'frameless'
  let deviceScale = 1.0; // 0.60 to 1.20
  let frameYOffset = 0; // -200 to +200 px
  let frameXOffset = 0; // -200 to +200 px

  let useIndependentBg = false;
  let independentGradStart = '#0F172A';
  let independentGradEnd = '#1E1B4B';
  let headlineFontSize = 64; // 36 to 96
  let textColor = '#FFFFFF';

  // Inherited background cache
  let inheritedBackground = {
    currentTheme: 'indigo',
    isCustomGradient: false,
    customGradStart: '#0F172A',
    customGradEnd: '#31104B',
    customBgImage: null,
    themePresets: null
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

  // Draw rounded rect path helper
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

  // Update canvas buffer and DOM elements to match current orientation
  function updateCanvasDimensions() {
    if (!screenshotCanvas) return;
    const isLandscape = orientation === 'landscape';
    const targetW = isLandscape ? 1920 : 1080;
    const targetH = isLandscape ? 1080 : 1920;

    if (screenshotCanvas.width !== targetW || screenshotCanvas.height !== targetH) {
      screenshotCanvas.width = targetW;
      screenshotCanvas.height = targetH;
    }

    if (isLandscape) {
      screenshotCanvas.classList.remove('orientation-portrait');
      screenshotCanvas.classList.add('orientation-landscape');
      screenshotCanvas.style.aspectRatio = '16 / 9';
      screenshotCanvas.style.maxHeight = 'calc(100vh - 260px)';
      screenshotCanvas.style.maxWidth = '100%';
      screenshotCanvas.style.width = 'auto';
      screenshotCanvas.style.height = 'auto';
      screenshotCanvas.style.objectFit = 'contain';
    } else {
      screenshotCanvas.classList.remove('orientation-landscape');
      screenshotCanvas.classList.add('orientation-portrait');
      screenshotCanvas.style.aspectRatio = '9 / 16';
      screenshotCanvas.style.maxHeight = 'calc(100vh - 260px)';
      screenshotCanvas.style.maxWidth = '100%';
      screenshotCanvas.style.width = 'auto';
      screenshotCanvas.style.height = 'auto';
      screenshotCanvas.style.objectFit = 'contain';
    }

    // Update Header and Footer badges
    const aspectBadge = document.getElementById('screen-aspect-badge');
    if (aspectBadge) {
      aspectBadge.textContent = isLandscape
        ? 'Aspect 16:9 Landscape (1920×1080)'
        : 'Aspect 9:16 Portrait (1080×1920)';
    }

    const footerSpecs = document.getElementById('screen-footer-specs-text');
    if (footerSpecs) {
      footerSpecs.textContent = isLandscape
        ? '1920×1080 px • 16:9 Landscape PNG'
        : '1080×1920 px • 9:16 Portrait PNG';
    }

    const downloadBtnText = document.getElementById('download-active-screen-text');
    if (downloadBtnText) {
      downloadBtnText.textContent = isLandscape
        ? 'Download Active Screen (1920×1080)'
        : 'Download Active Screen (1080×1920)';
    }
  }

  // Setup / Mount canvas in Card 5
  function setupScreenshotCanvas() {
    const previewContainer = document.getElementById('screenshot-mockup-preview');
    if (!previewContainer) return;

    screenshotCanvas = document.getElementById('screenshot-canvas');
    if (!screenshotCanvas) {
      screenshotCanvas = document.createElement('canvas');
      screenshotCanvas.id = 'screenshot-canvas';
      screenshotCanvas.width = orientation === 'landscape' ? 1920 : 1080;
      screenshotCanvas.height = orientation === 'landscape' ? 1080 : 1920;
      screenshotCanvas.className = 'phone-mockup-frame max-h-[calc(100vh-260px)] max-w-full w-auto h-auto rounded-[20px] shadow-2xl transition-all duration-300 object-contain m-auto';
      screenshotCanvas.title = 'Google Play Store Screenshot Mockup';

      previewContainer.innerHTML = '';
      previewContainer.className = 'w-full flex-1 flex items-center justify-center p-3 sm:p-4 rounded-xl overflow-y-auto overflow-x-hidden relative screenshot-preview-stage border border-[#1E2640] shadow-inner bg-canvas/80 h-full min-h-[380px] max-h-[calc(100vh-220px)]';
      previewContainer.style.height = '100%';
      previewContainer.style.maxHeight = 'calc(100vh - 220px)';
      previewContainer.appendChild(screenshotCanvas);
    }

    screenshotCtx = screenshotCanvas.getContext('2d');
    window.screenshotStudioCanvas = screenshotCanvas;
    updateCanvasDimensions();
  }

  let batchGridUpdateTimeout = null;

  function scheduleRender() {
    if (renderRafId) {
      cancelAnimationFrame(renderRafId);
    }
    renderRafId = requestAnimationFrame(function () {
      renderActiveScreenshot();
      renderRafId = null;
    });

    if (batchGridUpdateTimeout) {
      clearTimeout(batchGridUpdateTimeout);
    }
    batchGridUpdateTimeout = setTimeout(function () {
      updateAllBatchThumbnails();
    }, 40);
  }

  // Draw background (inherited or independent) onto any target context
  function drawBackground(ctx, width, height) {
    if (useIndependentBg) {
      // Independent gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, independentGradStart);
      grad.addColorStop(1, independentGradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial spotlight
      const spot = ctx.createRadialGradient(width / 2, height * 0.35, 30, width / 2, height * 0.35, width * 0.75);
      spot.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // Auto-inherited background from Card 2
    const bgState = window.getBannerBackgroundState
      ? window.getBannerBackgroundState()
      : inheritedBackground;

    if (bgState.customBgImage) {
      // Draw cover scaled custom image
      const img = bgState.customBgImage;
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
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
      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Dark overlay for legibility
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, width, height);
    } else if (bgState.isCustomGradient) {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, bgState.customGradStart || '#0F172A');
      grad.addColorStop(1, bgState.customGradEnd || '#31104B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      const spot = ctx.createRadialGradient(width / 2, height * 0.35, 30, width / 2, height * 0.35, width * 0.75);
      spot.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
      spot.addColorStop(1, 'transparent');
      ctx.fillStyle = spot;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Inherited theme preset
      const presets = bgState.themePresets || {
        indigo: { from: '#0F172A', mid: '#1E1B4B', to: '#31104B', spotlight: 'rgba(99, 102, 241, 0.22)' },
        emerald: { from: '#064E3B', mid: '#022C22', to: '#0F172A', spotlight: 'rgba(16, 185, 129, 0.22)' },
        amber: { from: '#78350F', mid: '#451A03', to: '#0F172A', spotlight: 'rgba(245, 158, 11, 0.22)' },
        midnight: { from: '#030712', mid: '#111827', to: '#1F2937', spotlight: 'rgba(156, 163, 175, 0.15)' },
      };
      const theme = presets[bgState.currentTheme] || presets.indigo;

      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, theme.from);
      bgGrad.addColorStop(0.45, theme.mid);
      bgGrad.addColorStop(1, theme.to);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Ambient radial glow
      const spotGrad = ctx.createRadialGradient(width / 2, height * 0.4, 20, width / 2, height * 0.4, width * 0.7);
      spotGrad.addColorStop(0, theme.spotlight);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle engineering grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 48;
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
  }

  // Draw Default Modern App UI mockup when user hasn't uploaded a screenshot yet
  // Helper to draw image scaled to cover a target rectangle
  function drawImageCover(ctx, img, displayX, displayY, displayW, displayH) {
    const imgRatio = img.width / img.height;
    const dispRatio = displayW / displayH;
    let drawW, drawH, drawX, drawY;

    if (imgRatio > dispRatio) {
      drawH = displayH;
      drawW = displayH * imgRatio;
      drawX = displayX + (displayW - drawW) / 2;
      drawY = displayY;
    } else {
      drawW = displayW;
      drawH = displayW / imgRatio;
      drawX = displayX;
      drawY = displayY + (displayH - drawH) / 2;
    }
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // Draw Default Modern App UI mockup when user hasn't uploaded a screenshot yet
  function drawSampleAppUI(ctx, x, y, width, height, screenIndex, isLandscape) {
    // Canvas background of app screen
    ctx.fillStyle = '#0B0F17';
    ctx.fillRect(x, y, width, height);

    if (isLandscape) {
      // ----------------------------------------------------
      // LANDSCAPE / TABLET APP UI
      // ----------------------------------------------------
      // Top Status & Header Bar
      const topBarH = 64;
      ctx.fillStyle = '#151C28';
      ctx.fillRect(x, y, width, topBarH);

      // Logo icon in top left
      if (window.masterIconImage) {
        ctx.save();
        drawRoundedRectPath(ctx, x + 24, y + 12, 40, 40, 10);
        ctx.clip();
        ctx.drawImage(window.masterIconImage, x + 24, y + 12, 40, 40);
        ctx.restore();
      } else {
        ctx.fillStyle = '#4F46E5';
        drawRoundedRectPath(ctx, x + 24, y + 12, 40, 40, 10);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('</>', x + 44, y + 37);
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 20px "Inter", sans-serif';
      ctx.textAlign = 'left';
      const appTitleVal = (document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'Mobile App';
      ctx.fillText(appTitleVal, x + 76, y + 38);

      // Status info on right
      ctx.textAlign = 'right';
      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('9:41  •  5G 100%', x + width - 28, y + 38);

      // Left Navigation Sidebar
      const sideW = 210;
      const sideY = y + topBarH;
      const sideH = height - topBarH;
      ctx.fillStyle = '#0F1522';
      ctx.fillRect(x, sideY, sideW, sideH);

      const navItems = ['Dashboard', 'Asset Pipeline', 'Play Store Mockup', 'Privacy Legal'];
      for (let n = 0; n < navItems.length; n++) {
        const itemY = sideY + 24 + n * 56;
        const isActive = n === (screenIndex % 4);
        if (isActive) {
          const activeGrad = ctx.createLinearGradient(x + 12, itemY, x + sideW - 12, itemY);
          activeGrad.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
          activeGrad.addColorStop(1, 'rgba(79, 70, 229, 0.15)');
          ctx.fillStyle = activeGrad;
          drawRoundedRectPath(ctx, x + 12, itemY, sideW - 24, 44, 10);
          ctx.fill();
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = '#818CF8';
          ctx.beginPath();
          ctx.arc(x + 28, itemY + 22, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '600 16px "Inter", sans-serif';
        } else {
          ctx.fillStyle = '#64748B';
          ctx.beginPath();
          ctx.arc(x + 28, itemY + 22, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#94A3B8';
          ctx.font = '500 15px "Inter", sans-serif';
        }
        ctx.textAlign = 'left';
        ctx.fillText(navItems[n], x + 44, itemY + 27);
      }

      // Main Content Area
      const contentX = x + sideW + 20;
      const contentY = sideY + 20;
      const contentW = width - sideW - 40;

      // Big Landscape Hero Card
      const heroH = Math.min(220, Math.round(sideH * 0.42));
      const heroGrad = ctx.createLinearGradient(contentX, contentY, contentX + contentW, contentY + heroH);
      if (screenIndex === 1) {
        heroGrad.addColorStop(0, '#065F46');
        heroGrad.addColorStop(1, '#059669');
      } else if (screenIndex === 2) {
        heroGrad.addColorStop(0, '#92400E');
        heroGrad.addColorStop(1, '#D97706');
      } else {
        heroGrad.addColorStop(0, '#4338CA');
        heroGrad.addColorStop(1, '#6366F1');
      }
      ctx.fillStyle = heroGrad;
      drawRoundedRectPath(ctx, contentX, contentY, contentW, heroH, 20);
      ctx.fill();

      // Hero text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px "Inter", sans-serif';
      ctx.textAlign = 'left';
      const titles = [
        'Fast P2P Asset Synchronization',
        'Strict Client-Side Sandboxed Privacy',
        'One-Click Google Play Asset Delivery'
      ];
      ctx.fillText(titles[screenIndex % titles.length], contentX + 32, contentY + 54);

      ctx.font = '400 18px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Optimized for modern Android 15 & Google Play specifications', contentX + 32, contentY + 92);

      // Hero Status Pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      drawRoundedRectPath(ctx, contentX + 32, contentY + 124, 230, 42, 21);
      ctx.fill();
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(contentX + 54, contentY + 145, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 16px "JetBrains Mono", monospace';
      ctx.fillText('Active Sync • 0ms', contentX + 70, contentY + 151);

      // 3 Bento Metric Cards below hero
      const cardsY = contentY + heroH + 18;
      const cardCount = 3;
      const cardGap = 16;
      const subCardW = (contentW - cardGap * (cardCount - 1)) / cardCount;
      const subCardH = height - (cardsY - y) - 20;

      const cardData = [
        { label: '512×512 Icon', desc: 'Auto-resampled 5 mipmaps', color: '#6366F1' },
        { label: 'Feature Graphic', desc: '1024×500 px 24-bit PNG', color: '#10B981' },
        { label: 'Privacy Policy', desc: 'GDPR / CCPA validated', color: '#F59E0B' }
      ];

      for (let c = 0; c < cardCount; c++) {
        const cx = contentX + c * (subCardW + cardGap);
        ctx.fillStyle = '#151C28';
        drawRoundedRectPath(ctx, cx, cardsY, subCardW, Math.max(80, subCardH), 16);
        ctx.fill();

        ctx.fillStyle = cardData[c].color;
        drawRoundedRectPath(ctx, cx + 20, cardsY + 20, 36, 36, 10);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 18px "Inter", sans-serif';
        ctx.fillText(cardData[c].label, cx + 66, cardsY + 38);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '400 14px "JetBrains Mono", monospace';
        ctx.fillText(cardData[c].desc, cx + 66, cardsY + 62);
      }
      return;
    }

    // ----------------------------------------------------
    // PORTRAIT / PHONE APP UI
    // ----------------------------------------------------
    // Status bar (Time, Battery, Wifi)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 24px "Inter", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('9:41', x + 44, y + 54);

    // Right status icons (Signal, Wifi, Battery)
    ctx.textAlign = 'right';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText('5G  100%', x + width - 44, y + 54);

    // App Navigation Bar
    const navY = y + 100;
    ctx.fillStyle = '#151C28';
    drawRoundedRectPath(ctx, x + 30, navY, width - 60, 72, 18);
    ctx.fill();

    // App Logo icon in Nav Bar
    if (window.masterIconImage) {
      ctx.save();
      drawRoundedRectPath(ctx, x + 46, navY + 12, 48, 48, 12);
      ctx.clip();
      ctx.drawImage(window.masterIconImage, x + 46, navY + 12, 48, 48);
      ctx.restore();
    } else {
      ctx.fillStyle = '#4F46E5';
      drawRoundedRectPath(ctx, x + 46, navY + 12, 48, 48, 12);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('</>', x + 70, navY + 42);
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 22px "Inter", sans-serif';
    ctx.textAlign = 'left';
    const appTitlePortVal = (document.getElementById('input-aso-title') && document.getElementById('input-aso-title').value.trim()) || 'Mobile App';
    ctx.fillText(appTitlePortVal, x + 110, navY + 44);

    // Screen specific mockup cards
    if (screenIndex === 0) {
      // Screen 1: Transfer / Dashboard Card
      const heroY = navY + 104;
      const heroGrad = ctx.createLinearGradient(x + 30, heroY, x + width - 30, heroY + 280);
      heroGrad.addColorStop(0, '#4338CA');
      heroGrad.addColorStop(1, '#6366F1');
      ctx.fillStyle = heroGrad;
      drawRoundedRectPath(ctx, x + 30, heroY, width - 60, 280, 24);
      ctx.fill();

      // Hero content
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.fillText('Fast P2P Asset Sync', x + 64, heroY + 74);
      ctx.font = '400 22px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Zero cloud latency • Secure local relay', x + 64, heroY + 118);

      // Status Pill
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      drawRoundedRectPath(ctx, x + 64, heroY + 160, 220, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(x + 94, heroY + 185, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('Active Sync', x + 116, heroY + 192);

      // Secondary metric cards
      const cardY = heroY + 314;
      for (let i = 0; i < 4; i++) {
        const itemY = cardY + i * 110;
        ctx.fillStyle = '#151C28';
        drawRoundedRectPath(ctx, x + 30, itemY, width - 60, 92, 20);
        ctx.fill();

        ctx.fillStyle = i === 0 ? '#10B981' : i === 1 ? '#6366F1' : '#F59E0B';
        drawRoundedRectPath(ctx, x + 50, itemY + 22, 48, 48, 14);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 22px "Inter", sans-serif';
        const labels = ['Density Buckets Built', 'ASO Metadata Passed', 'Feature Graphic Synced', 'Privacy Policy Validated'];
        ctx.fillText(labels[i], x + 118, itemY + 44);

        ctx.fillStyle = '#94A3B8';
        ctx.font = '400 18px "JetBrains Mono", monospace';
        const subs = ['res/mipmap-* (5/5)', 'Play Store 2024+', '1024×500 px • 24-bit', 'GDPR / CCPA OK'];
        ctx.fillText(subs[i], x + 118, itemY + 70);
      }
    } else if (screenIndex === 1) {
      // Screen 2: Privacy / Performance Mockup
      const heroY = navY + 104;
      ctx.fillStyle = '#064E3B';
      drawRoundedRectPath(ctx, x + 30, heroY, width - 60, 260, 24);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.fillText('100% Client-Side Privacy', x + 64, heroY + 74);
      ctx.font = '400 22px "Inter", sans-serif';
      ctx.fillStyle = '#A7F3D0';
      ctx.fillText('No cloud telemetry or server storage', x + 64, heroY + 118);

      // Visual Shield Badge
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      drawRoundedRectPath(ctx, x + 64, heroY + 160, 280, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#34D399';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('🛡️ End-to-End Encryption', x + 84, heroY + 192);

      // Privacy checklists
      const listY = heroY + 294;
      const items = ['Zero Third-Party Trackers', 'Strict Sandbox Execution', 'Bicubic Client-Side Resampling', 'Direct Local FileSaver Export'];
      for (let i = 0; i < 4; i++) {
        const itemY = listY + i * 116;
        ctx.fillStyle = '#151C28';
        drawRoundedRectPath(ctx, x + 30, itemY, width - 60, 96, 20);
        ctx.fill();

        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(x + 74, itemY + 48, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', x + 74, itemY + 55);

        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 22px "Inter", sans-serif';
        ctx.fillText(items[i], x + 114, itemY + 54);
      }
    } else {
      // Screen 3: Ready for Store Console
      const heroY = navY + 104;
      const grad = ctx.createLinearGradient(x + 30, heroY, x + width - 30, heroY + 260);
      grad.addColorStop(0, '#78350F');
      grad.addColorStop(1, '#B45309');
      ctx.fillStyle = grad;
      drawRoundedRectPath(ctx, x + 30, heroY, width - 60, 260, 24);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.fillText('Production ZIP Bundle', x + 64, heroY + 74);
      ctx.font = '400 22px "Inter", sans-serif';
      ctx.fillStyle = '#FDE68A';
      ctx.fillText('Standard Android directory hierarchy', x + 64, heroY + 118);

      // Badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      drawRoundedRectPath(ctx, x + 64, heroY + 160, 300, 50, 25);
      ctx.fill();
      ctx.fillStyle = '#FBBF24';
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText('📦 app-release-assets.zip', x + 84, heroY + 192);

      // Package item rows
      const listY = heroY + 294;
      const files = ['res/mipmap-xxxhdpi/ (192px)', 'playstore/ic_launcher-512.png', 'playstore/feature_graphic.png', 'legal/PRIVACY_POLICY.md'];
      for (let i = 0; i < 4; i++) {
        const itemY = listY + i * 116;
        ctx.fillStyle = '#151C28';
        drawRoundedRectPath(ctx, x + 30, itemY, width - 60, 96, 20);
        ctx.fill();

        ctx.fillStyle = '#6366F1';
        drawRoundedRectPath(ctx, x + 50, itemY + 24, 48, 48, 12);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = '600 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(files[i], x + 114, itemY + 54);
      }
    }

    // Bottom Navigation Bar
    const btmNavY = y + height - 100;
    ctx.fillStyle = '#151C28';
    drawRoundedRectPath(ctx, x + 30, btmNavY, width - 60, 76, 22);
    ctx.fill();

    // 4 tab dots / icons in nav bar
    const tabCount = 4;
    const tabStep = (width - 120) / tabCount;
    for (let t = 0; t < tabCount; t++) {
      const tabX = x + 60 + t * tabStep + tabStep / 2;
      ctx.fillStyle = t === screenIndex % 4 ? '#6366F1' : '#475569';
      ctx.beginPath();
      ctx.arc(tabX, btmNavY + 38, t === screenIndex % 4 ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw modern smartphone frame with sleek bezel, camera punch-hole, and display screen
  // or frameless floating shadow display
  function drawSmartphoneMockup(ctx, phoneX, phoneY, phoneW, phoneH, screenObj, screenIndex, isLandscape) {
    if (frameStyle === 'frameless') {
      // -----------------------------------------------------------------
      // FRAMELESS / RAW SCREENSHOT SHOWCASE (Floating Soft Elevation Shadow)
      // -----------------------------------------------------------------
      const displayRadius = isLandscape ? 30 : 38;
      const displayX = phoneX;
      const displayY = phoneY;
      const displayW = phoneW;
      const displayH = phoneH;

      // Soft deep floating elevation shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 58;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 34;
      drawRoundedRectPath(ctx, displayX, displayY, displayW, displayH, displayRadius);
      ctx.fillStyle = '#0B0F17';
      ctx.fill();
      ctx.restore();

      // Screen Display Area (Clipped)
      ctx.save();
      drawRoundedRectPath(ctx, displayX, displayY, displayW, displayH, displayRadius);
      ctx.clip();

      if (screenObj.image) {
        drawImageCover(ctx, screenObj.image, displayX, displayY, displayW, displayH);
      } else {
        drawSampleAppUI(ctx, displayX, displayY, displayW, displayH, screenIndex, isLandscape);
      }

      // Subtle edge stroke
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2;
      drawRoundedRectPath(ctx, displayX, displayY, displayW, displayH, displayRadius);
      ctx.stroke();

      ctx.restore();
      return;
    }

    // -----------------------------------------------------------------
    // MODERN SMARTPHONE FRAME
    // -----------------------------------------------------------------
    const bezelRadius = isLandscape ? 50 : 64;
    const screenPadding = isLandscape ? 16 : 18;
    const displayRadius = isLandscape ? 36 : 48;

    const displayX = phoneX + screenPadding;
    const displayY = phoneY + screenPadding;
    const displayW = phoneW - screenPadding * 2;
    const displayH = phoneH - screenPadding * 2;

    // 1. Soft Elevation Shadow below phone
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 64;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 38;

    // Outer Bezel
    drawRoundedRectPath(ctx, phoneX, phoneY, phoneW, phoneH, bezelRadius);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.restore();

    // 2. Bezel Metallic Edge Stroke
    ctx.save();
    drawRoundedRectPath(ctx, phoneX, phoneY, phoneW, phoneH, bezelRadius);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Subtle side button indicators on phone frame (Volume + Power)
    ctx.fillStyle = '#475569';
    if (isLandscape) {
      // In landscape, buttons are along top chassis edge
      drawRoundedRectPath(ctx, phoneX + 180, phoneY - 4, 80, 6, 3);
      ctx.fill();
      drawRoundedRectPath(ctx, phoneX + 280, phoneY - 4, 80, 6, 3);
      ctx.fill();
      drawRoundedRectPath(ctx, phoneX + phoneW - 230, phoneY - 4, 100, 6, 3);
      ctx.fill();
    } else {
      // In portrait, buttons are along left and right chassis edges
      drawRoundedRectPath(ctx, phoneX - 4, phoneY + 220, 6, 80, 3);
      ctx.fill();
      drawRoundedRectPath(ctx, phoneX - 4, phoneY + 320, 6, 80, 3);
      ctx.fill();
      drawRoundedRectPath(ctx, phoneX + phoneW - 2, phoneY + 260, 6, 110, 3);
      ctx.fill();
    }
    ctx.restore();

    // 3. Screen Display Area (Clipped)
    ctx.save();
    drawRoundedRectPath(ctx, displayX, displayY, displayW, displayH, displayRadius);
    ctx.clip();

    if (screenObj.image) {
      drawImageCover(ctx, screenObj.image, displayX, displayY, displayW, displayH);
    } else {
      drawSampleAppUI(ctx, displayX, displayY, displayW, displayH, screenIndex, isLandscape);
    }

    // Camera Punch-Hole
    ctx.fillStyle = '#05070A';
    if (isLandscape) {
      // Left bezel punch-hole in landscape
      const holeSize = 20;
      const holeX = displayX + 32;
      const holeY = displayY + displayH / 2;
      ctx.beginPath();
      ctx.arc(holeX, holeY, holeSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Camera reflection
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(holeX + 1, holeY - 1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Centered top hole-punch in portrait
      const holeSize = 22;
      const holeX = displayX + displayW / 2;
      const holeY = displayY + 34;
      ctx.beginPath();
      ctx.arc(holeX, holeY, holeSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Camera lens reflection
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(holeX + 2, holeY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Home indicator bar at bottom of screen
    const homeBarW = isLandscape ? 240 : 200;
    const homeBarH = 6;
    const homeBarX = displayX + (displayW - homeBarW) / 2;
    const homeBarY = displayY + displayH - (isLandscape ? 14 : 18);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    drawRoundedRectPath(ctx, homeBarX, homeBarY, homeBarW, homeBarH, 3);
    ctx.fill();

    // Subtle inner display glass shadow/vignette
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 3;
    drawRoundedRectPath(ctx, displayX, displayY, displayW, displayH, displayRadius);
    ctx.stroke();

    ctx.restore();
  }

  // Render a specific screen object onto any target canvas context
  function renderScreenToContext(ctx, screenObj, screenIndex) {
    const isLandscape = orientation === 'landscape';
    const width = isLandscape ? 1920 : 1080;
    const height = isLandscape ? 1080 : 1920;

    // 1. Draw Base Background (Inherited from Card 2 or Independent)
    drawBackground(ctx, width, height);

    // Read screen text values
    const headline = screenObj.headline || 'App Feature Showcase';
    const subheadline = screenObj.subheadline || 'Modern high-performance Android experience';

    // Layout dimension calculations
    let phoneW, phoneH, phoneX, phoneY;
    let textCenterX, textCenterY, textAlignment = 'center';
    let maxTextWidth = isLandscape ? 1600 : 960;

    if (isLandscape) {
      // -----------------------------------------------------------------
      // LANDSCAPE CANVAS (1920 × 1080)
      // -----------------------------------------------------------------
      if (hideText) {
        // Hide Text / Screen Only: Center phone cleanly & scale up
        const baseW = 1450;
        const baseH = 820;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round((height - phoneH) / 2 + frameYOffset);
      } else if (layoutMode === 'side-split') {
        // Horizontal Side Split: Left text, right phone
        const baseW = 1040;
        const baseH = 600;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round(860 + (1020 - phoneW) / 2 + frameXOffset);
        phoneY = Math.round((height - phoneH) / 2 + frameYOffset);

        textCenterX = 90;
        textCenterY = Math.round(height / 2);
        textAlignment = 'left';
        maxTextWidth = 720;
      } else if (layoutMode === 'text-bottom') {
        // Phone Top, Text Bottom
        const baseW = 1260;
        const baseH = 680;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round(50 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.round(phoneY + phoneH + (height - (phoneY + phoneH)) / 2);
      } else if (layoutMode === 'device-center') {
        // Device Centered
        const baseW = 1220;
        const baseH = 670;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round((height - phoneH) / 2 + 50 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.max(90, Math.round(phoneY / 2));
      } else {
        // Default Landscape: 'text-top'
        const baseW = 1260;
        const baseH = 700;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round(height - phoneH + 50 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.max(100, Math.round(phoneY / 2));
      }
    } else {
      // -----------------------------------------------------------------
      // PORTRAIT CANVAS (1080 × 1920)
      // -----------------------------------------------------------------
      if (hideText) {
        // Hide Text / Screen Only: Center phone cleanly & scale up
        const baseW = 860;
        const baseH = 1580;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round((height - phoneH) / 2 + frameYOffset);
      } else if (layoutMode === 'text-bottom') {
        // Phone Top, Text Bottom
        const baseW = 780;
        const baseH = 1400;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round(80 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.round(phoneY + phoneH + (height - (phoneY + phoneH)) / 2);
      } else if (layoutMode === 'device-center') {
        // Device Centered
        const baseW = 780;
        const baseH = 1380;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round((height - phoneH) / 2 + 90 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.max(130, Math.round(phoneY / 2));
      } else {
        // Default Portrait: 'text-top' (or side-split fallback in portrait)
        const baseW = 780;
        const baseH = 1420;
        phoneW = Math.round(baseW * deviceScale);
        phoneH = Math.round(baseH * deviceScale);
        phoneX = Math.round((width - phoneW) / 2 + frameXOffset);
        phoneY = Math.round(height - phoneH + 70 + frameYOffset);

        textCenterX = Math.round(width / 2);
        textCenterY = Math.max(140, Math.round(phoneY / 2));
      }
    }

    // 2. Render Text Content (Headline & Subheadline) unless hideText is active
    if (!hideText) {
      ctx.save();
      ctx.textAlign = textAlignment;
      ctx.textBaseline = 'middle';

      const effTitleSize = isLandscape ? Math.min(headlineFontSize, 68) : headlineFontSize;
      const effSubSize = Math.max(20, Math.round(effTitleSize * 0.45));
      const textGap = isLandscape ? 16 : 20;

      const headlineY = textCenterY - (effSubSize + textGap) / 2;
      const subheadlineY = headlineY + effTitleSize / 2 + textGap + effSubSize / 2;

      // Headline with soft shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${effTitleSize}px "Inter", system-ui, -apple-system, sans-serif`;
      ctx.fillText(headline, textCenterX, headlineY, maxTextWidth);

      // Subheadline
      ctx.shadowBlur = 10;
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.85;
      ctx.font = `500 ${effSubSize}px "JetBrains Mono", monospace`;
      ctx.fillText(subheadline, textCenterX, subheadlineY, maxTextWidth);
      ctx.restore();
    }

    // 3. Render Smartphone Mockup with Device Bezel & Display
    drawSmartphoneMockup(ctx, phoneX, phoneY, phoneW, phoneH, screenObj, screenIndex, isLandscape);
  }

  // Render the currently active screen onto the main interactive preview canvas
  function renderActiveScreenshot() {
    if (!screenshotCanvas || !screenshotCtx) {
      setupScreenshotCanvas();
      if (!screenshotCanvas || !screenshotCtx) return;
    }

    updateCanvasDimensions();
    const currentScreen = screens[activeScreenIndex] || screens[0];
    renderScreenToContext(screenshotCtx, currentScreen, activeScreenIndex);
  }

  // Expose function to obtain active screenshot as Blob (for standalone download)
  window.getActiveScreenshotBlob = function () {
    return new Promise(function (resolve, reject) {
      if (!screenshotCanvas) {
        setupScreenshotCanvas();
        renderActiveScreenshot();
      }
      if (!screenshotCanvas) {
        reject(new Error('Screenshot canvas not initialized'));
        return;
      }
      screenshotCanvas.toBlob(function (blob) {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from Screenshot canvas'));
        }
      }, 'image/png');
    });
  };

  // Expose function to render and return ALL screenshot blobs for JSZip packaging
  window.getAllScreenshotBlobs = async function () {
    const isLandscape = orientation === 'landscape';
    const width = isLandscape ? 1920 : 1080;
    const height = isLandscape ? 1080 : 1920;

    const results = [];
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');

    for (let i = 0; i < screens.length; i++) {
      offCtx.clearRect(0, 0, width, height);
      renderScreenToContext(offCtx, screens[i], i);

      const blob = await new Promise(function (resolve) {
        offscreen.toBlob(function (b) {
          resolve(b);
        }, 'image/png');
      });

      if (blob) {
        const orientSuffix = isLandscape ? '_landscape' : '';
        results.push({
          filename: `screenshot_${i + 1}${orientSuffix}.png`,
          blob: blob,
          index: i + 1,
          headline: screens[i].headline
        });
      }
    }

    return results;
  };

  // Re-build tab list UI based on current screens
  function updateTabsUI() {
    const tabList = document.getElementById('screenshot-tabs-list');
    if (!tabList) return;

    tabList.innerHTML = '';
    screens.forEach(function (screen, idx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `screenshot-tab-btn px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
        idx === activeScreenIndex
          ? 'active bg-indigo-950/80 border-indigo-500 text-white shadow-xs'
          : 'bg-surface border-borderline text-slate-400 hover:text-white hover:border-slate-600'
      }`;
      btn.setAttribute('data-screen-index', idx);

      const dotClass = screen.image ? 'bg-emerald-400' : 'bg-indigo-400';
      btn.innerHTML = `
        <span class="w-2 h-2 rounded-full ${dotClass} inline-block"></span>
        <span>Screen ${idx + 1}</span>
      `;

      btn.addEventListener('click', function () {
        activeScreenIndex = idx;
        syncInputsWithActiveScreen();
        updateTabsUI();
        scheduleRender();
      });

      tabList.appendChild(btn);
    });

    // Update screen badge indicator
    const badge = document.getElementById('screenshot-screen-badge');
    if (badge) {
      badge.textContent = `Screen ${activeScreenIndex + 1} of ${screens.length}`;
    }

    // Toggle delete button visibility (only if > 1 screen)
    const btnDelete = document.getElementById('btn-delete-screen');
    if (btnDelete) {
      if (screens.length > 1) {
        btnDelete.classList.remove('hidden');
      } else {
        btnDelete.classList.add('hidden');
      }
    }

    updateBatchQueueBadges();
    renderSlotsUI();
  }

  // Render the 4-slot interactive strip
  function renderSlotsUI() {
    const container = document.getElementById('screenshot-slots-container');
    if (!container) return;

    container.innerHTML = '';
    const slotCount = Math.max(screens.length, 4);

    for (let i = 0; i < slotCount; i++) {
      const screen = screens[i];
      const isActive = i === activeScreenIndex;
      const hasImage = !!(screen && screen.image);

      const slotCard = document.createElement('div');
      slotCard.className = `screenshot-slot-card rounded-xl border transition-all p-3 flex flex-col gap-2.5 cursor-pointer relative ${
        isActive
          ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
          : 'bg-surface border-borderline hover:border-slate-600 hover:bg-surface-hover'
      }`;
      slotCard.setAttribute('data-slot-index', i);

      // Slot top header
      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-center justify-between gap-1';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'flex items-center gap-1.5';
      titleWrap.innerHTML = `
        <span class="w-2 h-2 rounded-full ${hasImage ? 'bg-emerald-400' : 'bg-indigo-400'}"></span>
        <span class="text-xs font-mono font-semibold text-white">Slot ${i + 1}</span>
      `;
      headerRow.appendChild(titleWrap);

      const statusWrap = document.createElement('div');
      statusWrap.className = 'flex items-center gap-1';

      if (isActive) {
        const activePill = document.createElement('span');
        activePill.className = 'text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold';
        activePill.textContent = 'Active';
        statusWrap.appendChild(activePill);
      }

      if (hasImage) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.title = 'Remove custom screenshot';
        removeBtn.className = 'p-1 text-slate-400 hover:text-rose-400 rounded transition-colors';
        removeBtn.innerHTML = '<i data-lucide="x" class="w-3.5 h-3.5"></i>';
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          if (screens[i]) {
            screens[i].image = null;
            screens[i].fileName = null;
            syncInputsWithActiveScreen();
            updateTabsUI();
            scheduleRender();
          }
        });
        statusWrap.appendChild(removeBtn);
      }

      headerRow.appendChild(statusWrap);
      slotCard.appendChild(headerRow);

      // Slot body / preview area
      const previewArea = document.createElement('div');
      previewArea.className = 'h-32 rounded-lg bg-canvas/80 border border-borderline flex flex-col items-center justify-center p-2 text-center overflow-hidden relative group/drop';

      if (hasImage && screen.image.src) {
        const imgEl = document.createElement('img');
        imgEl.src = screen.image.src;
        imgEl.className = 'h-full w-auto max-w-full object-contain rounded drop-shadow-md';
        previewArea.appendChild(imgEl);

        const overlayText = document.createElement('div');
        overlayText.className = 'absolute inset-x-0 bottom-0 py-1 px-1.5 bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-slate-300 truncate text-center';
        overlayText.textContent = screen.fileName || `screen_${i + 1}.png`;
        previewArea.appendChild(overlayText);
      } else {
        // Dropzone placeholder
        previewArea.innerHTML = `
          <i data-lucide="smartphone" class="w-6 h-6 text-slate-500 mb-1"></i>
          <span class="text-[11px] font-mono text-slate-300 font-medium">Slot ${i + 1}</span>
          <span class="text-[10px] text-indigo-400 font-mono mt-0.5">+ Drop 9:16 PNG</span>
        `;
      }

      // Hidden file input for this specific slot
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/png,image/jpeg,image/webp';
      fileInput.className = 'hidden';
      fileInput.id = `slot-file-input-${i}`;
      fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
          if (!screens[i]) {
            screens[i] = {
              id: i + 1,
              headline: `Feature ${i + 1}`,
              subheadline: 'Crafted for mobile performance',
              image: null,
              fileName: null
            };
          }
          loadScreenshotFile(e.target.files[0], i);
          activeScreenIndex = i;
        }
      });
      slotCard.appendChild(fileInput);

      // Drag & Drop handlers for the slot
      previewArea.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        previewArea.classList.add('border-indigo-500', 'bg-indigo-950/30');
      });
      previewArea.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        previewArea.classList.remove('border-indigo-500', 'bg-indigo-950/30');
      });
      previewArea.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        previewArea.classList.remove('border-indigo-500', 'bg-indigo-950/30');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          if (!screens[i]) {
            screens[i] = {
              id: i + 1,
              headline: `Feature ${i + 1}`,
              subheadline: 'Crafted for mobile performance',
              image: null,
              fileName: null
            };
          }
          loadScreenshotFile(e.dataTransfer.files[0], i);
          activeScreenIndex = i;
        }
      });

      // Clicking slot card activates it; if no image, open file picker
      slotCard.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;

        if (i < screens.length) {
          activeScreenIndex = i;
          syncInputsWithActiveScreen();
          updateTabsUI();
          scheduleRender();
        }

        if (!hasImage) {
          fileInput.click();
        }
      });

      slotCard.appendChild(previewArea);
      container.appendChild(slotCard);
    }

    refreshLucideIcons();
  }

  // Populate per-screen input fields from active screen object
  function syncInputsWithActiveScreen() {
    const currentScreen = screens[activeScreenIndex] || screens[0];

    const inputHeadline = document.getElementById('input-screen-headline');
    const inputSubheadline = document.getElementById('input-screen-subheadline');
    const labelUploadName = document.getElementById('label-screen-upload-name');
    const btnRemoveCustomImage = document.getElementById('btn-remove-screen-img');

    if (inputHeadline) inputHeadline.value = currentScreen.headline || '';
    if (inputSubheadline) inputSubheadline.value = currentScreen.subheadline || '';

    if (labelUploadName) {
      labelUploadName.textContent = currentScreen.fileName
        ? currentScreen.fileName
        : 'Upload App Screenshot (Aspect 9:16)';
    }

    if (btnRemoveCustomImage) {
      if (currentScreen.image) {
        btnRemoveCustomImage.classList.remove('hidden');
      } else {
        btnRemoveCustomImage.classList.add('hidden');
      }
    }
  }

  // Toast notification helper for Studio feedback
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
    } else if (type === 'warning') {
      toast.className = 'fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl border border-amber-500/50 bg-amber-950/90 text-amber-200 font-mono text-xs backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2';
      toast.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0"></i><span>${message}</span>`;
    } else {
      toast.className = 'fixed top-20 right-6 z-50 max-w-sm px-4 py-3 rounded-xl shadow-2xl border border-indigo-500/50 bg-slate-950/90 text-indigo-200 font-mono text-xs backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 flex items-center gap-2';
      toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-indigo-400 shrink-0"></i><span>${message}</span>`;
    }

    refreshLucideIcons();

    setTimeout(function () {
      toast.classList.remove('opacity-100', 'translate-y-0');
      toast.classList.add('opacity-0', 'translate-y-[-10px]');
    }, 3200);
  }

  // Update header and queue counters
  function updateBatchQueueBadges() {
    const queueCount = document.getElementById('batch-queue-count');
    if (queueCount) queueCount.textContent = screens.length;

    const gridCount = document.getElementById('batch-grid-count-badge');
    if (gridCount) gridCount.textContent = `${screens.length} Card${screens.length === 1 ? '' : 's'}`;
  }

  // Render downsampled live thumbnail onto a card's canvas
  function renderScreenThumbnail(thumbCanvas, screenObj, screenIndex) {
    if (!thumbCanvas || !screenObj) return;

    const isLandscape = orientation === 'landscape';
    const targetW = isLandscape ? 1920 : 1080;
    const targetH = isLandscape ? 1080 : 1920;

    const displayW = isLandscape ? 400 : 225;
    const displayH = isLandscape ? 225 : 400;

    if (thumbCanvas.width !== displayW || thumbCanvas.height !== displayH) {
      thumbCanvas.width = displayW;
      thumbCanvas.height = displayH;
    }

    const tCtx = thumbCanvas.getContext('2d');
    if (!tCtx) return;

    tCtx.save();
    tCtx.clearRect(0, 0, displayW, displayH);
    tCtx.scale(displayW / targetW, displayH / targetH);
    renderScreenToContext(tCtx, screenObj, screenIndex);
    tCtx.restore();
  }

  // Render individual high-res PNG for a single card in the grid
  async function downloadSingleMockupPng(index) {
    const screen = screens[index];
    if (!screen) return;

    const isLandscape = orientation === 'landscape';
    const width = isLandscape ? 1920 : 1080;
    const height = isLandscape ? 1080 : 1920;

    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext('2d');

    renderScreenToContext(offCtx, screen, index);

    offscreen.toBlob(function (blob) {
      if (!blob) {
        showNotification('Failed to generate PNG blob', 'warning');
        return;
      }
      const dimLabel = isLandscape ? '1920x1080' : '1080x1920';
      const fileName = `screenshot_${index + 1}_${dimLabel}.png`;
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
      showNotification(`Downloaded Mockup #${index + 1} (${dimLabel})!`, 'success');
    }, 'image/png');
  }

  // Update all existing thumbnails in the live grid without destroying DOM
  function updateAllBatchThumbnails() {
    const gridContainer = document.getElementById('mockup-batch-grid');
    if (!gridContainer) return;

    const cards = gridContainer.querySelectorAll('.batch-mockup-card');
    if (cards.length !== screens.length) {
      renderBatchGrid();
      return;
    }

    screens.forEach(function (screen, idx) {
      const thumbCanvas = document.getElementById(`thumb-canvas-${idx}`);
      if (thumbCanvas) {
        renderScreenThumbnail(thumbCanvas, screen, idx);
      }
      const cardEl = cards[idx];
      if (cardEl) {
        if (idx === activeScreenIndex) {
          cardEl.classList.add('active-card', 'bg-indigo-950/70', 'border-indigo-500', 'shadow-lg', 'ring-2', 'ring-indigo-500/50');
          cardEl.classList.remove('bg-slate-900/70', 'border-[#1E2640]');
        } else {
          cardEl.classList.remove('active-card', 'bg-indigo-950/70', 'border-indigo-500', 'shadow-lg', 'ring-2', 'ring-indigo-500/50');
          cardEl.classList.add('bg-slate-900/70', 'border-[#1E2640]');
        }
      }
    });
  }

  // Render the Thumbnail Strip in the Screenshots Queue
  function renderBatchGrid() {
    const gridContainer = document.getElementById('mockup-batch-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    updateBatchQueueBadges();

    screens.forEach(function (screen, idx) {
      const isActive = idx === activeScreenIndex;
      const card = document.createElement('div');
      card.className = `batch-mockup-card shrink-0 w-28 sm:w-32 rounded-xl border p-2 flex flex-col items-center justify-between gap-1.5 cursor-pointer select-none transition-all group ${
        isActive
          ? 'active-card bg-indigo-950/70 border-indigo-500 shadow-lg ring-2 ring-indigo-500/50'
          : 'bg-slate-900/70 border-[#1E2640] hover:border-slate-500 hover:bg-slate-900'
      }`;
      card.setAttribute('data-screen-index', idx);
      card.title = `Click to load Slide #${idx + 1} into live preview`;

      // 1. Mini Header with Slide Index, Filename/Headline, and Delete
      const headerRow = document.createElement('div');
      headerRow.className = 'w-full flex items-center justify-between gap-1';

      const titleWrap = document.createElement('div');
      titleWrap.className = 'flex items-center gap-1 overflow-hidden min-w-0';
      titleWrap.innerHTML = `
        <span class="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
          isActive ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
        } shrink-0">
          #${idx + 1}
        </span>
        <span class="text-[10px] font-mono font-medium text-slate-300 truncate" title="${screen.headline || screen.fileName || `Slide ${idx + 1}`}">
          ${screen.headline ? screen.headline : `Slide ${idx + 1}`}
        </span>
      `;
      headerRow.appendChild(titleWrap);

      const actionsWrap = document.createElement('div');
      actionsWrap.className = 'flex items-center shrink-0';

      if (screens.length > 1) {
        const btnDel = document.createElement('button');
        btnDel.type = 'button';
        btnDel.className = 'p-0.5 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer';
        btnDel.title = 'Remove this slide';
        btnDel.innerHTML = '<i data-lucide="trash-2" class="w-3 h-3"></i>';
        btnDel.addEventListener('click', function (e) {
          e.stopPropagation();
          screens.splice(idx, 1);
          if (activeScreenIndex >= screens.length) {
            activeScreenIndex = screens.length - 1;
          }
          updateTabsUI();
          syncInputsWithActiveScreen();
          renderBatchGrid();
          scheduleRender();
        });
        actionsWrap.appendChild(btnDel);
      }

      headerRow.appendChild(actionsWrap);
      card.appendChild(headerRow);

      // 2. Thumbnail Preview Canvas Box
      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'w-full h-16 sm:h-20 rounded-lg bg-canvas/90 border border-black/40 flex items-center justify-center p-1 overflow-hidden relative';

      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.className = 'mockup-thumb-canvas max-h-full max-w-full object-contain rounded';
      thumbCanvas.id = `thumb-canvas-${idx}`;
      thumbWrap.appendChild(thumbCanvas);

      // Render initial thumbnail
      renderScreenThumbnail(thumbCanvas, screen, idx);

      card.appendChild(thumbWrap);

      // 3. Status Footer / Active indicator
      const footerRow = document.createElement('div');
      footerRow.className = 'w-full flex items-center justify-center pt-0.5';
      footerRow.innerHTML = `
        <span class="text-[9px] font-mono ${
          isActive ? 'text-indigo-300 font-bold' : 'text-slate-500 group-hover:text-slate-300'
        } truncate">
          ${isActive ? '● Active' : 'Select'}
        </span>
      `;
      card.appendChild(footerRow);

      // Click card to switch active slide in centerpiece
      card.addEventListener('click', function () {
        if (activeScreenIndex !== idx) {
          activeScreenIndex = idx;
          syncInputsWithActiveScreen();
          updateTabsUI();
          renderBatchGrid();
          scheduleRender();
        }
      });

      gridContainer.appendChild(card);
    });

    // Append a compact "+ Add Slide" card to the end of thumbnail queue
    const addCard = document.createElement('button');
    addCard.type = 'button';
    addCard.className = 'shrink-0 w-24 sm:w-28 h-auto self-stretch rounded-xl border border-dashed border-[#1E2640] hover:border-indigo-500/60 bg-slate-900/40 hover:bg-slate-900/80 p-2 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-indigo-300 transition-all cursor-pointer';
    addCard.title = 'Add new slide slot';
    addCard.innerHTML = `
      <i data-lucide="plus-circle" class="w-5 h-5 text-indigo-400"></i>
      <span class="text-[10px] font-mono font-medium">Add Slide</span>
    `;
    addCard.addEventListener('click', function () {
      const newIdx = screens.length + 1;
      screens.push({
        id: newIdx,
        headline: `Feature ${newIdx}: App Showcase`,
        subheadline: 'Crafted for modern mobile performance',
        image: null,
        fileName: null
      });
      activeScreenIndex = screens.length - 1;
      updateTabsUI();
      syncInputsWithActiveScreen();
      renderBatchGrid();
      scheduleRender();
    });
    gridContainer.appendChild(addCard);

    refreshLucideIcons();
  }

  // Batch Multi-File Loader: Reads multiple files asynchronously into queue
  async function loadBatchScreenshotFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter(function (f) {
      return f.type.startsWith('image/');
    });
    if (files.length === 0) {
      showNotification('No valid image files detected in selection.', 'warning');
      return;
    }

    showNotification(`Processing ${files.length} screenshot(s) into queue...`, 'info');

    const loadedItems = await Promise.all(
      files.map(function (file) {
        return new Promise(function (resolve) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
              resolve({ img: img, fileName: file.name });
            };
            img.onerror = function () {
              resolve(null);
            };
            img.src = e.target.result;
          };
          reader.onerror = function () {
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      })
    );

    const validItems = loadedItems.filter(Boolean);
    if (validItems.length === 0) {
      showNotification('Failed to read image files.', 'warning');
      return;
    }

    // Populate screens queue:
    // If existing screens have no custom images, replace from index 0
    // Otherwise add or expand screens
    validItems.forEach(function (item, idx) {
      if (idx < screens.length) {
        screens[idx].image = item.img;
        screens[idx].fileName = item.fileName;
      } else {
        screens.push({
          id: screens.length + 1,
          headline: `Feature ${screens.length + 1}`,
          subheadline: 'Crafted for mobile performance',
          image: item.img,
          fileName: item.fileName
        });
      }
    });

    activeScreenIndex = 0;
    updateBatchQueueBadges();
    updateTabsUI();
    syncInputsWithActiveScreen();
    renderBatchGrid();
    scheduleRender();

    showNotification(`Batch processed ${validItems.length} screenshot(s)! Live grid ready.`, 'success');
  }

  // Initialize Batch Drag-and-Drop Zone
  function initBatchDropzone() {
    const dropzone = document.getElementById('screenshot-batch-dropzone');
    const inputBatch = document.getElementById('input-screen-batch');

    if (dropzone && inputBatch) {
      dropzone.addEventListener('click', function () {
        inputBatch.click();
      });

      dropzone.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('batch-dropzone-active');
      });

      dropzone.addEventListener('dragleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('batch-dropzone-active');
      });

      dropzone.addEventListener('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('batch-dropzone-active');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          loadBatchScreenshotFiles(e.dataTransfer.files);
        }
      });

      inputBatch.addEventListener('change', function (e) {
        if (e.target.files && e.target.files.length > 0) {
          loadBatchScreenshotFiles(e.target.files);
          e.target.value = '';
        }
      });
    }
  }

  // Initialize Global Bulk Controls ("Apply Caption to All" & "Apply Theme to All")
  function initGlobalBatchControls() {
    // 1. Apply Caption Pattern to All
    const btnApplyBulkCaption = document.getElementById('btn-apply-bulk-caption');
    const inputBulkHeadline = document.getElementById('input-bulk-headline-template');
    const inputBulkSubheadline = document.getElementById('input-bulk-subheadline-template');

    if (btnApplyBulkCaption) {
      btnApplyBulkCaption.addEventListener('click', function () {
        const headPattern = (inputBulkHeadline && inputBulkHeadline.value) || 'Feature {n}';
        const subPattern = (inputBulkSubheadline && inputBulkSubheadline.value) || 'Crafted for mobile performance';

        screens.forEach(function (screen, i) {
          screen.headline = headPattern.replace(/{n}/g, i + 1);
          screen.subheadline = subPattern.replace(/{n}/g, i + 1);
        });

        syncInputsWithActiveScreen();
        renderBatchGrid();
        scheduleRender();
        showNotification(`Applied caption pattern across all ${screens.length} mockups!`, 'success');
      });
    }

    // 2. Sync Theme to All
    const btnApplyThemeAll = document.getElementById('btn-apply-theme-all');
    if (btnApplyThemeAll) {
      btnApplyThemeAll.addEventListener('click', function () {
        renderBatchGrid();
        scheduleRender();
        showNotification(`Synchronized theme & styling across all ${screens.length} mockups!`, 'success');
      });
    }

    // 3. Clear Batch Images
    const btnClearBatch = document.getElementById('btn-clear-batch-images');
    if (btnClearBatch) {
      btnClearBatch.addEventListener('click', function () {
        screens.forEach(function (s) {
          s.image = null;
          s.fileName = null;
        });
        syncInputsWithActiveScreen();
        updateTabsUI();
        renderBatchGrid();
        scheduleRender();
        showNotification('Cleared custom screenshots from all slots.', 'success');
      });
    }

    // 4. Add Screen to Grid
    const btnAddScreenGrid = document.getElementById('btn-add-screen-grid');
    if (btnAddScreenGrid) {
      btnAddScreenGrid.addEventListener('click', function () {
        const newIdx = screens.length + 1;
        screens.push({
          id: newIdx,
          headline: `Feature ${newIdx}: New Slide`,
          subheadline: 'Crafted for modern mobile performance',
          image: null,
          fileName: null
        });
        activeScreenIndex = screens.length - 1;
        updateTabsUI();
        syncInputsWithActiveScreen();
        renderBatchGrid();
        scheduleRender();
        showNotification(`Added Screen #${newIdx} to batch queue!`, 'success');
      });
    }
  }

  // Load an image file into a specific screen index
  function loadScreenshotFile(file, targetIndex) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        if (screens[targetIndex]) {
          screens[targetIndex].image = img;
          screens[targetIndex].fileName = file.name;
        }
        syncInputsWithActiveScreen();
        updateTabsUI();
        renderBatchGrid();
        scheduleRender();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Handle multi-file uploads (adds new screens or updates existing)
  function handleMultiScreenshotFiles(fileList) {
    loadBatchScreenshotFiles(fileList);
  }

  // Initialize all controls, listeners, and auto-inheritance
  function initScreenshotEngine() {
    setupScreenshotCanvas();

    // 1. Listen for background changes from Card 2 (Feature Graphic)
    window.addEventListener('bannerBackgroundChanged', function (e) {
      if (e.detail) {
        inheritedBackground = e.detail;
        if (!useIndependentBg) {
          scheduleRender();
        }
      }
    });

    // Also listen for master icon update so sample app mockup reflects it
    window.addEventListener('masterImageUpdated', function () {
      scheduleRender();
    });

    // 2. Tab Switcher & "+ Add Screen" Button
    const btnAddScreen = document.getElementById('btn-add-screen');
    if (btnAddScreen) {
      btnAddScreen.addEventListener('click', function () {
        const newIdx = screens.length + 1;
        screens.push({
          id: newIdx,
          headline: `Feature ${newIdx} Overview`,
          subheadline: 'Crafted for modern mobile performance',
          image: null,
          fileName: null
        });
        activeScreenIndex = screens.length - 1;
        updateTabsUI();
        syncInputsWithActiveScreen();
        renderBatchGrid();
        scheduleRender();
      });
    }

    // Delete current screen
    const btnDeleteScreen = document.getElementById('btn-delete-screen');
    if (btnDeleteScreen) {
      btnDeleteScreen.addEventListener('click', function () {
        if (screens.length <= 1) return;
        screens.splice(activeScreenIndex, 1);
        if (activeScreenIndex >= screens.length) {
          activeScreenIndex = screens.length - 1;
        }
        updateTabsUI();
        syncInputsWithActiveScreen();
        renderBatchGrid();
        scheduleRender();
      });
    }

    // Load sample screens button
    const btnSampleScreens = document.getElementById('btn-load-sample-screens');
    if (btnSampleScreens) {
      btnSampleScreens.addEventListener('click', function () {
        screens = [
          {
            id: 1,
            headline: 'Fast P2P Sharing',
            subheadline: 'Direct encrypted device-to-device transfers',
            image: null,
            fileName: null
          },
          {
            id: 2,
            headline: 'Seamless Performance',
            subheadline: 'Ultra-fast fluid native user experience',
            image: null,
            fileName: null
          },
          {
            id: 3,
            headline: 'Production Ready',
            subheadline: 'One-click compliant release asset bundles',
            image: null,
            fileName: null
          },
          {
            id: 4,
            headline: 'Store Listing ASO',
            subheadline: 'Optimized metadata & full store compliance',
            image: null,
            fileName: null
          }
        ];
        activeScreenIndex = 0;
        updateTabsUI();
        syncInputsWithActiveScreen();
        renderBatchGrid();
        scheduleRender();
        showNotification('Loaded 4 demo screenshot slides into batch queue!', 'success');
      });
    }

    // 3. Per-Screen Inputs: Headline & Subheadline
    const inputHeadline = document.getElementById('input-screen-headline');
    const inputSubheadline = document.getElementById('input-screen-subheadline');

    if (inputHeadline) {
      inputHeadline.addEventListener('input', function () {
        if (screens[activeScreenIndex]) {
          screens[activeScreenIndex].headline = this.value;
          scheduleRender();
        }
      });
    }

    if (inputSubheadline) {
      inputSubheadline.addEventListener('input', function () {
        if (screens[activeScreenIndex]) {
          screens[activeScreenIndex].subheadline = this.value;
          scheduleRender();
        }
      });
    }

    // 4. Headline Font Size Slider
    const sliderFontSize = document.getElementById('slider-screen-font-size');
    const valFontSize = document.getElementById('val-screen-font-size');
    if (sliderFontSize) {
      sliderFontSize.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 64;
        headlineFontSize = val;
        if (valFontSize) valFontSize.textContent = `${val}px`;
        scheduleRender();
      });
    }

    // 5. Text Color Picker
    const inputTextColor = document.getElementById('input-screen-text-color');
    const valTextColor = document.getElementById('val-screen-text-color');
    if (inputTextColor) {
      inputTextColor.addEventListener('input', function () {
        textColor = this.value;
        if (valTextColor) valTextColor.textContent = textColor.toUpperCase();
        scheduleRender();
      });
    }

    // 6. Orientation Toggle (Portrait 1080x1920 vs Landscape 1920x1080)
    const btnOrientPortrait = document.getElementById('btn-orient-portrait');
    const btnOrientLandscape = document.getElementById('btn-orient-landscape');

    function updateOrientationUI() {
      if (btnOrientPortrait && btnOrientLandscape) {
        if (orientation === 'portrait') {
          btnOrientPortrait.className = 'orient-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 bg-indigo-950 border border-indigo-500 text-indigo-300 shadow-xs cursor-pointer';
          btnOrientLandscape.className = 'orient-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer';
        } else {
          btnOrientLandscape.className = 'orient-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 bg-indigo-950 border border-indigo-500 text-indigo-300 shadow-xs cursor-pointer';
          btnOrientPortrait.className = 'orient-btn px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer';
        }
      }
    }

    if (btnOrientPortrait) {
      btnOrientPortrait.addEventListener('click', function () {
        orientation = 'portrait';
        updateOrientationUI();
        updateCanvasDimensions();
        scheduleRender();
      });
    }

    if (btnOrientLandscape) {
      btnOrientLandscape.addEventListener('click', function () {
        orientation = 'landscape';
        updateOrientationUI();
        updateCanvasDimensions();
        scheduleRender();
      });
    }

    // 7. Hide Text / Screen Only Toggle
    const toggleHideText = document.getElementById('toggle-screen-hide-text');
    const screenTextPanel = document.getElementById('screen-text-content-panel');

    if (toggleHideText) {
      toggleHideText.checked = hideText;
      toggleHideText.addEventListener('change', function () {
        hideText = !!this.checked;
        if (screenTextPanel) {
          if (hideText) {
            screenTextPanel.classList.add('opacity-50', 'pointer-events-none');
          } else {
            screenTextPanel.classList.remove('opacity-50', 'pointer-events-none');
          }
        }
        scheduleRender();
      });
    }

    // 8. Segmented Layout Selector Buttons
    const layoutButtons = document.querySelectorAll('.screen-layout-btn');
    function updateLayoutUI() {
      layoutButtons.forEach(function (btn) {
        const mode = btn.getAttribute('data-screen-layout');
        if (mode === layoutMode) {
          btn.className = 'screen-layout-btn px-2 py-1.5 rounded text-[11px] font-mono flex items-center justify-center gap-1 bg-indigo-950 border border-indigo-500 text-indigo-300 font-semibold shadow-xs cursor-pointer';
        } else {
          btn.className = 'screen-layout-btn px-2 py-1.5 rounded text-[11px] font-mono flex items-center justify-center gap-1 bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer';
        }
      });
    }

    layoutButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        const mode = this.getAttribute('data-screen-layout');
        if (mode) {
          layoutMode = mode;
          updateLayoutUI();
          scheduleRender();
        }
      });
    });

    // 9. Frame Style Toggle [Modern Smartphone vs Frameless Shadow]
    const btnFrameModern = document.getElementById('btn-frame-modern');
    const btnFrameFrameless = document.getElementById('btn-frame-frameless');

    function updateFrameStyleUI() {
      if (btnFrameModern && btnFrameFrameless) {
        if (frameStyle === 'modern') {
          btnFrameModern.className = 'frame-style-btn px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 bg-indigo-950 border border-indigo-500 text-indigo-300 shadow-xs cursor-pointer';
          btnFrameFrameless.className = 'frame-style-btn px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer';
        } else {
          btnFrameFrameless.className = 'frame-style-btn px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 bg-indigo-950 border border-indigo-500 text-indigo-300 shadow-xs cursor-pointer';
          btnFrameModern.className = 'frame-style-btn px-2 py-0.5 rounded text-[10px] font-mono font-medium flex items-center gap-1 bg-slate-900 border border-transparent text-slate-400 hover:text-white cursor-pointer';
        }
      }
    }

    if (btnFrameModern) {
      btnFrameModern.addEventListener('click', function () {
        frameStyle = 'modern';
        updateFrameStyleUI();
        scheduleRender();
      });
    }

    if (btnFrameFrameless) {
      btnFrameFrameless.addEventListener('click', function () {
        frameStyle = 'frameless';
        updateFrameStyleUI();
        scheduleRender();
      });
    }

    // 10. Frame Scale & Transform Sliders
    const sliderScale = document.getElementById('slider-screen-device-scale');
    const valScale = document.getElementById('val-screen-device-scale');
    const sliderYOffset = document.getElementById('slider-screen-y-offset');
    const valYOffset = document.getElementById('val-screen-y-offset');
    const sliderXOffset = document.getElementById('slider-screen-x-offset');
    const valXOffset = document.getElementById('val-screen-x-offset');
    const btnResetTransform = document.getElementById('btn-reset-frame-transform');

    if (sliderScale) {
      sliderScale.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 100;
        deviceScale = val / 100;
        if (valScale) valScale.textContent = `${val}%`;
        scheduleRender();
      });
    }

    if (sliderYOffset) {
      sliderYOffset.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 0;
        frameYOffset = val;
        if (valYOffset) valYOffset.textContent = `${val}px`;
        scheduleRender();
      });
    }

    if (sliderXOffset) {
      sliderXOffset.addEventListener('input', function () {
        const val = parseInt(this.value, 10) || 0;
        frameXOffset = val;
        if (valXOffset) valXOffset.textContent = `${val}px`;
        scheduleRender();
      });
    }

    if (btnResetTransform) {
      btnResetTransform.addEventListener('click', function () {
        deviceScale = 1.0;
        frameYOffset = 0;
        frameXOffset = 0;
        if (sliderScale) sliderScale.value = '100';
        if (valScale) valScale.textContent = '100%';
        if (sliderYOffset) sliderYOffset.value = '0';
        if (valYOffset) valYOffset.textContent = '0px';
        if (sliderXOffset) sliderXOffset.value = '0';
        if (valXOffset) valXOffset.textContent = '0px';
        scheduleRender();
      });
    }

    // 11. Legacy or auxiliary Text Position Toggle fallback (if present in DOM)
    const btnPosTop = document.getElementById('btn-screen-pos-top');
    const btnPosBottom = document.getElementById('btn-screen-pos-bottom');

    if (btnPosTop) {
      btnPosTop.addEventListener('click', function () {
        layoutMode = 'text-top';
        updateLayoutUI();
        scheduleRender();
      });
    }
    if (btnPosBottom) {
      btnPosBottom.addEventListener('click', function () {
        layoutMode = 'text-bottom';
        updateLayoutUI();
        scheduleRender();
      });
    }

    // 12. Screenshot File Upload for Current Screen
    const inputScreenFile = document.getElementById('input-screen-file');
    if (inputScreenFile) {
      inputScreenFile.addEventListener('change', function (e) {
        const files = e.target.files;
        if (files && files.length > 1) {
          handleMultiScreenshotFiles(files);
        } else if (files && files[0]) {
          loadScreenshotFile(files[0], activeScreenIndex);
        }
      });
    }

    // Remove screenshot image (revert to demo mockup)
    const btnRemoveScreenImg = document.getElementById('btn-remove-screen-img');
    if (btnRemoveScreenImg) {
      btnRemoveScreenImg.addEventListener('click', function () {
        if (screens[activeScreenIndex]) {
          screens[activeScreenIndex].image = null;
          screens[activeScreenIndex].fileName = null;
          syncInputsWithActiveScreen();
          updateTabsUI();
          scheduleRender();
        }
      });
    }

    // 8. "Use Independent Background" Toggle & Color Pickers
    const toggleIndependentBg = document.getElementById('toggle-independent-bg');
    const independentBgControls = document.getElementById('independent-bg-controls');
    const inputIndepStart = document.getElementById('input-indep-start');
    const inputIndepEnd = document.getElementById('input-indep-end');
    const valIndepStart = document.getElementById('val-indep-start');
    const valIndepEnd = document.getElementById('val-indep-end');
    const bgStatusLabel = document.getElementById('screen-bg-inheritance-status');

    if (toggleIndependentBg) {
      toggleIndependentBg.addEventListener('change', function () {
        useIndependentBg = !!this.checked;
        if (independentBgControls) {
          if (useIndependentBg) {
            independentBgControls.classList.remove('hidden');
          } else {
            independentBgControls.classList.add('hidden');
          }
        }
        if (bgStatusLabel) {
          bgStatusLabel.textContent = useIndependentBg
            ? 'Independent Colors'
            : 'Inherited from Feature Graphic';
        }
        scheduleRender();
      });
    }

    if (inputIndepStart) {
      inputIndepStart.addEventListener('input', function () {
        independentGradStart = this.value;
        if (valIndepStart) valIndepStart.textContent = independentGradStart.toUpperCase();
        scheduleRender();
      });
    }

    if (inputIndepEnd) {
      inputIndepEnd.addEventListener('input', function () {
        independentGradEnd = this.value;
        if (valIndepEnd) valIndepEnd.textContent = independentGradEnd.toUpperCase();
        scheduleRender();
      });
    }

    // Shared helper to download the currently active slide PNG
    async function downloadCurrentActiveScreen() {
      try {
        const blob = await window.getActiveScreenshotBlob();
        if (!blob) {
          showNotification('Could not render slide PNG', 'warning');
          return;
        }
        const isLandscape = orientation === 'landscape';
        const dimLabel = isLandscape ? '1920x1080' : '1080x1920';
        const fileName = `screenshot_${activeScreenIndex + 1}_${dimLabel}.png`;

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
        showNotification(`Downloaded Slide #${activeScreenIndex + 1} PNG!`, 'success');
      } catch (err) {
        console.error('Failed to download active screenshot:', err);
        showNotification('Failed to download slide PNG', 'error');
      }
    }

    // Standalone Download Button for Active Screenshot
    const btnDownloadActive = document.getElementById('btn-download-active-screen');
    if (btnDownloadActive) {
      btnDownloadActive.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        await downloadCurrentActiveScreen();
      });
    }

    // Canvas Direct Download Button
    const btnDownloadCanvasDirect = document.getElementById('btn-download-canvas-direct');
    if (btnDownloadCanvasDirect) {
      btnDownloadCanvasDirect.addEventListener('click', async function (e) {
        e.preventDefault();
        e.stopPropagation();
        await downloadCurrentActiveScreen();
      });
    }

    // Initialize Batch Multi-Screenshot Dropzone and Global Bulk Controls
    initBatchDropzone();
    initGlobalBatchControls();

    // Expose engine API on window.DevAssetStudio
    window.DevAssetStudio = window.DevAssetStudio || {};
    window.DevAssetStudio.screenshotEngine = {
      scheduleRender: scheduleRender,
      renderActiveScreenshot: renderActiveScreenshot,
      getActiveScreenshotBlob: window.getActiveScreenshotBlob,
      getAllScreenshotBlobs: window.getAllScreenshotBlobs,
      loadScreenshotFile: loadScreenshotFile,
      loadBatchScreenshotFiles: loadBatchScreenshotFiles,
      renderBatchGrid: renderBatchGrid,
      setActiveScreen: function (idx) {
        if (idx >= 0 && idx < screens.length) {
          activeScreenIndex = idx;
          syncInputsWithActiveScreen();
          updateTabsUI();
          renderBatchGrid();
          scheduleRender();
        }
      }
    };

    // Initialize tabs, layout UI, orientation UI, frame UI, sync inputs, and batch grid
    updateOrientationUI();
    updateLayoutUI();
    updateFrameStyleUI();
    updateCanvasDimensions();
    updateTabsUI();
    syncInputsWithActiveScreen();
    renderBatchGrid();
    scheduleRender();
    refreshLucideIcons();
  }

  // DOM ready hook
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreenshotEngine);
  } else {
    initScreenshotEngine();
  }
})();
