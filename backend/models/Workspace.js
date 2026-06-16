const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: [true, 'Please provide a property ID']
  },
  type: {
    type: String,
    enum: ['meeting room', 'private office', 'desk'],
    required: [true, 'Please provide a workspace type']
  },
  seatingCapacity: {
    type: Number,
    required: [true, 'Please provide seating capacity'],
    min: [1, 'Capacity must be at least 1']
  },
  smokingAllowed: {
    type: Boolean,
    default: false
  },
  availabilityDate: {
    type: Date,
    required: [true, 'Please provide an availability date']
  },
  leaseTerm: {
    type: String,
    enum: ['day', 'week', 'month'],
    required: [true, 'Please provide a lease term']
  },
  price: {
    type: Number,
    required: [true, 'Please provide a price'],
    min: [0, 'Price cannot be negative']
  },
  photos: [{
    url: String,
    caption: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Workspace', workspaceSchema);
