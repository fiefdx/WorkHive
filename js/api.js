/**
 * WorkHive - API Service Layer (Phase 2)
 * 
 * Issue #56: Update frontend to handle authentication with JWT tokens
 * Connects to Node.js backend API
 * 
 * Base URL: https://workhive-1ph3.onrender.com/api
 */

const API_BASE_URL = 'https://workhive-1ph3.onrender.com/api';

/**
 * API HELPER FUNCTION
 * Makes HTTP requests with authentication token
 */
async function apiRequest(endpoint, method = 'GET', data = null, requireAuth = false) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  // Add authentication token if required
  if (requireAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
  }

  // Add request body if data provided
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      return { success: false, message: result.message || 'Request failed', data: null };
    }

    return result;
  } catch (error) {
    console.error('API Request Error:', error);
    return { 
      success: false, 
      message: 'Network error. Please check if the backend server is running.', 
      error: error.message 
    };
  }
}

/**
 * AUTHENTICATION API
 */

// Register new user
async function apiRegister(userData) {
  const result = await apiRequest('/auth/register', 'POST', userData, false);
  
  if (result.success && result.data && result.data.token) {
    // Store token and user info after registration
    localStorage.setItem('authToken', result.data.token);
    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
  }
  
  return result;
}

// Login user
async function apiLogin(loginData) {
  const result = await apiRequest('/auth/login', 'POST', loginData, false);
  
  if (result.success && result.data && result.data.token) {
    // Store token and user info
    localStorage.setItem('authToken', result.data.token);
    localStorage.setItem('currentUser', JSON.stringify(result.data.user));
  }
  
  return result;
}

// Logout user
async function apiLogout() {
  const result = await apiRequest('/auth/logout', 'POST', null, true);
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  return result;
}

// Get current user
async function apiGetCurrentUser() {
  return await apiRequest('/auth/me', 'GET', null, true);
}

/**
 * PROPERTY API
 */

// Create property (owner only)
async function apiCreateProperty(propertyData) {
  return await apiRequest('/properties', 'POST', propertyData, true);
}

// Get all properties
async function apiGetProperties() {
  return await apiRequest('/properties', 'GET', null, false);
}

// Get property by ID
async function apiGetPropertyById(id) {
  return await apiRequest(`/properties/${id}`, 'GET', null, false);
}

// Get owner's properties
async function apiGetMyProperties() {
  const token = localStorage.getItem('authToken');
  console.log('apiGetMyProperties - Token exists:', !!token);
  const result = await apiRequest('/properties/my-properties', 'GET', null, true);
  console.log('apiGetMyProperties result:', result);
  return result;
}

// Update property
async function apiUpdateProperty(id, propertyData) {
  return await apiRequest(`/properties/${id}`, 'PUT', propertyData, true);
}

// Delete property
async function apiDeleteProperty(id) {
  return await apiRequest(`/properties/${id}`, 'DELETE', null, true);
}

/**
 * WORKSPACE API
 */

// Create workspace (owner only)
async function apiCreateWorkspace(workspaceData) {
  return await apiRequest('/workspaces', 'POST', workspaceData, true);
}

// Search workspaces with filters
async function apiSearchWorkspaces(filters = {}) {
  // Build query string from filters
  const queryParams = new URLSearchParams();
  
  if (filters.neighborhood) queryParams.append('neighborhood', filters.neighborhood);
  if (filters.minSquareFeet) queryParams.append('minSquareFeet', filters.minSquareFeet);
  if (filters.maxSquareFeet) queryParams.append('maxSquareFeet', filters.maxSquareFeet);
  if (filters.hasParking !== undefined) queryParams.append('hasParking', filters.hasParking);
  if (filters.hasPublicTransit !== undefined) queryParams.append('hasPublicTransit', filters.hasPublicTransit);
  if (filters.minSeatingCapacity) queryParams.append('minSeatingCapacity', filters.minSeatingCapacity);
  if (filters.smokingAllowed !== undefined) queryParams.append('smokingAllowed', filters.smokingAllowed);
  if (filters.availabilityDate) queryParams.append('availabilityDate', filters.availabilityDate);
  if (filters.leaseTerm) queryParams.append('leaseTerm', filters.leaseTerm);
  if (filters.minPrice) queryParams.append('minPrice', filters.minPrice);
  if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.order) queryParams.append('order', filters.order);
  if (filters.limit) queryParams.append('limit', filters.limit);
  if (filters.page) queryParams.append('page', filters.page);

  const queryString = queryParams.toString();
  const endpoint = `/workspaces${queryString ? '?' + queryString : ''}`;
  
  return await apiRequest(endpoint, 'GET', null, false);
}

// Get workspace by ID
async function apiGetWorkspaceById(id) {
  return await apiRequest(`/workspaces/${id}`, 'GET', null, false);
}

// Wrapper function for workspace details
async function getWorkspaceById(id) {
  const result = await apiGetWorkspaceById(id);
  
  if (result.success) {
    return { success: true, workspace: result.data.workspace };
  } else {
    return { success: false, message: result.message };
  }
}

// Get owner's workspaces
async function apiGetMyWorkspaces() {
  return await apiRequest('/workspaces/my-workspaces', 'GET', null, true);
}

// Update workspace
async function apiUpdateWorkspace(id, workspaceData) {
  return await apiRequest(`/workspaces/${id}`, 'PUT', workspaceData, true);
}

// Delete workspace
async function apiDeleteWorkspace(id) {
  return await apiRequest(`/workspaces/${id}`, 'DELETE', null, true);
}

/**
 * UTILITY FUNCTIONS
 */

// Check if user is authenticated
function isAuthenticated() {
  return localStorage.getItem('authToken') !== null;
}

// Get current user data
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// Set current user (for backward compatibility)
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear current user (for backward compatibility)
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

// Clear authentication
function clearAuth() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
}

// Search workspaces wrapper (returns simplified result for frontend use)
async function searchWorkspaces(filters) {
  const result = await apiSearchWorkspaces(filters);
  
  if (result.success) {
    return { 
      success: true, 
      workspaces: result.data.workspaces || [],
      pagination: result.data.pagination
    };
  } else {
    return { success: false, message: result.message, workspaces: [] };
  }
}

// Initialize API service (check if token is still valid)
async function initializeAPI() {
  const token = localStorage.getItem('authToken');
  const user = getCurrentUser();
  
  if (token && user) {
    // Verify token is still valid
    const result = await apiGetCurrentUser();
    if (!result.success) {
      // Token expired or invalid
      clearAuth();
      return { authenticated: false, user: null };
    }
    return { authenticated: true, user: result.data.user };
  }
  
  return { authenticated: false, user: null };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // API functions
    apiRegister,
    apiLogin,
    apiLogout,
    apiGetCurrentUser,
    apiCreateProperty,
    apiGetProperties,
    apiGetPropertyById,
    apiGetMyProperties,
    apiUpdateProperty,
    apiDeleteProperty,
    apiCreateWorkspace,
    apiSearchWorkspaces,
    searchWorkspaces, // Wrapper function for easier use
    apiGetWorkspaceById,
    getWorkspaceById, // Wrapper function for easier use
    apiGetMyWorkspaces,
    apiUpdateWorkspace,
    apiDeleteWorkspace,
    // Utility functions
    isAuthenticated,
    getCurrentUser,
    clearAuth,
    initializeAPI,
    // Constants
    API_BASE_URL
  };
}
