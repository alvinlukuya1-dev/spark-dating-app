import { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
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
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  username: { type: String, required: true, unique: true, minlength: 3 },
  name: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  photos: { type: [String], default: [] },
  birthDate: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other', 'non-binary', 'prefer-not-to-say'] },
  lookingFor: { type: String, enum: ['male', 'female', 'everyone'] },
  location: { type: String },
  interests: { type: [String] },
  lastSeen: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  passes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = model<IUser>('User', UserSchema);