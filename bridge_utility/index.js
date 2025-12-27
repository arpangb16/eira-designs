/**
 * Apparel Design Bridge Utility
 * 
 * This application runs locally and automates Adobe Illustrator
 * to process design instructions from the web application.
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const FormData = require('form-data');
const config = require('./config.json');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERROR: .env file not found!');
  console.error('');
  console.error('Please create a .env file in the bridge_utility directory.');
  console.error('You can copy .env.example as a starting point:');
  console.error('');
  console.error('  cp .env.example .env');
  console.error('');
  console.error('Then edit .env with your configuration.');
  process.exit(1);
}

// Configuration
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';
const USER_EMAIL = process.env.USER_EMAIL;
const USER_PASSWORD = process.env.USER_PASSWORD;
const TEMP_DIR = path.resolve(process.env.TEMP_DIR || './temp');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './output');
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5000');

// Validate required environment variables
if (!USER_EMAIL || !USER_PASSWORD) {
  console.error('❌ ERROR: Missing required environment variables!');
  console.error('');
  console.error('Please make sure your .env file contains:');
  console.error('  USER_EMAIL=your-email@example.com');
  console.error('  USER_PASSWORD=your-password');
  console.error('');
  process.exit(1);
}

let authToken = null;
let isProcessing = false;

// Ensure directories exist
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(OUTPUT_DIR);

console.log('🎨 Apparel Design Bridge Utility Starting...');
console.log('📍 Web App URL:', WEB_APP_URL);
console.log('👤 User Email:', USER_EMAIL);
console.log('📂 Temp Directory:', TEMP_DIR);
console.log('📁 Output Directory:', OUTPUT_DIR);
console.log('');

/**
 * Authenticate with the web application
 */
async function authenticate() {
  try {
    console.log('🔐 Authenticating with web app...');
    
    const response = await axios.post(`${WEB_APP_URL}/api/auth/callback/credentials`, {
      email: USER_EMAIL,
      password: USER_PASSWORD,
      json: true
    });

    if (response.data && response.data.url) {
      console.log('✅ Authentication successful');
      return true;
    }

    // Alternative: Use NextAuth session endpoint
    const sessionResponse = await axios.get(`${WEB_APP_URL}/api/auth/session`, {
      headers: {
        'Cookie': response.headers['set-cookie'] ? response.headers['set-cookie'].join('; ') : ''
      }
    });

    if (sessionResponse.data && sessionResponse.data.user) {
      authToken = response.headers['set-cookie'] ? response.headers['set-cookie'].join('; ') : null;
      console.log('✅ Authentication successful');
      console.log('👤 User:', sessionResponse.data.user.email);
      return true;
    }

    throw new Error('Authentication failed');
  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return false;
  }
}

/**
 * Fetch pending design instructions from the web app
 */
async function fetchPendingJobs() {
  try {
    const response = await axios.get(`${WEB_APP_URL}/api/design-instructions`, {
      headers: authToken ? { 'Cookie': authToken } : {},
      params: { status: 'pending' }
    });

    return response.data.instructions || [];
  } catch (error) {
    console.error('❌ Error fetching jobs:', error.message);
    return [];
  }
}

/**
 * Download a file from the web app
 */
async function downloadFile(cloudStoragePath, isPublic, destinationPath) {
  try {
    // Get file URL from web app
    const urlResponse = await axios.post(
      `${WEB_APP_URL}/api/upload/file-url`,
      { cloud_storage_path: cloudStoragePath, isPublic },
      { headers: authToken ? { 'Cookie': authToken } : {} }
    );

    const fileUrl = urlResponse.data.url;

    // Download the file
    const fileResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    });

    await fs.writeFile(destinationPath, fileResponse.data);
    console.log('  ✅ Downloaded:', path.basename(destinationPath));
    return true;
  } catch (error) {
    console.error('  ❌ Download error:', error.message);
    return false;
  }
}

/**
 * Upload a file to the web app
 */
async function uploadFile(filePath, itemId, designInstructionId, fileType) {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('itemId', itemId);
    if (designInstructionId) {
      form.append('designInstructionId', designInstructionId);
    }
    form.append('fileType', fileType);

    await axios.post(`${WEB_APP_URL}/api/bridge/upload`, form, {
      headers: {
        ...form.getHeaders(),
        ...(authToken ? { 'Cookie': authToken } : {})
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`  ✅ Uploaded: ${fileType.toUpperCase()}`);
    return true;
  } catch (error) {
    console.error(`  ❌ Upload error (${fileType}):`, error.message);
    return false;
  }
}

/**
 * Execute Adobe Illustrator script
 */
async function executeIllustratorScript(scriptPath, templatePath, outputBasePath, instructions) {
  return new Promise((resolve, reject) => {
    // Create a temporary script file with parameters
    const scriptContent = fs.readFileSync(path.join(__dirname, 'illustrator-script.jsx'), 'utf8');
    
    // Replace placeholders in script
    const parameterizedScript = scriptContent
      .replace('{{TEMPLATE_PATH}}', templatePath.replace(/\\/g, '\\\\'))
      .replace('{{OUTPUT_BASE_PATH}}', outputBasePath.replace(/\\/g, '\\\\'))
      .replace('{{INSTRUCTIONS}}', JSON.stringify(instructions).replace(/"/g, '\\"'));

    const tempScriptPath = path.join(TEMP_DIR, 'temp-script.jsx');
    fs.writeFileSync(tempScriptPath, parameterizedScript);

    // Determine OS and construct command
    const isWindows = process.platform === 'win32';
    const isMac = process.platform === 'darwin';

    let command;
    if (isWindows) {
      const illustratorPath = process.env.ILLUSTRATOR_PATH || 
        'C:\\Program Files\\Adobe\\Adobe Illustrator 2024\\Support Files\\Contents\\Windows\\Illustrator.exe';
      command = `"${illustratorPath}" "${tempScriptPath}"`;
    } else if (isMac) {
      command = `osascript -e 'tell application "Adobe Illustrator" to do javascript file "${tempScriptPath}"'`;
    } else {
      reject(new Error('Unsupported operating system'));
      return;
    }

    console.log('  🎨 Executing Illustrator script...');
    
    exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
      // Clean up temp script
      fs.removeSync(tempScriptPath);

      if (error) {
        console.error('  ❌ Illustrator script error:', error.message);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn('  ⚠️  Script warnings:', stderr);
      }

      console.log('  ✅ Illustrator script completed');
      resolve(stdout);
    });
  });
}

/**
 * Process a single design instruction
 */
async function processDesignInstruction(instruction) {
  const { id, itemId, instruction: instructionText, parsedData, item } = instruction;
  
  console.log('\n📋 Processing Design Instruction:', id);
  console.log('  Item:', item.name);
  console.log('  Instructions:', instructionText);

  try {
    // Update status to processing
    await axios.patch(
      `${WEB_APP_URL}/api/design-instructions/${id}`,
      { status: 'processing' },
      { headers: authToken ? { 'Cookie': authToken } : {} }
    );

    // Download template file
    const templateFileName = path.basename(item.template.filePath);
    const templatePath = path.join(TEMP_DIR, `template-${Date.now()}-${templateFileName}`);
    
    console.log('  📥 Downloading template...');
    const downloadSuccess = await downloadFile(
      item.template.filePath,
      item.template.fileIsPublic,
      templatePath
    );

    if (!downloadSuccess) {
      throw new Error('Failed to download template');
    }

    // Parse design instructions
    let parsedInstructions;
    try {
      parsedInstructions = typeof parsedData === 'string' ? JSON.parse(parsedData) : parsedData;
    } catch (e) {
      parsedInstructions = { raw: instructionText };
    }

    // Prepare output base path
    const timestamp = Date.now();
    const outputBaseName = `${item.name.replace(/[^a-z0-9]/gi, '_')}-${timestamp}`;
    const outputBasePath = path.join(OUTPUT_DIR, outputBaseName);

    // Execute Illustrator script
    console.log('  🎨 Processing with Adobe Illustrator...');
    await executeIllustratorScript(
      path.join(__dirname, 'illustrator-script.jsx'),
      templatePath,
      outputBasePath,
      parsedInstructions
    );

    // Upload generated files
    console.log('  📤 Uploading generated files...');
    
    const formats = config.export.formats || ['ai', 'svg', 'pdf', 'png'];
    for (const format of formats) {
      const filePath = `${outputBasePath}.${format}`;
      if (await fs.pathExists(filePath)) {
        await uploadFile(filePath, itemId, id, format);
        
        // Clean up if configured
        if (config.cleanup.keepOutputFiles === false) {
          await fs.remove(filePath);
        }
      }
    }

    // Clean up template file
    if (config.cleanup.deleteTempFiles) {
      await fs.remove(templatePath);
    }

    // Update status to completed
    await axios.patch(
      `${WEB_APP_URL}/api/design-instructions/${id}`,
      { status: 'completed' },
      { headers: authToken ? { 'Cookie': authToken } : {} }
    );

    console.log('  ✅ Design instruction completed successfully!');
    return true;

  } catch (error) {
    console.error('  ❌ Processing error:', error.message);
    
    // Update status to failed
    try {
      await axios.patch(
        `${WEB_APP_URL}/api/design-instructions/${id}`,
        { status: 'failed' },
        { headers: authToken ? { 'Cookie': authToken } : {} }
      );
    } catch (updateError) {
      console.error('  ❌ Failed to update status:', updateError.message);
    }

    return false;
  }
}

/**
 * Main polling loop
 */
async function pollForJobs() {
  if (isProcessing) {
    return; // Skip if already processing
  }

  try {
    const jobs = await fetchPendingJobs();

    if (jobs.length > 0) {
      console.log(`\n🔔 Found ${jobs.length} pending job(s)`);
      isProcessing = true;

      for (const job of jobs) {
        await processDesignInstruction(job);
      }

      isProcessing = false;
    }
  } catch (error) {
    console.error('❌ Polling error:', error.message);
    isProcessing = false;
  }
}

/**
 * Start the bridge utility
 */
async function start() {
  // Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.error('\n❌ Failed to authenticate. Please check your credentials in .env file.');
    process.exit(1);
  }

  console.log('\n✅ Bridge utility ready!');
  console.log(`⏱️  Polling every ${POLL_INTERVAL}ms for new jobs...`);
  console.log('\nPress Ctrl+C to stop.\n');

  // Start polling
  if (config.polling.enabled) {
    setInterval(pollForJobs, POLL_INTERVAL);
    pollForJobs(); // Initial poll
  } else {
    console.log('⚠️  Polling is disabled in config.json');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down bridge utility...');
  process.exit(0);
});

// Start the application
start().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
