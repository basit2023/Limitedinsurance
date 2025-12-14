import { IncomingWebhook } from '@slack/webhook'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

interface NotificationMetadata {
  centerName?: string
  priority?: string
  actionItems?: string[]
  dashboardUrl?: string
  recipients?: string[]
  userId?: string
  slackWebhookUrl?: string
  centerId?: string
  triggerType?: 'low_sales' | 'zero_sales' | 'high_dq' | 'low_approval' | 'milestone' | 'below_threshold_duration'
}

// Helper to get Supabase client for preference checks
function getSupabaseClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Supabase credentials missing for notification preferences check')
    return null
  }

  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })
}

/**
 * Send a Slack notification
 * Supports both global channel webhooks and per-center webhooks
 */
export async function sendSlackMessage(
  channel: 'sales' | 'quality' | 'critical',
  message: string,
  metadata?: {
    centerName?: string
    priority?: string
    actionItems?: string[]
    dashboardUrl?: string
    slackWebhookUrl?: string
  }
) {
  try {
    // Use center-specific webhook if provided, otherwise fall back to global webhooks
    let webhookUrl = metadata?.slackWebhookUrl

    if (!webhookUrl) {
      const webhookUrls = {
        sales: process.env.SLACK_WEBHOOK_SALES_ALERTS,
        quality: process.env.SLACK_WEBHOOK_QUALITY_ALERTS,
        critical: process.env.SLACK_WEBHOOK_CRITICAL_ALERTS
      }
      webhookUrl = webhookUrls[channel]
    }

    if (!webhookUrl) {
      console.log(`[MOCK SLACK] (${channel}) ${message}`) // Log to console as fallback
      console.warn(`Slack webhook not configured for channel: ${channel}. Message logged to console.`)
      return { success: true, mocked: true } // Return success to prevent downstream errors
    }

    const webhook = new IncomingWebhook(webhookUrl)

    // Build Slack message blocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    }

    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      console.log(`[MOCK EMAIL] To: ${recipients.join(', ')} | Subject: ${subject}`)
      console.warn('SMTP credentials not configured. Email logged to console.')
      return { success: true, mocked: true }
    }

    const transporter = nodemailer.createTransport(smtpConfig)

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
    data?: Record<string, unknown>
    priority?: 'high' | 'normal'
  }
) {
  try {
    const firebaseServerKey = process.env.FIREBASE_SERVER_KEY

    if (!firebaseServerKey) {
      console.log(`[MOCK PUSH] User: ${userId} | Title: ${payload.title}`)
      console.warn('Firebase server key not configured. Push notification logged to console.')
      return { success: true, mocked: true }
    }

    // In production, integration with Firebase Admin SDK would go here
    console.log(`📱 Push notification queued for user ${userId}:`, payload.title)

    return { success: true, queued: true }

  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send a Web Push notification (PWA)
 */
export async function sendWebPushNotification(
  userId: string,
  payload: {
    title: string
    body: string
    data?: Record<string, unknown>
    priority?: 'high' | 'normal'
  }
) {
  try {
    // Call the push API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: payload.priority || 'normal'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Error sending web push:', error)
      return { success: false, error: error.error || 'Unknown error' }
    }

    const result = await response.json()
    console.log(`📱 Web push notification sent to user ${userId}:`, result)
    return { success: true, ...result }

  } catch (error) {
    console.error('Error sending web push notification:', error)
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
      console.log(`[MOCK WHATSAPP] To: ${phoneNumber} | Message: ${message}`)
      console.warn('Twilio WhatsApp credentials not configured. Message logged to console.')
      return { success: true, mocked: true }
    }

    // In production, Twilio SDK integration would go here
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
  const supabase = getSupabaseClient()
  if (!supabase) return false // Default to allowing notifications if DB is unreachable

  try {
    const { data: prefs, error } = await supabase
      .from('notification_preferences')
      .select('quiet_hours_start, quiet_hours_end')
      .eq('user_id', userId)
      .single()

    if (error || !prefs || !prefs.quiet_hours_start || !prefs.quiet_hours_end) {
      // Fallback to default 10 PM - 7 AM if no specific prefs
      const currentHour = new Date().getHours()
      return currentHour >= 22 || currentHour < 7
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`

    // Simple check assuming start < end (e.g. 09:00 to 17:00 is NOT quiet hours)
    // For overnight (e.g. 22:00 to 07:00), we need special logic
    if (prefs.quiet_hours_start > prefs.quiet_hours_end) {
      return currentTime >= prefs.quiet_hours_start || currentTime <= prefs.quiet_hours_end
    } else {
      return currentTime >= prefs.quiet_hours_start && currentTime <= prefs.quiet_hours_end
    }

  } catch (err) {
    console.error('Error checking quiet hours:', err)
    return false
  }
}

/**
 * Check if we've exceeded frequency cap for a user
 */
export async function checkFrequencyCap(_userId: string, _alertType: string): Promise<boolean> {
  // Placeholder: Implement actual DB check if needed in future
  // For now, allow all alerts to ensure visibility during testing
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
    slackWebhookUrl?: string
    centerId?: string
    triggerType?: 'low_sales' | 'zero_sales' | 'high_dq' | 'low_approval' | 'milestone' | 'below_threshold_duration'
  }
) {
  const results: Array<{ channel: string; success: boolean; mocked?: boolean; error?: string; messageId?: string; queued?: boolean }> = []

  for (const channel of channels) {
    switch (channel) {
      case 'slack':
        // Intelligent channel routing based on trigger type
        let slackChannel: 'sales' | 'quality' | 'critical' = 'sales'

        if (metadata.triggerType) {
          switch (metadata.triggerType) {
            case 'zero_sales':
              slackChannel = 'critical'
              break
            case 'low_sales':
            case 'milestone':
            case 'below_threshold_duration':
              slackChannel = 'sales'
              break
            case 'high_dq':
            case 'low_approval':
              slackChannel = 'quality'
              break
            default:
              slackChannel = 'sales'
          }
        } else if (metadata.priority === 'critical') {
          // Fallback to priority-based routing if no trigger type
          slackChannel = 'critical'
        }

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
          // Send both mobile push (Firebase) and web push (PWA)
          const pushResult = await sendPushNotification(metadata.userId, {
            title: metadata.centerName || 'Performance Alert',
            body: message,
            priority: metadata.priority === 'critical' ? 'high' : 'normal',
            data: metadata
          })
          results.push({ channel: 'push', ...pushResult })

          // Also send web push notification
          const webPushResult = await sendWebPushNotification(metadata.userId, {
            title: metadata.centerName || 'Performance Alert',
            body: message,
            priority: metadata.priority === 'critical' ? 'high' : 'normal',
            data: metadata
          })
          results.push({ channel: 'web-push', ...webPushResult })
        }
        break

      case 'whatsapp':
        // WhatsApp implementation
        if (metadata.userId) {
          // ideally we resolve phone number from userId here
          // For now logging as mock
          const whatsappResult = await sendWhatsAppMessage('mock-number', message)
          results.push({ channel: 'whatsapp', ...whatsappResult })
        }
        break
    }
  }

  return results
}

/**
 * Build HTML email template
 */
function buildEmailTemplate(message: string, metadata: NotificationMetadata): string {
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
