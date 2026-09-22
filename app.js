/**
 * DevAsset Studio • Main Application Navigation & Workspace State Manager (app.js)
 * 
 * WORKSPACE ISOLATION (ZERO CLUTTER):
 * - Converts the main view into a single active panel viewport.
 * - Sidebar menu items act as view switchers for 5 discrete steps:
 *     Step 1: Master Icon & Mipmaps (#view-step-1)
 *     Step 2: Feature Graphic Banner (#view-step-2)
 *     Step 3: Screenshots Mockup (#view-step-3)
 *     Step 4: ASO Policy Check (#view-step-4)
 *     Step 5: Privacy Policy (#view-step-5)
 * - Only the selected step's view card is visible on screen. All other step cards are hidden.
 * - Sequential navigation ("Next Step ➔" and "⬅ Previous Step") links between steps.
 * - Standalone step downloads and persistent master bundle export integration.
 */

(function () {
  'use strict';

  window.DevAssetStudio = window.DevAssetStudio || {};

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
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
  window.DevAssetStudio.refreshIcons = refreshIcons;

  function openMobileDrawer() {
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerContent = document.getElementById('mobile-drawer-content');
    if (!mobileDrawer) return;

    mobileDrawer.classList.remove('hidden');
    requestAnimationFrame(function () {
      mobileDrawer.classList.remove('opacity-0');
      mobileDrawer.classList.add('opacity-100');
      if (mobileDrawerContent) {
        mobileDrawerContent.classList.remove('-translate-x-full');
      }
    });
  }

  function closeMobileDrawer() {
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerContent = document.getElementById('mobile-drawer-content');
    if (!mobileDrawer) return;

    mobileDrawer.classList.remove('opacity-100');
    mobileDrawer.classList.add('opacity-0');
    if (mobileDrawerContent) {
      mobileDrawerContent.classList.add('-translate-x-full');
    }
    setTimeout(function () {
      mobileDrawer.classList.add('hidden');
    }, 300);
  }

  function initAppNavigation() {
    // 4 Consolidated Isolated Step View Containers
    function getStepView(num) {
      return document.getElementById(`view-step-${num}`);
    }

    // Desktop Nav Items (01 through 04)
    const desktopNavLinks = {
      1: document.getElementById('nav-step-1'),
      2: document.getElementById('nav-step-2'),
      3: document.getElementById('nav-step-3'),
      4: document.getElementById('nav-step-4'),
    };

    // Mobile Nav Items (01 through 04)
    const mobileNavLinks = {
      1: document.getElementById('mobile-nav-step-1'),
      2: document.getElementById('mobile-nav-step-2'),
      3: document.getElementById('mobile-nav-step-3'),
      4: document.getElementById('mobile-nav-step-4'),
    };

    let currentStep = 1;

    /**
     * Update active class state for both desktop vertical sidebar and mobile navigation links
     */
    function updateActiveNav(stepNumber) {
      const activeNum = parseInt(stepNumber, 10) || 1;

      for (let i = 1; i <= 4; i++) {
        const dLink = desktopNavLinks[i];
        if (dLink) {
          const numBadge = dLink.querySelector('span');
          if (i === activeNum) {
            dLink.className = 'nav-module-link group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer bg-indigo-600/15 border border-indigo-500/40 text-white shadow-xs';
            if (numBadge) {
              numBadge.className = 'w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono text-xs flex items-center justify-center font-bold border border-indigo-500/30 shrink-0';
            }
          } else {
            dLink.className = 'nav-module-link group flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border border-transparent text-slate-300 hover:text-white hover:bg-surface-hover';
            if (numBadge) {
              numBadge.className = 'w-7 h-7 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold shrink-0';
            }
          }
        }

        const mLink = mobileNavLinks[i];
        if (mLink) {
          const mBadge = mLink.querySelector('span');
          if (i === activeNum) {
            mLink.className = 'mobile-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600/20 border border-indigo-500/30';
            if (mBadge) {
              mBadge.className = 'w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 font-mono text-xs flex items-center justify-center font-bold';
            }
          } else {
            mLink.className = 'mobile-nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-surface-hover border border-transparent';
            if (mBadge) {
              mBadge.className = 'w-5 h-5 rounded-md bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold';
            }
          }
        }
      }
    }

    /**
     * Switch to a specific step view (1-4)
     * WORKSPACE ISOLATION: Only the active step is visible. All others are display:none / hidden.
     */
    function switchStep(targetStep) {
      let stepNum = parseInt(targetStep, 10);
      if (isNaN(stepNum) || stepNum < 1) {
        stepNum = 1;
      }
      if (stepNum > 4) {
        stepNum = 4; // Map legacy Step 5 to Step 4
      }

      currentStep = stepNum;

      // Hide all step views completely; activate requested step
      for (let i = 1; i <= 4; i++) {
        const view = getStepView(i);
        if (view) {
          if (i === stepNum) {
            view.classList.remove('hidden');
            view.classList.add('flex', 'active');
          } else {
            view.classList.add('hidden');
            view.classList.remove('flex', 'active');
          }
        }
      }

      // Hide any lingering legacy containers if present
      const legacyStep5 = document.getElementById('view-step-5');
      if (legacyStep5 && stepNum !== 4) {
        legacyStep5.classList.add('hidden');
      }

      // Update active nav indicator styles
      updateActiveNav(stepNum);

      // Trigger re-render of canvas if entering screenshots mockup studio (Step 2)
      if (stepNum === 2 && window.DevAssetStudio.screenshotEngine && typeof window.DevAssetStudio.screenshotEngine.scheduleRender === 'function') {
        window.DevAssetStudio.screenshotEngine.scheduleRender();
      }

      // Update URL hash smoothly without reloading
      if (history.replaceState) {
        history.replaceState(null, null, `#view-step-${stepNum}`);
      } else {
        window.location.hash = `#view-step-${stepNum}`;
      }

      // Smooth scroll to target view avoiding header clipping
      const targetView = getStepView(stepNum);
      if (targetView) {
        const topBar = document.getElementById('topbar');
        const ecoBar = document.getElementById('ecosystem-top-bar');
        const headerOffset = (topBar ? topBar.offsetHeight : 64) + (ecoBar ? ecoBar.offsetHeight : 52) + 20;
        const rect = targetView.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetScrollTop = Math.max(0, rect.top + scrollTop - headerOffset);
        window.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }

      refreshIcons();
    }

    // Connect Desktop & Mobile Nav Click Handlers
    for (let i = 1; i <= 4; i++) {
      const dLink = desktopNavLinks[i];
      if (dLink) {
        dLink.addEventListener('click', function (e) {
          e.preventDefault();
          switchStep(i);
        });
      }

      const mLink = mobileNavLinks[i];
      if (mLink) {
        mLink.addEventListener('click', function (e) {
          e.preventDefault();
          closeMobileDrawer();
          switchStep(i);
        });
      }
    }

    // Connect Sequential Next / Prev Step Navigation Buttons
    // Step 1 -> Step 2
    const btnStep1Next = document.getElementById('btn-step1-next');
    if (btnStep1Next) {
      btnStep1Next.addEventListener('click', function () {
        switchStep(2);
      });
    }

    // Step 2 -> Step 1 (Prev), Step 2 -> Step 3 (Next)
    const btnStep2Prev = document.getElementById('btn-step2-prev');
    if (btnStep2Prev) {
      btnStep2Prev.addEventListener('click', function () {
        switchStep(1);
      });
    }
    const btnStep2Next = document.getElementById('btn-step2-next');
    if (btnStep2Next) {
      btnStep2Next.addEventListener('click', function () {
        switchStep(3);
      });
    }

    // Step 3 -> Step 2 (Prev), Step 3 -> Step 4 (Next)
    const btnStep3Prev = document.getElementById('btn-step3-prev') || document.getElementById('btn-step3-prev-bottom');
    if (btnStep3Prev) {
      btnStep3Prev.addEventListener('click', function () {
        switchStep(2);
      });
    }
    const btnStep3Next = document.getElementById('btn-step3-next') || document.getElementById('btn-step3-next-bottom');
    if (btnStep3Next) {
      btnStep3Next.addEventListener('click', function () {
        switchStep(4);
      });
    }

    // Step 4 -> Step 3 (Prev)
    const btnStep4Prev = document.getElementById('btn-step4-prev') || document.getElementById('btn-privacy-back-to-core') || document.getElementById('btn-step5-prev-bottom');
    if (btnStep4Prev) {
      btnStep4Prev.addEventListener('click', function () {
        switchStep(3);
      });
    }

    // Step 4 -> Complete Bundle (Next)
    const btnStep4Next = document.getElementById('btn-step4-next');
    if (btnStep4Next) {
      btnStep4Next.addEventListener('click', function () {
        if (typeof window.DevAssetStudio.exportPlayStoreBundle === 'function') {
          window.DevAssetStudio.exportPlayStoreBundle();
        }
      });
    }

    // Standalone Step Downloads
    // Step 1: Download Step Assets (.ZIP)
    const btnDownloadStep1Zip = document.getElementById('btn-download-step1-zip');
    if (btnDownloadStep1Zip) {
      btnDownloadStep1Zip.addEventListener('click', function () {
        if (typeof window.DevAssetStudio.exportStep1Bundle === 'function') {
          window.DevAssetStudio.exportStep1Bundle();
        } else if (typeof window.DevAssetStudio.exportMipmapsZip === 'function') {
          window.DevAssetStudio.exportMipmapsZip();
        }
      });
    }

    // Step 2: Download Mockups (.ZIP)
    const btnDownloadMockupsZip = document.getElementById('btn-download-mockups-zip');
    if (btnDownloadMockupsZip) {
      btnDownloadMockupsZip.addEventListener('click', function () {
        if (typeof window.DevAssetStudio.exportScreenshotBundle === 'function') {
          window.DevAssetStudio.exportScreenshotBundle();
        }
      });
    }

    // Step 3: Download Metadata (.TXT / .JSON)
    const btnDownloadMetadataStandalone = document.getElementById('btn-download-metadata-standalone');
    if (btnDownloadMetadataStandalone) {
      btnDownloadMetadataStandalone.addEventListener('click', function () {
        if (typeof window.DevAssetStudio.exportMetadataZip === 'function') {
          window.DevAssetStudio.exportMetadataZip();
        }
      });
    }

    // Step 4: Download Policy (.MD / .HTML)
    const btnDownloadPolicyStandalone = document.getElementById('btn-download-policy-standalone');
    if (btnDownloadPolicyStandalone) {
      btnDownloadPolicyStandalone.addEventListener('click', function () {
        if (typeof window.DevAssetStudio.exportPolicyBundle === 'function') {
          window.DevAssetStudio.exportPolicyBundle();
        }
      });
    }

    // Mobile Drawer Open / Close Triggers
    const mobileDrawerOpen = document.getElementById('mobile-drawer-open');
    if (mobileDrawerOpen) {
      mobileDrawerOpen.addEventListener('click', function () {
        openMobileDrawer();
      });
    }
    const mobileDrawerClose = document.getElementById('mobile-drawer-close');
    if (mobileDrawerClose) {
      mobileDrawerClose.addEventListener('click', function () {
        closeMobileDrawer();
      });
    }

    // =========================================================================
    // MULTI-ECOSYSTEM NAVIGATION CONTROLLER
    // [ Google Play ], [ Apple / iOS ], [ Samsung Galaxy Store ], [ Amazon Appstore ]
    // =========================================================================
    let currentEcosystem = 'google';

    const ecosystemTabs = {
      google: document.getElementById('tab-btn-google'),
      apple: document.getElementById('tab-btn-apple'),
      samsung: document.getElementById('tab-btn-samsung'),
      amazon: document.getElementById('tab-btn-amazon'),
    };

    const ecosystemViews = {
      google: document.getElementById('ecosystem-view-google'),
      apple: document.getElementById('ecosystem-view-apple'),
      samsung: document.getElementById('ecosystem-view-samsung'),
      amazon: document.getElementById('ecosystem-view-amazon'),
    };

    const ecosystemSeo = {
      google: {
        hash: '#google-play',
        title: 'Google Play Asset Generator | DevAsset Studio',
        description: 'Create Google Play compliant app icons, feature graphics, screenshots, metadata, and downloadable store bundles in your browser with DevAsset Studio.',
        schemaName: 'Google Play Asset Generator'
      },
      apple: {
        hash: '#apple-ios',
        title: 'Apple iOS App Store Asset Generator | DevAsset Studio',
        description: 'Prepare Apple iOS App Store icons, Xcode AppIcon assets, screenshots, metadata, and downloadable bundles locally in your browser with DevAsset Studio.',
        schemaName: 'Apple iOS App Store Asset Generator'
      },
      samsung: {
        hash: '#samsung-galaxy',
        title: 'Samsung Galaxy Store Asset Generator | DevAsset Studio',
        description: 'Generate Samsung Galaxy Store icons, One UI assets, banners, screenshots, metadata, and downloadable store bundles locally with DevAsset Studio.',
        schemaName: 'Samsung Galaxy Store Asset Generator'
      },
      amazon: {
        hash: '#amazon-appstore',
        title: 'Amazon Appstore Asset Generator | DevAsset Studio',
        description: 'Create Amazon Appstore icons, promotional graphics, Fire tablet screenshots, metadata, and downloadable store bundles in your browser with DevAsset Studio.',
        schemaName: 'Amazon Appstore Asset Generator'
      }
    };

    function updateEcosystemSeo(ecoKey) {
      const seo = ecosystemSeo[ecoKey] || ecosystemSeo.google;
      const pageUrl = `${window.location.origin}${window.location.pathname}${seo.hash}`;
      const setContent = function (id, value) {
        const element = document.getElementById(id);
        if (element) element.setAttribute('content', value);
      };

      document.title = seo.title;
      setContent('meta-description', seo.description);
      setContent('og-title', seo.title);
      setContent('og-description', seo.description);
      setContent('og-url', pageUrl);
      setContent('twitter-title', seo.title);
      setContent('twitter-description', seo.description);
      const canonicalElement = document.getElementById('canonical-url');
      if (canonicalElement) canonicalElement.setAttribute('href', pageUrl);

      const schemaElement = document.getElementById('web-application-schema');
      if (schemaElement) {
        try {
          const schema = JSON.parse(schemaElement.textContent || '{}');
          schema.name = seo.schemaName;
          schema.description = seo.description;
          schema.url = pageUrl;
          schemaElement.textContent = JSON.stringify(schema);
        } catch (error) {
          // Keep the static WebApplication schema if a page has malformed JSON-LD.
        }
      }
    }

    function ecosystemFromHash(hash) {
      const normalizedHash = (hash || '').toLowerCase();
      return Object.keys(ecosystemSeo).find(function (key) {
        return ecosystemSeo[key].hash === normalizedHash;
      }) || null;
    }

    function updateDockAction(ecoKey) {
      const dockBtn = document.getElementById('btn-export-smart-bundle') || document.getElementById('btn-download-bundle');
      const dockLabel = document.getElementById('bundle-btn-text');
      const dockSub = document.getElementById('footer-pipeline-status');
      const storeBadge = document.getElementById('bundle-toolbar-store-name');

      const storeNames = {
        google: 'Google Play',
        apple: 'Apple iOS',
        samsung: 'Samsung Galaxy',
        amazon: 'Amazon Appstore'
      };

      if (storeBadge) {
        storeBadge.textContent = storeNames[ecoKey] || 'Google Play';
      }

      if (dockLabel) {
        dockLabel.textContent = 'Export Generated Store Bundle (.ZIP)';
      }

      if (dockSub) {
        if (ecoKey === 'apple') {
          dockSub.textContent = 'Xcode AppIcon.appiconset + 1024×1024 0% Alpha App Store & Mockups';
        } else if (ecoKey === 'samsung') {
          dockSub.textContent = 'One UI Squircle Icon, 1024×500 Banner & 1080×1920 Screens';
        } else if (ecoKey === 'amazon') {
          dockSub.textContent = 'Large 512×512, Small 114×114, Promo Banner & Fire Tablets';
        } else {
          dockSub.textContent = 'Android res/mipmap-*, 512 Icon, Banner, Screens & Policy';
        }
      }
    }

    function switchEcosystem(ecoKey) {
      if (!['google', 'apple', 'samsung', 'amazon'].includes(ecoKey)) {
        ecoKey = 'google';
      }
      currentEcosystem = ecoKey;

      updateEcosystemSeo(ecoKey);
      if (window.location.hash !== ecosystemSeo[ecoKey].hash) {
        history.pushState(null, '', ecosystemSeo[ecoKey].hash);
      }

      // Update Tab styling
      Object.keys(ecosystemTabs).forEach(key => {
        const btn = ecosystemTabs[key];
        if (btn) {
          if (key === ecoKey) {
            btn.className = 'ecosystem-tab-btn active px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 text-white bg-indigo-600/90 shadow-xs border border-indigo-500/40';
          } else {
            btn.className = 'ecosystem-tab-btn px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-surface/50 border border-transparent';
          }
        }
      });

      // Update View Containers
      Object.keys(ecosystemViews).forEach(key => {
        const view = ecosystemViews[key];
        if (view) {
          if (key === ecoKey) {
            view.classList.remove('hidden');
          } else {
            view.classList.add('hidden');
          }
        }
      });

      updateDockAction(ecoKey);

      // Trigger redraws if needed
      if (ecoKey === 'apple' && window.DevAssetStudio.iosEngine && typeof window.DevAssetStudio.iosEngine.renderIosMockup === 'function') {
        window.DevAssetStudio.iosEngine.renderIosMockup();
      } else if (ecoKey === 'samsung' && window.DevAssetStudio.samsungEngine) {
        window.DevAssetStudio.samsungEngine.renderSamsungBanner();
        window.DevAssetStudio.samsungEngine.renderSamsungScreenshot();
      } else if (ecoKey === 'amazon' && window.DevAssetStudio.amazonEngine) {
        window.DevAssetStudio.amazonEngine.renderAmazonBanner();
        window.DevAssetStudio.amazonEngine.renderAmazonTablet();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
      refreshIcons();
    }

    // Attach click listeners to ecosystem tabs
    Object.keys(ecosystemTabs).forEach(key => {
      const btn = ecosystemTabs[key];
      if (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          switchEcosystem(key);
        });
      }
    });

    window.addEventListener('hashchange', function () {
      const hashEcosystem = ecosystemFromHash(window.location.hash);
      if (hashEcosystem && hashEcosystem !== currentEcosystem) {
        switchEcosystem(hashEcosystem);
      }
    });
    window.addEventListener('popstate', function () {
      const hashEcosystem = ecosystemFromHash(window.location.hash);
      if (hashEcosystem && hashEcosystem !== currentEcosystem) {
        switchEcosystem(hashEcosystem);
      }
    });

    // Expose global methods
    window.DevAssetStudio.switchStep = switchStep;
    window.DevAssetStudio.switchEcosystem = switchEcosystem;
    window.DevAssetStudio.getCurrentEcosystem = function () {
      return currentEcosystem;
    };
    window.DevAssetStudio.getCurrentStep = function () {
      return currentStep;
    };

    // Override bottom dock button to route based on active ecosystem
    const dockMainBtn = document.getElementById('btn-download-bundle');
    if (dockMainBtn && !dockMainBtn.dataset.listenerBound) {
      dockMainBtn.dataset.listenerBound = 'true';
      dockMainBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.DevAssetStudio.exportActiveEcosystemBundle === 'function') {
          window.DevAssetStudio.exportActiveEcosystemBundle();
        } else if (currentEcosystem === 'apple') {
          if (window.DevAssetStudio.iosEngine) window.DevAssetStudio.iosEngine.exportIosZip();
        } else if (currentEcosystem === 'samsung') {
          if (window.DevAssetStudio.samsungEngine) window.DevAssetStudio.samsungEngine.exportSamsungZip();
        } else if (currentEcosystem === 'amazon') {
          if (window.DevAssetStudio.amazonEngine) window.DevAssetStudio.amazonEngine.exportAmazonZip();
        } else {
          if (typeof window.DevAssetStudio.exportPlayStoreBundle === 'function') {
            window.DevAssetStudio.exportPlayStoreBundle();
          }
        }
      });
    }

    // Backward compatibility aliases
    window.DevAssetStudio.switchTab = function (tabKey) {
      if (tabKey === 'dropzone' || tabKey === 'mipmap' || tabKey === 'step-1' || tabKey === 1) switchStep(1);
      else if (tabKey === 'feature' || tabKey === 'step-2' || tabKey === 2) switchStep(1); // Merged into Step 1
      else if (tabKey === 'screenshots' || tabKey === 'step-3' || tabKey === 3) switchStep(2);
      else if (tabKey === 'aso' || tabKey === 'step-4' || tabKey === 4) switchStep(3);
      else if (tabKey === 'privacy' || tabKey === 'step-5' || tabKey === 5) switchStep(4);
      else switchStep(1);
    };
    window.DevAssetStudio.switchView = window.DevAssetStudio.switchTab;

    // Check store URL hash before the legacy workspace-step hash on page load.
    const initialHash = window.location.hash;
    const initialEcosystem = ecosystemFromHash(initialHash);
    if (initialEcosystem) {
      switchEcosystem(initialEcosystem);
    } else if (initialHash === '#view-step-2' || initialHash === '#view-screenshot-studio') {
      switchStep(2);
    } else if (initialHash === '#view-step-3' || initialHash === '#view-step-4' || initialHash === '#card-aso') {
      switchStep(3);
    } else if (initialHash === '#view-step-5' || initialHash === '#view-privacy-policy' || initialHash === '#card-privacy') {
      switchStep(4);
    } else {
      switchStep(1);
    }

    refreshIcons();
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAppNavigation);
  } else {
    initAppNavigation();
  }
})();

