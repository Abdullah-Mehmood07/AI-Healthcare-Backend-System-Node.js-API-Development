import express from 'express';
import Service from '../models/Service.js';
import { protect, hospitalAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @desc    Get all services FOR A SPECIFIC HOSPITAL
 * @route   GET /api/services/hospital/:hospitalId
 * @access  Public
 */
router.get('/hospital/:hospitalId', async (req, res) => {
    try {
        const services = await Service.find({ hospital: req.params.hospitalId });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching services' });
    }
});

/**
 * @desc    Create a new service
 * @route   POST /api/services
 * @access  Private/HospitalAdmin
 */
router.post('/', protect, hospitalAdminOnly, async (req, res) => {
    try {
        const { name, description, price } = req.body;
        
        // Map securely to the logged-in user's assigned hospital
        const service = await Service.create({
            name,
            description,
            price,
            hospital: req.user.hospitalId 
        });

        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: 'Invalid service data', error: error.message });
    }
});

// Update Route
router.put('/:id', protect, hospitalAdminOnly, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) return res.status(404).json({ message: 'Service not found' });
        if (service.hospital.toString() !== req.user.hospitalId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedService);
    } catch (error) {
        res.status(400).json({ message: 'Error updating service' });
    }
});

// Delete Route
router.delete('/:id', protect, hospitalAdminOnly, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);

        if (!service) return res.status(404).json({ message: 'Service not found' });
        if (service.hospital.toString() !== req.user.hospitalId.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await service.deleteOne();
        res.json({ message: 'Service removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service' });
    }
});

export default router;
