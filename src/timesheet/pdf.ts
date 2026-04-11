import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { createLogger } from '../core/logger.js';

const execAsync = promisify(exec);
const log = createLogger('pdf');

/**
 * Convert an Excel file to PDF using LibreOffice in headless mode.
 *
 * Requires LibreOffice installed:
 *   - Docker: `apk add libreoffice`
 *   - Windows: install LibreOffice and ensure `soffice` is in PATH
 *   - macOS/Linux: `brew install --cask libreoffice` / `apt install libreoffice`
 *
 * @returns Path to the generated PDF file
 */
export const convertToPdf = async (xlsxPath: string): Promise<string> => {
  if (!existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  const outputDir = dirname(xlsxPath);
  const pdfFilename = `${basename(xlsxPath, '.xlsx')}.pdf`;
  const pdfPath = join(outputDir, pdfFilename);

  log.info(`Converting to PDF: ${basename(xlsxPath)} → ${pdfFilename}`);

  const command = `soffice --headless --calc --convert-to pdf --outdir "${outputDir}" "${xlsxPath}"`;

  try {
    const { stderr } = await execAsync(command, { timeout: 60_000 });
    if (stderr) {
      log.warn(`LibreOffice stderr: ${stderr}`);
    }
  } catch (err) {
    throw new Error(
      `PDF conversion failed. Is LibreOffice installed? Run: soffice --version\n${String(err)}`
    );
  }

  if (!existsSync(pdfPath)) {
    throw new Error(`PDF conversion produced no output: expected ${pdfPath}`);
  }

  log.info(`PDF created: ${pdfPath}`);
  return pdfPath;
};
