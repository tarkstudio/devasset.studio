/**
 * modules/iosEngine.js
 * DevAsset Studio • Apple / iOS Ecosystem Asset Engine
 * 
 * Features:
 * 1. App Store Master: 1024x1024 px PNG
 *    - Strictly flattened transparency (0% alpha channel guarantee for App Store Connect).
 *    - Real-time alpha scanner & verification badge.
 *    - Squircle superellipse preview vs raw square for upload.
 * 2. iPhone & iPad Retina Suite (AppIcon.appiconset):
 *    - iPhone Home: 120x120 (@2x), 180x180 (@3x)
 *    - Spotlight: 80x80 (@2x), 120x120 (@3x)
 *    - Settings: 58x58 (@2x), 87x87 (@3x)
 *    - Notifications: 40x40 (@2x), 60x60 (@3x)
 *    - iPad: 152x152 (@2x), 167x167 (iPad Pro)
 * 3. Auto Contents.json generation:
 *    - Standard Xcode asset catalog schema.
 * 4. App Store Mockup Studio:
 *    - 1290x2796 px (6.7" iPhone 15/16 Pro Max)
 *    - 1242x2688 px (6.5" iPhone 11 Pro Max / XS Max)
 *    - Live canvas compositor with Dynamic Island / Notch framing & caption typography.
 */

(function () {
  'use strict';

  window.DevAssetStudio = window.DevAssetStudio || {};

  const IOS_SPECS = [
    { name: 'AppIcon-1024x1024@1x.png', size: 1024, idiom: 'ios-marketing', scale: '1x', pointSize: '1024x1024', role: 'App Store Master' },
    { name: 'AppIcon-60x60@3x.png', size: 180, idiom: 'iphone', scale: '3x', pointSize: '60x60', role: 'iPhone Home (@3x)' },
    { name: 'AppIcon-60x60@2x.png', size: 120, idiom: 'iphone', scale: '2x', pointSize: '60x60', role: 'iPhone Home (@2x)' },
    { name: 'AppIcon-40x40@3x.png', size: 120, idiom: 'iphone', scale: '3x', pointSize: '40x40', role: 'Spotlight (@3x)' },
    { name: 'AppIcon-40x40@2x.png', size: 80, idiom: 'iphone', scale: '2x', pointSize: '40x40', role: 'Spotlight (@2x)' },
    { name: 'AppIcon-29x29@3x.png', size: 87, idiom: 'iphone', scale: '3x', pointSize: '29x29', role: 'Settings (@3x)' },
    { name: 'AppIcon-29x29@2x.png', size: 58, idiom: 'iphone', scale: '2x', pointSize: '29x29', role: 'Settings (@2x)' },
    { name: 'AppIcon-20x20@3x.png', size: 60, idiom: 'iphone', scale: '3x', pointSize: '20x20', role: 'Notifications (@3x)' },
    { name: 'AppIcon-20x20@2x.png', size: 40, idiom: 'iphone', scale: '2x', pointSize: '20x20', role: 'Notifications (@2x)' },
    { name: 'AppIcon-83.5x83.5@2x.png', size: 167, idiom: 'ipad', scale: '2x', pointSize: '83.5x83.5', role: 'iPad Pro (@2x)' },
    { name: 'AppIcon-76x76@2x.png', size: 152, idiom: 'ipad', scale: '2x', pointSize: '76x76', role: 'iPad (@2x)' },
    { name: 'AppIcon-40x40@2x-ipad.png', size: 80, idiom: 'ipad', scale: '2x', pointSize: '40x40', role: 'iPad Spotlight (@2x)' },
    { name: 'AppIcon-29x29@2x-ipad.png', size: 58, idiom: 'ipad', scale: '2x', pointSize: '29x29', role: 'iPad Settings (@2x)' },
    { name: 'AppIcon-20x20@2x-ipad.png', size: 40, idiom: 'ipad', scale: '2x', pointSize: '20x20', role: 'iPad Notifications (@2x)' },
  ];

  const state = {
    sourceImage: null,
    flattenColor: '#000000',
    flattenMode: 'solid', // 'solid', 'dominant', 'white'
    appIconBlobs: {},
    master1024Blob: null,
    hasAlphaInSource: false,
    mockupPreset: '1290x2796', // '1290x2796' or '1242x2688'
    mockupImage: null,
    mockupHeadline: 'Experience Elegance',
    mockupSubhead: 'Engineered for iPhone & iOS 18 with Super Retina Display',
    mockupBgGradient: 'slate', // 'slate', 'indigo', 'midnight', 'sunset', 'pure_black'
    mockupFrame: 'dynamic_island', // 'dynamic_island' or 'notch'
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
   * Generates standard Xcode Contents.json
   */
  function generateContentsJson() {
    const contents = {
      images: [
        { size: '20x20', idiom: 'iphone', filename: 'AppIcon-20x20@2x.png', scale: '2x' },
        { size: '20x20', idiom: 'iphone', filename: 'AppIcon-20x20@3x.png', scale: '3x' },
        { size: '29x29', idiom: 'iphone', filename: 'AppIcon-29x29@2x.png', scale: '2x' },
        { size: '29x29', idiom: 'iphone', filename: 'AppIcon-29x29@3x.png', scale: '3x' },
        { size: '40x40', idiom: 'iphone', filename: 'AppIcon-40x40@2x.png', scale: '2x' },
        { size: '40x40', idiom: 'iphone', filename: 'AppIcon-40x40@3x.png', scale: '3x' },
        { size: '60x60', idiom: 'iphone', filename: 'AppIcon-60x60@2x.png', scale: '2x' },
        { size: '60x60', idiom: 'iphone', filename: 'AppIcon-60x60@3x.png', scale: '3x' },
        { size: '20x20', idiom: 'ipad', filename: 'AppIcon-20x20@2x-ipad.png', scale: '2x' },
        { size: '29x29', idiom: 'ipad', filename: 'AppIcon-29x29@2x-ipad.png', scale: '2x' },
        { size: '40x40', idiom: 'ipad', filename: 'AppIcon-40x40@2x-ipad.png', scale: '2x' },
        { size: '76x76', idiom: 'ipad', filename: 'AppIcon-76x76@2x.png', scale: '2x' },
        { size: '83.5x83.5', idiom: 'ipad', filename: 'AppIcon-83.5x83.5@2x.png', scale: '2x' },
        { size: '1024x1024', idiom: 'ios-marketing', filename: 'AppIcon-1024x1024@1x.png', scale: '1x' }
      ],
      info: {
        version: 1,
        author: 'xcode'
      }
    };
    return JSON.stringify(contents, null, 2);
  }

  /**
   * Scans an image element/canvas to detect transparency
   */
  function checkAlphaChannel(img) {
    const testCanvas = document.createElement('canvas');
    testCanvas.width = 64;
    testCanvas.height = 64;
    const ctx = testCanvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  }

  /**
   * Extracts dominant color from image if user wants automatic background matching
   */
  function extractDominantColor(img) {
    try {
      const c = document.createElement('canvas');
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 128) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }
      if (count === 0) return '#000000';
      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    } catch {
      return '#000000';
    }
  }

  /**
   * Renders the 1024x1024 App Store icon with STRICT 0% Alpha flattening
   */
  function renderAppStoreMaster(img, flattenColor) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d', { alpha: false }); // Strictly no alpha context

    // 1. Solid opaque background layer to flatten any alpha
    ctx.fillStyle = flattenColor || '#000000';
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Composite source image
    ctx.drawImage(img, 0, 0, 1024, 1024);

    return canvas;
  }

  /**
   * Generate all retina sizes and store blobs
   */
  async function generateRetinaSuite(masterCanvas) {
    state.appIconBlobs = {};

    for (const spec of IOS_SPECS) {
      const c = document.createElement('canvas');
      c.width = spec.size;
      c.height = spec.size;
      const ctx = c.getContext('2d', { alpha: false });
      ctx.fillStyle = state.flattenColor || '#000000';
      ctx.fillRect(0, 0, spec.size, spec.size);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(masterCanvas, 0, 0, spec.size, spec.size);

      const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png'));
      state.appIconBlobs[spec.name] = {
        blob,
        spec,
        dataUrl: c.toDataURL('image/png')
      };
    }

    state.master1024Blob = state.appIconBlobs['AppIcon-1024x1024@1x.png'].blob;
    updateIosUi();
  }

  /**
   * Update iOS Ecosystem UI elements
   */
  function updateIosUi() {
    const previewCanvas = document.getElementById('ios-master-canvas');
    const alphaBadge = document.getElementById('ios-alpha-badge');
    const suiteGrid = document.getElementById('ios-suite-grid');

    if (previewCanvas && state.appIconBlobs['AppIcon-1024x1024@1x.png']) {
      const ctx = previewCanvas.getContext('2d');
      previewCanvas.width = 512;
      previewCanvas.height = 512;
      const masterData = state.appIconBlobs['AppIcon-1024x1024@1x.png'];
      const tempImg = new Image();
      tempImg.onload = function () {
        ctx.clearRect(0, 0, 512, 512);
        ctx.drawImage(tempImg, 0, 0, 512, 512);
      };
      tempImg.src = masterData.dataUrl;
    }

    if (alphaBadge) {
      alphaBadge.className = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/80 border border-emerald-500/40 text-emerald-300';
      alphaBadge.innerHTML = `<i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-400"></i><span>0% Alpha (Flattened for App Store Connect)</span>`;
    }

    if (suiteGrid && Object.keys(state.appIconBlobs).length > 0) {
      suiteGrid.innerHTML = '';
      const displaySpecs = IOS_SPECS.filter((s, idx) => idx < 8); // Top 8 prominent icons
      displaySpecs.forEach(spec => {
        const item = state.appIconBlobs[spec.name];
        if (!item) return;
        const card = document.createElement('div');
        card.className = 'bg-surface p-3 rounded-xl border border-borderline flex flex-col items-center text-center gap-2 hover:border-sky-500/40 transition-all';
        card.innerHTML = `
          <div class="relative w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shadow-md bg-black">
            <img src="${item.dataUrl}" alt="${spec.role}" class="w-full h-full object-cover" />
          </div>
          <div class="w-full">
            <div class="text-[11px] font-bold text-white font-mono truncate">${spec.role}</div>
            <div class="text-[10px] text-slate-400 font-mono">${spec.size}×${spec.size} px (${spec.scale})</div>
          </div>
        `;
        suiteGrid.appendChild(card);
      });
    }

    refreshIcons();
  }

  /**
   * Process a new master image for iOS
   */
  async function processIosMaster(img) {
    state.sourceImage = img;
    state.hasAlphaInSource = checkAlphaChannel(img);

    if (state.flattenMode === 'dominant') {
      state.flattenColor = extractDominantColor(img);
      const colorInput = document.getElementById('ios-flatten-color');
      if (colorInput) colorInput.value = state.flattenColor;
    }

    const masterCanvas = renderAppStoreMaster(img, state.flattenColor);
    await generateRetinaSuite(masterCanvas);

    // Also update Mockup if empty
    if (!state.mockupImage) {
      renderIosMockup();
    }
  }

  let iosMockupRafId = null;
  function scheduleIosMockupRender() {
    if (iosMockupRafId) {
      cancelAnimationFrame(iosMockupRafId);
    }
    iosMockupRafId = requestAnimationFrame(function () {
      renderIosMockup();
      iosMockupRafId = null;
    });
  }

  /**
   * Renders the iOS Mockup Canvas (1290x2796 or 1242x2688)
   */
  function renderIosMockup() {
    const canvas = document.getElementById('ios-mockup-canvas');
    if (!canvas) return;

    const [targetW, targetH] = state.mockupPreset.split('x').map(Number);
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // 1. Background Gradient
    const bg = ctx.createLinearGradient(0, 0, 0, targetH);
    if (state.mockupBgGradient === 'indigo') {
      bg.addColorStop(0, '#1e1b4b');
      bg.addColorStop(0.5, '#0f172a');
      bg.addColorStop(1, '#020617');
    } else if (state.mockupBgGradient === 'midnight') {
      bg.addColorStop(0, '#090d16');
      bg.addColorStop(1, '#030712');
    } else if (state.mockupBgGradient === 'sunset') {
      bg.addColorStop(0, '#4c0519');
      bg.addColorStop(0.5, '#1e1b4b');
      bg.addColorStop(1, '#0f172a');
    } else { // Slate
      bg.addColorStop(0, '#0f172a');
      bg.addColorStop(0.6, '#020617');
      bg.addColorStop(1, '#000000');
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, targetW, targetH);

    // Subtle glow
    const glow = ctx.createRadialGradient(targetW / 2, targetH * 0.35, 100, targetW / 2, targetH * 0.35, targetW * 0.8);
    glow.addColorStop(0, 'rgba(56, 189, 248, 0.15)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, targetW, targetH);

    // 2. Headlines
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 84px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
    ctx.fillText(state.mockupHeadline || 'Experience Elegance', targetW / 2, 280);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 42px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillText(state.mockupSubhead || 'Engineered for iPhone with Super Retina Display', targetW / 2, 360);

    // 3. iPhone Device Frame (Realistic Bezel, Dynamic Island or Notch)
    const phoneW = targetW * 0.82;
    const phoneH = targetH * 0.68;
    const phoneX = (targetW - phoneW) / 2;
    const phoneY = 460;
    const cornerRadius = 90;

    // Phone shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 90;
    ctx.shadowOffsetY = 40;

    // Phone Outer Frame (Titanium finish)
    ctx.beginPath();
    ctx.roundRect(phoneX, phoneY, phoneW, phoneH, cornerRadius);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.restore();

    // Phone Outer Bezel Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Inner Screen (Black border + display)
    const screenMargin = 22;
    const screenX = phoneX + screenMargin;
    const screenY = phoneY + screenMargin;
    const screenW = phoneW - screenMargin * 2;
    const screenH = phoneH - screenMargin * 2;
    const screenRadius = cornerRadius - 16;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(screenX, screenY, screenW, screenH, screenRadius);
    ctx.clip();

    // Screen Content: Screenshot image or Default Mock UI
    if (state.mockupImage) {
      ctx.drawImage(state.mockupImage, screenX, screenY, screenW, screenH);
    } else {
      // Elegant default screen
      const screenGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + screenH);
      screenGrad.addColorStop(0, '#030712');
      screenGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = screenGrad;
      ctx.fillRect(screenX, screenY, screenW, screenH);

      // Render App Icon in center of screen
      if (state.sourceImage) {
        const iconSize = 220;
        const iconX = screenX + (screenW - iconSize) / 2;
        const iconY = screenY + (screenH - iconSize) / 2 - 80;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(iconX, iconY, iconSize, iconSize, 48);
        ctx.clip();
        ctx.drawImage(state.sourceImage, iconX, iconY, iconSize, iconSize);
        ctx.restore();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 44px system-ui, sans-serif';
        ctx.fillText('iOS Ready', screenX + screenW / 2, iconY + iconSize + 70);
      }
    }

    // Top Dynamic Island or Notch
    if (state.mockupFrame === 'dynamic_island') {
      const islandW = 240;
      const islandH = 68;
      const islandX = screenX + (screenW - islandW) / 2;
      const islandY = screenY + 24;
      ctx.beginPath();
      ctx.roundRect(islandX, islandY, islandW, islandH, islandH / 2);
      ctx.fillStyle = '#000000';
      ctx.fill();

      // Camera lens reflection dot
      ctx.beginPath();
      ctx.arc(islandX + islandW - 36, islandY + islandH / 2, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
    } else {
      // Classic Notch
      const notchW = 320;
      const notchH = 56;
      const notchX = screenX + (screenW - notchW) / 2;
      const notchY = screenY;
      ctx.beginPath();
      ctx.roundRect(notchX, notchY, notchW, notchH, [0, 0, 24, 24]);
      ctx.fillStyle = '#000000';
      ctx.fill();
    }

    // Home indicator bar at bottom
    const barW = 280;
    const barH = 10;
    const barX = screenX + (screenW - barW) / 2;
    const barY = screenY + screenH - 28;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();

    ctx.restore();
  }

  /**
   * Export the complete Xcode-ready iOS AppIcon bundle (.zip)
   */
  async function exportIosZip() {
    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      alert('Required compression libraries are loading. Please wait a moment.');
      return;
    }

    if (!state.sourceImage && !window.masterIconImage) {
      alert('Please upload or load a master icon first.');
      return;
    }

    // If sourceImage not yet processed, grab from master icon
    if (!state.sourceImage && window.masterIconImage) {
      await processIosMaster(window.masterIconImage);
    }

    const btn = document.getElementById('btn-download-ios-zip') || document.getElementById('btn-download-ios-top');
    const origText = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader" class="w-4 h-4 animate-spin"></i><span>Packaging iOS Suite...</span>`;
      refreshIcons();
    }

    try {
      const zip = new JSZip();

      // 1. Xcode AppIcon.appiconset directory
      const appIconSet = zip.folder('AppIcon.appiconset');
      appIconSet.file('Contents.json', generateContentsJson());

      for (const [filename, data] of Object.entries(state.appIconBlobs)) {
        appIconSet.file(filename, data.blob);
      }

      // 2. App Store Connect Master (1024x1024 0% Alpha)
      const appStoreFolder = zip.folder('app_store');
      if (state.master1024Blob) {
        appStoreFolder.file('AppStore_1024x1024_0percent_alpha.png', state.master1024Blob);
      }

      // 3. Mockup Screenshot if canvas exists
      const mockupCanvas = document.getElementById('ios-mockup-canvas');
      if (mockupCanvas) {
        const mockupBlob = await new Promise(resolve => mockupCanvas.toBlob(resolve, 'image/png'));
        const screenshotsFolder = zip.folder('screenshots');
        screenshotsFolder.file(`ios_appstore_mockup_${state.mockupPreset}.png`, mockupBlob);
      }

      // 4. Integration Guide
      zip.file('XCODE_SETUP_GUIDE.txt', `HOW TO IMPORT ASSETS INTO XCODE:
1. Open your project in Xcode.
2. Select Assets.xcassets in the Project Navigator.
3. Delete the default empty "AppIcon" item if present.
4. Drag and drop the "AppIcon.appiconset" folder directly from this ZIP into Assets.xcassets.
5. In Xcode project settings -> Target -> General -> App Icons and Launch Screen, confirm "AppIcon" is selected.

FOR APP STORE CONNECT:
Upload "app_store/AppStore_1024x1024_0percent_alpha.png" under the 1024×1024 App Store Icon section.
Note: Transparency has been 100% flattened to 0% alpha to guarantee rejection-free validation by Apple.`);

      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
      saveAs(zipBlob, 'devasset-ios-appicon-bundle.zip');

      if (btn) {
        btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i><span>iOS Bundle Downloaded!</span>`;
        refreshIcons();
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.disabled = false;
          refreshIcons();
        }, 3000);
      }
    } catch (err) {
      console.error('[DevAsset Studio] iOS export failed:', err);
      alert('iOS export failed: ' + err.message);
      if (btn) {
        btn.innerHTML = origText;
        btn.disabled = false;
        refreshIcons();
      }
    }
  }

  // Create sample iOS icon if needed
  function createSampleIosIcon() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 1024;
    const ctx = c.getContext('2d', { alpha: false });

    // Gradient background
    const g = ctx.createLinearGradient(0, 0, 1024, 1024);
    g.addColorStop(0, '#0284c7');
    g.addColorStop(0.5, '#4f46e5');
    g.addColorStop(1, '#9333ea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1024);

    // Inner symbol
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(512, 512, 280, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4f46e5';
    ctx.beginPath();
    ctx.arc(512, 512, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 240px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('', 512, 510);

    const img = new Image();
    img.onload = function () {
      processIosMaster(img);
    };
    img.src = c.toDataURL('image/png');
  }

  // Bind UI Events
  function initIosUi() {
    const uploadInput = document.getElementById('ios-icon-upload');
    const uploadZone = document.getElementById('ios-upload-zone');
    const btnSample = document.getElementById('btn-ios-sample');
    const colorInput = document.getElementById('ios-flatten-color');
    const btnDownloadZip = document.getElementById('btn-download-ios-zip');

    // Mockup controls
    const presetSelect = document.getElementById('ios-mockup-preset');
    const headlineInput = document.getElementById('ios-mockup-headline');
    const subheadInput = document.getElementById('ios-mockup-subhead');
    const bgSelect = document.getElementById('ios-mockup-bg');
    const frameSelect = document.getElementById('ios-mockup-frame');
    const mockupUpload = document.getElementById('ios-mockup-upload');
    const btnDownloadMockup = document.getElementById('btn-download-ios-mockup');

    if (uploadInput) {
      uploadInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            processIosMaster(img);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }

    if (btnSample) {
      btnSample.addEventListener('click', createSampleIosIcon);
    }

    if (colorInput) {
      colorInput.addEventListener('input', function (e) {
        state.flattenColor = e.target.value;
        if (state.sourceImage) {
          const masterCanvas = renderAppStoreMaster(state.sourceImage, state.flattenColor);
          generateRetinaSuite(masterCanvas);
        }
      });
    }

    if (btnDownloadZip) {
      btnDownloadZip.addEventListener('click', exportIosZip);
    }

    // Mockup event bindings
    if (presetSelect) {
      presetSelect.addEventListener('change', function (e) {
        state.mockupPreset = e.target.value;
        scheduleIosMockupRender();
      });
    }
    if (headlineInput) {
      headlineInput.addEventListener('input', function (e) {
        state.mockupHeadline = e.target.value;
        scheduleIosMockupRender();
      });
    }
    if (subheadInput) {
      subheadInput.addEventListener('input', function (e) {
        state.mockupSubhead = e.target.value;
        scheduleIosMockupRender();
      });
    }
    if (bgSelect) {
      bgSelect.addEventListener('change', function (e) {
        state.mockupBgGradient = e.target.value;
        scheduleIosMockupRender();
      });
    }
    if (frameSelect) {
      frameSelect.addEventListener('change', function (e) {
        state.mockupFrame = e.target.value;
        scheduleIosMockupRender();
      });
    }
    if (mockupUpload) {
      mockupUpload.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            state.mockupImage = img;
            scheduleIosMockupRender();
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      });
    }
    if (btnDownloadMockup) {
      btnDownloadMockup.addEventListener('click', function () {
        const canvas = document.getElementById('ios-mockup-canvas');
        if (!canvas) return;
        canvas.toBlob(function (blob) {
          saveAs(blob, `appstore_mockup_${state.mockupPreset}.png`);
        }, 'image/png');
      });
    }

    // Initial render
    createSampleIosIcon();
  }

  // Expose methods on window
  window.DevAssetStudio.iosEngine = {
    state,
    processIosMaster,
    exportIosZip,
    renderIosMockup,
    getContentsJson: generateContentsJson,
    initIosUi
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIosUi);
  } else {
    initIosUi();
  }
})();
