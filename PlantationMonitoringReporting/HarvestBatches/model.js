const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const harvestBatchSchema = new Schema({
  harvestId: { 
    type: String,  //  changed from Number → String
    unique: true,
    required: true
  },
  farmerId: { 
    type: Number,
    required: true,
  },
  plotid: { 
    type: Number,
    required: true,
  },
  harvestDate: { 
    type: Date,
    required: true,
  },
  weightKg: { 
    type: Number,
    required: true,
  },
  status: { 
    type: String,
    enum: ["Pending", "Approved", "Processed"],
    default: "Pending",
    required: true
  }
}, { timestamps: true });

//  Auto-generate harvestId with prefix HB + 3-digit sequence
harvestBatchSchema.pre("save", async function (next) {
  if (this.harvestId) return next(); // skip if already set

  try {
    const lastBatch = await mongoose.model("HarvestBatch")
      .findOne({}, {}, { sort: { createdAt: -1 } });

    let newNumber = 1;
    if (lastBatch && lastBatch.harvestId) {
      // remove prefix "HB" and parse the number part
      const lastNumber = parseInt(lastBatch.harvestId.replace("HB", ""), 10);
      newNumber = lastNumber + 1;
    }

    //  Format as HB001, HB002, etc.
    this.harvestId = "HB" + newNumber.toString().padStart(3, "0");

    next();
  } catch (err) {
    next(err);
  }
});

const HarvestBatch = mongoose.model('HarvestBatch', harvestBatchSchema);
module.exports = HarvestBatch;
