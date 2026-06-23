const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run() {
  try {
    console.log("=== Step 1: Installing Frontend Dependencies ===");
    execSync('npm install --prefix frontend', { stdio: 'inherit' });

    console.log("=== Step 2: Building Frontend ===");
    execSync('npm run build --prefix frontend', { stdio: 'inherit' });

    console.log("=== Step 3: Copying Build Output to Root dist/ ===");
    const src = path.join(__dirname, 'frontend', 'dist');
    const dst = path.join(__dirname, 'dist');

    if (fs.existsSync(dst)) {
      console.log(`Cleaning existing destination directory: ${dst}`);
      fs.rmSync(dst, { recursive: true, force: true });
    }

    console.log(`Copying folder from ${src} to ${dst}...`);
    // fs.cpSync requires Node.js v16.7.0+, which is supported on Vercel (Node 18+)
    fs.cpSync(src, dst, { recursive: true });
    console.log("=== Build and Copy completed successfully! ===");
  } catch (error) {
    console.error("ERROR: Build failed:", error.message);
    process.exit(1);
  }
}

run();
