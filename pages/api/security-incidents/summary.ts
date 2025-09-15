import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "../../../utils/db";
import SecurityIncident from "../../../models/SecurityIncident";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await dbConnect();

    // Verify admin access
    if (req.method !== "GET") {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }

    // Get total count of incidents
    const totalIncidents = await SecurityIncident.countDocuments({});

    // If there are no incidents, return an empty summary structure
    if (totalIncidents === 0) {
      return res.status(200).json({
        success: true,
        summary: {
          totalIncidents: 0,
          studentsWithIncidents: 0,
          examsWithIncidents: 0,
          incidentsByType: [],
          studentsWithMostIncidents: [],
          recentIncidents: [],
        },
      });
    }

    // Get unique students with incidents
    const uniqueStudentsCount = await SecurityIncident.distinct("student").then(
      (students) => students.length
    );

    // Get unique exams with incidents
    const uniqueExamsCount = await SecurityIncident.distinct("exam").then(
      (exams) => exams.length
    );

    // Get incidents grouped by type
    const incidentsByType = await SecurityIncident.aggregate([
      { $group: { _id: "$incidentType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get students with most incidents
    const studentsWithMostIncidents = await SecurityIncident.aggregate([
      { $group: { _id: "$student", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
    ]);

    // Get recent incidents
    const recentIncidents = await SecurityIncident.find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .populate("student", "name firstName lastName email batch")
      .populate("exam", "name")
      .populate({
        path: "student",
        populate: {
          path: "batch",
          select: "name",
        },
      });

    const summary = {
      totalIncidents,
      studentsWithIncidents: uniqueStudentsCount,
      examsWithIncidents: uniqueExamsCount,
      incidentsByType,
      studentsWithMostIncidents,
      recentIncidents,
    };

    res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("Error fetching security incidents summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch security incidents summary",
    });
  }
}
