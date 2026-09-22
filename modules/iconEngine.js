/**
 * modules/iconEngine.js
 * DevAsset Studio • Step 2 Canvas Engine
 * 
 * Responsibilities:
 * - Master Dropzone file handling & dragover effects
 * - 1:1 PNG format and dimension validation
 * - Programmatic 512x512 sample icon generation
 * - Android Mipmap downsampling (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi, 512px)
 * - Live mini-canvas previews for density rows in Card 1
 * - Shared state export (window.masterIconImage, window.generatedMipmaps)
 * - Custom event dispatch ('masterImageUpdated') for bannerEngine.js
 */

(function () {
  'use strict';

  // 1. GLOBAL STATE INITIALIZATION
  window.masterIconImage = null;
  window.masterIconFile = null;
  window.generatedMipmaps = {};

  // Android Mipmap Density Target Specifications
  const ANDROID_TARGETS = [
    {
      id: 'mipmap-mdpi',
      name: 'mipmap-mdpi',
      density: 'mdpi',
      factor: '1.0x baseline',
      width: 48,
      height: 48,
      path: 'res/mipmap-mdpi/ic_launcher.png',
    },
    {
      id: 'mipmap-hdpi',
      name: 'mipmap-hdpi',
      density: 'hdpi',
      factor: '1.5x',
      width: 72,
      height: 72,
      path: 'res/mipmap-hdpi/ic_launcher.png',
    },
    {
      id: 'mipmap-xhdpi',
      name: 'mipmap-xhdpi',
      density: 'xhdpi',
      factor: '2.0x',
      width: 96,
      height: 96,
      path: 'res/mipmap-xhdpi/ic_launcher.png',
    },
    {
      id: 'mipmap-xxhdpi',
      name: 'mipmap-xxhdpi',
      density: 'xxhdpi',
      factor: '3.0x',
      width: 144,
      height: 144,
      path: 'res/mipmap-xxhdpi/ic_launcher.png',
    },
    {
      id: 'mipmap-xxxhdpi',
      name: 'mipmap-xxxhdpi',
      density: 'xxxhdpi',
      factor: '4.0x',
      width: 192,
      height: 192,
      path: 'res/mipmap-xxxhdpi/ic_launcher.png',
    },
    {
      id: 'playstore-icon',
      name: 'playstore-icon',
      density: 'hi-res',
      factor: 'Google Play Store',
      width: 512,
      height: 512,
      path: 'playstore/ic_launcher-512.png',
    },
  ];

  // Helper to re-initialize Lucide vector icons
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

  // Helper to update pipeline status UI
  function updatePipelineStatus(status) {
    const statusBadge = document.getElementById('pipeline-status') || document.getElementById('pipeline-status-text');
    const progressBar = document.getElementById('pipeline-progress-bar');
    const hintText = document.getElementById('pipeline-hint');
    const navStatus = document.getElementById('nav-master-status');
    const mipmapCount = document.getElementById('mipmap-ready-count');

    if (status === 'processing') {
      if (statusBadge) {
        statusBadge.textContent = 'Processing...';
        statusBadge.className = 'text-amber-400 font-semibold animate-pulse';
      }
      if (progressBar) {
        progressBar.style.width = '60%';
        progressBar.className = 'bg-indigo-500 h-full transition-all duration-200';
      }
      if (hintText) hintText.textContent = 'Resampling Android mipmap densities...';
      if (navStatus) navStatus.className = 'ml-auto w-2 h-2 rounded-full bg-amber-400 animate-ping';
      if (mipmapCount) mipmapCount.textContent = 'Resampling...';
    } else if (status === 'ready') {
      if (statusBadge) {
        statusBadge.textContent = 'Ready (Assets Generated)';
        statusBadge.className = 'text-emerald-400 font-semibold';
      }
      if (progressBar) {
        progressBar.style.width = '100%';
        progressBar.className = 'bg-emerald-500 h-full transition-all duration-300';
      }
      if (hintText) hintText.textContent = 'Mipmaps generated in RAM & ready for ZIP bundle.';
      if (navStatus) navStatus.className = 'ml-auto w-2 h-2 rounded-full bg-emerald-400';
      if (mipmapCount) {
        mipmapCount.textContent = '6/6 Ready (In-Memory)';
        mipmapCount.className = 'text-[10px] text-emerald-400 font-semibold';
      }
    } else {
      // Idle
      if (statusBadge) {
        statusBadge.textContent = 'Idle';
        statusBadge.className = 'text-amber-400 font-semibold';
      }
      if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.className = 'bg-indigo-500 h-full transition-all duration-300';
      }
      if (hintText) hintText.textContent = 'Ready for 512x512 PNG master input';
      if (navStatus) navStatus.className = 'ml-auto w-2 h-2 rounded-full bg-amber-400';
      if (mipmapCount) {
        mipmapCount.textContent = '0/5 Generated';
        mipmapCount.className = 'text-[10px] text-amber-400 font-semibold';
      }
    }
  }

  // Error messaging helpers
  function showDropzoneError(title, message) {
    const errBox = document.getElementById('dropzone-error');
    const errTitle = document.getElementById('dropzone-error-title');
    const errDesc = document.getElementById('dropzone-error-desc');
    if (errBox && errTitle && errDesc) {
      errTitle.textContent = title;
      errDesc.textContent = message;
      errBox.classList.remove('hidden');
      refreshIcons();
    }
  }

  function clearDropzoneError() {
    const errBox = document.getElementById('dropzone-error');
    if (errBox) errBox.classList.add('hidden');
  }

  // High-Quality Canvas Resampling with Multi-Step Downsampling
  function resizeImageHighQuality(sourceImage, targetWidth, targetHeight) {
    let currentCanvas = document.createElement('canvas');
    currentCanvas.width = sourceImage.naturalWidth || sourceImage.width;
    currentCanvas.height = sourceImage.naturalHeight || sourceImage.height;

    let ctx = currentCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, 0, 0, currentCanvas.width, currentCanvas.height);

    // Multi-step halving for high downscale ratios (prevents aliasing artifacts)
    while (currentCanvas.width * 0.5 > targetWidth && currentCanvas.height * 0.5 > targetHeight) {
      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = Math.floor(currentCanvas.width * 0.5);
      nextCanvas.height = Math.floor(currentCanvas.height * 0.5);
      const nextCtx = nextCanvas.getContext('2d');
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';
      nextCtx.drawImage(currentCanvas, 0, 0, nextCanvas.width, nextCanvas.height);
      currentCanvas = nextCanvas;
    }

    // Final target canvas
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);

    return finalCanvas;
  }

  // Downsample master icon across all Android density buckets
  function generateAllAndroidMipmaps(sourceImg) {
    updatePipelineStatus('processing');
    window.generatedMipmaps = {};

    requestAnimationFrame(function () {
      const cardMipmap = document.getElementById('card-mipmap');
      const promises = [];

      ANDROID_TARGETS.forEach(function (target) {
        const targetCanvas = resizeImageHighQuality(sourceImg, target.width, target.height);

        // Replace density row preview placeholder with live mini-canvas
        if (cardMipmap) {
          // Find row corresponding to this density
          const rows = cardMipmap.querySelectorAll('.space-y-2\\.5 > div');
          rows.forEach(function (row) {
            const rowText = row.textContent || '';
            if (rowText.includes(target.name)) {
              const previewContainer = row.querySelector('.checkerboard-bg');
              if (previewContainer) {
                // Clear previous content
                previewContainer.innerHTML = '';
                
                // Create styled live preview canvas
                const miniCanvas = document.createElement('canvas');
                miniCanvas.width = target.width;
                miniCanvas.height = target.height;
                miniCanvas.className = 'w-full h-full object-contain';
                miniCanvas.title = `${target.name} (${target.width}x${target.height} px)`;
                
                const miniCtx = miniCanvas.getContext('2d');
                miniCtx.imageSmoothingEnabled = true;
                miniCtx.imageSmoothingQuality = 'high';
                miniCtx.drawImage(targetCanvas, 0, 0, target.width, target.height);

                previewContainer.appendChild(miniCanvas);
              }
            }
          });
        }

        // Generate in-memory Blob asynchronously
        const blobPromise = new Promise(function (resolve) {
          targetCanvas.toBlob(function (blob) {
            window.generatedMipmaps[target.id] = {
              id: target.id,
              name: target.name,
              width: target.width,
              height: target.height,
              path: target.path,
              canvas: targetCanvas,
              blob: blob,
              dataUrl: targetCanvas.toDataURL('image/png'),
            };
            resolve();
          }, 'image/png');
        });

        promises.push(blobPromise);
      });

      Promise.all(promises).then(function () {
        updatePipelineStatus('ready');

        // Dispatch custom event for bannerEngine.js & other consumers
        window.dispatchEvent(
          new CustomEvent('masterImageUpdated', {
            detail: {
              image: sourceImg,
              file: window.masterIconFile,
              width: sourceImg.naturalWidth || sourceImg.width,
              height: sourceImg.naturalHeight || sourceImg.height,
              mipmaps: window.generatedMipmaps,
            },
          })
        );
      });
    });
  }

  // Core File Processor
  function processMasterFile(file) {
    if (!file) return;

    // Validate MIME type & file extension
    const isImage = file.type.startsWith('image/') || /\.(png|webp|jpe?g)$/i.test(file.name);
    if (!isImage) {
      showDropzoneError(
        'Invalid File Type',
        `"${file.name}" is not a valid image format. Please drop a 512×512 PNG master logo.`
      );
      return;
    }

    clearDropzoneError();
    const reader = new FileReader();

    reader.onload = function (e) {
      const dataUrl = e.target.result;
      const img = new Image();

      img.onload = function () {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        // Check aspect ratio (prefer 1:1)
        const isSquare = width === height;
        const isExact512 = width === 512 && height === 512;

        if (!isSquare) {
          showDropzoneError(
            'Non-Square Aspect Ratio',
            `Master asset is ${width}×${height} (not 1:1 square). Android mipmaps will center-scale to square format.`
          );
        }

        // Store in global state
        window.masterIconImage = img;
        window.masterIconFile = file;

        // Update Dropzone UI
        const dropzoneIdle = document.getElementById('dropzone-idle');
        const dropzonePreview = document.getElementById('dropzone-preview');
        const previewImg = document.getElementById('preview-img');
        const previewFilename = document.getElementById('preview-filename');
        const metaDimensions = document.getElementById('meta-dimensions');
        const metaFilesize = document.getElementById('meta-filesize');
        const metaMime = document.getElementById('meta-mime');
        const validationPill = document.getElementById('preview-validation-pill');

        if (dropzoneIdle) dropzoneIdle.classList.add('hidden');
        if (dropzonePreview) {
          dropzonePreview.classList.remove('hidden');
          dropzonePreview.classList.add('flex');
        }
        if (previewImg) previewImg.src = dataUrl;
        if (previewFilename) previewFilename.textContent = file.name;
        if (metaDimensions) metaDimensions.textContent = `${width} × ${height} px`;
        if (metaFilesize) metaFilesize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
        if (metaMime) metaMime.textContent = file.type || 'image/png';

        if (validationPill) {
          if (isExact512) {
            validationPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 flex items-center gap-1';
            validationPill.innerHTML = '<i data-lucide="check" class="w-3 h-3"></i> Valid 512×512';
          } else {
            validationPill.className = 'px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/40 flex items-center gap-1';
            validationPill.innerHTML = `<i data-lucide="alert-triangle" class="w-3 h-3"></i> ${width}×${height} (Rescaled)`;
          }
        }

        refreshIcons();

        // Trigger downsampling across all Android mipmaps
        generateAllAndroidMipmaps(img);
      };

      img.onerror = function () {
        showDropzoneError('Decode Failed', 'Unable to decode image data. Please ensure the PNG file is valid.');
      };

      img.src = dataUrl;
    };

    reader.onerror = function () {
      showDropzoneError('Read Failed', 'An error occurred while reading the file from your filesystem.');
    };

    reader.readAsDataURL(file);
  }

  // Programmatic 512x512 Modern Developer Logo Generator
  function generateSampleMasterIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 1. Transparent clean base
    ctx.clearRect(0, 0, 512, 512);

    // 2. High-tech rounded squircle path
    const r = 105;
    const x = 32, y = 32, w = 448, h = 448;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    // 3. Electric Indigo to Purple Gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#6366F1');
    grad.addColorStop(0.5, '#4F46E5');
    grad.addColorStop(1, '#9333EA');

    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(99, 102, 241, 0.45)';
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 15;
    ctx.fill();

    // Reset shadow for inner strokes
    ctx.shadowColor = 'transparent';

    // 4. Subtle inner border highlight
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.stroke();

    // 5. Code bracket glyph </>
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 160px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('</>', 256, 256);

    // Convert to File & process
    canvas.toBlob(function (blob) {
      const sampleFile = new File([blob], 'master_icon_512.png', { type: 'image/png' });
      processMasterFile(sampleFile);
    }, 'image/png');
  }

  // Unload / Reset Master Asset
  function unloadMasterAsset() {
    window.masterIconImage = null;
    window.masterIconFile = null;
    window.generatedMipmaps = {};

    const dropzoneIdle = document.getElementById('dropzone-idle');
    const dropzonePreview = document.getElementById('dropzone-preview');
    const fileInput = document.getElementById('file-input');

    if (fileInput) fileInput.value = '';
    if (dropzonePreview) {
      dropzonePreview.classList.add('hidden');
      dropzonePreview.classList.remove('flex');
    }
    if (dropzoneIdle) dropzoneIdle.classList.remove('hidden');

    clearDropzoneError();
    updatePipelineStatus('idle');

    // Reset density rows in Card 1
    const cardMipmap = document.getElementById('card-mipmap');
    if (cardMipmap) {
      const rows = cardMipmap.querySelectorAll('.space-y-2\\.5 > div');
      rows.forEach(function (row) {
        const previewContainer = row.querySelector('.checkerboard-bg');
        if (previewContainer) {
          // Check target width from text
          const rowText = row.textContent || '';
          let sizeLabel = '48';
          if (rowText.includes('hdpi') && !rowText.includes('xhdpi')) sizeLabel = '72';
          else if (rowText.includes('xxxhdpi')) sizeLabel = '192';
          else if (rowText.includes('xxhdpi')) sizeLabel = '144';
          else if (rowText.includes('xhdpi')) sizeLabel = '96';

          previewContainer.innerHTML = `<span class="mipmap-fallback-icon text-[10px] font-mono text-slate-500">${sizeLabel}</span>`;
        }
      });
    }

    // Notify listeners
    window.dispatchEvent(
      new CustomEvent('masterImageUpdated', {
        detail: { image: null, file: null, mipmaps: {} },
      })
    );

    refreshIcons();
  }

  // Setup DOM Event Listeners
  function init() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const btnBrowse = document.getElementById('btn-browse-file');
    const btnReplace = document.getElementById('btn-replace-asset');
    const btnRemove = document.getElementById('btn-remove-asset');
    const btnDownloadMaster = document.getElementById('btn-download-master');
    const btnDismissError = document.getElementById('btn-dismiss-error');

    // Drag and Drop Events
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(function (evtName) {
        dropzone.addEventListener(evtName, function (e) {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dropzone-active');
        });
      });

      ['dragleave', 'drop'].forEach(function (evtName) {
        dropzone.addEventListener(evtName, function (e) {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dropzone-active');
        });
      });

      dropzone.addEventListener('drop', function (e) {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processMasterFile(e.dataTransfer.files[0]);
        }
      });

      dropzone.addEventListener('click', function () {
        if (!window.masterIconImage && fileInput) {
          fileInput.click();
        }
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (this.files && this.files.length > 0) {
          processMasterFile(this.files[0]);
        }
      });
    }

    if (btnBrowse) {
      btnBrowse.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    }

    if (btnReplace) {
      btnReplace.addEventListener('click', function (e) {
        e.stopPropagation();
        if (fileInput) fileInput.click();
      });
    }

    if (btnRemove) {
      btnRemove.addEventListener('click', function (e) {
        e.stopPropagation();
        unloadMasterAsset();
      });
    }

    if (btnDismissError) {
      btnDismissError.addEventListener('click', function (e) {
        e.stopPropagation();
        clearDropzoneError();
      });
    }

    if (btnDownloadMaster) {
      btnDownloadMaster.addEventListener('click', function (e) {
        e.stopPropagation();
        if (!window.masterIconImage) return;
        const link = document.createElement('a');
        link.href = window.masterIconImage.src;
        link.download = (window.masterIconFile && window.masterIconFile.name) || 'master_512x512.png';
        link.click();
      });
    }

    // Sample buttons
    ['btn-load-sample', 'btn-sample-trigger', 'btn-mobile-sample'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          generateSampleMasterIcon();
        });
      }
    });

    // Register hook for DevAssetStudio
    window.DevAssetStudio = window.DevAssetStudio || {};
    window.DevAssetStudio.hooks = window.DevAssetStudio.hooks || {};
    window.DevAssetStudio.hooks.onMasterAssetLoaded = function (file, img) {
      window.masterIconImage = img;
      window.masterIconFile = file;
      generateAllAndroidMipmaps(img);
    };
    window.DevAssetStudio.generateSampleMasterIcon = generateSampleMasterIcon;
    window.DevAssetStudio.processMasterFile = processMasterFile;

    updatePipelineStatus('idle');
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
