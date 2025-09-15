# Mongoose Utilities

This directory contains utility functions that help standardize Mongoose operations across the codebase while properly handling TypeScript type issues.

## Using mongooseUtils

The `mongooseUtils.ts` file provides type-safe wrappers around common Mongoose operations. Instead of directly using Mongoose methods on model objects, use these utility functions to ensure TypeScript compatibility.

### Example: Before

```typescript
// TypeScript error prone:
const user = await User.findOne({ email });
const newUser = await User.create(userData);
```

### Example: After

```typescript
import * as mongooseUtils from "../utils/mongooseUtils";

// TypeScript safe:
const user = await mongooseUtils.findOne(User, { email });
const newUser = await mongooseUtils.create(User, userData);
```

## Type Safety

These utilities provide improved TypeScript handling by supporting a second generic type parameter to help with document properties:

```typescript
// Define your interface
interface IUser {
  name: string;
  email: string;
  role: string;
}

// Pass it as the second type parameter
const user = await mongooseUtils.findById<UserDocument, IUser>(User, userId);

// Now you can access properties directly without type assertions
console.log(user.name); // TypeScript recognizes this property
```

## Available Functions

- `findById<T, K>(model, id, options?)` - Find a document by ID
- `findOne<T, K>(model, filter, projection?, options?)` - Find one document with filters
- `find<T, K>(model, filter, projection?, options?)` - Find multiple documents
- `create<T, K>(model, data)` - Create one or more documents
- `findByIdAndUpdate<T, K>(model, id, update, options?)` - Update a document by ID
- `updateOne<T>(model, filter, update, options?)` - Update one document
- `findByIdAndDelete<T, K>(model, id, options?)` - Delete a document by ID
- `deleteOne<T>(model, filter, options?)` - Delete one document
- `countDocuments<T>(model, filter)` - Count documents matching a filter
- `distinct<T>(model, field, filter?)` - Get distinct values for a field

## Why Use These Utilities?

- Solves TypeScript compatibility issues with Mongoose
- Centralizes type assertions in one place
- Provides consistent API across the codebase
- Makes Mongoose operations more maintainable
- Adds better type safety with generic type parameters
