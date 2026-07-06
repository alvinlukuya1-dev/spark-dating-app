import { Schema, model, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  firebaseUid: string;
  email: string;
  username: string;
  name: string;
  // Profile fields
  bio?: string;
  photos: string[]; // URLs to photos
  birthDate?: Date;
  gender?: string;
  lookingFor?: string; // e.g., 'men', 'women', 'everyone'
  location?: string;
  interests?: string[];
  // Email verification
  emailVerified?: boolean;
  // Activity
  lastSeen: Date;
  isActive: boolean;
  likes: Types.ObjectId[];
  passes: Types.ObjectId[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, minlength: 3 },
  name: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  photos: { type: [String], default: [] },
  birthDate: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'non-binary', 'prefer-not-to-say'] },
  lookingFor: { type: String, enum: ['male', 'female', 'everyone'] },
  location: { type: String },
  interests: { type: [String] },
  emailVerified: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  passes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});



export const User = model<IUser>('User', UserSchema);