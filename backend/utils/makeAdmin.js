import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const usernameInput = process.argv[2];

if (!usernameInput) {
  console.log('❌ Usage: node utils/makeAdmin.js <username>');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/privacy_dating';

async function grantAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    const usernameNormalized = usernameInput.trim().toLowerCase();

    const user = await User.findOne({ usernameNormalized });
    if (!user) {
      console.log(`❌ User with username "${usernameInput}" not found.`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`✅ Success! User "${user.username}" has been granted administrator role.`);
    console.log(`🔑 Navigate to http://localhost:5173/admin or click the "Admin" badge in the navbar.`);
    process.exit(0);
  } catch (err) {
    console.error('Error granting admin role:', err.message);
    process.exit(1);
  }
}

grantAdmin();
