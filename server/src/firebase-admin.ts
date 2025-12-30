import * as admin from 'firebase-admin';
import * as path from 'path';

// Initialize Firebase Admin with service account
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

try {
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:');
    console.error('   Make sure serviceAccountKey.json exists in server/ folder');
    console.error('   Download it from: Firebase Console → Project Settings → Service accounts');
    process.exit(1);
}

export default admin;
