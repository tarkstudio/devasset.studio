<div align="center">

# DevAsset Studio 🚀
**100% In-Browser Multi-Store Mobile Asset & Icon Suite Generator**

Fast, privacy-focused, zero-dependency asset pipeline for Android, iOS, Samsung One UI, and Amazon Fire OS.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![AlternativeTo](https://img.shields.io/badge/AlternativeTo-Listed-0078D7?style=flat-square&logo=alternativeto&logoColor=white)](https://alternativeto.net/software/devasset-studio/)
[![GitHub Stars](https://img.shields.io/github/stars/tarkstudio/devasset.studio?style=flat-square&logo=github)](https://github.com/tarkstudio/devasset.studio/stargazers)
[![Status](https://img.shields.io/badge/Maintained%3F-yes-brightgreen.svg?style=flat-square)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

[🚀 **Launch Live Tool**](https://tarkstudio.github.io/devasset.studio/) • [🐛 **Report Bug**](https://github.com/tarkstudio/devasset.studio/issues) • [⭐ **Star Repo**](https://github.com/tarkstudio/devasset.studio)

</div>

---

## ⚡ Why DevAsset Studio?

Most online app icon resizers trap developers behind **email captures, paywalls, slow cloud uploads, or incomplete zip structures**. 

DevAsset Studio fixes this by performing **100% of image rendering, squircle masking, and zip packaging inside your browser's RAM** using HTML5 Canvas API.

* **Zero Server Uploads**: No image data leaves your local machine.
* **Instant Export**: Sub-second bundle generation directly in browser memory.
* **One-Click All Stores**: Android, Apple iOS, Samsung Galaxy Store, and Amazon Fire OS in a single zip package.

---

## 📦 What You Get in the Export

```text
devasset_bundle.zip
├── android/
│   ├── ic_launcher_master_512x512.png (Google Play Store Master)
│   ├── play_store_feature_graphic_1024x500.png
│   └── res/
│       ├── mipmap-mdpi/ (48x48)
│       ├── mipmap-hdpi/ (72x72)
│       ├── mipmap-xhdpi/ (96x96)
│       ├── mipmap-xxhdpi/ (144x144)
│       └── mipmap-xxxhdpi/ (192x192)
├── ios/
│   └── AppIcon.appiconset/
│       ├── Contents.json (Pre-configured for Xcode 15/16)
│       ├── Icon-App-20x20@2x.png ... Icon-App-60x60@3x.png
│       └── Icon-App-1024x1024@1x.png (App Store Master)
├── samsung/
│   ├── galaxy_store_icon_512x512.png (Precise One UI Squircle Mask)
│   └── promo_banner_1024x500.png
└── amazon/
    ├── amazon_fireos_512x512.png
    └── promotional_header_1024x500.png
```

---

## 🛠️ Tech Stack & Architecture

- **Engine**: Pure Vanilla JavaScript (Zero bloated frameworks)
- **Image Pipeline**: Native HTML5 Canvas 2D Context
- **Archiving**: JSZip (In-memory asynchronous compression)
- **Hosting**: GitHub Pages (Global Edge CDN)
- **License**: MIT Permissive License

---

## 🤝 Contributing & Feedback

Contributions, issues, and feature suggestions are welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for full details.

Developed & Maintained with care by [Tark Studio](https://tarkstudio.github.io).

---

## ⚖️ Legal Disclaimer

All product and company names (including Google Play, Apple iOS, Xcode, Samsung, and Amazon) are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation with, endorsement, or sponsorship by them. DevAsset Studio is an independent open-source tool built to help developers export assets in compatible formats.
