import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateLabSummary, generateSpecialistRecommendation, generatePrescriptionExplanation, processConversation } from '../services/geminiService.js';
import { classifySpecialistFromSymptoms } from '../services/specialistClassifierService.js';
import LabReport from '../models/LabReport.js';
import Prescription from '../models/Prescription.js';
import Message from '../models/Message.js';
import Doctor from '../models/Doctor.js';

const router = express.Router();

const parseJsonText = (text) => {
    if (!text || typeof text !== 'string') {
        return null;
    }

    const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

router.get('/health', protect, (req, res) => {
    res.json({
        status: 'ok',
        geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
        classifierDatasetPath: process.env.CLASSIFIER_DATASET_PATH || '../Healthcare_5000_with_Specialist.csv'
    });
});

router.post('/conversation', protect, async (req, res) => {
    const { history, hospitalId } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
        return res.status(400).json({ message: 'history array is required' });
    }

    try {
        const toolsConfig = {
            predictSpecialist: async (symptoms) => {
                const result = await classifySpecialistFromSymptoms({ symptoms });
                return { specialist: result.predictedSpecialist };
            },
            findDoctors: async (specialty, hid) => {
                if (!hid) return { doctors: [], message: "No hospital ID provided by user." };
                const doctors = await Doctor.find({
                    hospital: hid,
                    specialty: specialty,
                    status: 'Active'
                }).select('name specialty weeklySchedule').lean();
                return { doctors };
            }
        };

        const reply = await processConversation(history, hospitalId, toolsConfig);
        res.json({ reply });
    } catch (error) {
        console.error("Conversation Error:", error);
        res.status(500).json({ message: 'Conversation failed', error: error.message });
    }
});

router.post('/triage', protect, async (req, res) => {
    const { symptoms, age, gender, includeAiExplanation = true, hospitalId } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
        return res.status(400).json({ message: 'symptoms (string) is required' });
    }

    try {
        const classifier = await classifySpecialistFromSymptoms({ symptoms });
        let aiExplanation = null;
        let recommendedDoctors = [];

        if (hospitalId && classifier.predictedSpecialist) {
            try {
                recommendedDoctors = await Doctor.find({
                    hospital: hospitalId,
                    specialty: classifier.predictedSpecialist,
                    status: 'Active'
                }).select('name specialty weeklySchedule');
            } catch (err) {
                console.error("Error fetching recommended doctors:", err);
            }
        }

        if (includeAiExplanation) {
            try {
                const aiRaw = await generateSpecialistRecommendation({ symptoms, age, gender });
                aiExplanation = parseJsonText(aiRaw) || { raw: aiRaw };
            } catch (geminiError) {
                aiExplanation = { error: geminiError.message };
            }
        }

        res.json({
            classifier,
            aiExplanation,
            recommendedDoctors
        });
    } catch (error) {
        res.status(500).json({ message: 'AI triage failed', error: error.message });
    }
});

router.post('/classify-specialist', protect, async (req, res) => {
    const { symptoms, hospitalId } = req.body;

    if (!symptoms || typeof symptoms !== 'string') {
        return res.status(400).json({ message: 'symptoms (string) is required' });
    }

    try {
        const classifier = await classifySpecialistFromSymptoms({ symptoms });
        let recommendedDoctors = [];

        if (hospitalId && classifier.predictedSpecialist) {
            try {
                recommendedDoctors = await Doctor.find({
                    hospital: hospitalId,
                    specialty: classifier.predictedSpecialist,
                    status: 'Active'
                }).select('name specialty weeklySchedule');
            } catch (err) {
                console.error("Error fetching recommended doctors:", err);
            }
        }

        res.json({
            ...classifier,
            recommendedDoctors
        });
    } catch (error) {
        res.status(500).json({ message: 'Specialist classification failed', error: error.message });
    }
});

router.post('/summarize-lab/:reportId', protect, async (req, res) => {
    const { reportId } = req.params;
    const { reportText } = req.body;

    if (!reportText || typeof reportText !== 'string') {
        return res.status(400).json({ message: 'reportText (string) is required' });
    }

    try {
        const report = await LabReport.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Lab report not found' });
        }

        const isPatientOwner = report.patientId && report.patientId.toString() === req.user._id.toString();
        const isUploader = report.uploaderId && report.uploaderId.toString() === req.user._id.toString();
        const isHospitalStaff = req.user.role === 'Hospital Admin' || req.user.role === 'Lab Admin' || req.user.role === 'PA Admin';
        const sameHospital = report.hospitalId && req.user.hospitalId && report.hospitalId.toString() === req.user.hospitalId.toString();
        const isWebAdmin = req.user.role === 'Web Admin';

        if (!(isPatientOwner || isUploader || isWebAdmin || (isHospitalStaff && sameHospital))) {
            return res.status(403).json({ message: 'Not authorized to summarize this report' });
        }

        const aiRaw = await generateLabSummary({ reportText });
        const parsed = parseJsonText(aiRaw);

        report.aiSummary = {
            plainSummary: parsed?.plainSummary || '',
            keyFindings: Array.isArray(parsed?.keyFindings) ? parsed.keyFindings : [],
            cautionFlags: Array.isArray(parsed?.cautionFlags) ? parsed.cautionFlags : [],
            suggestedFollowUp: parsed?.suggestedFollowUp || '',
            rawResponse: aiRaw,
            summarizedAt: new Date()
        };
        await report.save();

        res.json({
            reportId: report._id,
            aiSummary: report.aiSummary
        });
    } catch (error) {
        res.status(500).json({ message: 'AI lab summary failed', error: error.message });
    }
});

router.post('/explain-prescription/:prescriptionId', protect, async (req, res) => {
    const { prescriptionId } = req.params;
    const { prescriptionText } = req.body;

    if (!prescriptionText || typeof prescriptionText !== 'string') {
        return res.status(400).json({ message: 'prescriptionText (string) is required' });
    }

    try {
        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.patientId.toString() !== req.user._id.toString() && req.user.role !== 'Web Admin') {
            return res.status(403).json({ message: 'Not authorized to view this prescription' });
        }

        const aiRaw = await generatePrescriptionExplanation({ prescriptionText });
        const parsed = parseJsonText(aiRaw);

        prescription.aiExplanation = {
            plainSummary: parsed?.plainSummary || '',
            dosageInstructions: Array.isArray(parsed?.dosageInstructions) ? parsed.dosageInstructions : [],
            cautionFlags: Array.isArray(parsed?.cautionFlags) ? parsed.cautionFlags : [],
            suggestedFollowUp: parsed?.suggestedFollowUp || '',
            rawResponse: aiRaw,
            explainedAt: new Date()
        };
        await prescription.save();

        res.json({
            prescriptionId: prescription._id,
            aiExplanation: prescription.aiExplanation
        });
    } catch (error) {
        res.status(500).json({ message: 'AI prescription explanation failed', error: error.message });
    }
});

// @desc    Clarify prescription with doctor
// @route   POST /api/ai/clarify-prescription/:prescriptionId
// @access  Private/Patient
router.post('/clarify-prescription/:prescriptionId', protect, async (req, res) => {
    const { prescriptionId } = req.params;
    const { doctorId, text } = req.body;

    if (!doctorId) {
        return res.status(400).json({ message: 'doctorId is required' });
    }
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: 'clarification text (string) is required' });
    }

    try {
        const prescription = await Prescription.findById(prescriptionId);
        if (!prescription) {
            return res.status(404).json({ message: 'Prescription not found' });
        }

        if (prescription.patientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const determinedSenderRole = 'Patient';

        // 1. Add to prescription clarifications array
        prescription.clarifications.push({
            text,
            senderId: req.user._id,
            senderRole: determinedSenderRole,
            sentAt: new Date()
        });
        await prescription.save();

        // 2. Insert message into doctor-patient chat thread for real-time visibility
        const chatMessage = await Message.create({
            patientId: req.user._id,
            doctorId,
            senderRole: determinedSenderRole,
            text: `[Prescription Clarification Request for ${prescription.originalFileName}]: ${text}`
        });

        res.json({
            prescription,
            chatMessage
        });
    } catch (error) {
        res.status(500).json({ message: 'Clarification request failed', error: error.message });
    }
});

export default router;

