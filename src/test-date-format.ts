/**
 * Test Date Format Parsing
 *
 * Tests different date formats to ensure proper parsing
 */

import { logger } from './logger.js';

function testDateParsing() {
  logger.info('=== Testing Date Format Parsing ===\n');

  const testCases = [
    // ISO 8601 formats (recommended)
    { format: 'ISO 8601 with timezone', value: '2023-02-17T10:30:00.000Z' },
    { format: 'ISO 8601 without timezone', value: '2023-02-17T10:30:00' },
    { format: 'ISO 8601 with +08:00', value: '2023-02-17T10:30:00+08:00' },

    // Simple date formats (legacy support)
    { format: 'YYYY-MM-DD', value: '2023-02-17' },
    { format: 'YYYY/MM/DD', value: '2023/02/17' },

    // Edge cases
    { format: 'Timestamp (ms)', value: '1676628600000' },
    { format: 'Invalid format', value: 'not-a-date' },
    { format: 'Empty string', value: '' },
  ];

  const referenceDate = new Date('2023-02-01T00:00:00.000Z');
  logger.info(`Reference date: ${referenceDate.toISOString()}\n`);

  testCases.forEach(({ format, value }) => {
    try {
      const parsedDate = new Date(value);
      const isValid = !isNaN(parsedDate.getTime());

      if (isValid) {
        const isAfter = parsedDate > referenceDate;
        console.log(`✅ ${format.padEnd(30)} → ${parsedDate.toISOString()} (${isAfter ? 'AFTER' : 'BEFORE'} ref)`);
      } else {
        console.log(`❌ ${format.padEnd(30)} → INVALID`);
      }
    } catch (e) {
      console.log(`❌ ${format.padEnd(30)} → ERROR: ${(e as Error).message}`);
    }
  });

  console.log('\n');
  logger.success('✅ Date parsing test complete!');

  console.log('\n📋 Recommendations:');
  console.log('  1. Use ISO 8601 format in Airtable: "2023-02-17T10:30:00.000Z"');
  console.log('  2. Or use "Last Modified Time" field type (auto ISO format)');
  console.log('  3. Legacy "YYYY-MM-DD" format is still supported');
}

testDateParsing();
