import mongoose from 'mongoose';

export interface ISecurityIncident extends mongoose.Document {
  student: mongoose.Types.ObjectId;
  exam: mongoose.Types.ObjectId;
  incidentType: string;
  incidentDetails: string;
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  causedSuspension?: boolean;
  handledByPayment?: boolean;
  handledAt?: Date;
  suspensionRemovalPayment?: mongoose.Types.ObjectId;
}

const SecurityIncidentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  incidentType: {
    type: String,
    required: true,
    enum: [
      'TAB_SWITCH',
      'EXIT_FULLSCREEN',
      'BROWSER_MINIMIZE',
      'BROWSER_CLOSE',
      'DEV_TOOLS_OPEN',
      'COPY_ATTEMPT',
      'MULTIPLE_WINDOWS',
      'NETWORK_CHANGE',
      'SCREENSHOT_ATTEMPT',
      'OTHER',
      'system_note',
    ],
  },
  incidentDetails: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  userAgent: {
    type: String,
    required: false,
  },
  ipAddress: {
    type: String,
    required: false,
  },
  causedSuspension: {
    type: Boolean,
    default: false,
  },
  handledByPayment: {
    type: Boolean,
    default: false,
  },
  handledAt: {
    type: Date,
  },
  suspensionRemovalPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
});

// Create compound index for efficient querying by student and exam
SecurityIncidentSchema.index({ student: 1, exam: 1 });

// Ensure model is registered properly
let SecurityIncident;
if (mongoose.models && mongoose.models.SecurityIncident) {
  SecurityIncident = mongoose.models.SecurityIncident;
} else if (mongoose.modelNames().includes('SecurityIncident')) {
  SecurityIncident = mongoose.model('SecurityIncident');
} else {
  SecurityIncident = mongoose.model<ISecurityIncident>('SecurityIncident', SecurityIncidentSchema);
}

export default SecurityIncident;
