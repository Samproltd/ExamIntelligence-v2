#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Subject from '../models/Subject.ts';
import Course from '../models/Course.ts';
import Exam from '../models/Exam.ts';
import Question from '../models/Question.ts';
import Batch from '../models/Batch.ts';

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

// General Knowledge Questions
const generalKnowledgeQuestions = [
  {
    text: 'Which planet is known as the Red Planet?',
    options: [
      { text: 'Mars', isCorrect: true },
      { text: 'Venus', isCorrect: false },
      { text: 'Jupiter', isCorrect: false },
      { text: 'Saturn', isCorrect: false },
    ],
  },
  {
    text: 'Who painted the Mona Lisa?',
    options: [
      { text: 'Leonardo da Vinci', isCorrect: true },
      { text: 'Pablo Picasso', isCorrect: false },
      { text: 'Vincent van Gogh', isCorrect: false },
      { text: 'Michelangelo', isCorrect: false },
    ],
  },
  {
    text: 'What is the largest ocean on Earth?',
    options: [
      { text: 'Pacific Ocean', isCorrect: true },
      { text: 'Atlantic Ocean', isCorrect: false },
      { text: 'Indian Ocean', isCorrect: false },
      { text: 'Arctic Ocean', isCorrect: false },
    ],
  },
  {
    text: 'Which country is known as the Land of the Rising Sun?',
    options: [
      { text: 'Japan', isCorrect: true },
      { text: 'China', isCorrect: false },
      { text: 'Thailand', isCorrect: false },
      { text: 'Korea', isCorrect: false },
    ],
  },
  {
    text: 'Who wrote "Romeo and Juliet"?',
    options: [
      { text: 'William Shakespeare', isCorrect: true },
      { text: 'Charles Dickens', isCorrect: false },
      { text: 'Jane Austen', isCorrect: false },
      { text: 'Mark Twain', isCorrect: false },
    ],
  },
  {
    text: 'What is the chemical symbol for gold?',
    options: [
      { text: 'Au', isCorrect: true },
      { text: 'Ag', isCorrect: false },
      { text: 'Fe', isCorrect: false },
      { text: 'Go', isCorrect: false },
    ],
  },
  {
    text: 'Which animal is known as the King of the Jungle?',
    options: [
      { text: 'Lion', isCorrect: true },
      { text: 'Tiger', isCorrect: false },
      { text: 'Elephant', isCorrect: false },
      { text: 'Gorilla', isCorrect: false },
    ],
  },
  {
    text: 'What is the capital of Australia?',
    options: [
      { text: 'Canberra', isCorrect: true },
      { text: 'Sydney', isCorrect: false },
      { text: 'Melbourne', isCorrect: false },
      { text: 'Perth', isCorrect: false },
    ],
  },
  {
    text: 'Who discovered penicillin?',
    options: [
      { text: 'Alexander Fleming', isCorrect: true },
      { text: 'Louis Pasteur', isCorrect: false },
      { text: 'Marie Curie', isCorrect: false },
      { text: 'Albert Einstein', isCorrect: false },
    ],
  },
  {
    text: 'Which is the tallest mountain in the world?',
    options: [
      { text: 'Mount Everest', isCorrect: true },
      { text: 'K2', isCorrect: false },
      { text: 'Kangchenjunga', isCorrect: false },
      { text: 'Makalu', isCorrect: false },
    ],
  },
];

// Function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = array => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Main seed function
const seedGeneralKnowledgeExam = async () => {
  try {
    await connectDB();

    console.log('🔄 Starting general knowledge exam seeding process...');

    // 1. Create or find General Knowledge subject
    let generalKnowledgeSubject = await Subject.findOne({ name: 'General Knowledge' });

    if (!generalKnowledgeSubject) {
      console.log('📚 Creating General Knowledge subject...');
      generalKnowledgeSubject = await Subject.create({
        name: 'General Knowledge',
        description:
          'General Knowledge covers a wide range of topics including history, geography, science, and culture.',
        createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
      });
    }

    // 2. Create or find Basic General Knowledge course
    let generalKnowledgeCourse = await Course.findOne({
      name: 'Basic General Knowledge',
      subject: generalKnowledgeSubject._id,
    });

    if (!generalKnowledgeCourse) {
      console.log('📚 Creating Basic General Knowledge course...');
      generalKnowledgeCourse = await Course.create({
        name: 'Basic General Knowledge',
        description: 'Fundamental general knowledge concepts and facts covering various subjects.',
        subject: generalKnowledgeSubject._id,
        createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
      });
    }

    // 3. Create the exam
    console.log('📝 Creating General Knowledge Quiz...');
    const generalKnowledgeExam = await Exam.create({
      name: 'General Knowledge Quiz',
      description:
        'Test your general knowledge with 10 questions covering various subjects including science, history, geography, and more.',
      course: generalKnowledgeCourse._id,
      duration: 20, // 20 minutes
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
      generalKnowledgeExam.assignedBatches = batches.map(batch => batch._id);
      await generalKnowledgeExam.save();
    } else {
      console.log(
        "⚠️ No batches found - exam won't be visible to students until assigned to batches."
      );
    }

    // 5. Create general knowledge questions
    console.log('❓ Creating 10 general knowledge questions...');

    // Shuffle the questions to make them appear in random order
    const shuffledQuestions = shuffleArray([...generalKnowledgeQuestions]);

    const questionDocs = shuffledQuestions.map(question => ({
      text: question.text,
      options: question.options,
      exam: generalKnowledgeExam._id,
      createdBy: new ObjectId('000000000000000000000000'), // Admin ID or a valid user ID in your system
    }));

    await Question.insertMany(questionDocs);

    console.log('✅ General knowledge exam seeding completed successfully!');
    console.log('Exam details:');
    console.log(`  - Name: ${generalKnowledgeExam.name}`);
    console.log(`  - ID: ${generalKnowledgeExam._id}`);
    console.log(`  - Questions: 10`);
    console.log(`  - Duration: ${generalKnowledgeExam.duration} minutes`);
    console.log(`  - Pass percentage: ${generalKnowledgeExam.passPercentage}%`);

    // Disconnect from DB
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run the seed function
seedGeneralKnowledgeExam();
