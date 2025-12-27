# 🔗 Desktop Bridge Utility Setup Guide

## Overview

You now have a complete apparel design automation system with:

1. **Web Application** - Running at the deployed URL or locally
2. **Desktop Bridge Utility** - Located in `/bridge_utility` folder

## 📦 What You Need to Download

Download the entire `bridge_utility` folder from this project to your local laptop where Adobe Illustrator is installed.

## 🚀 Quick Start (5 Steps)

### 1. Install Node.js

- Download from https://nodejs.org/ (choose LTS version)
- Verify: Open terminal/command prompt and run `node --version`

### 2. Install Bridge Dependencies

```bash
cd /path/to/bridge_utility
npm install axios dotenv form-data fs-extra
```

### 3. Configure Environment

**IMPORTANT:** You must create a `.env` file from the example template.

```bash
cd /path/to/bridge_utility
cp .env.example .env
```

Then edit the `.env` file with your configuration:

```env
# Your web app URL
WEB_APP_URL=https://eira-designs.abacusai.app

# Your login credentials
USER_EMAIL=john@doe.com
USER_PASSWORD=johndoe123

# Adobe Illustrator path (find yours - see below)
ILLUSTRATOR_PATH=C:\Program Files\Adobe\Adobe Illustrator 2024\Support Files\Contents\Windows\Illustrator.exe

# Directories (defaults are fine)
TEMP_DIR=./temp
OUTPUT_DIR=./output
POLL_INTERVAL=5000
```

**Note:** On Windows, use a text editor like Notepad to create and edit the `.env` file. On macOS/Linux, you can use `nano .env` or any text editor.

**Finding your Illustrator path:**

**Windows:**
- Navigate to `C:\Program Files\Adobe\`
- Find your version folder (e.g., "Adobe Illustrator 2024")
- Path is usually: `[version folder]\Support Files\Contents\Windows\Illustrator.exe`

**macOS:**
- Go to Applications → Adobe Illustrator
- Right-click → Show Package Contents
- Navigate to: `Contents/MacOS/Adobe Illustrator`
- Full path: `/Applications/Adobe Illustrator 2024/Adobe Illustrator.app/Contents/MacOS/Adobe Illustrator`

### 4. Run the Bridge

```bash
cd /path/to/bridge_utility
node index.js
```

You should see:
```
🎨 Apparel Design Bridge Utility Starting...
🔐 Authenticating with web app...
✅ Authentication successful
✅ Bridge utility ready!
⏱️  Polling every 5000ms for new jobs...
```

### 5. Test It!

1. Go to your web app
2. Create a School, Team, and Project
3. Upload a template .ai file in Templates section
4. Create a Design Item
5. Add design instructions (e.g., "Put GT logo on top left")
6. Watch the bridge process it automatically!

## 🔍 How It Works

```
[Web App] → Creates design instruction
    ↓
[Bridge] → Polls and finds pending job
    ↓
[Bridge] → Downloads template .ai file
    ↓
[Bridge] → Launches Adobe Illustrator
    ↓
[Illustrator] → Applies changes to layers
    ↓
[Illustrator] → Exports .ai, .svg, .pdf, .png
    ↓
[Bridge] → Uploads files to web app
    ↓
[Web App] → Files available for download!
```

## ⚙️ Configuration Options

Edit `config.json` to customize:

```json
{
  "polling": {
    "enabled": true,
    "intervalMs": 5000  // Check every 5 seconds
  },
  "export": {
    "formats": ["ai", "svg", "pdf", "png"],  // What formats to generate
    "pngResolution": 300  // DPI for PNG export
  },
  "cleanup": {
    "deleteTempFiles": true,  // Clean up temp files after processing
    "keepOutputFiles": false  // Delete output files after upload
  }
}
```

## 💻 Multiple Machines

You can install the bridge on multiple computers:
- Each machine polls independently
- First machine to grab a job processes it
- Great for distributing workload
- Just copy the `bridge_utility` folder to each machine

## ⚠️ Troubleshooting

### Bridge connects to localhost instead of deployed URL
**Problem:** Bridge tries to connect to `http://localhost:3000` instead of your web app URL.

**Solution:**
1. Make sure you created a `.env` file (not just `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file and set `WEB_APP_URL`:
   ```env
   WEB_APP_URL=https://eira-designs.abacusai.app
   ```
3. Make sure there are no spaces around the `=` sign
4. Save the file and restart the bridge: `node index.js`

### ".env file not found" error
**Problem:** Bridge says ".env file not found!"

**Solution:**
1. You're either in the wrong directory, or haven't created the `.env` file
2. Make sure you're in the `bridge_utility` directory:
   ```bash
   cd /path/to/bridge_utility
   ls -la
   ```
3. You should see `.env.example` - copy it to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` with your settings

### Bridge won't authenticate
- Check `WEB_APP_URL` is correct in `.env`
- Verify email/password match your web app account
- Try logging in to web app manually first
- Make sure `.env` file exists and is being read (bridge will show "User Email: your-email" on startup)

### Illustrator not found
- Double-check `ILLUSTRATOR_PATH` in `.env`
- Make sure Illustrator is installed and licensed
- Try opening Illustrator manually to verify it works
- Uncomment the appropriate path for your OS in `.env`

### Script doesn't run
**Windows:** Run Command Prompt as Administrator
**macOS:** Grant Terminal permissions:
- System Preferences → Security & Privacy → Privacy
- Select "Automation"
- Enable Terminal to control Adobe Illustrator

### No jobs found
- Make sure design instruction status is "pending"
- Check that polling is enabled in `config.json`
- Verify bridge authenticated successfully (look for "✅ Authentication successful")

## 📚 Full Documentation

See `/bridge_utility/README.md` for complete documentation including:
- Detailed installation steps
- Advanced configuration
- How the Illustrator script works
- Modifying the script for custom needs
- Development tips

## 🆘 Need Help?

1. Check bridge console output for errors
2. Review README.md in bridge_utility folder
3. Verify all prerequisites are met
4. Test with a simple design first

---

**You're all set!** The bridge utility will now automatically process your design instructions. Keep it running while you work, and it will handle everything in the background. 🎨✨
