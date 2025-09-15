// Seed script to create a basic math calculations exam with 10 questions
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/Subject.js';
import Course from '../models/Course.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';
import Batch from '../models/Batch.js';

// Initialize environment variables
dotenv.config();
const { ObjectId } = mongoose.Types;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Generate a random math calculation question
const generateMathQuestion = index => {
  const operations = ['+', '-', '*', '/'];
  const operation = operations[Math.floor(Math.random() * 3)]; // Exclude division for simplicity

  let num1, num2, answer, questionText;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      questionText = `Calculate: ${num1} + ${num2}`;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 30; // Ensure positive result
      num2 = Math.floor(Math.random() * 30) + 1;
      answer = num1 - num2;
      questionText = `Calculate: ${num1} - ${num2}`;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1; // Keep multiplication simple
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      questionText = `Calculate: ${num1} × ${num2}`;
      break;
    case '/':
      num2 = Math.floor(Math.random() * 10) + 1;
      answer = Math.floor(Math.random() * 10) + 1;
      num1 = num2 * answer; // Ensure clean division
      questionText = `Calculate: ${num1} ÷ ${num2}`;
      break;
  }

  // Generate 3 incorrect options
  const incorrectOptions = [];
  while (incorrectOptions.length < 3) {
    // Generate an incorrect answer within a reasonable range
    const offset = Math.floor(Math.random() * 10) + 1;
    const incorrectAnswer = Math.random() > 0.5 ? answer + offset : Math.max(1, answer - offset);

    // Ensure no duplicates
    if (!incorrectOptions.includes(incorrectAnswer) && incorrectAnswer !== answer) {
      incorrectOptions.push(incorrectAnswer);
    }
  }

  // Create options array with correct and incorrect answers
  const options = [
    { text: answer.toString(), isCorrect: true },
    { text: incorrectOptions[0].toString(), isCorrect: false },
    { text: incorrectOptions[1].toString(), isCorrect: false },
    { text: incorrectOptions[2].toString(), isCorrect: false },
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    text: questionText,
    options: options,
  };
};

// Main seed function
const seedMathExam = async () => {
  try {
    await connectDB();

    console.log('🔄 Starting math exam seeding process...');

    // 1. Create or find Mathematics subject
    let mathSubject = await Subject.findOne({ name: 'Mathematics' });

    if (!mathSubject) {
      console.log('📚 Creating Mathematics subject...');
      mathSubject = await Subject.create({
        name: 'Mathematics',
        description: 'Mathematics subject covering arithmetic, algebra, geometry, and more.',
        createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
      });
    }

    // 2. Create or find Basic Math course
    let basicMathCourse = await Course.findOne({
      name: 'Basic Mathematics',
      subject: mathSubject._id,
    });

    if (!basicMathCourse) {
      console.log('📚 Creating Basic Mathematics course...');
      basicMathCourse = await Course.create({
        name: 'Basic Mathematics',
        description: 'Fundamental mathematics operations and concepts for beginners.',
        subject: mathSubject._id,
        createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
      });
    }

    // 3. Create the exam
    console.log('📝 Creating Math Calculations exam...');
    const mathExam = await Exam.create({
      name: 'Basic Math Calculations',
      description:
        'Test your skills with 10 basic math calculation problems including addition, subtraction, and multiplication.',
      course: basicMathCourse._id,
      duration: 15, // 15 minutes
      totalMarks: 10,
      passPercentage: 60,
      totalQuestions: 10,
      questionsToDisplay: 10,
      maxAttempts: 3,
      createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
    });

    // 4. Find all batches to assign the exam to
    const batches = await Batch.find({});
    if (batches.length > 0) {
      console.log(`📋 Assigning exam to ${batches.length} batches...`);
      mathExam.assignedBatches = batches.map(batch => batch._id);
      await mathExam.save();
    } else {
      console.log(
        "⚠️ No batches found - exam won't be visible to students until assigned to batches."
      );
    }

    // 5. Create 10 math calculation questions
    console.log('❓ Creating 10 math questions...');
    const questions = [];

    for (let i = 0; i < 10; i++) {
      const question = generateMathQuestion(i);
      questions.push({
        text: question.text,
        options: question.options,
        exam: mathExam._id,
        createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
      });
    }

    await Question.insertMany(questions);

    console.log('✅ Math exam seeding completed successfully!');
    console.log('Exam details:');
    console.log(`  - Name: ${mathExam.name}`);
    console.log(`  - ID: ${mathExam._id}`);
    console.log(`  - Questions: 10`);
    console.log(`  - Duration: ${mathExam.duration} minutes`);
    console.log(`  - Pass percentage: ${mathExam.passPercentage}%`);

    // Disconnect from DB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seed function
seedMathExam();
