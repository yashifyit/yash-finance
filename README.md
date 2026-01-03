# Minimalist Expense Tracker PWA

A modern, mobile-first **Progressive Web App (PWA)** designed for seamless personal finance management. Built with a focus on minimalism, speed, and "Apple-style" aesthetics, this application allows users to track expenses, visualize spending habits, and maintain financial discipline without the clutter.

![Project Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## 🚀 Key Features

* **Premium Minimalist UI:** A clean, monochrome interface utilizing **shadcn/ui** components for a professional look.
* **Smart Dashboard:** Real-time balance updates, monthly limits, and visual budget tracking.
* **Data Visualization:** Interactive donut charts powered by **Recharts** to analyze spending categories.
* **Secure Authentication:** Email/Password login powered by **Supabase Auth** with strict Row Level Security (RLS) to ensure data privacy.
* **PWA Support:** Installable on iOS and Android devices as a native-feeling app (offline capable).
* **Responsive Design:** Optimized for mobile viewports using dynamic viewport units (`dvh`) to prevent layout issues.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite
* **Styling:** Tailwind CSS, shadcn/ui
* **Backend:** Supabase (PostgreSQL, Auth, Realtime)
* **State Management:** React Query (TanStack Query)
* **Animation:** Framer Motion
* **Deployment:** Netlify / Vercel


### **How can I edit this code?**

There are several ways of editing your application.

**1. Use Lovable (AI-Assisted)**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting. Changes made via Lovable will be committed automatically to this repo.

**2. Use your preferred IDE (VS Code)**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

**Setup Steps:**

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm i

# Step 4: Configure Environment Variables
# Create a .env file in the root and add your Supabase keys:
# VITE_SUPABASE_URL=your_url_here
# VITE_SUPABASE_ANON_KEY=your_key_here

# Step 5: Start the development server
npm run dev
