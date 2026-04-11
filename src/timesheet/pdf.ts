import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { promisify } from 'node:util';

import { createLogger } from '../core/logger.js';

const execAsync = promisify(exec);
const log = createLogger('pdf');

/**
 * Check whether LibreOffice (soffice) is available on the system.
 */
const isLibreOfficeAvailable = async (): Promise<boolean> => {
  try {
    const cmd = process.platform === 'win32' ? 'where soffice' : 'which soffice';
    await execAsync(cmd, { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
};

/**
 * Try to convert an Excel file to PDF using LibreOffice headless.
 * Returns the PDF path if LibreOffice is available, otherwise returns the
 * original xlsx path unchanged (graceful fallback).
 */
export const convertToPdfIfAvailable = async (xlsxPath: string): Promise<string> => {
  if (!existsSync(xlsxPath)) {
    throw new Error(`Excel file not found: ${xlsxPath}`);
  }

  const available = await isLibreOfficeAvailable();
  if (!available) {
    log.warn('LibreOffice not found — will send .xlsx as-is');
    return xlsxPath;
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
    log.warn(`PDF conversion failed, sending .xlsx instead: ${String(err)}`);
    return xlsxPath;
  }

  if (!existsSync(pdfPath)) {
    log.warn(`PDF not produced (expected ${pdfPath}), sending .xlsx instead`);
    return xlsxPath;
  }

  log.info(`PDF created: ${pdfPath}`);
  return pdfPath;
};
