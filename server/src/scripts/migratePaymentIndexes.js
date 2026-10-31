import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Payment } from '../models/Payment.js';

const legacyIndexName = 'invoiceId_1_externalReference_1';

try {
  await connectDatabase();
  const indexes = await Payment.collection.indexes();
  if (indexes.some(index => index.name === legacyIndexName)) {
    await Payment.collection.dropIndex(legacyIndexName);
  }
  await Payment.collection.createIndex(
    { invoiceId: 1, externalReference: 1 },
    { name: legacyIndexName, unique: true, partialFilterExpression: { externalReference: { $type: 'string' } } }
  );
  console.log('Payment indexes updated.');
} finally {
  await disconnectDatabase();
  await mongoose.disconnect().catch(() => {});
}
