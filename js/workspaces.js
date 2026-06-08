/**
 * WorkHive - Workspace Management Module
 * 
 * Issue #11-16: Owner Lists Workspace
 * Issue #21-26: Owner Dashboard, Edit, Delete functionality for workspaces
 * 
 * Functions for managing workspaces with in-memory storage (Phase 1)
 */

/**
 * CREATE WORKSPACE
 * 
 * @param {Object} workspaceData - Workspace data
 * @returns {Object} - { success: boolean, message: string, workspace: Object|null }
 */
async function handleCreateWorkspace(workspaceData) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can create workspaces.', workspace: null };
  }
  
  // Validate workspace data
  const validation = validateWorkspaceData(workspaceData);
  if (!validation.valid) {
    return { success: false, message: validation.error, workspace: null };
  }
  
  // Check if property exists and belongs to owner
  const property = getPropertyById(workspaceData.propertyId);
  if (!property) {
    return { success: false, message: 'Selected property not found.', workspace: null };
  }
  
  if (property.ownerId !== currentUser.id) {
    return { success: false, message: 'You can only create workspaces for your own properties.', workspace: null };
  }
  
  // Create workspace
  const workspace = createWorkspace(
    workspaceData.propertyId,
    workspaceData.type,
    workspaceData.seatingCapacity,
    workspaceData.smokingAllowed || false,
    workspaceData.availabilityDate,
    workspaceData.leaseTerm,
    workspaceData.price
  );
  
  return { success: true, message: 'Workspace listed successfully!', workspace: workspace };
}

/**
 * UPDATE WORKSPACE
 * 
 * @param {number} workspaceId - Workspace ID to update
 * @param {Object} updates - Fields to update
 * @returns {Object} - { success: boolean, message: string, workspace: Object|null }
 */
async function handleUpdateWorkspace(workspaceId, updates) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can update workspaces.', workspace: null };
  }
  
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) {
    return { success: false, message: 'Workspace not found.', workspace: null };
  }
  
  // Check ownership (via property)
  const property = getPropertyById(workspace.propertyId);
  if (!property || property.ownerId !== currentUser.id) {
    return { success: false, message: 'You can only update your own workspaces.', workspace: null };
  }
  
  // Validate updates
  if (updates.type || updates.seatingCapacity || updates.price || updates.leaseTerm) {
    const validation = validateWorkspaceData(updates);
    if (!validation.valid) {
      return { success: false, message: validation.error, workspace: null };
    }
  }
  
  // Update workspace
  const updatedWorkspace = updateWorkspace(workspaceId, updates);
  
  return { success: true, message: 'Workspace updated successfully!', workspace: updatedWorkspace };
}

/**
 * DELETE WORKSPACE
 * 
 * @param {number} workspaceId - Workspace ID to delete
 * @returns {Object} - { success: boolean, message: string }
 */
async function handleDeleteWorkspace(workspaceId) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can delete workspaces.' };
  }
  
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) {
    return { success: false, message: 'Workspace not found.' };
  }
  
  // Check ownership (via property)
  const property = getPropertyById(workspace.propertyId);
  if (!property || property.ownerId !== currentUser.id) {
    return { success: false, message: 'You can only delete your own workspaces.' };
  }
  
  // Delete workspace
  deleteWorkspace(workspaceId);
  
  return { success: true, message: 'Workspace deleted successfully!' };
}

/**
 * GET OWNER'S WORKSPACES
 * 
 * @returns {Array} - Array of owner's workspaces with enriched data
 */
function getMyWorkspaces() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    return [];
  }
  
  const workspaces = getWorkspacesByOwnerId(currentUser.id);
  return workspaces.map(w => enrichWorkspaceWithProperty(w)).filter(w => w !== null);
}

/**
 * GET PROPERTIES FOR DROPDOWN
 * 
 * @returns {Array} - Array of owner's properties for dropdown
 */
function getMyPropertiesForDropdown() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    return [];
  }
  
  return getPropertiesByOwnerId(currentUser.id);
}

/**
 * VALIDATE WORKSPACE DATA
 * 
 * @param {Object} data - Workspace data to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validateWorkspaceData(data) {
  if (!data.propertyId) {
    return { valid: false, error: 'Please select a property.' };
  }
  
  if (!data.type) {
    return { valid: false, error: 'Please select a workspace type.' };
  }
  
  const validTypes = ['meeting room', 'private office', 'desk'];
  if (!validTypes.includes(data.type)) {
    return { valid: false, error: 'Invalid workspace type.' };
  }
  
  if (!data.seatingCapacity || isNaN(data.seatingCapacity) || data.seatingCapacity < 1) {
    return { valid: false, error: 'Seating capacity must be at least 1.' };
  }
  
  if (!data.availabilityDate) {
    return { valid: false, error: 'Please select an availability date.' };
  }
  
  const validLeaseTerms = ['day', 'week', 'month'];
  if (!data.leaseTerm || !validLeaseTerms.includes(data.leaseTerm)) {
    return { valid: false, error: 'Please select a valid lease term.' };
  }
  
  if (!data.price || isNaN(data.price) || data.price < 0) {
    return { valid: false, error: 'Please enter a valid price.' };
  }
  
  return { valid: true, error: null };
}

/**
 * SETUP WORKSPACE FORM HANDLER
 * Attach to workspace create form
 */
function setupWorkspaceForm() {
  const form = document.getElementById('workspaceForm');
  if (!form) return;
  
  // Populate property dropdown
  populatePropertyDropdown();
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const workspaceData = {
      propertyId: formData.get('propertyId'),
      type: formData.get('type'),
      seatingCapacity: formData.get('seatingCapacity'),
      smokingAllowed: formData.get('smokingAllowed') === 'on',
      availabilityDate: formData.get('availabilityDate'),
      leaseTerm: formData.get('leaseTerm'),
      price: formData.get('price')
    };
    
    const result = await handleCreateWorkspace(workspaceData);
    
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
 * POPULATE PROPERTY DROPDOWN
 * @param {number} selectedId - Optional property ID to pre-select
 */
function populatePropertyDropdown(selectedId) {
  // Check for editPropertyId (edit page) or propertySelect (create page)
  let select = document.getElementById('editPropertyId');
  
  if (!select) {
    select = document.getElementById('propertySelect');
  }
  if (!select) return;
  
  const properties = getMyPropertiesForDropdown();
  
  // Clear existing options except the first one
  select.innerHTML = '<option value="">-- Choose a property --</option>';
  
  if (properties.length === 0) {
    select.innerHTML += '<option value="" disabled>You have no properties. Please add a property first.</option>';
    return;
  }
  
  // Add property options
  properties.forEach(property => {
    const option = document.createElement('option');
    option.value = property.id;
    option.textContent = `${property.address} - ${property.neighborhood} (${property.squareFeet.toLocaleString()} sq ft)`;
    if (selectedId && property.id === selectedId) {
      option.selected = true;
    }
    select.appendChild(option);
  });
}

/**
 * SETUP WORKSPACE EDIT FORM HANDLER
 * Attach to workspace edit form
 */
function setupWorkspaceEditForm() {
  const form = document.getElementById('workspaceEditForm');
  if (!form) return;
  
  // Get workspace ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const workspaceId = parseInt(urlParams.get('id'));
  
  if (!workspaceId) {
    showMessage('Invalid workspace ID.', 'error');
    return;
  }
  
  // Load workspace data
  const workspace = getWorkspaceById(workspaceId);
  if (!workspace) {
    showMessage('Workspace not found.', 'error');
    return;
  }
  
  // Check ownership
  const property = getPropertyById(workspace.propertyId);
  const currentUser = getCurrentUser();
  if (!property || !currentUser || property.ownerId !== currentUser.id) {
    showMessage('You can only edit your own workspaces.', 'error');
    return;
  }
  
  // Pre-fill form
  document.getElementById('editPropertyId').value = workspace.propertyId;
  document.getElementById('editWorkspaceType').value = workspace.type;
  document.getElementById('editSeatingCapacity').value = workspace.seatingCapacity;
  document.getElementById('editSmokingAllowed').checked = workspace.smokingAllowed;
  document.getElementById('editAvailabilityDate').value = workspace.availabilityDate;
  document.getElementById('editLeaseTerm').value = workspace.leaseTerm;
  document.getElementById('editPrice').value = workspace.price;
  
  // Setup form submit handler
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const updates = {
      propertyId: formData.get('propertyId'),
      type: formData.get('type'),
      seatingCapacity: formData.get('seatingCapacity'),
      smokingAllowed: formData.get('smokingAllowed') === 'on',
      availabilityDate: formData.get('availabilityDate'),
      leaseTerm: formData.get('leaseTerm'),
      price: formData.get('price')
    };
    
    const result = await handleUpdateWorkspace(workspaceId, updates);
    
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
 * SETUP WORKSPACE DELETE HANDLER
 */
function setupWorkspaceDeleteHandler() {
  const deleteButtons = document.querySelectorAll('[data-delete-workspace]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const workspaceId = parseInt(this.dataset.deleteWorkspace);
      console.log('Delete workspace clicked:', workspaceId);
      
      if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
        return;
      }
      
      console.log('Deleting workspace:', workspaceId);
      const result = await handleDeleteWorkspace(workspaceId);
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
  setupWorkspaceForm();
  setupWorkspaceEditForm();
  setupWorkspaceDeleteHandler();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleDeleteWorkspace,
    getMyWorkspaces,
    getMyPropertiesForDropdown,
    validateWorkspaceData,
    setupWorkspaceForm,
    setupWorkspaceEditForm,
    setupWorkspaceDeleteHandler,
    populatePropertyDropdown
  };
}
