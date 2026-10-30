import mongoose from "mongoose"

const portalSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        maxLength: 100,
        default: ""
    },

    token: {
        type: String,
        default: ""
    },

    tokenHash: {
        type: String,
        required: true,
        unique: true
    },

    ownerId: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: () => new Date()
    },

    expiresAt: {
        type: Date,
        required: true
    },

    lastReceivedAt: {
        type: Date,
        default: null
    }
})

portalSchema.index({ ownerId: 1, createdAt: -1 });
portalSchema.index({ expiresAt: 1}, { expireAfterSeconds: 0});

export const Portal = mongoose.model("Portal", portalSchema);