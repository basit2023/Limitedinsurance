import { IncomingWebhook } from '@slack/webhook'
import nodemailer from 'nodemailer'

/**
 * Send a Slack notification
 */
export async function sendSlackMessage(
  channel: 'sales' | 'quality' | 'critical',
  message: string,
  metadata?: {
    centerName?: string
    priority?: string
    actionItems?: string[]
    dashboardUrl?: string
  }
) {
  try {
    const webhookUrls = {
      sales: process.env.SLACK_WEBHOOK_SALES_ALERTS,
      quality: process.env.SLACK_WEBHOOK_QUALITY_ALERTS,
      critical: process.env.SLACK_WEBHOOK_CRITICAL_ALERTS
    }
    
    const webhookUrl = webhookUrls[channel]
    
    if (!webhookUrl) {
      console.warn(`Slack webhook not configured for channel: ${channel}`)
      return { success: false, error: 'Webhook not configured' }
    }
    
    const webhook = new IncomingWebhook(webhookUrl)
    
    // Build Slack message blocks
    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: metadata?.centerName || 'Performance Alert',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message
        }
      }
    ]
    
    // Add priority badge
    if (metadata?.priority) {
      const priorityEmoji = {
        critical: '🚨',
        high: '⚠️',
        medium: '📊',
        low: 'ℹ️'
      }[metadata.priority] || 'ℹ️'
      
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${priorityEmoji} *Priority:* ${metadata.priority.toUpperCase()}`
          }
        ]
      })
    }
    
    // Add action items
    if (metadata?.actionItems && metadata.actionItems.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Action Items:*\n' + metadata.actionItems.map(item => `• ${item}`).join('\n')
        }
      })
    }
    
    // Add action buttons
    if (metadata?.dashboardUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '📊 View Dashboard'
            },
            url: metadata.dashboardUrl,
            style: 'primary'
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Acknowledge'
            },
            value: 'acknowledge'
          }
        ]
      })
    }
    
    await webhook.send({
      blocks,
      text: message // Fallback text for notifications
    })
    
    console.log(`✅ Slack message sent to ${channel} channel`)
    return { success: true }
    
  } catch (error) {
    console.error('Error sending Slack message:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send an email notification
 */
export async function sendEmail(
  recipients: string[],
  subject: string,
  htmlContent: string,
  plainText?: string
) {
  try {
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }
    
    if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.warn('SMTP credentials not configured')
      return { success: false, error: 'SMTP not configured' }
    }
    
    const transporter = nodemailer.createTransporter(smtpConfig)
    
    const mailOptions = {
      from: `"Insurance Alert Portal" <${process.env.EMAIL_FROM || smtpConfig.auth.user}>`,
      to: recipients.join(', '),
      subject,
      text: plainText || stripHtml(htmlContent),
      html: htmlContent
    }
    
    const info = await transporter.sendMail(mailOptions)
    
    console.log(`✅ Email sent to ${recipients.length} recipients: ${info.messageId}`)
    return { success: true, messageId: info.messageId }
    
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a push notification to mobile devices
 */
export async function sendPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    data?: any
    priority?: 'high' | 'normal'
  }
) {
  try {
    // This would integrate with Firebase Cloud Messaging (FCM) for Android
    // and Apple Push Notification Service (APNs) for iOS
    
    const firebaseServerKey = process.env.FIREBASE_SERVER_KEY
    
    if (!firebaseServerKey) {
      console.warn('Firebase server key not configured')
      return { success: false, error: 'Push notifications not configured' }
    }
    
    // Get user's device tokens from database
    // This is a placeholder - you'd query your mobile_devices table
    
    console.log(`📱 Push notification queued for user ${userId}:`, payload.title)
    
    // In production, you'd use Firebase Admin SDK:
    // await admin.messaging().send({
    //   notification: {
    //     title: payload.title,
    //     body: payload.body
    //   },
    //   data: payload.data,
    //   token: deviceToken,
    //   android: {
    //     priority: payload.priority === 'high' ? 'high' : 'normal'
    //   },
    //   apns: {
    //     payload: {
    //       aps: {
    //         alert: {
    //           title: payload.title,
    //           body: payload.body
    //         },
    //         sound: 'default'
    //       }
    //     }
    //   }
    // })
    
    return { success: true, queued: true }
    
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a WhatsApp message (using Twilio)
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      console.warn('Twilio WhatsApp credentials not configured')
      return { success: false, error: 'WhatsApp not configured' }
    }
    
    // In production, you'd use Twilio SDK:
    // const client = require('twilio')(twilioAccountSid, twilioAuthToken)
    // const messageResponse = await client.messages.create({
    //   body: message,
    //   from: `whatsapp:${twilioWhatsAppNumber}`,
    //   to: `whatsapp:${phoneNumber}`
    // })
    
    console.log(`💬 WhatsApp message queued to ${phoneNumber}`)
    
    return { success: true, queued: true }
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if user is in quiet hours
 */
export async function checkQuietHours(userId: string): Promise<boolean> {
  // This would query the notification_preferences table
  // For now, returning false (not in quiet hours)
  
  const now = new Date()
  const currentHour = now.getHours()
  
  // Default quiet hours: 10 PM to 7 AM
  if (currentHour >= 22 || currentHour < 7) {
    return true
  }
  
  return false
}

/**
 * Check if we've exceeded frequency cap for a user
 */
export async function checkFrequencyCap(userId: string, alertType: string): Promise<boolean> {
  // This would check alerts_sent table for this user in the last hour
  // For now, returning false (no frequency cap exceeded)
  return false
}

/**
 * Send multi-channel notification
 */
export async function sendMultiChannelNotification(
  channels: string[],
  message: string,
  metadata: {
    recipients?: string[]
    userId?: string
    centerName?: string
    priority?: string
    actionItems?: string[]
    dashboardUrl?: string
  }
) {
  const results: any[] = []
  
  for (const channel of channels) {
    switch (channel) {
      case 'slack':
        const slackChannel = metadata.priority === 'critical' ? 'critical' : 'sales'
        const slackResult = await sendSlackMessage(slackChannel, message, metadata)
        results.push({ channel: 'slack', ...slackResult })
        break
        
      case 'email':
        if (metadata.recipients && metadata.recipients.length > 0) {
          const emailHtml = buildEmailTemplate(message, metadata)
          const emailResult = await sendEmail(
            metadata.recipients,
            `Alert: ${metadata.centerName || 'Performance Update'}`,
            emailHtml
          )
          results.push({ channel: 'email', ...emailResult })
        }
        break
        
      case 'push':
        if (metadata.userId) {
          const pushResult = await sendPushNotification(metadata.userId, {
            title: metadata.centerName || 'Performance Alert',
            body: message,
            priority: metadata.priority === 'critical' ? 'high' : 'normal',
            data: metadata
          })
          results.push({ channel: 'push', ...pushResult })
        }
        break
        
      case 'whatsapp':
        // WhatsApp implementation would go here
        console.log('WhatsApp notification not yet implemented')
        break
    }
  }
  
  return results
}

/**
 * Build HTML email template
 */
function buildEmailTemplate(message: string, metadata: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Performance Alert</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .priority-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .priority-critical {
      background: #dc3545;
      color: white;
    }
    .priority-high {
      background: #ffc107;
      color: #000;
    }
    .priority-medium {
      background: #17a2b8;
      color: white;
    }
    .message {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .action-items {
      background: white;
      padding: 20px;
      border-radius: 6px;
      margin: 20px 0;
    }
    .action-items ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 10px 5px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${metadata.centerName || 'Performance Alert'}</h1>
    ${metadata.priority ? `<div class="priority-badge priority-${metadata.priority}">${metadata.priority} Priority</div>` : ''}
  </div>
  <div class="content">
    <div class="message">
      <p>${message.replace(/\n/g, '<br>')}</p>
    </div>
    
    ${metadata.actionItems && metadata.actionItems.length > 0 ? `
    <div class="action-items">
      <h3>Action Items:</h3>
      <ul>
        ${metadata.actionItems.map((item: string) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    ` : ''}
    
    ${metadata.dashboardUrl ? `
    <div style="text-align: center; margin: 20px 0;">
      <a href="${metadata.dashboardUrl}" class="button">View Dashboard</a>
    </div>
    ` : ''}
  </div>
  <div class="footer">
    <p>This is an automated alert from the Insurance Sales Alert Portal.</p>
    <p>Sent at ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
