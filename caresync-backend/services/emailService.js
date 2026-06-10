import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailTemplates = {
    verificationEmail: (name, verificationLink) => ({
        subject: 'Verify Your CareSync Account',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Welcome to CareSync, ${name}!</h2>
                <p>Thank you for registering. Please verify your email address to activate your account.</p>
                <div style="margin: 30px 0;">
                    <a href="${verificationLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Or copy this link: ${verificationLink}</p>
                <p style="color: #6b7280; font-size: 12px;">This link expires in 24 hours.</p>
            </div>
        `
    }),

    appointmentConfirmation: (patientName, doctorName, appointmentDate, timeSlot, hospitalName) => ({
        subject: `Appointment Confirmation - ${new Date(appointmentDate).toLocaleDateString()}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Appointment Confirmed</h2>
                <p>Dear ${patientName},</p>
                <p>Your appointment has been confirmed. Here are the details:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>Doctor:</strong> ${doctorName}</p>
                    <p><strong>Date:</strong> ${new Date(appointmentDate).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${timeSlot}</p>
                    <p><strong>Hospital:</strong> ${hospitalName}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Please arrive 10 minutes early. If you need to reschedule, contact us at least 24 hours before your appointment.</p>
            </div>
        `
    }),

    labReportReady: (patientName, reportType, downloadLink) => ({
        subject: 'Your Lab Report is Ready',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Lab Report Available</h2>
                <p>Dear ${patientName},</p>
                <p>Your ${reportType} lab report is ready and has been uploaded to your CareSync account.</p>
                <div style="margin: 30px 0;">
                    <a href="${downloadLink}" style="background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">View Report</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">You can also access this report anytime from your CareSync dashboard under "Lab Reports".</p>
            </div>
        `
    }),

    prescriptionUpdate: (patientName, medicationName, instructions) => ({
        subject: 'New Prescription Available',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">New Prescription</h2>
                <p>Dear ${patientName},</p>
                <p>Your doctor has issued a new prescription for <strong>${medicationName}</strong>.</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 4px; margin: 20px 0;">
                    <p><strong>Instructions:</strong></p>
                    <p>${instructions}</p>
                </div>
                <p style="color: #6b7280; font-size: 14px;">Please review the complete prescription details in your CareSync account. If you have any questions, contact your doctor.</p>
            </div>
        `
    }),

    passwordReset: (name, resetLink) => ({
        subject: 'Reset Your CareSync Password',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1f2937;">Password Reset Request</h2>
                <p>Dear ${name},</p>
                <p>We received a request to reset your CareSync password. Click the link below to set a new password.</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
            </div>
        `
    })
};

export const sendVerificationEmail = async (email, name, verificationToken) => {
    try {
        const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        const template = emailTemplates.verificationEmail(name, verificationLink);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: template.html
        });

        return { success: true, message: 'Verification email sent' };
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
};

export const sendAppointmentConfirmation = async (email, patientName, doctorName, appointmentDate, timeSlot, hospitalName) => {
    try {
        const template = emailTemplates.appointmentConfirmation(patientName, doctorName, appointmentDate, timeSlot, hospitalName);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: template.html
        });

        return { success: true, message: 'Appointment confirmation sent' };
    } catch (error) {
        console.error('Error sending appointment confirmation:', error);
        throw error;
    }
};

export const sendLabReportReady = async (email, patientName, reportType, reportId) => {
    try {
        const downloadLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/lab-reports/${reportId}`;
        const template = emailTemplates.labReportReady(patientName, reportType, downloadLink);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: template.html
        });

        return { success: true, message: 'Lab report notification sent' };
    } catch (error) {
        console.error('Error sending lab report notification:', error);
        throw error;
    }
};

export const sendPrescriptionUpdate = async (email, patientName, medicationName, instructions) => {
    try {
        const template = emailTemplates.prescriptionUpdate(patientName, medicationName, instructions);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: template.html
        });

        return { success: true, message: 'Prescription update sent' };
    } catch (error) {
        console.error('Error sending prescription update:', error);
        throw error;
    }
};

export const sendPasswordReset = async (email, name, resetToken) => {
    try {
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        const template = emailTemplates.passwordReset(name, resetLink);

        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject: template.subject,
            html: template.html
        });

        return { success: true, message: 'Password reset email sent' };
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
};

export const sendCustomEmail = async (email, subject, htmlContent) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: email,
            subject,
            html: htmlContent
        });

        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending custom email:', error);
        throw error;
    }
};

export const verifyEmailConfiguration = async () => {
    try {
        await transporter.verify();
        console.log('you can check your email');
        return true;
    } catch (error) {
        console.error('Email service configuration error:', error);
        return false;
    }
    
};

