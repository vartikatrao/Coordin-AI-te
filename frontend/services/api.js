const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Solo Mode API calls
export const soloModeAPI = {
  // Process natural language query
  async processQuery(query, userLocation = null, context = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/solo/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          user_location: userLocation,
          context
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Solo mode API error:', error);
      throw error;
    }
  },

  // Get place details
  async getPlaceDetails(fsqPlaceId, fields = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/solo/place-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fsq_place_id: fsqPlaceId,
          fields
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Place details API error:', error);
      throw error;
    }
  },

  // Get example queries
  async getExamples() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/solo/examples`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Examples API error:', error);
      throw error;
    }
  },

  // Get supported intents
  async getSupportedIntents() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/solo/supported-intents`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Supported intents API error:', error);
      throw error;
    }
  }
};

// Group Mode API calls
export const groupModeAPI = {
  // Note: AI-powered group meetup functionality removed
  // Your existing group coordination features remain available via /api/v1/group/*
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Test endpoint
export const testAPI = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/test`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Test API error:', error);
    throw error;
  }
};
