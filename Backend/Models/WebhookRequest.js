import mongoose from "mongoose"

const retenSec = 24*3600;

const requestSchema = new mongoose.Schema({
    portalId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Portal",
        required: true
    },

    method: {
        type: String,
        required: true
    },

    path: {
        type: String,
        default: ""
    },

    query: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    headers: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    body: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    rawBody: {
        type: String,
        default: null
    },

    contentType: {
        type: String,
        default: ""
    },

    bodySize: {
        type: Number,
        default: 0
    },

    receivedAt: {
        type: Date,
        default: () => new Date()
    },

    sourceIp: {
        type: String,
        default: null
    }
})

requestSchema.index({ portalId: 1, receivedAt: -1 });
requestSchema.index({ receivedAt: 1}, {expireAfterSeconds: retenSec});

export const WebhookRequest = mongoose.model("WebhookRequest", requestSchema)

