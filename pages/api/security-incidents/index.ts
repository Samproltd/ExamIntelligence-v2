import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { acquireLock } from '../../../utils/db';
import { authenticateAPI } from '../../../utils/auth';
import SecurityIncident from '../../../models/SecurityIncident';
import ExamSuspension from '../../../models/ExamSuspension';
import Setting from '../../../models/Setting';
import User from '../../../models/User';
import Batch from '../../../models/Batch';
import mongoose from 'mongoose';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  // Handle GET method for listing incidents
  if (req.method === 'GET') {
    try {
      // This endpoint requires admin access
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Extract query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const examId = req.query.examId as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      // Build query filters
      const filter: any = {};

      // Add exam filter if provided
      if (examId) {
        filter.exam = new mongoose.Types.ObjectId(examId);
      }

      // Add date range filter if provided
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) {
          filter.timestamp.$gte = new Date(startDate);
        }
        if (endDate) {
          // Set to end of the day
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          filter.timestamp.$lte = endDateTime;
        }
      }

      // Count total incidents matching the filter
      const total = await SecurityIncident.countDocuments(filter);

      // Get paginated incidents with populated related fields
      const incidents = await SecurityIncident.find(filter)
        .populate('student', 'name firstName lastName email batch')
        .populate('exam', 'name')
        .populate({
          path: 'student',
          populate: {
            path: 'batch',
            select: 'name',
          },
        })
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      // Return incidents with pagination info
      return res.status(200).json({
        success: true,
        incidents,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching security incidents:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }

  // Only allow POST method for creating incidents
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Ensure user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const { examId, incidentType, incidentDetails } = req.body;

    // Validation
    if (!examId || !incidentType || !incidentDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    // Get user and batch information
    const user = await User.findById(req.user.userId);
    let batchMaxSecurityIncidents = null;
    let batchEnableAutoSuspend = null;

    // If user has a batch, get the batch details
    if (user?.batch) {
      const batch = await Batch.findById(user.batch);
      batchMaxSecurityIncidents = batch?.maxSecurityIncidents;
      batchEnableAutoSuspend = batch?.enableAutoSuspend;
    }

    // Get the security settings first (global settings)
    const globalSettings = await getSecuritySettings();

    // Determine the maxIncidents to use (prefer batch setting if available)
    const maxIncidents = batchMaxSecurityIncidents ?? globalSettings.maxIncidents;
    const enableAutoSuspend = batchEnableAutoSuspend ?? globalSettings.enableAutoSuspend;
    let effectiveMaxIncidents = maxIncidents;

    console.log('SECURITY SETTINGS:', {
      studentId: req.user.userId,
      batchId: user?.batch,
      batchMaxSecurityIncidents,
      globalMaxSecurityIncidents: globalSettings.maxIncidents,
      usingMaxIncidents: maxIncidents,
      effectiveMaxIncidents,
      batchEnableAutoSuspend,
      globalEnableAutoSuspend: globalSettings.enableAutoSuspend,
      usingEnableAutoSuspend: enableAutoSuspend,
    });

    // Check if the exam is already suspended for this student
    // Get the most recent suspension first
    const activeSuspension = await ExamSuspension.findOne({
      student: req.user.userId,
      exam: examId,
      removed: { $ne: true }, // Only include suspensions that haven't been removed
    }).sort({ suspensionTime: -1 });

    // If there's an active (non-removed) suspension, just return it
    if (activeSuspension) {
      return res.status(200).json({
        success: true,
        suspended: true,
        message: 'Exam already suspended',
        suspension: activeSuspension,
        securitySettings: {
          enableAutoSuspend,
          maxIncidents,
          effectiveMaxIncidents,
        },
      });
    }

    // Create new security incident
    const incident = await SecurityIncident.create({
      student: req.user.userId,
      exam: examId,
      incidentType,
      incidentDetails,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown',
    });

    // Count how many incidents this student has for this exam
    const incidentCount = await SecurityIncident.countDocuments({
      student: req.user.userId,
      exam: examId,
      handledByPayment: { $ne: true }, // Only count incidents that haven't been handled by payment
    });

    // Get how many times this student has been suspended for this exam
    const previousSuspensionsCount = await ExamSuspension.countDocuments({
      student: req.user.userId,
      exam: examId,
    });

    // Check if there's a recently removed suspension (payment made)
    if (previousSuspensionsCount > 0) {
      // Get the most recent removed suspension to check if we need to apply additional incident allowance
      const recentRemovedSuspension = await ExamSuspension.findOne({
        student: req.user.userId,
        exam: examId,
        removed: true,
      }).sort({ removedAt: -1 });

      // If there's a recently removed suspension, apply the additional incidents allowance
      if (recentRemovedSuspension) {
        // Get the batch settings for additional incidents after removal
        let additionalIncidentsAllowed = 3; // Default value

        if (user?.batch) {
          const batch = await Batch.findById(user.batch);
          if (batch?.additionalSecurityIncidentsAfterRemoval !== undefined) {
            additionalIncidentsAllowed = batch.additionalSecurityIncidentsAfterRemoval;
          }
        }

        // Apply the additional incidents allowance
        effectiveMaxIncidents = maxIncidents + additionalIncidentsAllowed;

        console.log('APPLYING ADDITIONAL INCIDENTS ALLOWANCE:', {
          baseMaxIncidents: maxIncidents,
          additionalIncidentsAllowed,
          effectiveMaxIncidents,
          removedSuspensionId: recentRemovedSuspension._id,
          removedAt: recentRemovedSuspension.removedAt,
        });
      }
    }

    // If auto-suspension is enabled and the incident count exceeds the threshold, suspend the exam
    if (enableAutoSuspend && incidentCount >= effectiveMaxIncidents) {
      // Create a unique lock key for this student-exam pair
      const lockKey = `suspension:${req.user.userId}:${examId}`;
      let releaseLock: (() => void) | null = null;

      try {
        // Acquire lock to prevent parallel suspension creation
        try {
          releaseLock = await acquireLock(lockKey);
        } catch (lockError) {
          // If we couldn't acquire the lock, check if a suspension already exists
          console.warn(`Failed to acquire lock for ${lockKey}: ${lockError}`);

          const existingSuspension = await ExamSuspension.findOne({
            student: req.user.userId,
            exam: examId,
            removed: { $ne: true },
          });

          if (existingSuspension) {
            console.log(
              `Found existing suspension while waiting for lock: ${existingSuspension._id}`
            );
            return res.status(200).json({
              success: true,
              incident,
              suspended: true,
              suspension: existingSuspension,
              securitySettings: {
                enableAutoSuspend,
                maxIncidents,
                effectiveMaxIncidents,
              },
              incidentCount,
              suspensionCount: previousSuspensionsCount,
              info: 'Used existing suspension after lock timeout',
            });
          }

          // If no existing suspension, continue without the lock (risk of duplicate, but at least we tried)
          console.warn('No existing suspension found after lock timeout, continuing without lock');
        }

        // Mark this incident as the one that caused suspension
        await SecurityIncident.findByIdAndUpdate(incident._id, {
          causedSuspension: true,
        });

        // Get all incidents for this student and exam
        const allIncidents = await SecurityIncident.find({
          student: req.user.userId,
          exam: examId,
        });

        // Use MongoDB's session and transaction for atomic operations
        const session = await mongoose.startSession();
        let suspensionResult;

        try {
          await session.withTransaction(async () => {
            // First check if there's an active suspension
            const existingSuspension = await ExamSuspension.findOne({
              student: req.user.userId,
              exam: examId,
              removed: { $ne: true },
            }).session(session);

            if (existingSuspension) {
              // If there's already an active suspension, use it
              suspensionResult = existingSuspension;
              return;
            }

            // But update the reason message to include batch information if applicable
            const suspensionReason =
              previousSuspensionsCount > 0
                ? `Repeatedly exceeded maximum allowed security incidents (${effectiveMaxIncidents}${batchMaxSecurityIncidents ? ' for your batch' : ''}). This is suspension #${previousSuspensionsCount + 1}.`
                : `Exceeded maximum allowed security incidents (${effectiveMaxIncidents}${batchMaxSecurityIncidents ? ' for your batch' : ''})`;

            // Create a new suspension if none exists
            const newSuspension = new ExamSuspension({
              student: req.user.userId,
              exam: examId,
              incidents: allIncidents.map(incident => incident._id),
              reason: suspensionReason,
              suspensionTime: new Date(),
              reviewedByAdmin: false,
              removed: false,
            });

            // Save with the session to ensure it's part of the transaction
            await newSuspension.save({ session });
            suspensionResult = newSuspension;
          });
        } finally {
          session.endSession();
        }

        if (!suspensionResult) {
          throw new Error('Failed to create or find suspension');
        }

        return res.status(201).json({
          success: true,
          incident,
          suspended: true,
          suspension: suspensionResult,
          securitySettings: {
            enableAutoSuspend,
            maxIncidents,
            effectiveMaxIncidents,
          },
          incidentCount,
          suspensionCount: previousSuspensionsCount + (suspensionResult.isNew ? 1 : 0),
        });
      } catch (error) {
        console.error('Error creating/retrieving suspension:', error);

        // Even if there was an error in the transaction, check if there's an existing suspension
        try {
          const fallbackSuspension = await ExamSuspension.findOne({
            student: req.user.userId,
            exam: examId,
            removed: { $ne: true },
          });

          if (fallbackSuspension) {
            return res.status(200).json({
              success: true,
              incident,
              suspended: true,
              suspension: fallbackSuspension,
              securitySettings: {
                enableAutoSuspend,
                maxIncidents,
                effectiveMaxIncidents,
              },
              incidentCount,
              suspensionCount: previousSuspensionsCount,
              warning: 'Used existing suspension due to error creating new one',
            });
          }
        } catch (fallbackError) {
          console.error('Error in fallback suspension check:', fallbackError);
        }

        return res.status(500).json({
          success: false,
          message: 'Failed to create suspension',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        // Always release the lock if we acquired it
        if (releaseLock) {
          releaseLock();
        }
      }
    }

    // Return the incident data without suspension
    return res.status(201).json({
      success: true,
      incident,
      suspended: false,
      securitySettings: {
        enableAutoSuspend,
        maxIncidents,
        effectiveMaxIncidents,
      },
      incidentCount,
      warningOnly: enableAutoSuspend === false,
      previousSuspensionsCount,
    });
  } catch (error) {
    console.error('Error creating security incident:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
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
