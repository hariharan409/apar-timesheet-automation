/**
 * Template Inspector Utility
 *
 * Reads the Excel template and prints cell values for verifying
 * the template-map.ts constants match the actual template layout.
 *
 * Usage: npm run inspect-template
 */
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Workbook } from 'exceljs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '..', 'templates', 'timesheet-template.xlsx');

const inspect = async (): Promise<void> => {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Template not found: ${TEMPLATE_PATH}`);
    console.error('Copy your template to: templates/timesheet-template.xlsx');
    process.exit(1);
  }

  const workbook = new Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  console.log(`\n📊 Template: ${TEMPLATE_PATH}`);
  console.log(`   Sheets: ${workbook.worksheets.map((s) => s.name).join(', ')}\n`);

  const sheet = workbook.worksheets.at(0);
  if (!sheet) {
    console.error('No worksheets found in template');
    process.exit(1);
  }
  console.log(`── Sheet: "${sheet.name}" ──`);
  console.log(`   Rows: ${String(sheet.rowCount)}, Columns: ${String(sheet.columnCount)}\n`);

  // Print first 35 rows with cell values
  const ROWS_TO_INSPECT = 35;
  const COLS_TO_INSPECT = 33; // A through AG

  for (let row = 1; row <= ROWS_TO_INSPECT; row++) {
    const cells: string[] = [];
    for (let col = 1; col <= COLS_TO_INSPECT; col++) {
      const cell = sheet.getCell(row, col);
      const val = cell.value;
      if (val !== null && val !== undefined && val !== '') {
        const colLetter = String.fromCharCode(64 + col);
        cells.push(`${colLetter}${String(row)}="${String(val)}"`);
      }
    }
    if (cells.length > 0) {
      console.log(`  Row ${String(row).padStart(2)}: ${cells.join(' | ')}`);
    }
  }

  // Check for images
  const images = sheet.getImages();
  console.log(`\n  Images: ${String(images.length)} found`);
  for (const img of images) {
    const range = img.range;
    console.log(
      `    - Image at range: tl=${JSON.stringify(range.tl)}, br=${JSON.stringify(range.br)}`
    );
  }

  console.log('\n✅ Inspection complete. Compare with src/template-map.ts constants.');
};

inspect().catch(console.error);
