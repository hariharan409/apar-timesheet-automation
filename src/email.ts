import { basename } from 'node:path';

import nodemailer from 'nodemailer';

import { createLogger } from './logger.js';
import { MONTH_NAMES_FULL } from './template-map.js';
import type { AppConfig } from './types.js';

const log = createLogger('email');

interface SendResult {
  success: boolean;
  messageId?: string;
}

/**
 * Send the generated timesheet via email using AWS SES SMTP.
 */
export const sendTimesheet = async (
  filePath: string,
  year: number,
  month: number,
  employeeName: string,
  config: Readonly<AppConfig>
): Promise<SendResult> => {
  const monthName = MONTH_NAMES_FULL[month - 1] ?? 'January';
  const subject = `Timesheet - ${monthName} ${year} - ${employeeName}`;

  log.info(`Sending email: "${subject}" to ${config.email.to}`);

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  const info = await transporter.sendMail({
    from: config.email.from,
    to: config.email.to,
    subject,
    text: `Please find attached the timesheet for ${monthName} ${year}.\n\nRegards,\n${employeeName}`,
    attachments: [
      {
        filename: basename(filePath),
        path: filePath,
      },
    ],
  });

  log.info(`Email sent successfully. MessageId: ${info.messageId}`);
  return { success: true, messageId: info.messageId };
};
