const express = require('express');
const router = express.Router();
const {
  createReview,
  getWorkspaceReviews,
  getMyReview,
  updateReview,
  deleteReview
} = require('../controllers/reviews');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/workspace/:workspaceId', getWorkspaceReviews);

// Protected routes
router.post('/', protect, authorize('coworker'), createReview);
router.get('/my-review/:workspaceId', protect, getMyReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
