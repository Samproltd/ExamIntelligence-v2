const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/examintelligence');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Subscription Plan Schema (updated)
const SubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [100, 'Plan name cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 month'],
    max: [999, 'Duration cannot exceed 999 months'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  features: [
    {
      type: String,
      trim: true,
      maxlength: [200, 'Feature description cannot be more than 200 characters'],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  colleges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
  }],
}, {
  timestamps: true,
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);
const College = mongoose.model('College', new mongoose.Schema({
  name: String,
  code: String,
  address: String,
  contactEmail: String,
  isActive: Boolean,
}));

const migrateSubscriptionPlans = async () => {
  try {
    console.log('Starting subscription plans migration...');

    // Get all existing subscription plans
    const plans = await SubscriptionPlan.find({});
    console.log(`Found ${plans.length} subscription plans to migrate`);

    // Get the default college (or first college)
    const defaultCollege = await College.findOne({ isActive: true });
    if (!defaultCollege) {
      console.log('No active college found. Creating a default college...');
      const newCollege = new College({
        name: 'Default College',
        code: 'DEFAULT',
        address: 'Default Address',
        contactEmail: 'admin@default.com',
        isActive: true,
      });
      await newCollege.save();
      console.log('Default college created');
    }

    const collegeId = defaultCollege ? defaultCollege._id : (await College.findOne())._id;

    // Migrate each plan
    for (const plan of plans) {
      console.log(`Migrating plan: ${plan.name}`);
      
      // If plan has old 'college' field, migrate it to 'colleges' array
      if (plan.college && !plan.colleges) {
        plan.colleges = [plan.college];
        delete plan.college;
        await plan.save();
        console.log(`  - Migrated college field to colleges array`);
      } else if (!plan.colleges || plan.colleges.length === 0) {
        // If no colleges assigned, assign to default college
        plan.colleges = [collegeId];
        await plan.save();
        console.log(`  - Assigned to default college`);
      } else {
        console.log(`  - Already has colleges assigned`);
      }
    }

    console.log('Migration completed successfully!');
    console.log(`Migrated ${plans.length} subscription plans`);

  } catch (error) {
    console.error('Migration error:', error);
  }
};

const main = async () => {
  await connectDB();
  await migrateSubscriptionPlans();
  await mongoose.connection.close();
  console.log('Database connection closed');
};

main().catch(console.error);
