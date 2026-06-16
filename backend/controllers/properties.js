const Property = require('../models/Property');
const Workspace = require('../models/Workspace');

// @desc    Create property
// @route   POST /api/properties
// @access  Private (owner)
exports.createProperty = async (req, res) => {
  try {
    req.body.ownerId = req.user.id;
    
    // Handle uploaded photos
    if (req.files && req.files.length > 0) {
      req.body.photos = req.files.map(file => ({
        url: `/uploads/properties/${file.filename}`,
        caption: req.body.captions ? req.body.captions.split(',')[req.files.indexOf(file)] || '' : '',
        uploadedAt: new Date()
      }));
    }

    const property = await Property.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { property }
    });
  } catch (error) {
    console.error('CreateProperty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getProperties = async (req, res) => {
  try {
    const properties = await Property.find().populate('ownerId', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      count: properties.length,
      data: { properties }
    });
  } catch (error) {
    console.error('GetProperties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get owner's properties
// @route   GET /api/properties/my-properties
// @access  Private (owner)
exports.getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user.id });

    res.status(200).json({
      success: true,
      count: properties.length,
      data: { properties }
    });
  } catch (error) {
    console.error('GetMyProperties error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
exports.getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('ownerId', 'firstName lastName email phone');

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { property }
    });
  } catch (error) {
    console.error('GetPropertyById error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (owner)
exports.updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

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
        message: 'Not authorized to update this property'
      });
    }

    property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Property updated successfully',
      data: { property }
    });
  } catch (error) {
    console.error('UpdateProperty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (owner)
exports.deleteProperty = async (req, res) => {
  try {
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
        message: 'Not authorized to delete this property'
      });
    }

    // Delete associated workspaces
    await Workspace.deleteMany({ propertyId: property._id });

    await property.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Property and associated workspaces deleted successfully'
    });
  } catch (error) {
    console.error('DeleteProperty error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
