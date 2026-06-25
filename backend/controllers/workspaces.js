const Workspace = require('../models/Workspace');
const Property = require('../models/Property');

// @desc    Create workspace
// @route   POST /api/workspaces
// @access  Private (owner)
exports.createWorkspace = async (req, res) => {
  try {
    // Verify property belongs to owner
    const property = await Property.findById(req.body.propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (property.ownerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create workspace for this property'
      });
    }
    
    // Handle uploaded photos
    if (req.files && req.files.length > 0) {
      req.body.photos = req.files.map(file => ({
        url: `/uploads/workspaces/${file.filename}`,
        caption: req.body.captions ? req.body.captions.split(',')[req.files.indexOf(file)] || '' : '',
        uploadedAt: new Date()
      }));
    }

    const workspace = await Workspace.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      data: { workspace }
    });
  } catch (error) {
    console.error('CreateWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search/Filter workspaces
// @route   GET /api/workspaces
// @access  Public
exports.searchWorkspaces = async (req, res) => {
  try {
    const {
      neighborhood,
      minSquareFeet,
      maxSquareFeet,
      hasParking,
      hasPublicTransit,
      minSeatingCapacity,
      smokingAllowed,
      availabilityDate,
      leaseTerm,
      minPrice,
      maxPrice,
      type,
      sortBy = 'createdAt',
      order = 'desc',
      limit = 50,
      page = 1
    } = req.query;

    // Build query
    const query = {};

    if (type) query.type = type;
    if (minSeatingCapacity) query.seatingCapacity = { ...query.seatingCapacity, $gte: parseInt(minSeatingCapacity) };
    if (smokingAllowed !== undefined) query.smokingAllowed = smokingAllowed === 'true';
    if (leaseTerm) query.leaseTerm = leaseTerm;
    if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };

    // Property filters (need to join with Property collection)
    let propertyQuery = {};
    if (neighborhood) propertyQuery.neighborhood = neighborhood;
    if (minSquareFeet || maxSquareFeet) {
      propertyQuery.squareFeet = {};
      if (minSquareFeet) propertyQuery.squareFeet.$gte = parseInt(minSquareFeet);
      if (maxSquareFeet) propertyQuery.squareFeet.$lte = parseInt(maxSquareFeet);
    }
    if (hasParking !== undefined) propertyQuery.hasParking = hasParking === 'true';
    if (hasPublicTransit !== undefined) propertyQuery.hasPublicTransit = hasPublicTransit === 'true';

    // Get matching properties
    let matchingProperties;
    if (Object.keys(propertyQuery).length > 0) {
      matchingProperties = await Property.find(propertyQuery).select('_id');
      if (matchingProperties.length === 0) {
        return res.status(200).json({
          success: true,
          count: 0,
          data: { workspaces: [], pagination: { total: 0, page: 1, limit: parseInt(limit), pages: 0 } }
        });
      }
      query.propertyId = { $in: matchingProperties.map(p => p._id) };
    }

    // Availability date filter
    if (availabilityDate) {
      query.availabilityDate = { $lte: new Date(availabilityDate) };
    }

    // Execute query with pagination and sorting
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = order === 'asc' ? 1 : -1;

    // Build sort object - support multiple sort fields
    let sortObj = {};
    if (sortBy === 'rating') {
      sortObj = { averageRating: sortDirection, ratingCount: sortDirection };
    } else if (sortBy === 'price') {
      sortObj = { price: sortDirection };
    } else if (sortBy === 'availability') {
      sortObj = { availabilityDate: sortDirection };
    } else if (sortBy === 'createdAt') {
      sortObj = { createdAt: sortDirection };
    } else {
      sortObj = { [sortBy]: sortDirection };
    }

    const workspaces = await Workspace.find(query)
      .populate('propertyId', 'address neighborhood squareFeet hasParking hasPublicTransit')
      .populate({
        path: 'propertyId',
        populate: { path: 'ownerId', select: 'firstName lastName email phone' }
      })
      .sort(sortObj)
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count for pagination
    const total = await Workspace.countDocuments(query);

    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: {
        workspaces,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('SearchWorkspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get owner's workspaces
// @route   GET /api/workspaces/my-workspaces
// @access  Private (owner)
exports.getMyWorkspaces = async (req, res) => {
  try {
    // Get owner's properties first
    const properties = await Property.find({ ownerId: req.user.id }).select('_id');
    const propertyIds = properties.map(p => p._id);

    const workspaces = await Workspace.find({ propertyId: { $in: propertyIds } })
      .populate('propertyId', 'address neighborhood');

    res.status(200).json({
      success: true,
      count: workspaces.length,
      data: { workspaces }
    });
  } catch (error) {
    console.error('GetMyWorkspaces error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get workspace by ID
// @route   GET /api/workspaces/:id
// @access  Public
exports.getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate({
        path: 'propertyId',
        populate: { path: 'ownerId', select: 'firstName lastName email phone' }
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Get reviews for this workspace
    const Review = require('../models/Review');
    const reviews = await Review.find({ workspaceId: workspace._id })
      .populate('userId', 'firstName lastName email')
      .select('-userId.password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { 
        workspace,
        reviews,
        reviewCount: reviews.length
      }
    });
  } catch (error) {
    console.error('GetWorkspaceById error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private (owner)
exports.updateWorkspace = async (req, res) => {
  try {
    console.log('Update workspace request body:', req.body);
    let workspace = await Workspace.findById(req.params.id).populate('propertyId');

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
        message: 'Not authorized to update this workspace'
      });
    }

    workspace = await Workspace.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: { workspace }
    });
  } catch (error) {
    console.error('UpdateWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private (owner)
exports.deleteWorkspace = async (req, res) => {
  try {
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
        message: 'Not authorized to delete this workspace'
      });
    }

    await workspace.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully'
    });
  } catch (error) {
    console.error('DeleteWorkspace error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
