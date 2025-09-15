import mongoose from "mongoose";

export interface ISetting extends mongoose.Document {
  key: string;
  value: any;
  description: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to update the updatedAt timestamp
SettingSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Register the model
let Setting;
if (mongoose.models && mongoose.models.Setting) {
  Setting = mongoose.models.Setting;
} else if (mongoose.modelNames().includes("Setting")) {
  Setting = mongoose.model("Setting");
} else {
  Setting = mongoose.model<ISetting>("Setting", SettingSchema);
}

// Default settings initialization function
export const initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: "security.maxIncidents",
      value: 5,
      description:
        "Maximum number of security incidents allowed before an exam is automatically suspended",
    },
    {
      key: "security.enableAutoSuspend",
      value: true,
      description:
        "Enable automatic suspension of exams when security incidents exceed the threshold",
    },
  ];

  console.log("Initializing default settings if needed");

  for (const setting of defaultSettings) {
    try {
      // Check if the setting exists
      const existingSetting = await Setting.findOne({ key: setting.key });

      if (!existingSetting) {
        console.log(`Creating default setting for ${setting.key}:`, setting);
        await Setting.create(setting);
      } else {
        console.log(
          `Default setting ${setting.key} already exists:`,
          existingSetting
        );
      }
    } catch (error) {
      console.error(`Error initializing setting ${setting.key}:`, error);
    }
  }
};

export default Setting;
