// ES Module example
import { createLogger } from '../index.mjs';

async function testLogger() {
  // Create a logger instance
  const logger = createLogger('0e78815d69603a88d111c02e03143cf2e4dc5d4aaf9821d9cec41fe738ce7d56');

  try {
    // Log messages
    await logger.info('Application started');
    console.log('✅ Info log sent successfully');

    await logger.error('Something went wrong', { error_code: 500 });
    console.log('✅ Error log sent successfully');

    // Test other methods
    await logger.warning('This is a warning', { component: 'auth' });
    console.log('✅ Warning log sent successfully');

    await logger.debug('Debug information', { debug_data: { test: true } });
    console.log('✅ Debug log sent successfully');

    // Test timing
    const endTimer = logger.time('test-operation', 'Testing operation timing');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate 1 second operation
    endTimer();
    console.log('✅ Timing log sent successfully');

    // Test retrieving logs
    console.log('\n📊 Retrieving recent logs...');
    const logs = await logger.getLogs({ limit: 5 });
    console.log(`Found ${logs.data.logs.length} logs:`);
    logs.data.logs.forEach(log => {
      console.log(`- [${log.level}] ${log.message} (${log.timestamp})`);
    });

    // Test statistics
    console.log('\n📈 Getting statistics...');
    const stats = await logger.stats.getStats();
    console.log(`Total logs: ${stats.data.total_logs}`);
    console.log(`Today's logs: ${stats.data.logs_today}`);

    const errorRate = await logger.stats.getErrorRate();
    console.log(`Error rate: ${errorRate.toFixed(2)}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Run the test
testLogger().then(() => {
  console.log('\n✅ All tests completed!');
}).catch(error => {
  console.error('\n❌ Test failed:', error.message);
});