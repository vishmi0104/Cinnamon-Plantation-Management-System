const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const landPlotSchema = new Schema({
    plotid:{ 
        type: Number,  //data type
        required:true, //validation
            },
    location:{ 
        type: String,  //data type
        required:true, //validation
            },
    size:{ 
        type: Number,  //data type
        required:true, //validation
            },
    status:{ 
        type: String,  //data type
        enum: ["Active", "Inactive"],
        default: "Active",
        required:true, //validation
            } 
}, {timestamps: true});

const LandPlot = mongoose.model('Land_Plot', landPlotSchema);
module.exports = LandPlot;