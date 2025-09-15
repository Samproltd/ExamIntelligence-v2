import mongoose, { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';

/**
 * Utility functions to handle MongoDB operations with proper TypeScript typing
 */

/**
 * Find a document by ID
 */
export async function findById<T extends Document, K = T>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  options?: QueryOptions
): Promise<(T & K) | null> {
  return model.findById(id, null, options) as unknown as Promise<(T & K) | null>;
}

/**
 * Find one document matching a filter
 */
export async function findOne<T extends Document, K = T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  projection?: any,
  options?: QueryOptions
): Promise<(T & K) | null> {
  // If projection is a string starting with '+', it's a select statement
  if (typeof projection === 'string' && projection.startsWith('+')) {
    return model.findOne(filter).select(projection) as unknown as Promise<(T & K) | null>;
  }
  return model.findOne(filter, projection, options) as unknown as Promise<(T & K) | null>;
}

/**
 * Find multiple documents matching a filter
 */
export async function find<T extends Document, K = T>(
  model: Model<T>,
  filter: FilterQuery<T>,
  projection?: any,
  options?: QueryOptions
): Promise<(T & K)[]> {
  return model.find(filter, projection, options) as unknown as Promise<(T & K)[]>;
}

/**
 * Create a new document
 */
export async function create<T extends Document, K = T>(
  model: Model<T>,
  data: Record<string, any> | Record<string, any>[]
): Promise<(T & K) | (T & K)[]> {
  return model.create(data) as unknown as Promise<(T & K) | (T & K)[]>;
}

/**
 * Update a document by ID
 */
export async function findByIdAndUpdate<T extends Document, K = T>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  update: UpdateQuery<T>,
  options?: QueryOptions
): Promise<(T & K) | null> {
  return model.findByIdAndUpdate(id, update, options) as unknown as Promise<(T & K) | null>;
}

/**
 * Update one document matching a filter
 */
export async function updateOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options?: any
): Promise<mongoose.UpdateWriteOpResult> {
  return model.updateOne(filter, update, options);
}

/**
 * Delete a document by ID
 */
export async function findByIdAndDelete<T extends Document, K = T>(
  model: Model<T>,
  id: string | mongoose.Types.ObjectId,
  options?: QueryOptions
): Promise<(T & K) | null> {
  return model.findByIdAndDelete(id, options) as unknown as Promise<(T & K) | null>;
}

/**
 * Delete one document matching a filter
 */
export async function deleteOne<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: any
): Promise<mongoose.DeleteResult> {
  return model.deleteOne(filter, options);
}

/**
 * Count documents matching a filter
 */
export async function countDocuments<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>
): Promise<number> {
  return model.countDocuments(filter);
}

/**
 * Get distinct values for a field
 */
export async function distinct<T extends Document>(
  model: Model<T>,
  field: string,
  filter?: FilterQuery<T>
): Promise<any[]> {
  return model.distinct(field, filter) as unknown as Promise<any[]>;
}

/**
 * Delete multiple documents matching a filter
 */
export async function deleteMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  options?: any
): Promise<mongoose.DeleteResult> {
  return model.deleteMany(filter, options);
}

/**
 * Update multiple documents matching a filter
 */
export async function updateMany<T extends Document>(
  model: Model<T>,
  filter: FilterQuery<T>,
  update: UpdateQuery<T>,
  options?: any
): Promise<mongoose.UpdateWriteOpResult> {
  return model.updateMany(filter, update, options);
}
