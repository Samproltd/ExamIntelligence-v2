import { read, utils, WorkSheet } from "xlsx";

interface StudentData {
  name: string; // For backward compatibility
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  rollNumber?: string;
  mobile?: string;
  dateOfBirth?: string;
}

interface QuestionData {
  text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOption: number;
}

interface CellError {
  cell: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  data?: StudentData[] | QuestionData[];
  errors?: Array<{
    row: number;
    errors: string[];
    cells?: CellError[];
  }>;
}

/**
 * Gets Excel column letter from index
 */
const getColumnLetter = (index: number): string => {
  let temp;
  let letter = "";
  while (index > 0) {
    temp = (index - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    index = (index - temp - 1) / 26;
  }
  return letter;
};

/**
 * Get cell reference (e.g., "A2", "B3")
 */
const getCellRef = (col: number, row: number): string => {
  return `${getColumnLetter(col)}${row}`;
};

/**
 * Validates student data from an Excel file
 * @param buffer Excel file buffer
 * @returns Validation result with data or errors
 */
export const validateStudentExcel = (buffer: Buffer): ValidationResult => {
  try {
    // Read the workbook from buffer
    const workbook = read(buffer);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = utils.sheet_to_json(worksheet) as Record<string, any>[];

    // No data
    if (!rawData || rawData.length === 0) {
      return {
        valid: false,
        errors: [
          {
            row: 0,
            errors: [
              "The file contains no data. Please add student information to the file.",
            ],
            cells: [
              {
                cell: "A1-G1",
                message:
                  "Expected headers: firstName, lastName, email, password, mobile, dateOfBirth, rollNumber",
              },
            ],
          },
        ],
      };
    }

    // Map for column indexes - used for error reporting
    const columnMap: Record<string, number> = {
      firstName: 1,
      lastName: 2,
      email: 3,
      password: 4,
      mobile: 5,
      dateOfBirth: 6,
      rollNumber: 7,
    };

    // Validate required headers
    const requiredHeaders = ["firstName", "lastName", "email", "password"];
    const optionalHeaders = ["mobile", "dateOfBirth", "rollNumber"];
    const headers = Object.keys(rawData[0]).map((h) => h.toLowerCase());

    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.some((header) => header.toLowerCase() === h.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      // Get cell references for missing headers
      const headerCells: CellError[] = missingHeaders.map((header) => {
        const headerIndex = columnMap[header] || 1; // Default to 1 if not found
        return {
          cell: getCellRef(headerIndex, 1),
          message: `Missing header: ${header}`,
        };
      });

      return {
        valid: false,
        errors: [
          {
            row: 1,
            errors: [
              `Missing required column headers: ${missingHeaders.join(
                ", "
              )}. Do not modify the column headers.`,
            ],
            cells: headerCells,
          },
        ],
      };
    }

    // Validate each row
    const validatedData: StudentData[] = [];
    const errors: { row: number; errors: string[]; cells: CellError[] }[] = [];
    const emails = new Set<string>();

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of 0-indexing and header row
      const rowErrors: string[] = [];
      const cellErrors: CellError[] = [];

      // Validate firstName
      const firstName = row.firstName?.toString().trim();
      if (!firstName) {
        rowErrors.push("First name is required");
        cellErrors.push({
          cell: getCellRef(columnMap["firstName"], rowNumber),
          message: "First name is required",
        });
      } else if (firstName.length > 25) {
        rowErrors.push("First name cannot be more than 25 characters");
        cellErrors.push({
          cell: getCellRef(columnMap["firstName"], rowNumber),
          message: "First name cannot be more than 25 characters",
        });
      }

      // Validate lastName
      const lastName = row.lastName?.toString().trim();
      if (!lastName) {
        rowErrors.push("Last name is required");
        cellErrors.push({
          cell: getCellRef(columnMap["lastName"], rowNumber),
          message: "Last name is required",
        });
      } else if (lastName.length > 25) {
        rowErrors.push("Last name cannot be more than 25 characters");
        cellErrors.push({
          cell: getCellRef(columnMap["lastName"], rowNumber),
          message: "Last name cannot be more than 25 characters",
        });
      }

      // Validate email
      const email = row.email?.toString().trim().toLowerCase();
      if (!email) {
        rowErrors.push("Email is required");
        cellErrors.push({
          cell: getCellRef(columnMap["email"], rowNumber),
          message: "Email is required",
        });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        rowErrors.push("Invalid email format");
        cellErrors.push({
          cell: getCellRef(columnMap["email"], rowNumber),
          message: "Invalid email format",
        });
      } else if (emails.has(email)) {
        rowErrors.push(`Duplicate email: ${email}`);
        cellErrors.push({
          cell: getCellRef(columnMap["email"], rowNumber),
          message: "Duplicate email in the uploaded file",
        });
      } else {
        emails.add(email);
      }

      // Validate password
      const password = row.password?.toString();
      if (!password) {
        rowErrors.push("Password is required");
        cellErrors.push({
          cell: getCellRef(columnMap["password"], rowNumber),
          message: "Password is required",
        });
      } else if (password.length < 6) {
        rowErrors.push("Password must be at least 6 characters");
        cellErrors.push({
          cell: getCellRef(columnMap["password"], rowNumber),
          message: "Password must be at least 6 characters",
        });
      }

      // Validate mobile (optional)
      const mobile = row.mobile?.toString().trim();
      if (mobile && mobile.length > 15) {
        rowErrors.push("Mobile number cannot be more than 15 characters");
        cellErrors.push({
          cell: getCellRef(columnMap["mobile"], rowNumber),
          message: "Mobile number cannot be more than 15 characters",
        });
      }

      // Validate date of birth (optional)
      const dateOfBirth = row.dateOfBirth?.toString().trim();
      if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
        rowErrors.push("Date of birth should be in YYYY-MM-DD format");
        cellErrors.push({
          cell: getCellRef(columnMap["dateOfBirth"], rowNumber),
          message: "Use YYYY-MM-DD format",
        });
      }

      // Validate roll number (optional)
      const rollNumber = row.rollNumber?.toString().trim();
      if (rollNumber && rollNumber.length > 20) {
        rowErrors.push("Roll number cannot be more than 20 characters");
        cellErrors.push({
          cell: getCellRef(columnMap["rollNumber"], rowNumber),
          message: "Roll number cannot be more than 20 characters",
        });
      }

      // Add errors if any
      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
          cells: cellErrors,
        });
      } else {
        // Create combined name for backward compatibility
        const name = `${firstName} ${lastName}`.trim();

        // Add valid student data
        validatedData.push({
          name,
          firstName,
          lastName,
          email,
          password,
          ...(mobile ? { mobile } : {}),
          ...(dateOfBirth ? { dateOfBirth } : {}),
          ...(rollNumber ? { rollNumber } : {}),
        });
      }
    });

    // Return validation result
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      data: validatedData,
    };
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return {
      valid: false,
      errors: [
        {
          row: 0,
          errors: [
            "Failed to parse Excel file. Please make sure it's a valid .xlsx file and contains the correct headers.",
          ],
        },
      ],
    };
  }
};

/**
 * Validates question data from an Excel file
 * @param buffer Excel file buffer
 * @returns Validation result with data or errors
 */
export const validateQuestionsExcel = (buffer: Buffer): ValidationResult => {
  try {
    // Read the workbook from buffer
    const workbook = read(buffer);

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = utils.sheet_to_json(worksheet) as Record<string, any>[];

    // No data
    if (!rawData || rawData.length === 0) {
      return {
        valid: false,
        errors: [
          {
            row: 0,
            errors: [
              "The file contains no data. Please add question information to the file.",
            ],
            cells: [
              {
                cell: "A1-F1",
                message:
                  "Expected headers: text, option1, option2, option3, option4, correctOption",
              },
            ],
          },
        ],
      };
    }

    // Map for column indexes
    const columnMap = {
      text: 1,
      option1: 2,
      option2: 3,
      option3: 4,
      option4: 5,
      correctOption: 6,
    };

    // Validate required headers
    const requiredHeaders = [
      "text",
      "option1",
      "option2",
      "option3",
      "option4",
      "correctOption",
    ];
    const headers = Object.keys(rawData[0]).map((h) => h.toLowerCase());

    const missingHeaders = requiredHeaders.filter(
      (h) => !headers.some((header) => header.toLowerCase() === h.toLowerCase())
    );

    if (missingHeaders.length > 0) {
      // Get cell references for missing headers
      const headerCells: CellError[] = missingHeaders.map((header) => {
        const colIndex = columnMap[header as keyof typeof columnMap];
        return {
          cell: getCellRef(colIndex, 1),
          message: `Missing header: ${header}`,
        };
      });

      return {
        valid: false,
        errors: [
          {
            row: 1,
            errors: [
              `Missing required column headers: ${missingHeaders.join(
                ", "
              )}. Do not modify the column headers.`,
            ],
            cells: headerCells,
          },
        ],
      };
    }

    // Validate each row
    const validatedData: QuestionData[] = [];
    const errors: { row: number; errors: string[]; cells: CellError[] }[] = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because of 0-indexing and header row
      const rowErrors: string[] = [];
      const cellErrors: CellError[] = [];

      // Validate question text
      const text = row.text?.toString().trim();
      if (!text) {
        rowErrors.push("Question text is required");
        cellErrors.push({
          cell: getCellRef(columnMap["text"], rowNumber),
          message: "Question text is required",
        });
      }

      // Validate options
      const option1 = row.option1?.toString().trim();
      if (!option1) {
        rowErrors.push("Option 1 is required");
        cellErrors.push({
          cell: getCellRef(columnMap["option1"], rowNumber),
          message: "Option 1 is required",
        });
      }

      const option2 = row.option2?.toString().trim();
      if (!option2) {
        rowErrors.push("Option 2 is required");
        cellErrors.push({
          cell: getCellRef(columnMap["option2"], rowNumber),
          message: "Option 2 is required",
        });
      }

      const option3 = row.option3?.toString().trim();
      if (!option3) {
        rowErrors.push("Option 3 is required");
        cellErrors.push({
          cell: getCellRef(columnMap["option3"], rowNumber),
          message: "Option 3 is required",
        });
      }

      const option4 = row.option4?.toString().trim();
      if (!option4) {
        rowErrors.push("Option 4 is required");
        cellErrors.push({
          cell: getCellRef(columnMap["option4"], rowNumber),
          message: "Option 4 is required",
        });
      }

      // Validate correct option
      let correctOption: number;
      const correctOptionStr = row.correctOption?.toString().trim();
      try {
        correctOption = parseInt(correctOptionStr);
        if (isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
          rowErrors.push(
            `Correct option must be a number between 1 and 4, got: ${correctOptionStr}`
          );
          cellErrors.push({
            cell: getCellRef(columnMap["correctOption"], rowNumber),
            message: `Correct option must be a number between 1 and 4, got: ${correctOptionStr}`,
          });
        }
      } catch (e) {
        rowErrors.push(
          `Correct option must be a number between 1 and 4, got: ${correctOptionStr}`
        );
        cellErrors.push({
          cell: getCellRef(columnMap["correctOption"], rowNumber),
          message: `Correct option must be a number between 1 and 4, got: ${correctOptionStr}`,
        });
      }

      // Add errors if any
      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
          cells: cellErrors,
        });
      } else {
        // Add valid question data
        validatedData.push({
          text,
          option1,
          option2,
          option3,
          option4,
          correctOption: parseInt(row.correctOption),
        });
      }
    });

    // Return validation result
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      data: validatedData,
    };
  } catch (error) {
    console.error("Error parsing Excel file:", error);
    return {
      valid: false,
      errors: [
        {
          row: 0,
          errors: [
            "Failed to parse Excel file. Please make sure it's a valid .xlsx file and contains the required headers: text, option1, option2, option3, option4, correctOption.",
          ],
        },
      ],
    };
  }
};
