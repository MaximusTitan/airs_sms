// Simple test script to check if webhook endpoint is working
const test = async () => {
  try {
    // Test the debug endpoint
    const response = await fetch('http://localhost:3000/api/debug/email-events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test_event',
        email_id: 'test-123'
      })
    });

    const result = await response.json();
    console.log('Debug endpoint response:', result);
    
    // Test the analytics endpoint
    const analyticsResponse = await fetch('http://localhost:3000/api/analytics/email');
    const analyticsResult = await analyticsResponse.json();
    console.log('Analytics endpoint response:', analyticsResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

test();
