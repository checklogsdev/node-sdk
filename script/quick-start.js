#!/usr/bin/env node

/**
 * Quick Start Script for @checklogs/node-sdk
 * This script helps you get started quickly with the CheckLogs SDK
 */

const fs = require('fs');
const path = require('path');

function createQuickStartFiles() {
  console.log('🚀 CheckLogs Node.js SDK - Quick Start Setup\n');

  // Check if package.json exists
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  let isESModules = false;

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    isESModules = packageJson.type === 'module';
    console.log(`📦 Detected project type: ${isESModules ? 'ES Modules' : 'CommonJS'}`);
  } else {
    console.log('⚠️  No package.json found in current directory');
    console.log('   Creating a basic package.json...\n');
    
    const basicPackageJson = {
      "name": "checklogs-test",
      "version": "1.0.0",
      "description": "Testing CheckLogs SDK",
      "main": "index.js",
      "scripts": {
        "test": "node test.js"
      },
      "dependencies": {
        "@checklogs/node-sdk": "^1.0.0"
      }
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(basicPackageJson, null, 2));
    console.log('✅ Created package.json');
  }

  // Create appropriate test file based on project type
  if (isESModules) {
    createESModuleTest();
  } else {
    createCommonJSTest();
  }

  console.log('\n🎉 Quick start files created!');
  console.log('\nNext steps:');
  console.log('1. Replace "your-api-key-here" with your actual CheckLogs API key');
  console.log('2. Install dependencies: npm install');
  console.log(`3. Run the test: ${isESModules ? 'node test.mjs' : 'node test.js'}`);
  console.log('\nFor more examples and documentation, visit: https://github.com/checklogs/node-sdk');
}

function createCommonJSTest() {
  const testContent = `// CommonJS Test for CheckLogs SDK
const { createLogger } = require('@checklogs/node-sdk');

async function testCheckLogs() {
  console.log('🧪 Testing CheckLogs SDK (CommonJS)...');
  
  // Replace with your actual API key
  const logger = createLogger('your-api-key-here');

  try {
    // Test basic logging
    await logger.info('Test message from CommonJS', { 
      test: true, 
      timestamp: new Date().toISOString() 
    });
    console.log('✅ Log sent successfully!');

    // Test error logging
    await logger.error('Test error message', { 
      error_code: 'TEST_ERROR',
      component: 'quick-start' 
    });
    console.log('✅ Error log sent successfully!');

    // Test retrieving logs
    const logs = await logger.getLogs({ limit: 3 });
    console.log(\`📊 Retrieved \${logs.data.logs.length} recent logs\`);

    console.log('\\n🎉 All tests passed! Your CheckLogs SDK is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.statusCode === 401) {
      console.log('\\n💡 Tip: Make sure you have replaced "your-api-key-here" with your actual API key');
    }
    
    process.exit(1);
  }
}

// Run the test
testCheckLogs();
`;

  fs.writeFileSync(path.join(process.cwd(), 'test.js'), testContent);
  console.log('✅ Created test.js (CommonJS)');
}

function createESModuleTest() {
  const testContent = `// ES Module Test for CheckLogs SDK
import { createLogger } from '@checklogs/node-sdk';

async function testCheckLogs() {
  console.log('🧪 Testing CheckLogs SDK (ES Modules)...');
  
  // Replace with your actual API key
  const logger = createLogger('your-api-key-here');

  try {
    // Test basic logging
    await logger.info('Test message from ES Modules', { 
      test: true, 
      timestamp: new Date().toISOString() 
    });
    console.log('✅ Log sent successfully!');

    // Test error logging
    await logger.error('Test error message', { 
      error_code: 'TEST_ERROR',
      component: 'quick-start' 
    });
    console.log('✅ Error log sent successfully!');

    // Test retrieving logs
    const logs = await logger.getLogs({ limit: 3 });
    console.log(\`📊 Retrieved \${logs.data.logs.length} recent logs\`);

    console.log('\\n🎉 All tests passed! Your CheckLogs SDK is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.statusCode === 401) {
      console.log('\\n💡 Tip: Make sure you have replaced "your-api-key-here" with your actual API key');
    }
    
    process.exit(1);
  }
}

// Run the test
testCheckLogs();
`;

  fs.writeFileSync(path.join(process.cwd(), 'test.mjs'), testContent);
  console.log('✅ Created test.mjs (ES Modules)');
}

// Run the script
createQuickStartFiles();