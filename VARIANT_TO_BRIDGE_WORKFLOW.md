# 🎯 Variant to Bridge Workflow Guide

## Overview

This guide explains how to generate design variants in the web app and send them to the Adobe Illustrator bridge for final .AI file creation.

---

## 📋 Complete Workflow

### Step 1: Configure Your Design

1. Navigate to an **Item detail page**
2. Click on the **Configuration** tab
3. Configure your design layers:
   - **Text Layers**: Edit text content (e.g., team names, player numbers)
   - **Graphic Layers**: Change colors using the Pantone color picker
   - **Logo Layers**: Upload or select logos from your library
   - **Patterns**: Add patterns and specify placement (body, sleeve, etc.)
   - **Embellishments**: Add graphics with position and size control

### Step 2: Generate Variants

1. After configuring all layers, click **"Generate Variants"**
2. The system creates SVG preview files for each variant
3. Wait for the generation to complete (you'll see a success toast notification)
4. The **Variants** tab will now show your generated previews

### Step 3: Select Variants for Production

1. Switch to the **Variants** tab
2. You'll see a gallery of all generated variant previews
3. **Select the variants** you want to create final .AI files for:
   - Click the checkbox in the top-left corner of each variant card
   - You can select multiple variants at once
4. Selected variants will have a **blue ring** around them

### Step 4: Send to Adobe Illustrator Bridge

1. Once you've selected your variants, a **"Ready to Generate Final Files"** card appears at the bottom
2. This card shows:
   - How many variants are selected
   - A reminder to ensure your bridge utility is running
3. Click **"Generate Final Files"** button
4. The variants are queued for processing:
   - Status changes from "Preview" → "Generating"
   - Bridge jobs are created in the database
   - A success message shows how many variants were queued

### Step 5: Bridge Processing (Automatic)

**On Your Local Machine:**

1. Ensure the Adobe Illustrator bridge utility is running:
   ```bash
   cd /path/to/bridge_utility
   node index.js
   ```

2. The bridge will:
   - **Poll** the web app every 5 seconds for new jobs
   - **Detect** your queued variant jobs
   - **Download** the template .AI file
   - **Open** Adobe Illustrator (if configured)
   - **Apply** all layer configurations (colors, text, logos, patterns)
   - **Generate** the final .AI file
   - **Upload** the .AI file back to the web app
   - **Update** variant status to "Generated"

3. Console output will show:
   ```
   🔔 Found 3 pending job(s) (0 design instructions, 3 variants)
   
   🎯 Processing Variant Job: clxxx...
     Variant: Team A - Red/White
     Item: Basketball Jersey
     📥 Downloading template...
     ✅ Downloaded: template.ai
     🎨 Processing with Adobe Illustrator...
     ✅ Illustrator script completed
     📤 Uploading .AI file...
     ✅ Uploaded: AI
     ✅ Variant job completed successfully!
   ```

### Step 6: Download Final Files

1. **Refresh** the Variants tab in the web app
2. Processed variants will show:
   - Status badge: **"Generated"** (green)
   - **"Download .AI"** button appears
3. Click **"Download .AI"** to get your production-ready file

---

## 🔍 Understanding Variant Status

| Status | Badge | Description |
|--------|-------|-------------|
| **Preview** | ⏱️ Gray | Variant is generated as SVG preview only |
| **Selected** | ✓ Blue | Variant is selected but not yet queued for processing |
| **Generating** | ⟳ Yellow | Variant is queued and waiting for bridge processing |
| **Generated** | ✓ Green | Final .AI file has been created and is available for download |
| **Failed** | ⚠️ Red | Processing failed - check error message |

---

## 🎨 What Happens in Adobe Illustrator?

The bridge utility automates the following in Illustrator:

1. **Opens the template** .AI file
2. **Finds or creates layers** based on the variant configuration
3. **Applies modifications**:
   - **Text layers**: Updates text content
   - **Graphic layers**: Changes fill colors to specified hex values
   - **Logo layers**: Places logo images at specified positions
   - **Pattern layers**: Applies patterns to designated areas
   - **Embellishment layers**: Adds graphics with proper positioning and scaling
4. **Saves the final** .AI file
5. **Uploads** to cloud storage

---

## 📊 Variant Configuration Format

When you configure layers and generate variants, the system creates a JSON configuration like this:

```json
{
  "layers": [
    {
      "layerId": "Body",
      "layerName": "Body",
      "type": "graphic",
      "value": "#FF0000"
    },
    {
      "layerId": "Team_Name",
      "layerName": "Team Name",
      "type": "text",
      "value": "Eagles"
    },
    {
      "layerId": "Team_Logo",
      "layerName": "Team Logo",
      "type": "logo",
      "value": "16728/uploads/1234567890-logo.png"
    }
  ],
  "patterns": [
    {
      "patternId": "clxxx...",
      "position": "sleeve"
    }
  ],
  "embellishments": [
    {
      "embellishmentId": "clxxx...",
      "position": "chest",
      "size": 100
    }
  ]
}
```

This configuration is stored with each variant and sent to the bridge for processing.

---

## 🚨 Troubleshooting

### Variants Stuck in "Generating" Status

**Problem**: Variants show "Generating" but never complete.

**Solutions**:
1. **Check if bridge is running**:
   ```bash
   # In bridge_utility directory
   node index.js
   ```

2. **Check bridge console** for errors

3. **Verify connectivity**:
   - Bridge should show: "Web App URL: https://eira-designs.abacusai.app"
   - Should authenticate successfully

4. **Check Adobe Illustrator**:
   - Is Illustrator installed?
   - Is the path correct in `.env`?

### Bridge Not Finding Jobs

**Problem**: Bridge runs but says "0 pending job(s)".

**Solutions**:
1. **Verify variants are selected** in the web app
2. **Click "Generate Final Files"** button
3. **Check network connectivity** between bridge and web app
4. **Verify authentication** - bridge should show "Authentication successful"

### Download Button Not Appearing

**Problem**: Variant shows "Generated" but no download button.

**Solutions**:
1. **Refresh the page** - hard refresh with Ctrl+Shift+R
2. **Check browser console** for errors
3. **Verify the variant** has `finalAiPath` in database

### Processing Fails

**Problem**: Variant status changes to "Failed".

**Solutions**:
1. **Check error message** displayed on the variant card
2. **Review bridge console** output for detailed error
3. **Common issues**:
   - Template file not found/downloadable
   - Illustrator path incorrect
   - Layer names don't match configuration
   - Insufficient permissions

---

## 💡 Best Practices

### 1. Test with One Variant First

- Generate and process a single variant before batch processing
- Verify the output meets your quality standards
- Adjust layer configurations if needed

### 2. Keep Bridge Running

- Leave the bridge utility running in a terminal window
- Consider running it as a background service for continuous processing

### 3. Monitor Processing

- Watch the bridge console for real-time progress
- Check for any warnings or errors
- Note processing time per variant (typically 30-60 seconds)

### 4. Batch Processing

- Select multiple variants and queue them all at once
- Bridge processes them sequentially
- No limit on the number of variants you can queue

### 5. Template Quality

- Ensure templates are properly structured:
  - Layer names match expected format (e.g., "Body", "Team_Logo")
  - Layers are organized logically
  - File is not corrupted

---

## 🔄 Reprocessing Variants

If you need to regenerate a variant:

1. **Delete the existing variant** (trash icon)
2. **Regenerate** from the Configuration tab
3. **Select and queue** again

**Note**: You cannot reprocess a variant that's already "Generated" - you must delete it first.

---

## 📈 Monitoring Bridge Jobs

The system tracks all bridge jobs in the database:

- **Job ID**: Unique identifier
- **Variant ID**: Which variant is being processed
- **Status**: pending → processing → completed/failed
- **Priority**: Higher priority jobs processed first (default: 0)
- **Timestamps**: Created, started, completed
- **Error messages**: If failed

These are automatically managed by the bridge utility.

---

## 🎯 Summary

```
Web App (You)                    Bridge Utility (Your Machine)
─────────────                    ──────────────────────────────
1. Configure layers
2. Generate variants
3. Select variants
4. Click "Generate Final Files"
                                 5. Bridge polls for jobs
                                 6. Downloads template
                                 7. Opens Illustrator
                                 8. Applies configuration
                                 9. Generates .AI file
                                 10. Uploads to web app
11. Download final .AI files
```

---

## 📞 Need Help?

If you encounter issues:

1. **Check bridge console** output for errors
2. **Review this guide** for troubleshooting steps
3. **Verify all prerequisites** are met (Node.js, Illustrator, etc.)
4. **Test connectivity** with `testConnectivity()` function

---

**You're all set! Create amazing apparel designs!** 🎨✨
