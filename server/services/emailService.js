const { google } = require('googleapis');
const db = require('../config/database');

class EmailService {
  constructor() {
    this.oauth2Client = null;
  }

  // Initialize Gmail OAuth2 client with stored credentials
  async initializeGmailClient() {
    try {
      const result = await db.query(`
        SELECT * FROM gmail_credentials 
        WHERE is_active = true 
        ORDER BY created_at DESC 
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        throw new Error('No active Gmail credentials found');
      }

      const credentials = result.rows[0];
      
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.CLIENT_URL || 'http://localhost:3000'}/settings/gmail/callback`
      );

      this.oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        expiry_date: credentials.token_expiry ? new Date(credentials.token_expiry).getTime() : null
      });

      // Handle token refresh
      this.oauth2Client.on('tokens', async (tokens) => {
        if (tokens.refresh_token) {
          // Update stored refresh token
          await db.query(`
            UPDATE gmail_credentials 
            SET access_token = $1, refresh_token = $2, token_expiry = $3, updated_at = CURRENT_TIMESTAMP
            WHERE email = $4
          `, [
            tokens.access_token,
            tokens.refresh_token,
            tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            credentials.email
          ]);
        } else {
          // Update just the access token
          await db.query(`
            UPDATE gmail_credentials 
            SET access_token = $1, token_expiry = $2, updated_at = CURRENT_TIMESTAMP
            WHERE email = $3
          `, [
            tokens.access_token,
            tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            credentials.email
          ]);
        }
      });

      return this.oauth2Client;
    } catch (error) {
      console.error('Error initializing Gmail client:', error);
      throw error;
    }
  }

  // Check if Gmail integration is enabled and configured
  async isGmailEnabled() {
    try {
      const settingResult = await db.query(`
        SELECT setting_value FROM system_settings 
        WHERE setting_key = 'gmail_integration_enabled'
      `);

      const credentialsResult = await db.query(`
        SELECT COUNT(*) as count FROM gmail_credentials WHERE is_active = true
      `);

      return settingResult.rows[0]?.setting_value === 'true' && 
             parseInt(credentialsResult.rows[0].count) > 0;
    } catch (error) {
      console.error('Error checking Gmail status:', error);
      return false;
    }
  }

  // Send email using Gmail API
  async sendEmail({
    to,
    cc = [],
    bcc = [],
    subject,
    textBody,
    htmlBody,
    templateId = null,
    relatedType = null,
    relatedId = null,
    sentBy
  }) {
    try {
      const isEnabled = await this.isGmailEnabled();
      if (!isEnabled) {
        throw new Error('Gmail integration is not enabled or configured');
      }

      await this.initializeGmailClient();
      
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Get default from name
      const fromNameResult = await db.query(`
        SELECT setting_value FROM system_settings WHERE setting_key = 'default_from_name'
      `);
      const fromName = fromNameResult.rows[0]?.setting_value || 'West Nebraska Sports Council';

      // Get sender email from credentials
      const credentialsResult = await db.query(`
        SELECT email FROM gmail_credentials WHERE is_active = true ORDER BY created_at DESC LIMIT 1
      `);
      const fromEmail = credentialsResult.rows[0]?.email;

      if (!fromEmail) {
        throw new Error('No sender email found in Gmail credentials');
      }

      // Prepare email
      const toAddresses = Array.isArray(to) ? to : [to];
      const ccAddresses = Array.isArray(cc) ? cc : (cc ? [cc] : []);
      const bccAddresses = Array.isArray(bcc) ? bcc : (bcc ? [bcc] : []);

      let emailContent = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${toAddresses.join(', ')}`,
      ];

      if (ccAddresses.length > 0) {
        emailContent.push(`Cc: ${ccAddresses.join(', ')}`);
      }
      
      if (bccAddresses.length > 0) {
        emailContent.push(`Bcc: ${bccAddresses.join(', ')}`);
      }

      emailContent.push(`Subject: ${subject}`);
      emailContent.push('MIME-Version: 1.0');

      if (htmlBody) {
        emailContent.push('Content-Type: multipart/alternative; boundary="boundary123"');
        emailContent.push('');
        emailContent.push('--boundary123');
        emailContent.push('Content-Type: text/plain; charset="UTF-8"');
        emailContent.push('');
        emailContent.push(textBody || '');
        emailContent.push('');
        emailContent.push('--boundary123');
        emailContent.push('Content-Type: text/html; charset="UTF-8"');
        emailContent.push('');
        emailContent.push(htmlBody);
        emailContent.push('');
        emailContent.push('--boundary123--');
      } else {
        emailContent.push('Content-Type: text/plain; charset="UTF-8"');
        emailContent.push('');
        emailContent.push(textBody || '');
      }

      const encodedMessage = Buffer.from(emailContent.join('\n')).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Log email attempt
      const logResult = await db.query(`
        INSERT INTO email_logs 
        (to_emails, cc_emails, bcc_emails, subject, body_text, body_html, 
         template_id, status, related_type, related_id, sent_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10)
        RETURNING id
      `, [
        toAddresses,
        ccAddresses.length > 0 ? ccAddresses : null,
        bccAddresses.length > 0 ? bccAddresses : null,
        subject,
        textBody,
        htmlBody,
        templateId,
        relatedType,
        relatedId,
        sentBy
      ]);

      const logId = logResult.rows[0].id;

      try {
        // Send email via Gmail API
        const result = await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage
          }
        });

        // Update log with success
        await db.query(`
          UPDATE email_logs 
          SET status = 'sent', message_id = $1, sent_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [result.data.id, logId]);

        return {
          success: true,
          messageId: result.data.id,
          logId: logId
        };

      } catch (sendError) {
        // Update log with failure
        await db.query(`
          UPDATE email_logs 
          SET status = 'failed', error_message = $1
          WHERE id = $2
        `, [sendError.message, logId]);

        throw sendError;
      }

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Send email using template
  async sendEmailFromTemplate({
    templateId,
    to,
    cc = [],
    bcc = [],
    variables = {},
    relatedType = null,
    relatedId = null,
    sentBy
  }) {
    try {
      // Get template
      const templateResult = await db.query(`
        SELECT * FROM email_templates WHERE id = $1 AND is_active = true
      `, [templateId]);

      if (templateResult.rows.length === 0) {
        throw new Error('Email template not found or inactive');
      }

      const template = templateResult.rows[0];

      // Replace variables in subject and body
      let subject = template.subject;
      let textBody = template.body_text;
      let htmlBody = template.body_html;

      Object.keys(variables).forEach(key => {
        const placeholder = `{{${key}}}`;
        const value = variables[key] || '';
        
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        if (textBody) textBody = textBody.replace(new RegExp(placeholder, 'g'), value);
        if (htmlBody) htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), value);
      });

      // Send email
      return await this.sendEmail({
        to,
        cc,
        bcc,
        subject,
        textBody,
        htmlBody,
        templateId,
        relatedType,
        relatedId,
        sentBy
      });

    } catch (error) {
      console.error('Error sending template email:', error);
      throw error;
    }
  }

  // Get daily email count
  async getDailyEmailCount() {
    try {
      const result = await db.query(`
        SELECT COUNT(*) as count 
        FROM email_logs 
        WHERE DATE(created_at) = CURRENT_DATE AND status = 'sent'
      `);

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting daily email count:', error);
      return 0;
    }
  }

  // Check if daily email limit is reached
  async isDailyLimitReached() {
    try {
      const limitResult = await db.query(`
        SELECT setting_value FROM system_settings WHERE setting_key = 'max_daily_emails'
      `);
      
      const dailyLimit = parseInt(limitResult.rows[0]?.setting_value || 100);
      const currentCount = await this.getDailyEmailCount();

      return currentCount >= dailyLimit;
    } catch (error) {
      console.error('Error checking daily limit:', error);
      return true; // Err on the side of caution
    }
  }
}

module.exports = new EmailService();