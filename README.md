# Nomad Wardrobe

> A modern, feature-rich personal wardrobe and packing list manager for digital nomads, minimalists, and organized travelers.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)

**Nomad Wardrobe** is a free, open-source web application that helps you manage your entire wardrobe, create outfit combinations, plan trips with smart packing lists, and showcase your style. Perfect for digital nomads, minimalists, frequent travelers, and anyone who wants to organize their clothing and accessories digitally.

All your data stays private and secure in your browser - no servers, no cloud, no sign-ups required.

## Table of Contents

- [Features](#features)
- [Why Nomad Wardrobe?](#why-nomad-wardrobe)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running Locally](#running-locally)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Data Privacy](#data-privacy)
- [Export & Backup](#export--backup)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgments](#acknowledgments)

## Features

### Comprehensive Inventory Management
- **Add unlimited items** with detailed metadata: name, category, subcategory, color, brand, size, purchase date, condition, location, and notes
- **Upload photos** of each item for visual reference
- **Smart size system** that adapts based on item type (letter sizes for clothing, shoe sizes, dimensions for bags, etc.)
- **Track item condition** (new, good, worn, needs replacement)
- **Climate tagging** (hot weather, cold weather, all-weather)
- **Occasion tagging** (casual, formal, sports, travel, outdoor)
- **Location tracking** (home, suitcase, backpack, storage, laundry)
- **Search and filter** by category, condition, or keyword
- **Grid and list views** for different browsing preferences
- **Duplicate items** quickly for similar pieces
- **Mark items as featured** for your showcase

### Smart Dashboard
- **Visual statistics** showing total items, items needing attention, and active trips
- **Category breakdown** with beautiful progress bars
- **Recently added items** gallery
- **Item condition overview** (new, good, worn, needs replacement)
- **"Consider Replacing" section** highlighting aging items (3+ years old)
- **Personalized greeting** with your name

### Outfit Combinations
- **Create and save outfit combinations** from your wardrobe items
- **Organize by occasion and season**
- **Auto-suggest feature** that randomly generates outfits from your wardrobe
- **Visual outfit cards** showing all items in each combination
- Perfect for planning what to wear or packing specific looks

### Trip Packing Planner
- **Create multiple trips** with destinations, dates, climate info, and notes
- **Add items to packing lists** from your wardrobe
- **Real-time packing progress** with visual progress bars
- **Check off items as packed** with satisfying visual feedback
- **Trip statuses** (planning, packing, traveling, completed)
- **Edit trips** and adjust packing lists on the fly
- Never forget an essential item again!

### Showcase & Sharing
- **Feature your favorite items** in a dedicated showcase
- **Export to HTML** - create a beautiful standalone webpage of your featured items
- **Generate shareable links** to show off your wardrobe to friends
- Perfect for fashion enthusiasts, minimalist bloggers, or style inspiration

### Phase-Out Tracker
- **Monitor items marked for replacement**
- **Track aging items** (3-5 years old) and old items (5+ years)
- **See statistics** for items needing attention
- **Quick actions** to toggle phase-out status or delete items
- Helps you maintain a fresh, functional wardrobe

### Data Management & Settings
- **Manual JSON export** for complete backup
- **Import from backup** to restore or migrate data
- **Quick export** to system folders (if browser supports File System Access API)
- **Auto-export scheduling** (daily, weekly, monthly)
- **Storage statistics** showing:
  - Total items count
  - Items with images
  - Storage size breakdown
  - Estimated capacity
- **Privacy-first design** - all data stored locally in your browser

## Why Nomad Wardrobe?

Traditional wardrobe apps either require paid subscriptions, send your data to the cloud, or lack essential features for travelers and minimalists. **Nomad Wardrobe** solves these problems:

- **100% Free & Open Source** - Use it forever, modify it, learn from it
- **Privacy-First** - Your wardrobe data never leaves your device
- **No Account Required** - Start using it immediately
- **Offline-Capable** - Works without an internet connection
- **Travel-Optimized** - Built specifically for packing and trip planning
- **Minimalist-Friendly** - Track what you own, identify what you need
- **Modern & Fast** - Built with the latest web technologies

Perfect for:
- Digital nomads who live out of a suitcase
- Minimalists tracking a capsule wardrobe
- Frequent travelers who need efficient packing
- Fashion enthusiasts organizing their collection
- Anyone decluttering and wanting visibility into their wardrobe

## Tech Stack

**Nomad Wardrobe** is built with modern, performant web technologies:

### Frontend
- **React 18.3** - Modern UI library with hooks
- **TypeScript 5.6** - Type-safe development
- **Vite 5.4** - Lightning-fast build tool and dev server
- **React Router 6.26** - Client-side routing

### UI & Styling
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **Lucide React** - Beautiful icon library
- **Custom component library** - Button, Card, Dialog, Input, Select, and more

### Data & Storage
- **Dexie.js 4.0** - Powerful IndexedDB wrapper
- **IndexedDB** - Browser-based local database
- **LocalStorage** - For app preferences and settings

### Utilities
- **clsx** - Conditional class names
- **tailwind-merge** - Intelligent Tailwind class merging
- **Class Variance Authority** - Type-safe component variants

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Yarn** (recommended) or npm - [Install Yarn](https://yarnpkg.com/getting-started/install)
- A modern web browser (Chrome, Firefox, Edge, Safari)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/theshajha/wardrobe.git
cd wardrobe
```

2. **Install dependencies**

```bash
yarn install
# or
npm install
```

### Running Locally

1. **Start the development server**

```bash
yarn dev
# or
npm run dev
```

2. **Open in your browser**

Navigate to `http://localhost:5173` (or the port shown in your terminal)

3. **Build for production**

```bash
yarn build
# or
npm run build
```

The built files will be in the `dist/` directory, ready to deploy to any static hosting service.

## Usage

### First-Time Setup

1. **Welcome Screen**: When you first open the app, you'll see a landing page with a quick overview
2. **Enter Your Name**: Click "Get Started" and enter your name for a personalized experience
3. **Start Adding Items**: Click the sidebar or navigate to "Inventory" to add your first wardrobe item

### Adding Items

1. Navigate to **Inventory**
2. Click the **"+ Add Item"** button
3. Fill in the details:
   - **Name** (required) - e.g., "White Oxford Shirt"
   - **Category** - Clothing, Accessories, Gadgets, Bags, or Footwear
   - **Subcategory** - Specific type (auto-populated based on category)
   - **Upload Photo** (optional but recommended)
   - **Color, Brand, Size** - Additional details
   - **Purchase Date** - Helps track item age
   - **Condition** - New, Good, Worn, or Needs Replacement
   - **Location** - Where the item currently is
   - **Climate & Occasion** - Helps with packing suggestions
   - **Notes** - Any additional information
4. Click **"Add Item"** to save

### Creating Outfits

1. Navigate to **Outfits**
2. Click **"+ New Outfit"**
3. Give your outfit a name and select occasion/season
4. Check the items you want to include
5. Click **"Create Outfit"**

**Tip**: Use the **"Suggest Outfit"** button for random outfit ideas!

### Planning a Trip

1. Navigate to **Packing**
2. Click **"+"** to create a new trip
3. Enter trip details:
   - Trip name (e.g., "Beach Vacation in Bali")
   - Destination
   - Start and end dates
   - Climate type
   - Trip status
   - Notes
4. Click **"Create Trip"**
5. Select the trip from the sidebar
6. Click **"Add Items"** to add items from your wardrobe
7. Check off items as you pack them!

### Backing Up Your Data

**Manual Export:**
1. Go to **Settings**
2. Click **"Export Data"**
3. Save the JSON file somewhere safe

**Quick Export** (Chrome/Edge):
1. Go to **Settings**
2. Select a folder on your computer
3. Click **"Quick Export"** anytime for instant backup

**Auto-Export:**
1. Go to **Settings**
2. Enable auto-export
3. Choose frequency (daily, weekly, monthly)
4. Your data exports automatically to the selected folder

### Importing Data

1. Go to **Settings**
2. Click **"Import Data"**
3. Select your backup JSON file
4. Your data is restored!

## Project Structure

```
wardrobe/
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # Entry point
│   ├── index.css               # Global styles
│   │
│   ├── pages/                  # Page components
│   │   ├── Landing.tsx         # Landing/onboarding page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   ├── Inventory.tsx       # Wardrobe inventory
│   │   ├── Outfits.tsx         # Outfit combinations
│   │   ├── Packing.tsx         # Trip packing planner
│   │   ├── Showcase.tsx        # Featured items showcase
│   │   ├── PhaseOut.tsx        # Item lifecycle tracking
│   │   └── Settings.tsx        # Settings & data management
│   │
│   ├── components/             # Reusable components
│   │   ├── Sidebar.tsx         # Main navigation
│   │   ├── ImageUpload.tsx     # Image upload component
│   │   └── ui/                 # UI component library
│   │
│   ├── db/                     # Database configuration
│   │   └── index.ts            # Dexie setup & schemas
│   │
│   └── lib/                    # Utilities
│       └── utils.ts            # Helper functions
│
├── public/                     # Static assets
├── dist/                       # Production build (generated)
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
└── README.md                   # This file
```

## Data Privacy

**Your privacy is paramount.** Nomad Wardrobe is designed with privacy at its core:

- **No server communication** - The app runs entirely in your browser
- **No analytics or tracking** - We don't collect any usage data
- **No accounts or sign-ups** - Start using it immediately
- **Local-only storage** - All data stored in IndexedDB on your device
- **No cloud dependency** - Works completely offline
- **You control your data** - Export anytime in standard JSON format

**Data Storage Location:**
- All wardrobe data, images, and settings are stored in your browser's IndexedDB
- User preferences stored in LocalStorage
- Typical storage limit: ~500MB (varies by browser)
- Data persists until you clear browser data or manually delete it

**Security Note:**
Since data is stored locally, anyone with access to your device can access the app. Consider:
- Using browser profiles if sharing a computer
- Exporting backups to encrypted storage
- Clearing browser data if using a shared/public computer

## Export & Backup

### Export Formats

**JSON Backup** (recommended for long-term storage):
- Complete database export
- Includes all items, trips, outfits, and settings
- Human-readable format
- Can be version controlled

**HTML Export** (for showcases):
- Self-contained HTML file with embedded images
- Beautiful responsive design
- Share your featured items with anyone
- No installation required to view

**Shareable Link** (for quick sharing):
- URL-encoded data (without images to keep URL short)
- Open in any browser with Nomad Wardrobe
- Perfect for sharing outfit ideas or packing lists

### Backup Strategy

We recommend:
1. **Weekly manual exports** saved to cloud storage (Dropbox, Google Drive, iCloud)
2. **Monthly backups** to an external drive
3. **Enable auto-export** if using Chrome/Edge with File System Access API
4. **Test your backups** by importing to verify integrity

## Browser Compatibility

**Nomad Wardrobe** works on all modern browsers:

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome  | 90+     | Full ✅       |
| Edge    | 90+     | Full ✅       |
| Firefox | 88+     | Full ✅       |
| Safari  | 14+     | Full ✅       |
| Opera   | 76+     | Full ✅       |

**Feature Support:**
- **IndexedDB**: Supported by all modern browsers
- **File System Access API**: Chrome 86+, Edge 86+ (for quick export)
- **Service Workers**: Coming soon for offline support

**Mobile Browsers:**
- iOS Safari 14+
- Chrome Mobile 90+
- Firefox Mobile 88+
- Samsung Internet 14+

## Contributing

We welcome contributions from the community! Whether it's:

- Reporting bugs
- Suggesting new features
- Improving documentation
- Submitting pull requests

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- Write clean, readable TypeScript
- Follow existing code style and patterns
- Add comments for complex logic
- Test your changes in multiple browsers
- Update documentation if needed
- Keep commits focused and atomic

### Reporting Issues

Found a bug? Have a feature request?

1. Check if an issue already exists
2. Open a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Screenshots if applicable
   - Browser and OS information

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

**TL;DR:**
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Use privately
- ✅ Sublicense
- ❌ No warranty or liability

## Acknowledgments

Built with love by [Shashank Jha](https://github.com/theshajha) for digital nomads and minimalists worldwide.

**Special Thanks:**
- [React](https://react.dev/) team for the amazing framework
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for beautiful styling
- [Dexie.js](https://dexie.org/) for making IndexedDB usable
- [Lucide](https://lucide.dev/) for gorgeous icons
- The open-source community for inspiration and tools

---

**Made for nomads, by a nomad. Happy organizing!** 🌍✈️👔

If this project helps you, please consider:
- ⭐ **Starring the repo**
- 🐛 **Reporting bugs**
- 💡 **Suggesting features**
- 🔀 **Contributing code**
- 📢 **Sharing with others**

[GitHub Repository](https://github.com/theshajha/wardrobe) | [Report Bug](https://github.com/theshajha/wardrobe/issues) | [Request Feature](https://github.com/theshajha/wardrobe/issues)
