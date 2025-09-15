import * as XLSX from 'xlsx';

/**
 * Generates an Excel template for student import
 */
export function generateStudentTemplate() {
  // Create workbook and sheet
  const wb = XLSX.utils.book_new();

  // Define columns with headers and sample data
  const columns = [
    { header: 'firstName', sample: 'John' },
    { header: 'lastName', sample: 'Doe' },
    { header: 'email', sample: 'john.doe@example.com' },
    { header: 'password', sample: 'password123' },
    { header: 'mobile', sample: '9876543210' },
    { header: 'dateOfBirth', sample: '1990-01-01' },
    { header: 'rollNumber', sample: 'STU001' },
  ];

  // Create header row
  const worksheet = XLSX.utils.aoa_to_sheet([
    columns.map(col => col.header),
    columns.map(col => col.sample),
  ]);

  // Add column width specifications
  const colWidths = [
    { wch: 15 }, // firstName
    { wch: 15 }, // lastName
    { wch: 30 }, // email
    { wch: 15 }, // password
    { wch: 15 }, // mobile
    { wch: 15 }, // dateOfBirth
    { wch: 15 }, // rollNumber
  ];

  worksheet['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, worksheet, 'Students');

  // Write to file
  XLSX.writeFile(wb, 'student_import_template.xlsx');

  // console.log("Excel template generated: student_import_template.xlsx");
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateStudentTemplate();
}

module.exports = {
  generateStudentTemplate,
};
