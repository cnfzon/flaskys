# NTUT Dynamic Grade Management Platform

> **⚠️ PROJECT STATUS: DISCONTINUED** > This project has been officially canceled by the upstream sponsor (Project PI). Development is no longer active. The codebase represents the final POC (Proof of Concept) stage and is now publicly available under the **MIT License** for educational purposes or future handovers.

---

## 專案概述 (Overview)
本計畫為國立臺北科技大學（NTUT）電子工程系 **陳彥笙教授** 實驗室之教學網站開發專案。旨在建立一個安全、重視隱私且具備高度自由度的成績管理與教學資源平台。

### 核心功能 (Current Features - POC Stage)
* **身分驗證**：整合 Firebase Authentication。
* **權限管理 (RBAC)**：初步實作教師、助教（TA）與學生之視角切換。
* **動態數據**：支援成績組件與圖表顯示。
* **雲端部署**：系統目前部署於 Vercel，具備高可用性。

---

## Tech Stack
* **Frontend**: Next.js / TypeScript / Tailwind CSS
* **Backend/Database**: Firebase (Firestore & Auth)
* **Deployment**: Vercel
* **Package Manager**: pnpm

---

## Handover Note
由於開發合約已終止，後續接手者請注意：
1. **環境變數**：需自行設定 `.env.local` 包含 Firebase API Keys。
2. **權限移交**：專案管理權限（Vercel/Firebase）需由原開發者進行 Owner 移轉。
3. **授權條款**：本專案採用 **MIT License**，允許自由修改與再發佈。

---

## Author
**Cnfzon**