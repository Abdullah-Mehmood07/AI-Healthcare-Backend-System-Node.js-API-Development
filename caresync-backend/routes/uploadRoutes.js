import express from 'express';
import multer from 'multer';
import path from 'path';
import mongoose from 'mongoose';
import { protect } from '../middleware/authMiddleware.js';
import LabReport from '../models/LabReport.js';
import User from '../models/User.js';
import Prescription from '../models/Prescription.js';
import Hospital from '../models/Hospital.js';

const router = express.Router();

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images and PDFs only!');
    }
}

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// @desc    Upload lab report + persist metadata
// @route   POST /api/upload
// @access  Private 
router.post('/', protect, upload.single('report'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {
        const patientId = req.body.patientId || null;
        const testType = req.body.testType || '';

        if (patientId && !mongoose.Types.ObjectId.isValid(patientId)) {
            return res.status(400).json({ message: 'patientId must be a valid ObjectId when provided' });
        }

        const savedPath = `/${req.file.path.replace(/\\/g, '/')}`;

        const report = await LabReport.create({
            patientId: patientId || undefined,
            uploaderId: req.user._id,
            hospitalId: req.user.hospitalId || undefined,
            testType,
            originalFileName: req.file.originalname,
            mimeType: req.file.mimetype,
            filePath: savedPath,
            fileSize: req.file.size
        });

        // F4: Smart Report Notifier SMS/Email simulation
        let patientEmail = 'unknown@caresync.com';
        if (patientId) {
            const patientUser = await User.findById(patientId);
            if (patientUser) {
                patientEmail = patientUser.email;
            }
        }
        console.log(`\n==================================================`);
        console.log(`[SMS/Email Notification Sent] To Patient: ${patientEmail}`);
        console.log(`Message: Your lab report for "${testType}" is ready.`);
        console.log(`Access Link: http://localhost:5000${savedPath}`);
        console.log(`==================================================\n`);

        res.json({
            message: 'File uploaded and report metadata saved',
            reportId: report._id,
            filePath: savedPath
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save report metadata', error: error.message });
    }
});

// @desc    Upload patient prescription
// @route   POST /api/upload/prescription
// @access  Private/Patient
router.post('/prescription', protect, upload.single('prescription'), async (req, res) => {
    if (req.user.role !== 'Patient') {
        return res.status(403).json({ message: 'Only patients can upload prescriptions' });
    }

    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {
        const hospitalId = req.body.hospitalId;

        if (!hospitalId || !mongoose.Types.ObjectId.isValid(hospitalId)) {
            return res.status(400).json({ message: 'A valid hospitalId is required' });
        }

        const savedPath = `/${req.file.path.replace(/\\/g, '/')}`;

        const prescription = await Prescription.create({
            patientId: req.user._id,
            hospitalId,
            originalFileName: req.file.originalname,
            mimeType: req.file.mimetype,
            filePath: savedPath,
            fileSize: req.file.size
        });

        res.status(201).json({
            message: 'Prescription uploaded successfully',
            prescription
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save prescription', error: error.message });
    }
});

// @desc    Upload hospital image
// @route   POST /api/upload/hospital-image/:hospitalId
// @access  Private/Web Admin
router.post('/hospital-image/:hospitalId', protect, upload.single('image'), async (req, res) => {
    if (req.user.role !== 'Web Admin') {
        return res.status(403).json({ message: 'Only Web Admins can upload hospital images' });
    }

    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    try {
        const hospitalId = req.params.hospitalId;
        const hospital = await Hospital.findById(hospitalId);

        if (!hospital) {
            return res.status(404).json({ message: 'Hospital not found' });
        }

        const savedPath = `/${req.file.path.replace(/\\/g, '/')}`;

        hospital.images.push(savedPath);
        await hospital.save();

        res.status(201).json({
            message: 'Image uploaded successfully',
            filePath: savedPath
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload hospital image', error: error.message });
    }
});

// @desc    Get current user's patient prescriptions
// @route   GET /api/upload/my-prescriptions
// @access  Private/Patient
router.get('/my-prescriptions', protect, async (req, res) => {
    if (req.user.role !== 'Patient') {
        return res.status(403).json({ message: 'Only patients can access this endpoint' });
    }

    try {
        const prescriptions = await Prescription.find({ patientId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('hospitalId', 'name city');

        res.json(prescriptions);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch prescriptions', error: error.message });
    }
});

// @desc    Get current user's patient reports
// @route   GET /api/upload/my-reports
// @access  Private/Patient
router.get('/my-reports', protect, async (req, res) => {
    if (req.user.role !== 'Patient') {
        return res.status(403).json({ message: 'Only patients can access this endpoint' });
    }

    try {
        const reports = await LabReport.find({ patientId: req.user._id })
            .sort({ createdAt: -1 })
            .populate('uploaderId', 'name email');

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
});

// @desc    Get reports scoped for staff/admin views
// @route   GET /api/upload/reports
// @access  Private
router.get('/reports', protect, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'Patient') {
            query.patientId = req.user._id;
        } else if (req.user.role === 'Web Admin') {
            query = {};
        } else if (req.user.hospitalId) {
            query.hospitalId = req.user.hospitalId;
        } else {
            return res.status(403).json({ message: 'No hospital scope available for this account' });
        }

        const reports = await LabReport.find(query)
            .sort({ createdAt: -1 })
            .populate('patientId', 'name email ghid')
            .populate('uploaderId', 'name email')
            .populate('hospitalId', 'name');

        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
});

export default router;
