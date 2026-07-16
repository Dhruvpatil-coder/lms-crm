const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.dirname(__filename);
const FRONTEND = path.join(ROOT, 'frontend');
const BACKEND = path.join(ROOT, 'backend');

// Step 1: Kill all node processes
console.log('[1/4] Killing old node processes...');
try {
  execSync('taskkill /F /IM node.exe', { stdio: 'ignore' });
} catch {}

// Step 2: Clear React cache
console.log('[2/4] Clearing React cache...');
const cacheDir = path.join(FRONTEND, 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  fs.rmSync(cacheDir, { recursive: true, force: true });
  console.log('      Cache cleared.');
} else {
  console.log('      No cache to clear.');
}

// Step 3: Start backend
console.log('[3/4] Starting Backend...');
const backendProc = spawn('node', ['src/index.js'], {
  cwd: BACKEND,
  stdio: 'inherit',
  shell: true
});

// Wait 3 seconds then start frontend
setTimeout(() => {
  console.log('[4/4] Starting Frontend...');
  const frontendProc = spawn('npm', ['start'], {
    cwd: FRONTEND,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PATH: 'C:\\Program Files\\nodejs;' + process.env.PATH }
  });

  console.log('\n==========================================');
  console.log('  BOTH SERVERS STARTING...');
  console.log('==========================================');
  console.log('  Backend:  http://localhost:5000');
  console.log('  Frontend: http://localhost:3000');
  console.log('==========================================\n');
  console.log('Wait for "Compiled successfully!" then open:');
  console.log('http://localhost:3000\n');
}, 3000);

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  backendProc.kill();
  process.exit(0);
});
