import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect, { preloadModels } from '../../../utils/db';
import Question from '../../../models/Question';
import { verifyToken } from '../../../utils/auth';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  await preloadModels();

  if (req.method === 'GET') {
    return await getCategories(req, res);
  }

  if (req.method === 'DELETE') {
    return await deleteCategory(req, res);
  }

  if (req.method === 'PUT') {
    return await updateCategory(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getCategories(req: NextApiRequest, res: NextApiResponse) {
  try {
    const categories = await (Question as any).aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          latestQuestion: { $max: '$createdAt' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const formattedCategories = categories.map((cat: any) => ({
      name: cat._id,
      questionCount: cat.count,
      latestQuestion: cat.latestQuestion
    }));

    return res.status(200).json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching categories',
    });
  }
}

// Helper function to authenticate and get decoded token
async function authenticateUser(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return null;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return null;
  }

  return decoded;
}

async function updateCategory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { oldCategory, newCategory } = req.body;

    if (!oldCategory || !newCategory) {
      return res.status(400).json({
        success: false,
        message: 'Both old and new category names are required',
      });
    }

    if (oldCategory.trim() === newCategory.trim()) {
      return res.status(400).json({
        success: false,
        message: 'New category name must be different from the old one',
      });
    }

    // Check if new category already exists
    const existingCategory = await (Question as any).findOne({ category: newCategory.trim() });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name already exists',
      });
    }

    // Update all questions with the old category to the new category
    const result = await (Question as any).updateMany(
      { category: oldCategory },
      { category: newCategory.trim() }
    );

    return res.status(200).json({
      success: true,
      message: `Category renamed successfully. ${result.modifiedCount} questions updated.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message,
    });
  }
}

async function deleteCategory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decoded = await authenticateUser(req, res);
    if (!decoded) return;

    const { category } = req.query;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    // Check if category exists
    const categoryExists = await (Question as any).findOne({ category });
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Count questions in this category
    const questionCount = await (Question as any).countDocuments({ category });

    // Delete all questions in this category
    const result = await (Question as any).deleteMany({ category });

    return res.status(200).json({
      success: true,
      message: `Category and ${result.deletedCount} questions deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message,
    });
  }
}

export default handler;
