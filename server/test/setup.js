process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
process.env.JWT_ISSUER = 'brightloop-subscription-test';
process.env.JWT_AUDIENCE = 'brightloop-client-test';
process.env.MONGO_TEST_URI = 'mongodb://127.0.0.1:27017/brightloop_subscription_test';
