// ExamIntelligence/models/ForgotPasswordOTP.ts
import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IForgotPasswordOTP extends Document {
  user: mongoose.Types.ObjectId;
  otp: string;
  expiry: Date;
}

const ForgotPasswordOTPSchema = new Schema<IForgotPasswordOTP>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  otp: { type: String, required: true },
  expiry: { type: Date, required: true },
});

export const ForgotPasswordOTP: Model<IForgotPasswordOTP> =
  mongoose.models.ForgotPasswordOTP ||
  mongoose.model<IForgotPasswordOTP>('ForgotPasswordOTP', ForgotPasswordOTPSchema);
