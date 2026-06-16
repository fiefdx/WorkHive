const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide an owner ID']
  },
  address: {
    type: String,
    required: [true, 'Please provide an address'],
    trim: true
  },
  neighborhood: {
    type: String,
    required: [true, 'Please provide a neighborhood'],
    trim: true
  },
  squareFeet: {
    type: Number,
    required: [true, 'Please provide square footage'],
    min: [1, 'Square footage must be positive']
  },
  hasParking: {
    type: Boolean,
    default: false
  },
  hasPublicTransit: {
    type: Boolean,
    default: false
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Property', propertySchema);
