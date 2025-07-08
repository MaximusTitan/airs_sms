// Test email sending to see if events are recorded
const testEmailSend = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/emails/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would need proper authentication
      },
      body: JSON.stringify({
        emails: ['test@example.com'],
        subject: 'Test Email for Analytics',
        content: '<h1>Test Email</h1><p>This is a test email to check if analytics are working.</p>',
        personalized: false
      })
    });

    const result = await response.json();
    console.log('Email send response:', result);
    
  } catch (error) {
    console.error('Email send test failed:', error);
  }
};

// Wait a moment and then check analytics
const testAnalyticsAfterSend = async () => {
  try {
    // Wait 2 seconds for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:3000/api/debug/analytics');
    const result = await response.json();
    console.log('Analytics after email send:', result);
    
  } catch (error) {
    console.error('Analytics test failed:', error);
  }
};

console.log('Testing email send...');
testEmailSend().then(() => {
  console.log('Testing analytics after send...');
  return testAnalyticsAfterSend();
});
