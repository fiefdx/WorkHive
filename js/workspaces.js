/**
 * WorkHive - Workspace Management Module (Phase 2)
 * 
 * Phase 2: Uses backend API with MongoDB
 */

/**
 * CREATE WORKSPACE
 * Uses backend API
 */
async function handleCreateWorkspace(workspaceData, files = null) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can create workspaces.', workspace: null };
  }
  
  // Validate workspace data
  const validation = validateWorkspaceData(workspaceData);
  if (!validation.valid) {
    return { success: false, message: validation.error, workspace: null };
  }
  
  // Prepare form data for file upload
  const formData = new FormData();
  formData.append('propertyId', workspaceData.propertyId);
  formData.append('type', workspaceData.type);
  formData.append('seatingCapacity', parseInt(workspaceData.seatingCapacity));
  formData.append('smokingAllowed', workspaceData.smokingAllowed || false);
  formData.append('availabilityDate', workspaceData.availabilityDate);
  formData.append('leaseTerm', workspaceData.leaseTerm);
  formData.append('price', parseFloat(workspaceData.price));
  formData.append('description', workspaceData.description || '');
  
  // Add images if provided
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
  }
  
  // Call backend API with FormData
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    return { success: true, message: 'Workspace listed successfully!', workspace: result.data.workspace };
  } else {
    return { success: false, message: result.message, workspace: null };
  }
}

/**
 * UPDATE WORKSPACE
 * Uses backend API
 */
async function handleUpdateWorkspace(workspaceId, updates) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can update workspaces.', workspace: null };
  }
  
  // Validate updates
  if (updates.type || updates.seatingCapacity || updates.price || updates.leaseTerm) {
    const validation = validateWorkspaceData(updates);
    if (!validation.valid) {
      return { success: false, message: validation.error, workspace: null };
    }
  }
  
  // Call backend API
  const result = await apiUpdateWorkspace(workspaceId, updates);
  
  if (result.success) {
    return { success: true, message: 'Workspace updated successfully!', workspace: result.data.workspace };
  } else {
    return { success: false, message: result.message, workspace: null };
  }
}

/**
 * DELETE WORKSPACE
 * Uses backend API
 */
async function handleDeleteWorkspace(workspaceId) {
  const currentUser = getCurrentUser();
  
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, message: 'Only owners can delete workspaces.' };
  }
  
  if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
    return { success: false, message: 'Deletion cancelled.' };
  }
  
  // Call backend API
  const result = await apiDeleteWorkspace(workspaceId);
  
  if (result.success) {
    return { success: true, message: 'Workspace deleted successfully!' };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * GET OWNER'S WORKSPACES
 * Uses backend API
 */
async function getMyWorkspaces() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    return { success: false, workspaces: [] };
  }
  
  const result = await apiGetMyWorkspaces();
  
  if (result.success) {
    return { success: true, workspaces: result.data.workspaces };
  } else {
    return { success: false, message: result.message, workspaces: [] };
  }
}

/**
 * GET PROPERTIES FOR DROPDOWN
 * Uses backend API
 */
async function getMyPropertiesForDropdown() {
  const currentUser = getCurrentUser();
  if (!currentUser || currentUser.role !== 'owner') {
    return [];
  }
  
  const result = await apiGetMyProperties();
  
  if (result.success) {
    return result.data.properties;
  } else {
    return [];
  }
}

/**
 * SEARCH WORKSPACES (for coworkers)
 * Uses backend API
 */
async function searchWorkspaces(filters) {
  const result = await apiSearchWorkspaces(filters);
  
  if (result.success) {
    return { 
      success: true, 
      workspaces: result.data.workspaces,
      pagination: result.data.pagination
    };
  } else {
    return { success: false, message: result.message, workspaces: [] };
  }
}

/**
 * GET WORKSPACE BY ID
 * Uses backend API
 */
async function getWorkspaceById(id) {
  const result = await apiGetWorkspaceById(id);
  
  if (result.success) {
    return { success: true, workspace: result.data.workspace };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * VALIDATE WORKSPACE DATA
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

  // Prevent selecting a past date
  const selectedDate = new Date(data.availabilityDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { valid: false, error: 'Availability date cannot be in the past.' };
  }
  
  const validLeaseTerms = ['day', 'week', 'month'];
  if (!data.leaseTerm || !validLeaseTerms.includes(data.leaseTerm)) {
    return { valid: false, error: 'Please select a valid lease term.' };
  }
  
  if (!data.price || isNaN(data.price) || data.price < 0) {
    return { valid: false, error: 'Please enter a valid price.' };
  }
  
  // Validate description length (optional field)
  if (data.description && data.description.length > 1000) {
    return { valid: false, error: 'Description must be 1000 characters or less.' };
  }
  
  return { valid: true, error: null };
}

/**
 * SETUP WORKSPACE FORM HANDLER
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
      price: formData.get('price'),
      description: formData.get('description') || ''
    };
    
    console.log('Submitting workspace data:', workspaceData);
// Get uploaded files
    const imageInput = document.getElementById('workspaceImages');
    const files = imageInput ? imageInput.files : null;
    
    const result = await handleCreateWorkspace(workspaceData, files);
    
    if (result.success) {
      showMessage(result.message, 'success');
      
      // Clear image preview
      const preview = document.getElementById('imagePreview');
      if (preview) preview.innerHTML = '';
      
      // Check if we're on the create page (has workspaceForm but no workspaceList)
      const isCreatePage = document.getElementById('workspaceForm') && !document.getElementById('workspaceList') && !document.getElementById('workspacesList');
      
      if (isCreatePage) {
        // Redirect to dashboard after successful creation on create page
        setTimeout(() => {
          window.location.href = '../dashboard.html';
        }, 1500);
      } else {
        // Reset form and reload list if on dashboard or edit page
        const form = document.getElementById('workspaceForm');
        if (form) {
          form.reset();
        }
        
        // Reload workspaces list if on dashboard
        if (document.getElementById('workspacesList')) {
          setTimeout(() => {
            if (typeof loadDashboardData === 'function') {
              loadDashboardData();
            }
          }, 1000);
        }
      }
    } else {
      showMessage(result.message, 'error');
    }
  });
}

/**
 * POPULATE PROPERTY DROPDOWN
 */
async function populatePropertyDropdown(selectedId) {
  console.log('populatePropertyDropdown called with selectedId:', selectedId);
  let select = document.getElementById('editPropertyId');
  
  if (!select) {
    select = document.getElementById('propertySelect');
  }
  if (!select) {
    console.log('Property dropdown select element not found!');
    return;
  }
  
  const properties = await getMyPropertiesForDropdown();
  console.log('Properties loaded:', properties);
  
  select.innerHTML = '<option value="">-- Choose a property --</option>';
  
  if (properties.length === 0) {
    select.innerHTML += '<option value="" disabled>You have no properties. Please add a property first.</option>';
    return;
  }
  
  properties.forEach(property => {
    const option = document.createElement('option');
    option.value = property._id;
    option.textContent = `${property.address} - ${property.neighborhood} (${property.squareFeet.toLocaleString()} sq ft)`;
    if (selectedId && property._id === selectedId) {
      option.selected = true;
      console.log('Selected property matched:', property._id);
    }
    select.appendChild(option);
  });
  
  console.log('Property dropdown populated, selected value:', select.value);
}

/**
 * RENDER WORKSPACE LIST
 */
function renderWorkspaceList(workspaces, containerId, showActions = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!workspaces || workspaces.length === 0) {
    container.innerHTML = '<p class="no-data">No workspaces found.</p>';
    return;
  }
  
  let html = '<div class="workspace-list">';
  
  workspaces.forEach(workspace => {
    const property = workspace.propertyId;
    html += `
      <div class="workspace-card" data-workspace-id="${workspace._id}">
        <h3>${escapeHtml(workspace.type)}</h3>
        <p class="property">${escapeHtml(property.address)}</p>
        <p class="neighborhood">${escapeHtml(property.neighborhood)}</p>
        <p class="details">
          <span class="capacity">${workspace.seatingCapacity} seats</span>
          <span class="price">$${workspace.price}/${workspace.leaseTerm}</span>
          ${workspace.smokingAllowed ? '<span class="smoking">Smoking Allowed</span>' : ''}
        </p>
        <p class="availability">Available from: ${new Date(workspace.availabilityDate).toLocaleDateString()}</p>
    `;
    
    if (showActions) {
      html += `
        <div class="actions">
          <button onclick="editWorkspace('${workspace._id}')" class="btn btn-edit">Edit</button>
          <button onclick="deleteWorkspace('${workspace._id}')" class="btn btn-delete">Delete</button>
        </div>
      `;
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * EDIT WORKSPACE - Load data into form
 */
async function editWorkspace(id) {
  const result = await getWorkspaceById(id);
  
  if (result.success) {
    const workspace = result.workspace;
    
    // Fill form with workspace data
    document.getElementById('editPropertyId').value = workspace.propertyId._id;
    document.getElementById('editWorkspaceType').value = workspace.type;
    document.getElementById('editSeatingCapacity').value = workspace.seatingCapacity;
    document.getElementById('editSmokingAllowed').checked = workspace.smokingAllowed;
    document.getElementById('editAvailabilityDate').value = workspace.availabilityDate;
    document.getElementById('editLeaseTerm').value = workspace.leaseTerm;
    document.getElementById('editPrice').value = workspace.price;
    
    // Store workspace ID for update
    document.getElementById('workspaceEditForm').dataset.workspaceId = id;
    
    // Change form title
    const formTitle = document.querySelector('h1');
    if (formTitle) formTitle.textContent = 'Edit Workspace';
    
    window.scrollTo(0, 0);
  } else {
    showMessage(result.message, 'error');
  }
}

/**
 * DELETE WORKSPACE - Wrapper
 */
async function deleteWorkspace(id) {
  const result = await handleDeleteWorkspace(id);
  
  if (result.success) {
    showMessage(result.message, 'success');
    // Reload workspaces list
    const loadResult = await getMyWorkspaces();
    if (loadResult.success) {
      renderWorkspaceList(loadResult.workspaces, 'workspaceList', true);
    }
  } else {
    showMessage(result.message, 'error');
  }
}

/**
 * SETUP WORKSPACE DELETE HANDLER
 */
function setupWorkspaceDeleteHandler() {
  const deleteButtons = document.querySelectorAll('[data-delete-workspace]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const workspaceId = this.dataset.deleteWorkspace;
      
      if (!confirm('Are you sure you want to delete this workspace?')) {
        return;
      }
      
      const result = await handleDeleteWorkspace(workspaceId);
      
      if (result.success) {
        showMessage(result.message, 'success');
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

/**
 * DELETE WORKSPACE IMAGE
 * @param {string} workspaceId - Workspace ID
 * @param {number} imageIndex - Index of image to delete
 */
async function deleteWorkspaceImage(workspaceId, imageIndex) {
  if (!confirm('Are you sure you want to delete this image?')) {
    return { success: false };
  }
  
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/images/${imageIndex}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    return { success: true, message: 'Image deleted successfully' };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * ESCAPE HTML - Prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Image preview handler for workspaces
function setupWorkspaceImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', function(e) {
    const files = e.target.files;
    preview.innerHTML = '';
    
    if (files && files.length > 0) {
      Array.from(files).forEach((file, index) => {
        if (!file.type.match('image.*')) {
          showMessage('Please select image files only.', 'error');
          return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
          showMessage(`File ${file.name} is too large. Max 5MB.`, 'error');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
          const div = document.createElement('div');
          div.style.cssText = 'width: 150px; height: 150px; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; position: relative;';
          div.innerHTML = `
            <img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">
            <div style="position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6); color: white; padding: 4px; font-size: 12px; text-align: center;">
              ${file.name}
            </div>
          `;
          preview.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  setupWorkspaceForm();
  setupWorkspaceDeleteHandler();
  setupWorkspaceImagePreview('workspaceImages', 'imagePreview');
  
  // Load workspaces if on dashboard
  if (document.getElementById('workspaceList')) {
    getMyWorkspaces().then(result => {
      if (result.success) {
        renderWorkspaceList(result.workspaces, 'workspaceList', true);
      } else {
        document.getElementById('workspaceList').innerHTML = `<p class="error">${result.message}</p>`;
      }
    });
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleCreateWorkspace,
    handleUpdateWorkspace,
    handleDeleteWorkspace,
    getMyWorkspaces,
    getMyPropertiesForDropdown,
    searchWorkspaces,
    getWorkspaceById,
    validateWorkspaceData,
    setupWorkspaceForm,
    setupWorkspaceDeleteHandler,
    populatePropertyDropdown,
    renderWorkspaceList,
    editWorkspace,
    deleteWorkspace,
    escapeHtml
  };
}

/**
 * DELETE WORKSPACE PHOTO
 * Deletes a photo from a workspace
 */
async function handleDeleteWorkspacePhoto(workspaceId, photoIndex) {
  if (!confirm('Are you sure you want to delete this photo?')) {
    return { success: false };
  }
  
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/photos/${photoIndex}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    showMessage('Photo deleted successfully', 'success');
    // Reload page to show updated photos
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    return { success: true };
  } else {
    showMessage(result.message || 'Failed to delete photo', 'error');
    return { success: false };
  }
}

// Expose functions globally for use in HTML files
window.getWorkspaceById = getWorkspaceById;
window.handleCreateWorkspace = handleCreateWorkspace;
window.handleUpdateWorkspace = handleUpdateWorkspace;
window.handleDeleteWorkspace = handleDeleteWorkspace;
window.populatePropertyDropdown = populatePropertyDropdown;
window.handleDeleteWorkspacePhoto = handleDeleteWorkspacePhoto;
