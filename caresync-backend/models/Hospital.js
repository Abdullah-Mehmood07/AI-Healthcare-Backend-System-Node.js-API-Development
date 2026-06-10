import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Hospital name is required'],
            trim: true
        },
        city: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'City'
        },
        address: {
            type: String,
            required: [true, 'Hospital address is required'],
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true
        },
        images: [{
            type: String
        }],
        departments: [{
            type: String
        }],
        type: {
            type: String,
            enum: ['General', 'Specialized', 'Clinic', 'Other'],
            default: 'General'
        },
        status: {
            type: String,
            required: true,
            enum: ['Active', 'Inactive'],
            default: 'Active'
        }
    },
    {
        timestamps: true
    }
);

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
