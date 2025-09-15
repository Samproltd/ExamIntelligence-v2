import XLSX from 'xlsx';

/**
 * Generates an Excel template for question import
 */
export function generateQuestionsTemplate() {
  // Create workbook and sheet
  const wb = XLSX.utils.book_new();

  // Define columns with headers and sample data
  const columns = [
    { header: 'text', sample: 'What is the capital city of France?' },
    { header: 'option1', sample: 'Paris' },
    { header: 'option2', sample: 'London' },
    { header: 'option3', sample: 'Berlin' },
    { header: 'option4', sample: 'Madrid' },
    { header: 'correctOption', sample: '1' },
  ];

  // Create header row
  const worksheet = XLSX.utils.aoa_to_sheet([
    columns.map(col => col.header),
    columns.map(col => col.sample),
  ]);

  // Add column width specifications
  const colWidths = [
    { wch: 40 }, // text
    { wch: 25 }, // option1
    { wch: 25 }, // option2
    { wch: 25 }, // option3
    { wch: 25 }, // option4
    { wch: 15 }, // correctOption
  ];

  worksheet['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, worksheet, 'Questions');

  // Write to file
  XLSX.writeFile(wb, 'question_import_template.xlsx');
}

// Run the function if this script is executed directly
if (require.main === module) {
  generateQuestionsTemplate();
}

module.exports = {
  generateQuestionsTemplate,
};
