const fs = require('fs');
const path = require('path');

// Create .env.local file with Razorpay configuration
const envContent = `# Razorpay Configuration (Live Credentials)
# Replace these with your actual live Razorpay credentials
RAZORPAY_KEY_ID=your_live_key_id_here
RAZORPAY_KEY_SECRET=your_live_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_live_key_id_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/examintelligence

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Admin Configuration
ADMIN_EMAIL=examadmin@gmail.com
ADMIN_PASSWORD=Admin@123
`;

const envPath = path.join(__dirname, '..', '.env.local');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Please update it manually with your Razorpay credentials.');
    console.log('📝 Required variables:');
    console.log('   - RAZORPAY_KEY_ID');
    console.log('   - RAZORPAY_KEY_SECRET');
    console.log('   - RAZORPAY_WEBHOOK_SECRET');
    console.log('   - NEXT_PUBLIC_RAZORPAY_KEY_ID');
  } else {
    // Create .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file');
    console.log('📝 Please update the following variables with your actual Razorpay credentials:');
    console.log('   - RAZORPAY_KEY_ID');
    console.log('   - RAZORPAY_KEY_SECRET');
    console.log('   - RAZORPAY_WEBHOOK_SECRET');
    console.log('   - NEXT_PUBLIC_RAZORPAY_KEY_ID');
  }
  
  console.log('\n🔧 After updating .env.local, restart your server:');
  console.log('   npm run dev');
  
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
}
