/**
 * Template Inspector Utility
 *
 * Reads the Excel template and prints cell values for verifying
 * the template-map.ts constants match the actual template layout.
 *
 * Usage: npm run inspect-template
 */
import { Workbook } from 'exceljs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '..', 'templates', 'timesheet-template.xlsx');

async function inspect(): Promise<void> {
  if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Template not found: ${TEMPLATE_PATH}`);
    console.error('Copy your template to: templates/timesheet-template.xlsx');
    process.exit(1);
  }

  const workbook = new Workbook();
  await workbook.xlsx.readFile(TEMPLATE_PATH);

  console.log(`\n📊 Template: ${TEMPLATE_PATH}`);
  console.log(`   Sheets: ${workbook.worksheets.map((s) => s.name).join(', ')}\n`);

  const sheet = workbook.worksheets[0]!;
  console.log(`── Sheet: "${sheet.name}" ──`);
  console.log(`   Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}\n`);

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
        cells.push(`${colLetter}${row}="${val}"`);
      }
    }
    if (cells.length > 0) {
      console.log(`  Row ${String(row).padStart(2)}: ${cells.join(' | ')}`);
    }
  }

  // Check for images
  const images = sheet.getImages();
  console.log(`\n  Images: ${images.length} found`);
  for (const img of images) {
    console.log(`    - Image at range: tl=${JSON.stringify(img.range?.tl)}, br=${JSON.stringify(img.range?.br)}`);
  }

  console.log('\n✅ Inspection complete. Compare with src/template-map.ts constants.');
}

inspect().catch(console.error);
