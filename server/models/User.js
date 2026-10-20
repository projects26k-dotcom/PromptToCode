import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: {
      type: String,
      default: '',
      trim: true,
    },
    lastName: {
      type: String,
      default: '',
      trim: true,
    },
    username: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    lastSignInAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(' ') || this.username || this.email;
});

// Helper static method to upsert user from Clerk data
userSchema.statics.upsertFromClerk = async function (data) {
  const { clerkId, email, firstName, lastName, username, imageUrl, lastSignInAt, metadata } = data;

  if (!clerkId) {
    throw new Error('clerkId is required to upsert user');
  }

  const updateFields = {
    updatedAt: new Date(),
  };

  if (email) updateFields.email = email;
  if (firstName !== undefined) updateFields.firstName = firstName;
  if (lastName !== undefined) updateFields.lastName = lastName;
  if (username !== undefined) updateFields.username = username;
  if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
  if (lastSignInAt) updateFields.lastSignInAt = new Date(lastSignInAt);
  if (metadata) updateFields.metadata = metadata;

  const user = await this.findOneAndUpdate(
    { clerkId },
    {
      $set: updateFields,
      $setOnInsert: {
        clerkId,
        createdAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return user;
};

export const User = mongoose.model('User', userSchema);
