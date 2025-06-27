const { spawn } = require('child_process');
const path = require('path');

// Start the backend server
const server = spawn('npx', ['nodemon', '--exec', 'npx ts-node server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

// Start the frontend dev server
const client = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true
});

console.log('🚀 Starting AI Agents Platform...');
console.log('📱 Frontend: http://localhost:5173');
console.log('🔧 Backend: http://localhost:3000');

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  server.kill();
  client.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  server.kill();
  client.kill();
  process.exit();
});