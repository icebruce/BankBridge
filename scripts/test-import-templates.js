#!/usr/bin/env node

/**
 * Script to run Import Templates tests with coverage and detailed output
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Import Templates Tests...\n');

try {
  // Run tests with coverage for ImportTemplates
  const command = 'npm run test:coverage -- src/components/ImportTemplates --reporter=verbose';
  
  console.log('📊 Running tests with coverage...');
  console.log(`Command: ${command}\n`);
  
  execSync(command, { 
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
  
  console.log('\n✅ All Import Templates tests passed!');
  console.log('\n📈 Coverage report generated in coverage/ directory');
  console.log('🌐 Open coverage/index.html to view detailed coverage report');
  
} catch (error) {
  console.error('\n❌ Tests failed!');
  console.error('Please fix the failing tests and try again.');
  process.exit(1);
} 