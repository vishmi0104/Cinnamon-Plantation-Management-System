const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const distributionSchema = new Schema(
  {
    distributionId: {
      type: String,
      unique: true,
      required: false,
    },
    farmerId: {
      type: Number,
      required: true,
    },
    plotid: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Compost",
        "Biofertilizers",
        "Nitrogen",
        "Green manure",
        "Phosphorus",
        "Farmyard manure (FYM)",
      ],
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    distributedDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-generate Distribution ID like D001, D002...
distributionSchema.pre("save", async function (next) {
  if (this.distributionId) return next();

  try {
    const last = await mongoose
      .model("Distribution")
      .findOne()
      .sort({ createdAt: -1 });

    let newNumber = 1;
    if (last && last.distributionId) {
      const lastNum = parseInt(last.distributionId.replace("D", ""), 10);
      newNumber = lastNum + 1;
    }

    this.distributionId = "D" + newNumber.toString().padStart(3, "0");
    next();
  } catch (err) {
    next(err);
  }
});

const Distribution = mongoose.model("Distribution", distributionSchema);

module.exports = Distribution;
