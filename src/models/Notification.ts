import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  user: Types.ObjectId;
  from: Types.ObjectId;
  type: 'match' | 'message' | 'like';
  referenceId?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['match', 'message', 'like'], required: true },
  referenceId: { type: String },
  read: { type: Boolean, default: false }
}, { timestamps: true });

NotificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', NotificationSchema);
