/**
 * WorkHive - Properties Module (Phase 2)
 * 
 * Phase 2: Uses backend API with MongoDB
 */

/**
 * CREATE PROPERTY
 * Uses backend API
 */
async function handlePropertyCreation(propertyData, files = null) {
  // Client-side validation
  if (!propertyData.address || propertyData.address.trim().length === 0) {
    return { success: false, message: 'Address is required.', property: null };
  }
  if (!propertyData.neighborhood || propertyData.neighborhood.trim().length === 0) {
    return { success: false, message: 'Neighborhood is required.', property: null };
  }
  if (!propertyData.squareFeet || parseInt(propertyData.squareFeet) <= 0) {
    return { success: false, message: 'Please enter a valid square footage.', property: null };
  }
  
  // Prepare form data for file upload
  const formData = new FormData();
  formData.append('address', propertyData.address);
  formData.append('neighborhood', propertyData.neighborhood);
  formData.append('squareFeet', parseInt(propertyData.squareFeet));
  formData.append('hasParking', propertyData.hasParking || false);
  formData.append('hasPublicTransit', propertyData.hasPublicTransit || false);
  
  // Add images if provided
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
  }
  
  // Call backend API with FormData
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/properties`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  const result = await response.json();
  
  if (result.success) {
    return { success: true, message: 'Property listed successfully!', property: result.data.property };
  } else {
    return { success: false, message: result.message, property: null };
  }
}

/**
 * GET OWNER'S PROPERTIES
 * Uses backend API
 */
async function loadOwnerProperties() {
  console.log('loadOwnerProperties called');
  const result = await apiGetMyProperties();
  console.log('loadOwnerProperties result:', result);
  
  if (result.success) {
    return { success: true, properties: result.data.properties };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * GET ALL PROPERTIES
 * Uses backend API
 */
async function loadAllProperties() {
  const result = await apiGetProperties();
  
  if (result.success) {
    return { success: true, properties: result.data.properties };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * GET PROPERTY BY ID
 * Uses backend API
 */
async function loadPropertyById(id) {
  console.log('loadPropertyById called with ID:', id);
  const result = await apiGetPropertyById(id);
  console.log('loadPropertyById result:', result);
  
  if (result.success) {
    return { success: true, property: result.data.property };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * UPDATE PROPERTY
 * Uses backend API
 */
async function handlePropertyUpdate(id, propertyData) {
  const result = await apiUpdateProperty(id, propertyData);
  
  if (result.success) {
    return { success: true, message: 'Property updated successfully!', property: result.data.property };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * DELETE PROPERTY
 * Uses backend API (also deletes associated workspaces)
 */
async function handlePropertyDelete(id) {
  if (!confirm('Are you sure you want to delete this property? All associated workspaces will also be deleted.')) {
    return { success: false, message: 'Deletion cancelled.' };
  }
  
  const result = await apiDeleteProperty(id);
  
  if (result.success) {
    return { success: true, message: 'Property deleted successfully!' };
  } else {
    return { success: false, message: result.message };
  }
}

/**
 * RENDER PROPERTY LIST
 * Renders properties to the DOM
 */
function renderPropertyList(properties, containerId, showActions = false) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!properties || properties.length === 0) {
    container.innerHTML = '<p class="no-data">No properties found.</p>';
    return;
  }
  
  let html = '<div class="property-list">';
  
  properties.forEach(property => {
    html += `
      <div class="property-card" data-property-id="${property._id}">
        <h3>${escapeHtml(property.address)}</h3>
        <p class="neighborhood">${escapeHtml(property.neighborhood)}</p>
        <p class="details">
          <span class="sqft">${property.squareFeet} sq ft</span>
          ${property.hasParking ? '<span class="amenity parking">Parking</span>' : ''}
          ${property.hasPublicTransit ? '<span class="amenity transit">Public Transit</span>' : ''}
        </p>
    `;
    
    if (showActions) {
      html += `
        <div class="actions">
          <button onclick="editProperty('${property._id}')" class="btn btn-edit">Edit</button>
          <button onclick="deleteProperty('${property._id}')" class="btn btn-delete">Delete</button>
        </div>
      `;
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  container.innerHTML = html;
}

/**
 * EDIT PROPERTY - Load property data into form
 */
async function editProperty(id) {
  const result = await loadPropertyById(id);
  
  if (result.success) {
    const property = result.property;
    
    // Fill form with property data
    document.getElementById('address').value = property.address;
    document.getElementById('neighborhood').value = property.neighborhood;
    document.getElementById('squareFeet').value = property.squareFeet;
    document.getElementById('hasParking').checked = property.hasParking;
    document.getElementById('hasPublicTransit').checked = property.hasPublicTransit;
    
    // Store property ID for update
    document.getElementById('propertyForm').dataset.propertyId = id;
    
    // Change form title
    const formTitle = document.querySelector('h1');
    if (formTitle) formTitle.textContent = 'Edit Property';
    
    // Scroll to form
    window.scrollTo(0, 0);
  } else {
    showMessage(result.message, 'error');
  }
}

/**
 * DELETE PROPERTY - Wrapper for handlePropertyDelete
 */
async function deleteProperty(id) {
  const result = await handlePropertyDelete(id);
  
  if (result.success) {
    showMessage(result.message, 'success');
    // Reload properties list
    loadOwnerProperties().then(loadResult => {
      if (loadResult.success) {
        renderPropertyList(loadResult.properties, 'propertyList', true);
      }
    });
  } else {
    showMessage(result.message, 'error');
  }
}

/**
 * SETUP PROPERTY FORM
 */
function setupPropertyForm() {
  const form = document.getElementById('propertyForm');
  if (!form) return;
  
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const propertyId = form.dataset.propertyId;
    
    const propertyData = {
      address: formData.get('address'),
      neighborhood: formData.get('neighborhood'),
      squareFeet: formData.get('squareFeet'),
      hasParking: formData.get('hasParking') === 'on',
      hasPublicTransit: formData.get('hasPublicTransit') === 'on'
    };
    
    // Get uploaded files
    const imageInput = document.getElementById('propertyImages');
    const files = imageInput ? imageInput.files : null;
    
    let result;
    
    if (propertyId) {
      // Update existing property (no file upload for now)
      result = await handlePropertyUpdate(propertyId, propertyData);
    } else {
      // Create new property with file upload
      result = await handlePropertyCreation(propertyData, files);
    }
    
    if (result.success) {
      showMessage(result.message, 'success');
      
      // Clear image preview
      const preview = document.getElementById('imagePreview');
      if (preview) preview.innerHTML = '';
      
      // Check if we're on the create page (has propertyForm but no propertyList)
      const isCreatePage = document.getElementById('propertyForm') && !document.getElementById('propertyList') && !document.getElementById('propertiesList');
      
      if (isCreatePage) {
        // Redirect to dashboard after successful creation on create page
        setTimeout(() => {
          window.location.href = '../dashboard.html';
        }, 1500);
      } else {
        // Reset form and reload list if on dashboard or edit page
        form.reset();
        delete form.dataset.propertyId;
        
        const formTitle = document.querySelector('h1');
        if (formTitle) formTitle.textContent = 'List a Property';
        
        // Reload properties list if on dashboard
        if (document.getElementById('propertiesList')) {
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
 * DELETE PROPERTY IMAGE
 * @param {string} propertyId - Property ID
 * @param {number} imageIndex - Index of image to delete
 */
async function deletePropertyImage(propertyId, photoIndex) {
  if (!confirm('Are you sure you want to delete this photo?')) {
    return { success: false };
  }
  
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/properties/${propertyId}/photos/${photoIndex}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  if (result.success) {
    showMessage('Photo deleted successfully', 'success');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    return { success: true };
  } else {
    showMessage(result.message || 'Failed to delete photo', 'error');
    return { success: false };
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

// Image preview handler
function setupImagePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  
  if (!input || !preview) return;
  
  input.addEventListener('change', function(e) {
    const files = e.target.files;
    preview.innerHTML = '';
    
    if (files && files.length > 0) {
      Array.from(files).forEach((file, index) => {
        // Check file type
        if (!file.type.match('image.*')) {
          showMessage('Please select image files only.', 'error');
          return;
        }
        
        // Check file size (5MB limit)
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
  setupPropertyForm();
  setupImagePreview('propertyImages', 'imagePreview');
  
  // Load properties if on dashboard or property list page
  if (document.getElementById('propertyList')) {
    loadOwnerProperties().then(result => {
      if (result.success) {
        renderPropertyList(result.properties, 'propertyList', true);
      } else {
        document.getElementById('propertyList').innerHTML = `<p class="error">${result.message}</p>`;
      }
    });
  }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handlePropertyCreation,
    loadOwnerProperties,
    loadAllProperties,
    loadPropertyById,
    handlePropertyUpdate,
    handlePropertyDelete,
    renderPropertyList,
    editProperty,
    deleteProperty,
    setupPropertyForm,
    escapeHtml
  };
}

// Expose functions globally for use in HTML files
window.loadPropertyById = loadPropertyById;
window.handlePropertyUpdate = handlePropertyUpdate;
window.handlePropertyDelete = handlePropertyDelete;
window.renderPropertyList = renderPropertyList;
window.deletePropertyImage = deletePropertyImage;
window.loadOwnerProperties = loadOwnerProperties;
window.loadAllProperties = loadAllProperties;
