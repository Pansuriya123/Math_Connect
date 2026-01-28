const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    cleanupDefaultPhotos();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function cleanupDefaultPhotos() {
  try {
    // Find users with the old default photo URL
    const oldDefaultUrl = 'https://live.staticflickr.com/7631/26849088292_36fc52ee90_b.jpg';
    
    const usersWithDefaultPhoto = await User.find({ 
      profile_photo: oldDefaultUrl 
    });
    
    console.log(`Found ${usersWithDefaultPhoto.length} users with old default photo`);
    
    if (usersWithDefaultPhoto.length > 0) {
      // Update these users to have null profile_photo
      const result = await User.updateMany(
        { profile_photo: oldDefaultUrl },
        { $unset: { profile_photo: 1 } }
      );
      
      console.log(`Updated ${result.modifiedCount} users to remove default photo`);
      console.log('Users will now show initials instead of default photo');
    } else {
      console.log('No users found with old default photo');
    }
    
    // Also clean up any empty string profile photos
    const usersWithEmptyPhoto = await User.find({
      $or: [
        { profile_photo: '' },
        { profile_photo: null }
      ]
    });
    
    console.log(`Found ${usersWithEmptyPhoto.length} users with empty/null profile photos`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up default photos:', error);
    process.exit(1);
  }
}



