#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Subject } from '../models/Subject.js';
import { Course } from '../models/Course.js';
import { Exam } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { Batch } from '../models/Batch.js';

// Initialize environment variables
dotenv.config();

/**
 * Generate a math question with multiple choice options
 * @param {number} index - Question index
 * @returns {Object} - Question object
 */
function generateMathQuestion(index) {
  // Generate random numbers between 1 and 20
  const num1 = Math.floor(Math.random() * 20) + 1;
  const num2 = Math.floor(Math.random() * 20) + 1;

  // Choose a random operation (addition, subtraction, multiplication)
  const operations = ['+', '-', '×'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let question, answer, explanation;

  // Generate question and answer based on the operation
  switch (operation) {
    case '+':
      question = `${num1} + ${num2} = ?`;
      answer = num1 + num2;
      explanation = `To solve ${num1} + ${num2}, we add the numbers directly: ${num1} + ${num2} = ${answer}`;
      break;
    case '-':
      // Ensure the subtraction result is positive
      const largerNum = Math.max(num1, num2);
      const smallerNum = Math.min(num1, num2);
      question = `${largerNum} - ${smallerNum} = ?`;
      answer = largerNum - smallerNum;
      explanation = `To solve ${largerNum} - ${smallerNum}, we subtract the smaller number from the larger: ${largerNum} - ${smallerNum} = ${answer}`;
      break;
    case '×':
      question = `${num1} × ${num2} = ?`;
      answer = num1 * num2;
      explanation = `To solve ${num1} × ${num2}, we multiply the numbers: ${num1} × ${num2} = ${answer}`;
      break;
  }

  // Generate options for multiple choice (including the correct answer)
  const options = [answer];

  // Generate 3 additional incorrect options
  while (options.length < 4) {
    // Generate a random offset between -10 and +10, but not 0
    let offset = Math.floor(Math.random() * 20) - 10;
    if (offset === 0) offset = 1;

    const option = answer + offset;

    // Ensure the option is positive and not already included
    if (option > 0 && !options.includes(option)) {
      options.push(option);
    }
  }

  // Shuffle the options
  const shuffledOptions = options.sort(() => Math.random() - 0.5);

  return {
    text: question,
    options: shuffledOptions.map(opt => ({ text: opt.toString(), isCorrect: opt === answer })),
    answer: answer.toString(),
    explanation,
    marks: 1,
    type: 'MULTIPLE_CHOICE',
    index,
  };
}

/**
 * Create a general math test with 10 basic calculation questions
 */
async function createGeneralMathTest() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Find or create Mathematics subject
    let subject = await Subject.findOne({ name: 'Mathematics' });
    if (!subject) {
      subject = await Subject.create({ name: 'Mathematics' });
      console.log('Created Mathematics subject');
    } else {
      console.log('Found existing Mathematics subject');
    }

    // Find or create General Math course
    let course = await Course.findOne({ name: 'General Math', subject: subject._id });
    if (!course) {
      course = await Course.create({
        name: 'General Math',
        subject: subject._id,
        description: 'Basic mathematics calculations',
      });
      console.log('Created General Math course');
    } else {
      console.log('Found existing General Math course');
    }

    // Create a new exam
    const exam = await Exam.create({
      title: 'Basic Calculations Test',
      course: course._id,
      duration: 10, // 10 minutes
      totalMarks: 10,
      description: 'Test your basic math calculation skills',
      instructions: 'Answer all questions. Each question carries 1 mark.',
    });

    console.log(`Created exam: ${exam.title}`);

    // Optional: Associate exam with a batch
    // const batch = await Batch.findOne({ name: 'Your Batch Name' });
    // if (batch) {
    //   batch.exams.push(exam._id);
    //   await batch.save();
    //   console.log(`Associated exam with batch: ${batch.name}`);
    // }

    // Generate and create questions
    const questions = [];
    for (let i = 0; i < 10; i++) {
      const questionData = generateMathQuestion(i + 1);
      questions.push({
        ...questionData,
        exam: exam._id,
      });
    }

    // Save all questions to the database
    await Question.insertMany(questions);

    console.log(`Created ${questions.length} math questions`);

    // Close the database connection
    await mongoose.connection.close();
    console.log('General math test created successfully!');
  } catch (error) {
    console.error('Error creating general math test:', error);
    // Ensure the connection is closed even if there's an error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Execute the main function
createGeneralMathTest().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
