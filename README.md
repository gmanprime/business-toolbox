# Fiscal Register Tool (የፋይናንስ መመዝገቢያ መሣሪያ) 🧾

> **High-Integrity Data Parsing, Extraction, and Reporting Engine for Ethiopian ERCA / Ministry of Revenues Certified Fiscal Cash Registers (Model: HEK0105410).**

[![Tauri v2](https://img.shields.io/badge/Tauri-v2.0-blue.svg)](https://tauri.app/)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-Core%20Engine-orange.svg)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**Fiscal Register Tool** is a desktop and mobile fiscal data processing engine designed specifically for Ethiopian retail and enterprise cash registers. It ingests raw hardware dump text files (serial logs from models such as **HEK0105410**), reconstructs complex multi-item sales transactions, audits sequential fiscal numbering, filters out non-item payment tenders (e.g. `BY CHEQUE`, `CASH`, `CARD`), and formats everything into standardized Ethiopian Ministry of Revenues (ERCA) compliant Excel workbooks and CSV files.

---

## ✨ Key Features

* **⚡ Sequential Fiscal Audit Trail (FS No.)**:
  * Extracts, verifies, and audits consecutive Fiscal Sales receipts (e.g. `FS No. 00000001` through `FS No. 00000426`) with zero missing numbers.
  * Preserves void transactions (`ITEM# 0`) with zeroed amounts for strict audit compliance.

* **📊 14-Column ERCA Standard Sales Export (Sheet 1)**:
  * Flat relational layout mapping every sold item to its parent fiscal receipt context.
  * Full bilingual column support (Amharic & English):
    `ተ. ቁ.` (Serial), `የተሸጠው የእቃ መጠሪያ` (Item Description), `ብዛት` (Quantity), `የአንዱ ሽያጭ ዋጋ ከተእታ በፊት` (Unit Price excl. VAT), `ጠቅላላ ሽያጭ ዋጋ ከተእታ በፊት` (Total excl. VAT), `ተ እ ታ` (15% VAT), `ጠቅላላ ዋጋ ታክስ ጨምሮ` (Grand Total), `የሽያጭ ደረሰኝ ቁጥር (FS No.)`, `ቀን` (Date), `MRC` (`HEK0105410`).

* **📦 Cumulative PLU Inventory Reports (Sheet 2)**:
  * Automatically parses `*** PLU REPORT X ***` blocks.
  * Decouples catalog prices from trailing ERCA tax group indicators (e.g. `90.000 1` $\to$ Base Price: `90.00 ETB`, Tax Group: `1`).
  * Calculates realized revenue and effective unit selling prices.

* **🔒 Duplicate Protection & Embedded Database**:
  * Powered by embedded SQLite in WAL (Write-Ahead Logging) mode.
  * Dual-fingerprint verification prevents double-counting when re-importing past dump files.

* **🖥️ Modern Fluid Interface**:
  * macOS-style floating bottom dock on Desktop; native flush tab bar on Mobile.
  * Desktop OS window bounds ($1000 \times 700$, min $900 \times 600$) to guarantee zero table breakage.
  * Advanced export column selector allowing users to customize which fields are included in output files.

---

## 📥 Download & Install (Windows)

You can download the latest installers directly from the [GitHub Releases](https://github.com/gmanprime/business-toolbox/releases) page:

| Installer | Description | Download |
| :--- | :--- | :--- |
| **Setup Wizard (`.exe`)** | Standard Windows installer with desktop and start menu shortcuts (Recommended) | [Download Setup .exe](https://github.com/gmanprime/business-toolbox/releases/latest) |
| **Enterprise Installer (`.msi`)** | Windows Installer package for IT environments | [Download .msi](https://github.com/gmanprime/business-toolbox/releases/latest) |

---

## 🛠️ Tech Stack & Architecture

```
                    Fiscal Register Tool Application Architecture
                                      │
           ┌──────────────────────────┴──────────────────────────┐
           ▼                                                     ▼
     Frontend GUI                                         Rust Core Engine
  Next.js 14 SSG + Tailwind CSS                       Tauri 2.0 Native Runtime
  • Floating Bottom Dock                              • Regex State Machine Parser
  • Sticky 14-Column ERCA Table                       • Embedded SQLite (WAL Mode)
  • Dynamic Amharic/English Exporter                  • Multi-Sheet Excel (rust_xlsxwriter)
           │                                                     │
           └────────────────── IPC Middleware Bridge ────────────┘
                              src/lib/tauri-bridge.ts
```

* **Frontend**: Next.js 14 (Static Site Generation), React 18, Tailwind CSS, Lucide Icons.
* **Desktop Runtime**: Tauri 2.0 with native dialog plugins (`tauri-plugin-dialog`).
* **Backend Engine**: Native Rust (`splitter`, `fs_parser`, `plu_parser`, `rusqlite`, `rust_xlsxwriter`).

---

## 🚀 Development Setup

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Rust & Cargo](https://rustup.rs/) (v1.75 or higher)
* Windows Visual Studio C++ Build Tools

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gmanprime/business-toolbox.git
   cd business-toolbox
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode (Native Desktop Window):**
   ```bash
   npm run tauri dev
   ```

4. **Run in browser preview mode (Offline Fixtures):**
   ```bash
   npm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) in your web browser.*

5. **Run test suite:**
   ```bash
   cargo test --manifest-path src-tauri/Cargo.toml
   npm run build
   ```

6. **Build production installers:**
   ```bash
   npm run tauri build
   ```
   *Generated packages are saved to `src-tauri/target/release/bundle/nsis/` and `bundle/msi/`.*

---

## 📄 License

Licensed under the [MIT License](LICENSE).
