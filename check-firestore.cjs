const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'nyumbanii'
});

const db = admin.firestore();

async function checkPowerOutages() {
  try {
    console.log('📊 Checking powerOutages collection...\n');

    const snapshot = await db.collection('powerOutages').get();

    console.log(`Total documents: ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('❌ No power outages found in database');
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log('='.repeat(80));
      console.log(`📄 Document ID: ${doc.id}`);
      console.log(`Status: ${data.status}`);
      console.log(`Affected Areas: ${data.affectedAreas?.join(', ') || 'None'}`);
      console.log(`Scheduled Date: ${data.scheduledDate || 'Not set'}`);
      console.log(`Start Time: ${data.startTime || 'Not set'}`);
      console.log(`End Time: ${data.endTime || 'Not set'}`);
      console.log(`Tweet ID: ${data.tweetId}`);
      console.log(`Tweet URL: ${data.tweetUrl}`);
      console.log(`Description: ${data.description || 'None'}`);
      console.log(`Raw Text (first 200 chars): ${data.rawText?.substring(0, 200) || 'None'}...`);
      console.log('='.repeat(80));
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkPowerOutages();
