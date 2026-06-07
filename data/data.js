/**
 * WorkHive - In-Memory Data Storage (Phase 1)
 * 
 * Phase 1: Uses in-memory arrays/objects for data storage
 * Phase 2: Will be replaced with MongoDB + Mongoose
 * 
 * Data Models:
 * - User: { id, firstName, middleName, lastName, email, phone, role, password }
 * - Property: { id, ownerId, address, neighborhood, squareFeet, hasParking, hasPublicTransit }
 * - Workspace: { id, propertyId, type, seatingCapacity, smokingAllowed, availabilityDate, leaseTerm, price }
 */

// Initialize empty data arrays
const users = [];
const properties = [];
const workspaces = [];

// ID counters for auto-incrementing
let userIdCounter = 1;
let propertyIdCounter = 1;
let workspaceIdCounter = 1;

/**
 * DEMO DATA (For Testing)
 * Pre-populate with demo accounts for easy testing
 */
function loadDemoData() {
  // Check if already loaded
  if (users.length > 0) return;
  
  // Demo Coworker Account
  // Email: coworker@gmail.com, Password: 123456
  const coworker = {
    id: userIdCounter++,
    firstName: 'Demo',
    middleName: '',
    lastName: 'Coworker',
    email: 'coworker@gmail.com',
    phone: '4165551234',
    role: 'coworker',
    password: '123456'
  };
  users.push(coworker);
  
  // Demo Owner Account
  // Email: owner@gmail.com, Password: 123456
  const owner = {
    id: userIdCounter++,
    firstName: 'Demo',
    middleName: '',
    lastName: 'Owner',
    email: 'owner@gmail.com',
    phone: '4165555678',
    role: 'owner',
    password: '123456'
  };
  users.push(owner);
  
  // Demo Property (owned by owner)
  const property1 = {
    id: propertyIdCounter++,
    ownerId: owner.id,
    address: '123 Main Street',
    neighborhood: 'Downtown',
    squareFeet: 2500,
    hasParking: true,
    hasPublicTransit: true,
    workspaces: []
  };
  properties.push(property1);
  
  const property2 = {
    id: propertyIdCounter++,
    ownerId: owner.id,
    address: '456 Oak Avenue',
    neighborhood: 'Midtown',
    squareFeet: 1800,
    hasParking: false,
    hasPublicTransit: true,
    workspaces: []
  };
  properties.push(property2);
  
  // Demo Workspaces
  const workspace1 = {
    id: workspaceIdCounter++,
    propertyId: property1.id,
    type: 'private office',
    seatingCapacity: 6,
    smokingAllowed: false,
    availabilityDate: '2026-06-01',
    leaseTerm: 'month',
    price: 350
  };
  workspaces.push(workspace1);
  property1.workspaces.push(workspace1.id);
  
  const workspace2 = {
    id: workspaceIdCounter++,
    propertyId: property1.id,
    type: 'meeting room',
    seatingCapacity: 10,
    smokingAllowed: false,
    availabilityDate: '2026-06-15',
    leaseTerm: 'day',
    price: 75
  };
  workspaces.push(workspace2);
  property1.workspaces.push(workspace2.id);
  
  const workspace3 = {
    id: workspaceIdCounter++,
    propertyId: property2.id,
    type: 'desk',
    seatingCapacity: 1,
    smokingAllowed: true,
    availabilityDate: '2026-07-01',
    leaseTerm: 'month',
    price: 200
  };
  workspaces.push(workspace3);
  property2.workspaces.push(workspace3.id);
  
  console.log('Demo data loaded: 2 users, 2 properties, 3 workspaces');
}

// Auto-load demo data on initialization
loadDemoData();

// Get current logged-in user (stored in localStorage)
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// Set current logged-in user
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

// Clear current user (logout)
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}

/**
 * USER DATA STRUCTURE
 */
function createUser(firstName, middleName, lastName, email, phone, role, password) {
  const user = {
    id: userIdCounter++,
    firstName: firstName.trim(),
    middleName: middleName ? middleName.trim() : '',
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    role: role, // 'owner' or 'coworker'
    password: password // Phase 1: plain text
  };
  
  users.push(user);
  return user;
}

function getUserByEmail(email) {
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  return users.find(u => u.id === id);
}

function getAllUsers() {
  return [...users];
}

/**
 * PROPERTY DATA STRUCTURE
 */
function createProperty(ownerId, address, neighborhood, squareFeet, hasParking, hasPublicTransit) {
  const property = {
    id: propertyIdCounter++,
    ownerId: ownerId,
    address: address.trim(),
    neighborhood: neighborhood.trim(),
    squareFeet: parseInt(squareFeet),
    hasParking: hasParking || false,
    hasPublicTransit: hasPublicTransit || false,
    workspaces: [] // Array of workspace IDs
  };
  
  properties.push(property);
  return property;
}

function getPropertyById(id) {
  return properties.find(p => p.id === id);
}

function getPropertiesByOwnerId(ownerId) {
  return properties.filter(p => p.ownerId === ownerId);
}

function getAllProperties() {
  return [...properties];
}

function updateProperty(id, updates) {
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  const property = properties[index];
  const updatedProperty = { ...property, ...updates };
  properties[index] = updatedProperty;
  return updatedProperty;
}

function deleteProperty(id) {
  const index = properties.findIndex(p => p.id === id);
  if (index === -1) return false;
  
  // Remove all workspaces associated with this property
  const propertyWorkspaces = workspaces.filter(w => w.propertyId === id);
  propertyWorkspaces.forEach(w => {
    const wsIndex = workspaces.findIndex(ws => ws.id === w.id);
    if (wsIndex !== -1) workspaces.splice(wsIndex, 1);
  });
  
  properties.splice(index, 1);
  return true;
}

/**
 * WORKSPACE DATA STRUCTURE
 */
function createWorkspace(propertyId, type, seatingCapacity, smokingAllowed, availabilityDate, leaseTerm, price) {
  const workspace = {
    id: workspaceIdCounter++,
    propertyId: parseInt(propertyId),
    type: type, // 'meeting room', 'private office', 'desk'
    seatingCapacity: parseInt(seatingCapacity),
    smokingAllowed: smokingAllowed || false,
    availabilityDate: availabilityDate,
    leaseTerm: leaseTerm, // 'day', 'week', 'month'
    price: parseFloat(price)
  };
  
  workspaces.push(workspace);
  
  // Add workspace ID to property
  const property = getPropertyById(propertyId);
  if (property) {
    property.workspaces.push(workspace.id);
  }
  
  return workspace;
}

function getWorkspaceById(id) {
  return workspaces.find(w => w.id === id);
}

function getWorkspacesByPropertyId(propertyId) {
  return workspaces.filter(w => w.propertyId === propertyId);
}

function getWorkspacesByOwnerId(ownerId) {
  // Get all properties owned by this user
  const ownerProperties = getPropertiesByOwnerId(ownerId);
  const propertyIds = ownerProperties.map(p => p.id);
  // Get all workspaces for those properties
  return workspaces.filter(w => propertyIds.includes(w.propertyId));
}

function getAllWorkspaces() {
  return [...workspaces];
}

function updateWorkspace(id, updates) {
  const index = workspaces.findIndex(w => w.id === id);
  if (index === -1) return null;
  
  const workspace = workspaces[index];
  const updatedWorkspace = { ...workspace, ...updates };
  workspaces[index] = updatedWorkspace;
  return updatedWorkspace;
}

function deleteWorkspace(id) {
  const index = workspaces.findIndex(w => w.id === id);
  if (index === -1) return false;
  
  const workspace = workspaces[index];
  
  // Remove workspace ID from property's workspaces array
  const property = getPropertyById(workspace.propertyId);
  if (property && property.workspaces) {
    const wsIndex = property.workspaces.indexOf(id);
    if (wsIndex !== -1) {
      property.workspaces.splice(wsIndex, 1);
    }
  }
  
  workspaces.splice(index, 1);
  return true;
}

/**
 * SEARCH/FILTER FUNCTIONALITY
 */
function filterWorkspaces(filters = {}) {
  let results = [...workspaces];
  
  // Filter by address/neighborhood
  if (filters.address) {
    const searchLower = filters.address.toLowerCase();
    results = results.filter(w => {
      const property = getPropertyById(w.propertyId);
      if (!property) return false;
      return property.address.toLowerCase().includes(searchLower) ||
             property.neighborhood.toLowerCase().includes(searchLower);
    });
  }
  
  // Filter by minimum seating capacity
  if (filters.minCapacity) {
    results = results.filter(w => w.seatingCapacity >= parseInt(filters.minCapacity));
  }
  
  // Filter by lease term
  if (filters.leaseTerm) {
    results = results.filter(w => w.leaseTerm === filters.leaseTerm);
  }
  
  // Filter by price range
  if (filters.minPrice) {
    results = results.filter(w => w.price >= parseFloat(filters.minPrice));
  }
  if (filters.maxPrice) {
    results = results.filter(w => w.price <= parseFloat(filters.maxPrice));
  }
  
  // Filter by availability date
  if (filters.availDate) {
    results = results.filter(w => w.availabilityDate >= filters.availDate);
  }
  
  // Filter by property amenities (only apply if explicitly checked)
  if (filters.hasParking === true) {
    results = results.filter(w => {
      const property = getPropertyById(w.propertyId);
      return property && property.hasParking === true;
    });
  }
  
  if (filters.hasTransit === true) {
    results = results.filter(w => {
      const property = getPropertyById(w.propertyId);
      return property && property.hasPublicTransit === true;
    });
  }
  
  // Filter by smoking (only apply if explicitly checked)
  if (filters.smokingAllowed === true) {
    results = results.filter(w => w.smokingAllowed === true);
  }
  
  return results;
}

/**
 * UTILITY FUNCTIONS
 */
function enrichWorkspaceWithProperty(workspace) {
  const property = getPropertyById(workspace.propertyId);
  if (!property) return null;
  
  const owner = getUserById(property.ownerId);
  
  return {
    ...workspace,
    property: {
      id: property.id,
      address: property.address,
      neighborhood: property.neighborhood,
      squareFeet: property.squareFeet,
      hasParking: property.hasParking,
      hasPublicTransit: property.hasPublicTransit
    },
    owner: owner ? {
      id: owner.id,
      firstName: owner.firstName,
      lastName: owner.lastName,
      email: owner.email,
      phone: owner.phone
    } : null
  };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Users
    createUser, getUserByEmail, getUserById, getAllUsers, getCurrentUser, setCurrentUser, clearCurrentUser,
    // Properties
    createProperty, getPropertyById, getPropertiesByOwnerId, getAllProperties, updateProperty, deleteProperty,
    // Workspaces
    createWorkspace, getWorkspaceById, getWorkspacesByPropertyId, getWorkspacesByOwnerId, getAllWorkspaces, updateWorkspace, deleteWorkspace,
    // Search
    filterWorkspaces,
    // Utilities
    enrichWorkspaceWithProperty
  };
}
