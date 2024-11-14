const Mongoose = require('mongoose');
const Schema = Mongoose.Schema;

const PostSchema = new Schema({
    userId:{
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'User',   
        required: true,
    },
    fecha:{
        type: Date,
        required: true,
        default: Date.now
    },
    volumen: {
        type: Number,
        required: true,
    },
    vasos: {
        type: Number,
        required: true,
    },
}, { timestamps: true });

module.exports = Mongoose.model('Post', PostSchema);