import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "../../../utils/auth";
import dbConnect from "../../../utils/db";
import Setting, { initializeDefaultSettings } from "../../../models/Setting";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();

    // Initialize default settings if they don't exist
    await initializeDefaultSettings();
    console.log("Database connected and default settings initialized");

    // GET request - retrieve all settings
    if (req.method === "GET") {
      try {
        const settings = await Setting.find().sort({ key: 1 });
        console.log("Retrieved settings:", settings);

        return res.status(200).json({
          success: true,
          settings,
        });
      } catch (error) {
        console.error("Error fetching settings:", error);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
    }

    // PUT request - update a single setting
    else if (req.method === "PUT") {
      try {
        const { key, value } = req.body;

        if (!key) {
          return res
            .status(400)
            .json({ success: false, message: "Setting key is required" });
        }

        if (value === undefined || value === null) {
          return res
            .status(400)
            .json({ success: false, message: "Setting value is required" });
        }

        console.log(
          `Updating setting: ${key} to value: ${value} (${typeof value})`
        );

        // Make sure we process the value based on the key
        let processedValue = value;

        // Handle specific key types
        if (key === "security.maxIncidents") {
          processedValue = Number(value);
        } else if (key === "security.enableAutoSuspend") {
          // Ensure boolean value
          processedValue = value === true || value === "true";
        }

        // Find and update the setting
        const updatedSetting = await Setting.findOneAndUpdate(
          { key },
          {
            value: processedValue,
            updatedBy: req.user.userId,
            updatedAt: new Date(),
          },
          { new: true, upsert: true } // Create if it doesn't exist
        );

        if (!updatedSetting) {
          return res
            .status(404)
            .json({ success: false, message: "Setting not found" });
        }

        console.log(`Setting updated:`, updatedSetting);

        return res.status(200).json({
          success: true,
          setting: updatedSetting,
        });
      } catch (error) {
        console.error("Error updating setting:", error);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
    }

    // Method not allowed
    else {
      return res
        .status(405)
        .json({ success: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error in handler:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Only allow admin access
export default requireAdmin(handler);
