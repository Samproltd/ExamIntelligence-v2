import type { NextApiRequest, NextApiResponse } from 'next';
import { authenticateAPI } from '../../../../utils/auth';
import dbConnect from '../../../../utils/db';
import ExamSuspension from '../../../../models/ExamSuspension';
import SecurityIncident from '../../../../models/SecurityIncident';
import Setting from '../../../../models/Setting';
import User from '../../../../models/User';
import Batch from '../../../../models/Batch';
import mongoose from 'mongoose';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Only students can check suspension status
  if (req.user.role !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Only students can check exam suspension status',
    });
  }

  const { id } = req.query; // exam ID

  // Validate object ID
  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res.status(400).json({ success: false, message: 'Invalid exam ID' });
  }

  // GET - Check if exam is suspended
  if (req.method === 'GET') {
    try {
      // Get the security settings
      const globalSettings = await getSecuritySettings();

      // Get user and batch information
      const user = await User.findById(req.user.userId);
      let batchMaxSecurityIncidents = null;

      // If user has a batch, get the batch details
      if (user?.batch) {
        const batch = await Batch.findById(user.batch);
        batchMaxSecurityIncidents = batch?.maxSecurityIncidents;
      }

      // Use batch setting if available, otherwise global setting
      const maxIncidents = batchMaxSecurityIncidents ?? globalSettings.maxIncidents;
      const securitySettings = {
        enableAutoSuspend: globalSettings.enableAutoSuspend,
        maxIncidents,
      };

      // Count the number of incidents
      const incidentCount = await SecurityIncident.countDocuments({
        student: req.user.userId,
        exam: id,
      });

      // Check if the exam is suspended for this student by finding the most recent suspension
      // Sort by suspensionTime in descending order to get the most recent suspension first
      const suspensions = await ExamSuspension.find({
        student: req.user.userId,
        exam: id,
      })
        .populate({
          path: 'incidents',
          options: { sort: { timestamp: 1 } },
        })
        .sort({ suspensionTime: -1 })
        .limit(1); // Get the most recent suspension

      // If there's a most recent suspension and it hasn't been removed
      if (suspensions.length > 0 && !suspensions[0].removed) {
        return res.status(200).json({
          success: true,
          suspended: true,
          suspension: suspensions[0],
          securitySettings,
          incidentCount,
          suspensionCount: await ExamSuspension.countDocuments({
            student: req.user.userId,
            exam: id,
          }),
        });
      }

      // Check if the student has any previous suspensions that were removed
      const previousRemovedSuspensions = await ExamSuspension.countDocuments({
        student: req.user.userId,
        exam: id,
        removed: true,
      });

      // If no active suspension or it has been removed
      return res.status(200).json({
        success: true,
        suspended: false,
        securitySettings,
        incidentCount,
        warningOnly: securitySettings.enableAutoSuspend === false,
        hadPreviousSuspensions: previousRemovedSuspensions > 0,
        suspensionCount: previousRemovedSuspensions,
      });
    } catch (error) {
      console.error('Error checking exam suspension status:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

// Helper function to get security settings
async function getSecuritySettings() {
  // Default settings
  const defaultSettings = {
    enableAutoSuspend: false,
    maxIncidents: 5,
  };

  try {
    const enableAutoSuspendSetting = await Setting.findOne({
      key: 'security.enableAutoSuspend',
    });

    const maxIncidentsSetting = await Setting.findOne({
      key: 'security.maxIncidents',
    });

    // Ensure proper types
    const enableAutoSuspend =
      enableAutoSuspendSetting?.value === true || enableAutoSuspendSetting?.value === 'true';

    const maxIncidents =
      maxIncidentsSetting?.value !== undefined
        ? Number(maxIncidentsSetting.value)
        : defaultSettings.maxIncidents;

    const settings = {
      enableAutoSuspend,
      maxIncidents,
    };

    return settings;
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return defaultSettings;
  }
}

export default authenticateAPI(handler);
