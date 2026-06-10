/**
 * WorkHive - Property Management Module
 * 
 * Issue #6-10: Owner Lists Property
 * Issue #21-26: Owner Dashboard, Edit, Delete functionality
 * 
 * Functions for managing properties with in-memory storage (Phase 1)
 */

/**
 * CREATE PROPERTY
 * 
 * @param {Object} propertyData - Property data
 * @returns {Object} - { success: boolean, message: string, property: Object|null }
 */
async function handleCreateProperty(propertyData) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can create properties.', property: null };
  }
  
  // Validate property data
  const validation = validatePropertyData(propertyData);
  if (!validation.valid) {
    return { success: false, message: validation.error, property: null };
  }
  
  // Create property
  const property = createProperty(
    currentUser.id,
    propertyData.address,
    propertyData.neighborhood,
    propertyData.squareFeet,
    propertyData.hasParking || false,
    propertyData.hasPublicTransit || false
  );
  
  return { success: true, message: 'Property listed successfully!', property: property };
}

/**
 * UPDATE PROPERTY
 * 
 * @param {number} propertyId - Property ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object} - { success: boolean, message: string, property: Object|null }
 */
async function handleUpdateProperty(propertyId, updates) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can update properties.', property: null };
  }
  
  const property = getPropertyById(propertyId);
  if (!property) {
    return { success: false, message: 'Property not found.', property: null };
  }
  
  // Check ownership
  if (property.ownerId !== currentUser.id) {
    return { success: false, message: 'You can only update your own properties.', property: null };
  }
  
  // Validate updates
  if (updates.address || updates.neighborhood || updates.squareFeet) {
    const validation = validatePropertyData(updates);
    if (!validation.valid) {
      return { success: false, message: validation.error, property: null };
    }
  }
  
  // Update property
  const updatedProperty = updateProperty(propertyId, updates);
  
  return { success: true, message: 'Property updated successfully!', property: updatedProperty };
}

/**
 * DELETE PROPERTY
 * 
 * @param {number} propertyId - Property ID to delete
 * @returns {Object} - { success: boolean, message: string }
 */
async function handleDeleteProperty(propertyId) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can delete properties.' };
  }
  
  const property = getPropertyById(propertyId);
  if (!property) {
    console.log('Property not found:', propertyId);
    return { success: false, message: 'Property not found.' };
  }
  
  console.log('Property to delete:', property);
  console.log('Current user:', currentUser);
  console.log('Property ownerId:', property.ownerId, 'User id:', currentUser.id);
  
  // Check ownership
  if (property.ownerId !== currentUser.id) {
    return { success: false, message: 'You can only delete your own properties.' };
  }
  
  // Check if property has workspaces
  const workspaceCount = property.workspaces ? property.workspaces.length : 0;
  console.log('Workspace count for property:', workspaceCount, 'workspaces:', property.workspaces);
  if (workspaceCount > 0) {
    return { 
      success: false, 
      message: `Cannot delete property with ${workspaceCount} workspace(s). Please delete workspaces first.` 
    };
  }
  
  // Delete property
  deleteProperty(propertyId);
  console.log('Property deleted successfully');
  
  return { success: true, message: 'Property deleted successfully!' };
}

/**
 * GET OWNER'S PROPERTIES
 * 
 * @returns {Array} - Array of owner's properties
 */
function getMyProperties() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    return [];
  }
  
  return getPropertiesByOwnerId(currentUser.id);
}

/**
 * VALIDATE PROPERTY DATA
 * 
 * @param {Object} data - Property data to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validatePropertyData(data) {
  if (!data.address || data.address.trim().length === 0) {
    return { valid: false, error: 'Address is required.' };
  }
  
  if (!data.neighborhood || data.neighborhood.trim().length === 0) {
    return { valid: false, error: 'Neighborhood is required.' };
  }
  
  if (!data.squareFeet || isNaN(data.squareFeet) || data.squareFeet <= 0) {
    return { valid: false, error: 'Square feet must be a positive number.' };
  }
  
  return { valid: true, error: null };
}

/**
 * SETUP PROPERTY FORM HANDLER
 * Attach to property create/edit form
 */
function setupPropertyForm() {
  const form = document.getElementById('propertyForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const propertyData = {
      address: formData.get('address'),
      neighborhood: formData.get('neighborhood'),
      squareFeet: formData.get('squareFeet'),
      hasParking: formData.get('hasParking') === 'on',
      hasPublicTransit: formData.get('hasPublicTransit') === 'on'
    };
    
    const result = await handleCreateProperty(propertyData);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        window.location.href = '../dashboard.html';
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * SETUP PROPERTY EDIT FORM HANDLER
 * Attach to property edit form
 */
function setupPropertyEditForm() {
  const form = document.getElementById('propertyEditForm');
  if (!form) return;
  
  // Get property ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const propertyId = parseInt(urlParams.get('id'));
  
  if (!propertyId) {
    showMessage('Invalid property ID.', 'error');
    return;
  }
  
  // Load property data
  const property = getPropertyById(propertyId);
  if (!property) {
    showMessage('Property not found.', 'error');
    return;
  }
  
  // Pre-fill form
  document.getElementById('editAddress').value = property.address;
  document.getElementById('editNeighborhood').value = property.neighborhood;
  document.getElementById('editSquareFeet').value = property.squareFeet;
  document.getElementById('editHasParking').checked = property.hasParking;
  document.getElementById('editHasPublicTransit').checked = property.hasPublicTransit;
  
  // Setup form submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const updates = {
      address: formData.get('address'),
      neighborhood: formData.get('neighborhood'),
      squareFeet: formData.get('squareFeet'),
      hasParking: formData.get('hasParking') === 'on',
      hasPublicTransit: formData.get('hasPublicTransit') === 'on'
    };
    
    const result = await handleUpdateProperty(propertyId, updates);
    
    if (result.success) {
      showMessage(result.message, 'success');
      setTimeout(() => {
        window.location.href = '../dashboard.html';
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * SETUP PROPERTY DELETE HANDLER
 */
function setupPropertyDeleteHandler() {
  const deleteButtons = document.querySelectorAll('[data-delete-property]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const propertyId = parseInt(this.dataset.deleteProperty);
      console.log('Delete property clicked:', propertyId);
      
      if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
        return;
      }
      
      console.log('Deleting property:', propertyId);
      const result = await handleDeleteProperty(propertyId);
      console.log('Delete result:', result);
      
      if (result.success) {
        showMessage(result.message, 'success');
        // Refresh dashboard data without page reload
        if (typeof loadDashboardData === 'function') {
          loadDashboardData();
        } else {
          window.location.reload();
        }
      } else {
        showMessage(result.message, 'error');
      }
    });
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  setupPropertyForm();
  setupPropertyEditForm();
  setupPropertyDeleteHandler();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleCreateProperty,
    handleUpdateProperty,
    handleDeleteProperty,
    getMyProperties,
    validatePropertyData,
    setupPropertyForm,
    setupPropertyEditForm,
    setupPropertyDeleteHandler
  };
} 
