import express from 'express';
import Hospital from '../models/Hospital.js';
import City from '../models/City.js';
import { protect, adminOnly, hospitalAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Fetch all hospitals
// @route   GET /api/hospitals
// @access  Public (so patients can see available hospitals)
router.get('/', async (req, res) => {
    try {
        // Populate the city field so we get the city name along with the hospital
        const hospitals = await Hospital.find({}).populate('city', 'name');
        res.json(hospitals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching hospitals' });
    }
});

// @desc    Create a hospital
// @route   POST /api/hospitals
// @access  Private/Web Admin
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const { name, city, address, phone, email, type, status } = req.body;

        // Verify city exists before creating hospital
        const cityExists = await City.findById(city);
        if (!cityExists) {
            return res.status(404).json({ message: 'City not found. Cannot add hospital here.' });
        }

        const hospital = await Hospital.create({
            name,
            city,
            address,
            phone,
            email,
            type: type || 'General',
            status: status || 'Active'
        });

        // Return hospital with populated city for immediate UI display
        const populatedHospital = await Hospital.findById(hospital._id).populate('city', 'name');
        res.status(201).json(populatedHospital);
    } catch (error) {
        res.status(400).json({ message: 'Invalid hospital data' });
    }
});

// @desc    Update a hospital status
// @route   PUT /api/hospitals/:id
// @access  Private/Web Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (hospital) {
            hospital.status = req.body.status || hospital.status;
            if (req.body.name) hospital.name = req.body.name;
            if (req.body.city) hospital.city = req.body.city;
            if (req.body.address) hospital.address = req.body.address;
            if (req.body.phone) hospital.phone = req.body.phone;
            if (req.body.email) hospital.email = req.body.email;
            if (req.body.type) hospital.type = req.body.type;

            const updatedHospital = await hospital.save();
            const populatedUpdatedHospital = await Hospital.findById(updatedHospital._id).populate('city', 'name');
            res.json(populatedUpdatedHospital);
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating hospital' });
    }
});

// @desc    Delete a hospital
// @route   DELETE /api/hospitals/:id
// @access  Private/Web Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const hospital = await Hospital.findByIdAndDelete(req.params.id);
        if (hospital) {
            res.json({ message: 'Hospital removed successfully' });
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting hospital' });
    }
});

// @desc    Update hospital departments
// @route   PUT /api/hospitals/:id/departments
// @access  Private/Hospital Admin
router.put('/:id/departments', protect, hospitalAdminOnly, async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);

        if (hospital) {
            // Admin must belong to the hospital they are trying to update
            if (req.user.role === 'Hospital Admin' && req.user.hospitalId.toString() !== req.params.id) {
                return res.status(403).json({ message: 'Not authorized to update this hospital' });
            }

            hospital.departments = req.body.departments || hospital.departments;
            const updatedHospital = await hospital.save();
            res.json(updatedHospital);
        } else {
            res.status(404).json({ message: 'Hospital not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error updating departments' });
    }
});

export default router;
