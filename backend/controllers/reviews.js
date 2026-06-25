const Review = require('../models/Review');
const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Create review for workspace
// @route   POST /api/reviews
// @access  Private (coworker)
exports.createReview = async (req, res) => {
  try {
    const { workspaceId, rating, comment } = req.body;

    // Check if workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found'
      });
    }

    // Check if user has already reviewed this workspace
    const existingReview = await Review.findOne({
      userId: req.user.id,
      workspaceId
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this workspace'
      });
    }

    // Create review
    const review = await Review.create({
      userId: req.user.id,
      workspaceId,
      rating,
      comment
    });

    // Populate user info
    const populatedReview = await Review.findById(review._id).populate('userId', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review: populatedReview }
    });
  } catch (error) {
    console.error('CreateReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get reviews for workspace
// @route   GET /api/reviews/workspace/:workspaceId
// @access  Public
exports.getWorkspaceReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ workspaceId: req.params.workspaceId })
      .populate('userId', 'firstName lastName email')
      .select('-userId.password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: { reviews }
    });
  } catch (error) {
    console.error('GetWorkspaceReviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get my review for a workspace
// @route   GET /api/reviews/my-review/:workspaceId
// @access  Private
exports.getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: req.user.id,
      workspaceId: req.params.workspaceId
    }).populate('userId', 'firstName lastName');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'No review found for this workspace'
      });
    }

    res.status(200).json({
      success: true,
      data: { review }
    });
  } catch (error) {
    console.error('GetMyReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private (own review)
exports.updateReview = async (req, res) => {
  try {
    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review'
      });
    }

    review = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName');

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });
  } catch (error) {
    console.error('UpdateReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private (own review)
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review'
      });
    }

    await review.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('DeleteReview error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
