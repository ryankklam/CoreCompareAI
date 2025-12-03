# CoreCompare AI - Banking Migration Toolkit 🏦

**CoreCompare AI** is a specialized user interface designed for banking technology teams performing core system migrations (e.g., migrating from a Legacy Mainframe to a Cloud-Native Core). 

It automates the comparison of transaction and master data, visualizes discrepancies, and utilizes **Google Gemini AI** to explain root causes for data mismatches that do not fit standard migration rules.

![App Status](https://img.shields.io/badge/Status-Prototype-blue)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Gemini-green)

## 🚀 Key Features

### 1. Automated Data Comparison
- **Record Matching:** Compares Legacy data vs. New Core data side-by-side.
- **Dynamic Field Analysis:** Automatically detects which fields (Principal, Interest Rate, Dates, etc.) differ between systems.
- **Rule-Based Classification:** Automatically tags discrepancies based on a "Known Discrepancy Dictionary" (e.g., Rounding differences, Timezone offsets).

### 2. AI-Powered Analysis (Gemini)
- **Root Cause Analysis:** When a discrepancy is flagged as `UNKNOWN`, the app sends the record payload to Gemini. The AI analyzes the data context to suggest functional reasons (e.g., "End-of-day logic difference" or "Fee calculation variance").
- **Executive Summaries:** Generates professional Go/No-Go summaries and risk assessments based on the statistical data of the batch run.

### 3. Interactive Dashboard
- **Visual Analytics:** Pie charts and Bar charts (using Recharts) to show Match Rates and Top Discrepancy Categories.
- **Field-Level Heatmap:** Identifies which specific data fields (e.g., `maturityDate`) are causing the most failures.

### 4. Job Execution Simulation
- Simulate batch processing jobs for different data domains (Loan Master, Transaction History).
- View run history, duration, and status.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **Visualization:** Recharts
- **Icons:** Lucide React
- **AI Integration:** Google GenAI SDK (`@google/genai`)

## ⚙️ Configuration & Logic

### Known Discrepancy Dictionary
The heart of the classification engine is located in `constants.ts`. This dictionary defines "acceptable" or "known" gaps that occur during migration.

Example:
- **R001 (Rounding):** Variance < 0.1 due to floating point math.
- **R003 (Date Offset):** Timestamp shifts due to timezone conversion (UTC vs Local).
- **R005 (Record Drop):** Critical failure where a record didn't migrate.

### Mock Data Generation
The app currently runs on a deterministic mock data generator (`generateMockData` in `constants.ts`) that simulates:
- A legacy database schema.
- A new core schema.
- Controlled "random" variances to demonstrate the comparison logic (approx. 28% error rate simulation).

## 🚀 Getting Started

### Prerequisites
To use the AI features, you must have a Google Gemini API Key.

### Installation

1. **Clone the repository** (or download source).
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Set up API Key:**
   Ensure `process.env.API_KEY` is available in your environment, or configure your build tool to inject it.
4. **Run the app:**
   ```bash
   npm start
   ```

## 📱 Mobile Support
The application is fully responsive:
- **Desktop:** Full sidebar navigation and side-by-side comparison panels.
- **Mobile:** Collapsible hamburger menu, optimized table views, and full-screen detail overlays.

## 🛡️ License
Private / Proprietary Banking Tool Prototype.
