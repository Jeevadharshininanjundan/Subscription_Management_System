import { setServers } from 'node:dns';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Payment } from '../models/Payment.js';

const legacyIndexName = 'invoiceId_1_externalReference_1';
const indexKey = { invoiceId: 1, externalReference: 1 };
const partialFilterExpression = { externalReference: { $type: 'string' } };

function isCorrectIndex(index) {
  return index.name === legacyIndexName
    && index.unique === true
    && JSON.stringify(index.key) === JSON.stringify(indexKey)
    && JSON.stringify(index.partialFilterExpression) === JSON.stringify(partialFilterExpression);
}

try {
  setServers(['8.8.8.8', '1.1.1.1']);
  await connectDatabase();
  const indexes = await Payment.collection.indexes();
  if (indexes.some(isCorrectIndex)) {
    console.log('Payment indexes are already up to date.');
  } else {
    if (indexes.some(index => index.name === legacyIndexName)) {
      console.log(`Dropping obsolete index ${legacyIndexName}.`);
      await Payment.collection.dropIndex(legacyIndexName);
    }
    const refreshedIndexes = await Payment.collection.indexes();
    if (!refreshedIndexes.some(isCorrectIndex)) {
      await Payment.collection.createIndex(
        indexKey,
        { name: legacyIndexName, unique: true, partialFilterExpression }
      );
    }
    console.log('Payment indexes updated.');
  }
} finally {
  await disconnectDatabase();
}
