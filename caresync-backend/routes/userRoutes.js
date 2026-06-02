import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly, hospitalAdminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Generate a unique Global Health ID (GHID)
const generateGHID = async () => {
    let isUnique = false;
    let newGhid;
    while (!isUnique) {
        // Generate something like "CS-9834-A712"
        const numPart = Math.floor(1000 + Math.random() * 9000);
        const randLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const numPart2 = Math.floor(100 + Math.random() * 900);
        newGhid = `CS-${numPart}-${randLetter}${numPart2}`;

        // Check uniqueness
        const existing = await User.findOne({ ghid: newGhid });
        if (!existing) isUnique = true;
    }
    return newGhid;
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                ghid: user.ghid,
                hospitalId: user.hospitalId,
                doctorId: user.doctorId,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server Authentication Error. Check backend logs for details.' });
    }
});

// @desc    Register a new user (Web Admin creating Hospital Admin OR Patient registering themselves)
// @route   POST /api/users
// @access  Public (for Patients) / Private (for Admins)
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, hospitalId, doctorId, national_id } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Determine the role being created
        const requestedRole = role || 'Patient';
        const userData = { name, email, password, role: requestedRole };

        // Security check: Only a logged-in Web Admin can create another Web Admin or Hospital Admin
        if (requestedRole === 'Web Admin' || requestedRole === 'Hospital Admin') {
            // Manual middleware check since this route is mixed
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const currentUser = await User.findById(decoded.id);
                if (!currentUser || currentUser.role !== 'Web Admin') {
                    return res.status(403).json({ message: 'Only Web Admins can create administrative accounts.' });
                }
            } else {
                return res.status(401).json({ message: 'Not authorized, no token available for admin creation.' });
            }

            if (requestedRole === 'Hospital Admin' && hospitalId) {
                userData.hospitalId = hospitalId;
            }
        }

        // Security check: Only a logged-in Hospital Admin can create a Lab Admin or PA Admin
        if (requestedRole === 'Lab Admin' || requestedRole === 'PA Admin') {
            let token;
            if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
                token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const currentUser = await User.findById(decoded.id);
                
                if (!currentUser || currentUser.role !== 'Hospital Admin') {
                    return res.status(403).json({ message: `Only Hospital Admins can create ${requestedRole} accounts.` });
                }
                
                // Assign to the exact same hospital
                userData.hospitalId = currentUser.hospitalId;
                if (requestedRole === 'PA Admin' && doctorId) {
                    userData.doctorId = doctorId;
                }
            } else {
                return res.status(401).json({ message: `Not authorized to create ${requestedRole}.` });
            }
        }

        // If it's a Patient, generate their Global Health ID and check National ID
        if (requestedRole === 'Patient') {
            if (!national_id) {
                return res.status(400).json({ message: 'National ID (CNIC/SSN) is required for patient registration.' });
            }
            const existingPatient = await User.findOne({ national_id });
            if (existingPatient) {
                // Global Patient Identity Feature
                // Instead of rejecting, we return the existing identity
                
                // If a hospital logs them in and passes a specific MR Number, we link it
                if (req.body.hospitalId && req.body.mrNumber) {
                    const alreadyLinked = existingPatient.localMrNumbers.find(m => m.hospital.toString() === req.body.hospitalId);
                    if (!alreadyLinked) {
                        existingPatient.localMrNumbers.push({ hospital: req.body.hospitalId, mrNumber: req.body.mrNumber });
                        await existingPatient.save();
                    }
                }

                return res.status(200).json({
                    message: 'Patient already globally registered. Linking existing identity.',
                    _id: existingPatient._id,
                    name: existingPatient.name,
                    email: existingPatient.email,
                    role: existingPatient.role,
                    ghid: existingPatient.ghid,
                    token: generateToken(existingPatient._id)
                });
            }
            userData.national_id = national_id;
            userData.ghid = await generateGHID();
            
            // Allow linking mr number on initial registration
            if (req.body.hospitalId && req.body.mrNumber) {
                userData.localMrNumbers = [{ hospital: req.body.hospitalId, mrNumber: req.body.mrNumber }];
            }
        }

        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                ghid: user.ghid,
                hospitalId: user.hospitalId,
                doctorId: user.doctorId,
                token: generateToken(user._id) // Auto-login after registration
            });
        } else {
            res.status(400).json({ message: 'Invalid user data format' });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ message: 'Error registering user' });
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Web Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}).populate('hospitalId', 'name').select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching users' });
    }
});

// @desc    Get all patients
// @route   GET /api/users/patients
// @access  Private (Staff only)
router.get('/patients', protect, async (req, res) => {
    if (req.user.role === 'Patient') {
        return res.status(403).json({ message: 'Access denied. Only staff can view the patient directory.' });
    }
    try {
        const patients = await User.find({ role: 'Patient' }).select('name email ghid national_id');
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching patients' });
    }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Web Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            if (user.role === 'Web Admin' && user.email === 'superadmin@caresync.com') {
                return res.status(400).json({ message: 'Cannot delete master admin' });
            }
            await User.findByIdAndDelete(req.params.id);
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error deleting user' });
    }
});

// @desc    Change password
// @route   PUT /api/users/profile/password
// @access  Private
router.put('/profile/password', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const { oldPassword, newPassword } = req.body;
            if (await user.matchPassword(oldPassword)) {
                user.password = newPassword;
                await user.save();
                res.json({ message: 'Password updated successfully' });
            } else {
                res.status(401).json({ message: 'Incorrect old password' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating password' });
    }
});

export default router;
