const express = require('express');
const router = express.Router();
const path = require('path');
const Workspace = require('../models/Workspace');
const { 
  createWorkspace, 
  searchWorkspaces, 
  getWorkspaceById, 
  updateWorkspace, 
  deleteWorkspace,
  getMyWorkspaces 
} = require('../controllers/workspaces');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(searchWorkspaces)
  .post(protect, authorize('owner'), upload.array('images', 5), createWorkspace);

// Add photos to existing workspace
router.post('/:id/photos', protect, authorize('owner'), upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No photos uploaded'
      });
    }
    
    const workspace = await Workspace.findById(req.params.id).populate('propertyId');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check ownership
    if (workspace.propertyId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add photos to this workspace'
      });
    }
    
    // Add photos to workspace
    const newPhotos = req.files.map(file => ({
      url: `/uploads/workspaces/${file.filename}`,
      caption: req.body.caption || '',
      uploadedAt: new Date()
    }));
    
    workspace.photos = workspace.photos || [];
    workspace.photos.push(...newPhotos);
    await workspace.save();
    
    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: { photos: newPhotos }
    });
  } catch (error) {
    console.error('Add workspace photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete photo from workspace
router.delete('/:id/photos/:photoIndex', protect, authorize('owner'), async (req, res) => {
  try {
    const { id, photoIndex } = req.params;
    const index = parseInt(photoIndex);
    
    if (isNaN(index) || index < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo index'
      });
    }
    
    const workspace = await Workspace.findById(id).populate('propertyId');
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }
    
    // Check ownership
    if (workspace.propertyId.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete photos from this workspace'
      });
    }
    
    // Get photo filename to delete file
    const photoToDelete = workspace.photos[index];
    if (photoToDelete) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', photoToDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove photo from array
    workspace.photos.splice(index, 1);
    await workspace.save();
    
    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete workspace photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/my-workspaces', protect, authorize('owner'), getMyWorkspaces);

router.route('/:id')
  .get(getWorkspaceById)
  .put(protect, authorize('owner'), updateWorkspace)
  .delete(protect, authorize('owner'), deleteWorkspace);

module.exports = router;
