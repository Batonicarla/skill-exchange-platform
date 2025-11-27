const axios = require('axios');

const testBackend = async () => {
  try {
    console.log('Testing local backend...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5001/api/health');
    console.log('Health check:', healthResponse.data);
    
    // Test database connection
    const dbResponse = await axios.get('http://localhost:5001/api/test-db');
    console.log('Database test:', dbResponse.data);
    
  } catch (error) {
    console.error('Backend test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
};

testBackend();