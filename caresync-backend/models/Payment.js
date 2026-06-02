import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        default: null
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'USD',
        enum: ['USD', 'GHS', 'EUR', 'GBP']
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    method: {
        type: String,
        enum: ['card', 'bank_transfer', 'cash'],
        default: 'card'
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    invoiceId: {
        type: String,
        unique: true,
        sparse: true
    },
    metadata: {
        type: Map,
        of: String,
        default: new Map()
    }
}, {
    timestamps: true
});

// Index for faster queries
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
