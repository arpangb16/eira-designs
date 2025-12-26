# Apparel Design Bridge Utility

This desktop application runs on your local machine and automates Adobe Illustrator to process apparel design instructions from the web application.

## 🎯 What It Does

- Connects to the web application and polls for pending design jobs
- Downloads template .ai files from cloud storage
- Controls Adobe Illustrator via scripting to manipulate layers
- Applies logos, colors, text, and other customizations based on instructions
- Generates exports in multiple formats (.ai, .svg, .pdf, .png)
- Uploads generated files back to the web application

## 📋 Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version`

2. **Adobe Illustrator** (CC 2020 or later recommended)
   - Must be installed and licensed on your machine
   - Note the installation path (needed for configuration)

### System Requirements

- **Windows 10/11** or **macOS 10.15+**
- At least 4GB RAM (8GB recommended)
- 2GB free disk space for temporary files

## 🚀 Installation

### Step 1: Download the Bridge Utility

1. Download the entire `bridge_utility` folder from the project
2. Place it in a convenient location on your computer (e.g., `C:\Users\YourName\apparel-bridge` on Windows or `~/apparel-bridge` on Mac)

### Step 2: Install Dependencies

1. Open Terminal (macOS/Linux) or Command Prompt (Windows)
2. Navigate to the bridge utility folder:
   ```bash
   cd /path/to/bridge_utility
   ```

3. Initialize npm (if package.json doesn't exist):
   ```bash
   npm init -y
   ```

4. Install required packages:
   ```bash
   npm install axios dotenv form-data fs-extra
   ```

5. Optional: Install nodemon for development:
   ```bash
   npm install --save-dev nodemon
   ```

### Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your settings:

   ```env
   # Web App Configuration
   WEB_APP_URL=http://localhost:3000
   # Or use deployed URL: WEB_APP_URL=https://eira-designs.abacusai.app
   
   # Your login credentials
   USER_EMAIL=john@doe.com
   USER_PASSWORD=johndoe123
   
   # Adobe Illustrator Path
   # Windows:
   ILLUSTRATOR_PATH=C:\Program Files\Adobe\Adobe Illustrator 2024\Support Files\Contents\Windows\Illustrator.exe
   
   # macOS:
   # ILLUSTRATOR_PATH=/Applications/Adobe Illustrator 2024/Adobe Illustrator.app/Contents/MacOS/Adobe Illustrator
   
   # Working Directories (can use defaults)
   TEMP_DIR=./temp
   OUTPUT_DIR=./output
   
   # Polling Interval (how often to check for new jobs, in milliseconds)
   POLL_INTERVAL=5000
   ```

### Step 4: Find Your Illustrator Path

#### Windows:
1. Open File Explorer
2. Navigate to `C:\Program Files\Adobe\`
3. Find your Illustrator version folder (e.g., `Adobe Illustrator 2024`)
4. The executable is usually at: `Support Files\Contents\Windows\Illustrator.exe`
5. Common paths:
   - `C:\Program Files\Adobe\Adobe Illustrator 2024\Support Files\Contents\Windows\Illustrator.exe`
   - `C:\Program Files\Adobe\Adobe Illustrator CC 2023\Support Files\Contents\Windows\Illustrator.exe`

#### macOS:
1. Open Finder
2. Navigate to Applications
3. Find Adobe Illustrator (e.g., `Adobe Illustrator 2024`)
4. Right-click and "Show Package Contents"
5. Navigate to `Contents/MacOS/`
6. Common paths:
   - `/Applications/Adobe Illustrator 2024/Adobe Illustrator.app/Contents/MacOS/Adobe Illustrator`
   - `/Applications/Adobe Illustrator CC 2023/Adobe Illustrator.app/Contents/MacOS/Adobe Illustrator`

### Step 5: Configure Settings (Optional)

Edit `config.json` to customize behavior:

```json
{
  "polling": {
    "enabled": true,
    "intervalMs": 5000
  },
  "illustrator": {
    "autoLaunch": false,
    "closeAfterExport": false
  },
  "export": {
    "formats": ["ai", "svg", "pdf", "png"],
    "pngResolution": 300
  },
  "cleanup": {
    "deleteTempFiles": true,
    "keepOutputFiles": false
  }
}
```

## ▶️ Running the Bridge Utility

### Start the Bridge

```bash
cd /path/to/bridge_utility
node index.js
```

Or use npm script:
```bash
npm start
```

### Expected Output

You should see:
```
🎨 Apparel Design Bridge Utility Starting...
📍 Web App URL: http://localhost:3000
📂 Temp Directory: /path/to/temp
📁 Output Directory: /path/to/output

🔐 Authenticating with web app...
✅ Authentication successful
👤 User: john@doe.com

✅ Bridge utility ready!
⏱️  Polling every 5000ms for new jobs...

Press Ctrl+C to stop.
```

### Processing Jobs

When a design job is found:
```
🔔 Found 1 pending job(s)

📋 Processing Design Instruction: clxxx...
  Item: GT Tennis T-Shirt
  Instructions: Put GT logo on top left, player name on back
  📥 Downloading template...
  ✅ Downloaded: template.ai
  🎨 Processing with Adobe Illustrator...
  ✅ Illustrator script completed
  📤 Uploading generated files...
  ✅ Uploaded: AI
  ✅ Uploaded: SVG
  ✅ Uploaded: PDF
  ✅ Uploaded: PNG
  ✅ Design instruction completed successfully!
```

## 🔧 Troubleshooting

### Authentication Fails

**Problem:** "❌ Authentication error: 401 Unauthorized"

**Solutions:**
- Verify your email and password in `.env` are correct
- Make sure you can log in to the web app with these credentials
- Check that `WEB_APP_URL` is correct

### Illustrator Not Found

**Problem:** "❌ Illustrator script error: Cannot find Illustrator"

**Solutions:**
- Verify `ILLUSTRATOR_PATH` in `.env` is correct
- Make sure Adobe Illustrator is installed
- Try running Illustrator manually to ensure it's working

### Script Execution Fails

**Problem:** Illustrator opens but script doesn't run

**Solutions:**
- **Windows:** Ensure you're running Command Prompt as Administrator
- **macOS:** Grant Terminal accessibility permissions:
  1. System Preferences → Security & Privacy → Privacy
  2. Select "Automation" in left sidebar
  3. Enable Terminal to control Adobe Illustrator

### Template Download Fails

**Problem:** "❌ Download error"

**Solutions:**
- Check internet connection
- Verify the web app is running and accessible
- Ensure template files were uploaded correctly in the web app

### No Jobs Found

**Problem:** Bridge runs but no jobs are processed

**Solutions:**
- Create a design item in the web app
- Add design instructions to the item
- Verify the instruction status is "pending"
- Check that polling is enabled in `config.json`

## 📁 File Structure

```
bridge_utility/
├── index.js                 # Main application
├── illustrator-script.jsx   # Adobe Illustrator ExtendScript
├── config.json             # Configuration settings
├── .env                    # Environment variables (create from .env.example)
├── .env.example            # Example environment file
├── README.md               # This file
├── temp/                   # Temporary files (auto-created)
└── output/                 # Generated files (auto-created)
```

## 🎨 How It Works

### Workflow

1. **Poll for Jobs:** Bridge checks web app every 5 seconds for pending design instructions
2. **Download Template:** Fetches the .ai template file from cloud storage
3. **Parse Instructions:** Converts natural language instructions into structured data
4. **Execute Script:** Runs ExtendScript in Adobe Illustrator to manipulate layers
5. **Apply Changes:**
   - Place logos at specified positions
   - Add text (team names, player names, etc.)
   - Apply team colors to layers
   - Add manufacturer logo
6. **Generate Exports:** Save as .ai, .svg, .pdf, .png
7. **Upload Results:** Send generated files back to web app
8. **Update Status:** Mark job as completed

### Layer Manipulation

The Illustrator script:
- Finds or creates layers based on element names
- Clears existing content
- Places images (logos) at specified positions
- Adds text with formatting
- Applies colors to specific layers
- Positions elements based on instructions (top left, center, bottom right, etc.)

### Supported Instructions

The script can interpret:
- **Logo placement:** "Put GT logo on top left"
- **Text placement:** "Player name on back"
- **Manufacturer logo:** "Manufacturer logo bottom right"
- **Colors:** Automatically applies team colors to designated layers
- **Multiple variations:** Can process multiple placements in one job

## 🔒 Security Notes

- Never commit `.env` file to version control
- Keep your credentials secure
- The bridge only communicates with your specified web app
- Temporary files are cleaned up automatically

## 🆘 Getting Help

### Check Logs

The bridge outputs detailed logs to the console. If something fails:
1. Check the console output for error messages
2. Look for specific error codes or messages
3. Verify all prerequisites are met

### Common Issues

| Issue | Solution |
|-------|----------|
| Bridge won't start | Check Node.js installation, run `npm install` |
| Can't authenticate | Verify credentials in `.env` |
| Illustrator errors | Check Illustrator path, ensure it's licensed |
| Upload fails | Check internet connection, verify web app URL |
| Files not generated | Check Illustrator script permissions |

## 🔄 Updating

To update the bridge utility:
1. Download the new version
2. Replace `index.js` and `illustrator-script.jsx`
3. Check for new configuration options in `config.json`
4. Restart the bridge

## 💡 Tips

- **Keep it running:** Leave the bridge running in a terminal window while designing
- **Monitor output:** Watch the console for errors or issues
- **Test templates:** Start with simple designs to verify everything works
- **Multiple machines:** Install the bridge on multiple computers for distributed processing
- **Background process:** On Windows, use `npm install -g pm2` then `pm2 start index.js` to run as background service

## 📝 Development

### Running in Development Mode

```bash
npm install --save-dev nodemon
npm run dev
```

This will auto-restart the bridge when you make code changes.

### Modifying the Illustrator Script

The `illustrator-script.jsx` file uses Adobe ExtendScript. Key functions:

- `processInstructions()` - Main processing logic
- `processPlacement()` - Handle individual placements
- `placeLogo()` - Place image files
- `addText()` - Add text elements
- `applyColors()` - Apply team colors
- `exportDocument()` - Generate exports

### Testing

1. Create a test design in the web app
2. Add simple instructions like "Put logo on top left"
3. Monitor bridge console output
4. Check generated files in `output/` folder
5. Verify files appear in web app

## 📜 License

MIT License - Feel free to modify and distribute

---

**Ready to automate your apparel designs!** 🎨✨
