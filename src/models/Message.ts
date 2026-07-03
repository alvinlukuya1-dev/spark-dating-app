import { Schema, model, Document } from 'mongoose';
import { Types } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  sender: Types.ObjectId; // Reference to User
  receiver: Types.ObjectId; // Reference to User
  content: string;
  mediaUrl?: string; // URL to image/file if any
  type: 'text' | 'image' | 'file';
  isRead: boolean;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  mediaUrl: { type: String },
  type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Index for faster queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
MessageSchema.index({ receiver: 1, isRead: 1 });

export const Message = model<IMessage>('Message', MessageSchema);