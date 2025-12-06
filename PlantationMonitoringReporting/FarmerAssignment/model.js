const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const farmerAssignmentSchema = new Schema({
  farmerId: { 
    type: Number,
    required: true,
  },
  farmerName: { 
    type: String,
    required: true,
  },
  plotid: {   //  numeric plotid, not ObjectId
    type: Number,
    required: true
  },
  assignedDate: { 
    type: Date,
    default: Date.now
  } 
}, { timestamps: true });

const FarmerAssignment = mongoose.model('FarmerAssignment', farmerAssignmentSchema);
module.exports = FarmerAssignment;
