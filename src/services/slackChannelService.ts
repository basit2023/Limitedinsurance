import { WebClient } from '@slack/web-api'
import { IncomingWebhook } from '@slack/webhook'

// Initialize Slack Web API client for creating channels
let slackClient: WebClient | null = null

function getSlackClient(): WebClient | null {
  const botToken = process.env.SLACK_BOT_TOKEN

  if (!botToken) {
    console.warn('SLACK_BOT_TOKEN not configured. Channel creation will be disabled.')
    return null
  }

  if (!slackClient) {
    slackClient = new WebClient(botToken)
  }

  return slackClient
}

/**
 * Create a Slack channel for a center if it doesn't exist
 */
export async function createCenterSlackChannel(
  centerName: string,
  centerId: string
): Promise<{ channelId?: string; channelName?: string; webhook?: string; error?: string }> {
  try {
    const client = getSlackClient()

    if (!client) {
      return {
        error: 'Slack Bot Token not configured'
      }
    }

    // Format channel name (Slack requires lowercase, no spaces, max 80 chars)
    const channelName = `center-${centerName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').substring(0, 70)}`

    // Check if channel already exists
    let channelId: string | undefined

    try {
      const result = await client.conversations.list({
        types: 'public_channel,private_channel',
        limit: 1000
      })

      const existingChannel = result.channels?.find((ch) => ch.name === channelName)

      if (existingChannel) {
        console.log(`Slack channel ${channelName} already exists`)
        channelId = existingChannel.id
      }
    } catch (error) {
      console.error('Error checking for existing channel:', error)
    }

    // Create channel if it doesn't exist
    if (!channelId) {
      try {
        const createResult = await client.conversations.create({
          name: channelName,
          is_private: false
        })

        channelId = createResult.channel?.id
        console.log(`✅ Created Slack channel: ${channelName} (${channelId})`)

        // Set channel topic and description
        if (channelId) {
          await client.conversations.setTopic({
            channel: channelId,
            topic: `Performance alerts for ${centerName} (Center ID: ${centerId})`
          })

          await client.conversations.setPurpose({
            channel: channelId,
            purpose: `Automated notifications for sales, quality, and performance metrics at ${centerName}`
          })
        }
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'data' in error) {
          const errorData = error.data as { error?: string }
          if (errorData.error === 'name_taken') {
            console.log(`Channel ${channelName} already exists (race condition)`)
            // Try to find it again
            const retryResult = await client.conversations.list({
              types: 'public_channel,private_channel',
              limit: 1000
            })
            const retryChannel = retryResult.channels?.find((ch) => ch.name === channelName)
            channelId = retryChannel?.id
          } else {
            throw error
          }
        } else {
          throw error
        }
      }
    }

    // Generate webhook URL for the channel (requires Incoming Webhooks app)
    // Note: Webhook URLs need to be created manually or via Slack App configuration
    // For now, we'll return the channel info and let admins configure webhooks manually

    return {
      channelId,
      channelName,
      error: undefined
    }
  } catch (error) {
    console.error('Error creating Slack channel:', error)
    return {
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Send a message to a Slack channel (using webhook or channel ID)
 */
export async function sendSlackChannelMessage(
  channelIdOrWebhook: string,
  message: string,
  metadata?: {
    centerName?: string
    priority?: string
    actionItems?: string[]
    dashboardUrl?: string
  }
) {
  try {
    // Check if it's a webhook URL
    if (channelIdOrWebhook.startsWith('http')) {
      const webhook = new IncomingWebhook(channelIdOrWebhook)

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
            }
          ]
        })
      }

      await webhook.send({
        blocks,
        text: message
      })

      console.log(`✅ Slack message sent via webhook`)
      return { success: true }
    } else {
      // Use channel ID with Web API
      const client = getSlackClient()

      if (!client) {
        return { success: false, error: 'Slack Bot Token not configured' }
      }

      await client.chat.postMessage({
        channel: channelIdOrWebhook,
        text: message,
        mrkdwn: true
      })

      console.log(`✅ Slack message sent to channel ${channelIdOrWebhook}`)
      return { success: true }
    }
  } catch (error) {
    console.error('Error sending Slack message:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Invite users to a Slack channel
 */
export async function inviteUsersToChannel(
  channelId: string,
  userEmails: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getSlackClient()

    if (!client) {
      return { success: false, error: 'Slack Bot Token not configured' }
    }

    // Look up user IDs from emails
    const userIds: string[] = []

    for (const email of userEmails) {
      try {
        const result = await client.users.lookupByEmail({ email })
        if (result.user?.id) {
          userIds.push(result.user.id)
        }
      } catch (error) {
        console.warn(`Could not find Slack user for email: ${email}`)
      }
    }

    // Invite users to channel
    if (userIds.length > 0) {
      await client.conversations.invite({
        channel: channelId,
        users: userIds.join(',')
      })

      console.log(`✅ Invited ${userIds.length} users to Slack channel ${channelId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error inviting users to Slack channel:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
