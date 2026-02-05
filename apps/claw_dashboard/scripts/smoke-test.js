#!/usr/bin/env node
/**
 * Smoke Test - OpenClaw Dashboard
 * 
 * Verifies basic functionality:
 * 1. Gateway is running
 * 2. Agents are accessible
 * 3. Sessions can be listed
 */

const { execSync } = require('child_process');

const run = (cmd) => {
  try {
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error) {
    return { success: false, output: error.stderr || error.stdout || error.message };
  }
};

console.log('🧪 Running OpenClaw Dashboard smoke tests...\n');

// 1. Check gateway status
console.log('1️⃣  Checking gateway status...');
const gatewayStatus = run('openclaw gateway status');
if (!gatewayStatus.success) {
  console.error('❌ Failed to check gateway status');
  console.error(gatewayStatus.output);
  process.exit(1);
}
if (!gatewayStatus.output.toLowerCase().includes('running')) {
  console.error('❌ Gateway is not running');
  console.error('   Start it with: openclaw gateway start');
  process.exit(1);
}
console.log('✅ Gateway is running\n');

// 2. List agents
console.log('2️⃣  Listing agents...');
const agentsList = run('openclaw agents list');
if (!agentsList.success) {
  console.error('❌ Failed to list agents');
  console.error(agentsList.output);
  process.exit(1);
}

const requiredAgents = ['head', 'worker', 'tester', 'main'];
const missingAgents = requiredAgents.filter(agent => !agentsList.output.includes(agent));
if (missingAgents.length > 0) {
  console.error('❌ Missing required agents:', missingAgents.join(', '));
  console.error('   Found agents:', agentsList.output);
  process.exit(1);
}
console.log('✅ All required agents found:', requiredAgents.join(', '), '\n');

// 3. List sessions
console.log('3️⃣  Listing sessions...');
const sessionsList = run('openclaw sessions');
if (!sessionsList.success) {
  console.error('❌ Failed to list sessions');
  console.error(sessionsList.output);
  process.exit(1);
}
console.log('✅ Sessions listed successfully\n');

// 4. Test JSON output (verify IPC will work)
console.log('4️⃣  Testing JSON output...');
const agentsJson = run('openclaw agents list');
const sessionsJson = run('openclaw sessions --json');
if (!sessionsJson.success) {
  console.error('❌ JSON output not available');
  console.error(sessionsJson.output);
  process.exit(1);
}
try {
  const parsed = JSON.parse(sessionsJson.output);
  if (!parsed.sessions) {
    throw new Error('Missing sessions field in JSON output');
  }
  console.log('✅ JSON output valid\n');
} catch (err) {
  console.error('❌ Invalid JSON output:', err.message);
  process.exit(1);
}

// 5. Verify dashboard files exist
console.log('5️⃣  Verifying dashboard build...');
const fs = require('fs');
const path = require('path');
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ dist/ directory not found. Run: npm run build');
  process.exit(1);
}
const indexHtml = path.join(distPath, 'renderer', 'index.html');
if (!fs.existsSync(indexHtml)) {
  console.error('❌ dist/renderer/index.html not found. Run: npm run build');
  process.exit(1);
}
console.log('✅ Dashboard build files found\n');

console.log('🎉 All smoke tests passed!');
console.log('   Dashboard is ready to run.');
process.exit(0);
