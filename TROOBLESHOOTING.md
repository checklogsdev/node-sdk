# Troubleshooting Guide

## Common Issues and Solutions

### 1. "require is not defined in ES module scope"

**Error message:**
```
ReferenceError: require is not defined in ES module scope, you can use import instead
```

**Cause:** Your project is configured to use ES modules but you're using CommonJS syntax.

**Solutions:**

#### Option A: Use ES Module syntax (Recommended)
Change your code from:
```javascript
const { createLogger } = require('@checklogs/node-sdk');
```

To:
```javascript
import { createLogger } from '@checklogs/node-sdk';
```

#### Option B: Configure your project for CommonJS
If you want to keep using `require()`, make sure your project is configured for CommonJS:

1. Remove `"type": "module"` from your `package.json`
2. Use `.js` extension instead of `.mjs`
3. Keep using `require()` syntax

#### Option C: Use dynamic imports in ES modules
```javascript
const { createLogger } = await import('@checklogs/node-sdk');
```

### 2. "Cannot use import statement outside a module"

**Cause:** Your project is configured for CommonJS but you're using ES module syntax.

**Solutions:**

#### Option A: Configure your project for ES modules
1. Add `"type": "module"` to your `package.json`
2. Use ES module syntax (`import/export`)

#### Option B: Use CommonJS syntax
Change your code from:
```javascript
import { createLogger } from '@checklogs/node-sdk';
```

To:
```javascript
const { createLogger } = require('@checklogs/node-sdk');
```

#### Option C: Use `.mjs` extension
Rename your file from `.js` to `.mjs` and use ES module syntax.

### 3. Project Configuration Examples

#### ES Modules Configuration
**package.json:**
```json
{
  "name": "my-project",
  "type": "module",
  "dependencies": {
    "@checklogs/node-sdk": "^1.0.0"
  }
}
```

**Your code (test.js or test.mjs):**
```javascript
import { createLogger } from '@checklogs/node-sdk';

const logger = createLogger('your-api-key');
await logger.info('Test message');
```

#### CommonJS Configuration
**package.json:**
```json
{
  "name": "my-project",
  "dependencies": {
    "@checklogs/node-sdk": "^1.0.0"
  }
}
```

**Your code (test.js):**
```javascript
const { createLogger } = require('@checklogs/node-sdk');

async function test() {
  const logger = createLogger('your-api-key');
  await logger.info('Test message');
}

test();
```

### 4. How to Check Your Project Type

Check your `package.json` file:

- If it contains `"type": "module"` → Your project uses ES modules
- If it doesn't contain `"type": "module"` → Your project uses CommonJS (default)

### 5. File Extensions

- `.js` - Uses project default (ES modules if `"type": "module"`, CommonJS otherwise)
- `.mjs` - Always ES modules
- `.cjs` - Always CommonJS

### 6. Network Issues

If you're getting network errors:

1. **Check your API key:** Make sure it's valid and has proper permissions
2. **Verify the API URL:** The SDK is configured for `http://localhost/checklogs/webiste/api/logs.php`
3. **Check network connectivity:** Ensure your application can reach the API server
4. **Firewall/Proxy issues:** Make sure there are no network restrictions

### 7. API Key Issues

**Error:** "Invalid or missing API key"

**Solutions:**
1. Verify your API key is correct
2. Make sure you're passing it as a string
3. Check that the key has proper permissions in CheckLogs

### 8. Validation Errors

**Error:** "message is required and must be a string"

**Solutions:**
1. Always provide a `message` field
2. Ensure the message is a string
3. Check that the message is not empty

Example:
```javascript
// ✅ Correct
await logger.log({ message: 'User logged in' });

// ❌ Incorrect
await logger.log({ msg: 'User logged in' }); // Wrong field name
await logger.log({ message: 123 }); // Wrong type
await logger.log({}); // Missing message
```

## Getting Help

If you're still having issues:

1. Check the [examples](./examples/) folder for working code samples
2. Review the [README.md](./README.md) for complete documentation
3. Create an issue on our GitHub repository with:
   - Your Node.js version
   - Your project configuration (package.json)
   - The exact error message
   - Your code snippet

## Quick Test

To quickly test if the SDK is working:

**For ES Modules:**
```javascript
// test.mjs
import { createLogger } from '@checklogs/node-sdk';

const logger = createLogger('your-api-key-here');
logger.info('Test from ES modules').then(() => {
  console.log('✅ Success!');
}).catch(error => {
  console.error('❌ Error:', error.message);
});
```

**For CommonJS:**
```javascript
// test.js (without "type": "module" in package.json)
const { createLogger } = require('@checklogs/node-sdk');

async function test() {
  const logger = createLogger('your-api-key-here');
  await logger.info('Test from CommonJS');
  console.log('✅ Success!');
}

test().catch(error => {
  console.error('❌ Error:', error.message);
});
```