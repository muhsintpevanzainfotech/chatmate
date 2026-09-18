import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    usernameNormalized: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      index: true,
    },
    gender: {
      type: String,
      enum: ['female', 'male', 'other'],
      required: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      index: true,
    },
    state: {
      type: String,
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    ageVerified: {
      type: Boolean,
      default: true,
      required: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    publicKey: {
      type: String,
      default: '',
    },
    privacySettings: {
      discoverable: { type: Boolean, default: true, index: true },
      showOnlineStatus: { type: Boolean, default: true },
      allowMessages: { type: String, enum: ['everyone', 'blocked_none'], default: 'everyone' },
      allowCalls: { type: String, enum: ['everyone', 'blocked_none'], default: 'everyone' },
      allowVideoCalls: { type: String, enum: ['everyone', 'blocked_none'], default: 'everyone' },
      showPlace: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ accountStatus: 1, ageVerified: 1, 'privacySettings.discoverable': 1 });
userSchema.index({ gender: 1, state: 1, district: 1 });

userSchema.methods.toPublicJSON = function (includePlace = true) {
  return {
    _id: this._id,
    username: this.username,
    gender: this.gender,
    country: includePlace && this.privacySettings?.showPlace ? this.country : null,
    state: includePlace && this.privacySettings?.showPlace ? this.state : null,
    district: includePlace && this.privacySettings?.showPlace ? this.district : null,
    publicKey: this.publicKey || '',
    showOnlineStatus: this.privacySettings?.showOnlineStatus ?? true,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
