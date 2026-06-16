const express = require('express');
const router = express.Router();
const path = require('path');
const Property = require('../models/Property');
const { 
  createProperty, 
  getProperties, 
  getPropertyById, 
  updateProperty, 
  deleteProperty,
  getMyProperties 
} = require('../controllers/properties');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getProperties)
  .post(protect, authorize('owner'), upload.array('images', 5), createProperty);

// Add photos to existing property
router.post('/:id/photos', protect, authorize('owner'), upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }
    
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check ownership
    if (property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add photos to this property'
      });
    }
    
    // Add photos to property
    const newPhotos = req.files.map(file => ({
      url: `/uploads/properties/${file.filename}`,
      caption: req.body.caption || '',
      uploadedAt: new Date()
    }));
    
    property.photos = property.photos || [];
    property.photos.push(...newPhotos);
    await property.save();
    
    res.status(200).json({
      success: true,
      message: 'Photos uploaded successfully',
      data: { photos: newPhotos }
    });
  } catch (error) {
    console.error('Add property photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete photo from property
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
    
    const property = await Property.findById(id);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    // Check ownership
    if (property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete photos from this property'
      });
    }
    
    // Get photo filename to delete file
    const photoToDelete = property.photos[index];
    if (photoToDelete) {
      const fs = require('fs');
      const filePath = path.join(__dirname, '..', photoToDelete.url);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Remove photo from array
    property.photos.splice(index, 1);
    await property.save();
    
    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Delete property photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

router.get('/my-properties', protect, authorize('owner'), getMyProperties);

router.route('/:id')
  .get(getPropertyById)
  .put(protect, authorize('owner'), updateProperty)
  .delete(protect, authorize('owner'), deleteProperty);

module.exports = router;
