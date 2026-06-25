const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide a user ID'],
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: [true, 'Please provide a workspace ID'],
    index: true
  },
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Ensure one review per user per workspace
reviewSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

// Middleware to update workspace average rating after review operations
reviewSchema.post('save', async function() {
  await updateWorkspaceRating(this.workspaceId);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateWorkspaceRating(doc.workspaceId);
  }
});

// Helper function to calculate and update workspace average rating
async function updateWorkspaceRating(workspaceId) {
  const Workspace = mongoose.model('Workspace');
  const Review = mongoose.model('Review');
  
  const reviews = await Review.find({ workspaceId });
  
  if (reviews.length === 0) {
    await Workspace.findByIdAndUpdate(workspaceId, {
      averageRating: 0,
      ratingCount: 0
    });
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Workspace.findByIdAndUpdate(workspaceId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: reviews.length
    });
  }
}

module.exports = mongoose.model('Review', reviewSchema);
