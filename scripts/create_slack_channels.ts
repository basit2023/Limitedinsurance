/**
 * Create Slack Channels for All Centers
 * This script creates dedicated Slack channels for each center
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { createCenterSlackChannel, inviteUsersToChannel } from '../src/services/slackChannelService'

function getSupabaseClient() {
    const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase environment variables')
    }

    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    })
}

async function createSlackChannelsForCenters() {
    console.log('🏢 Creating Slack Channels for All Centers\n')

    const supabase = getSupabaseClient()

    // Get all centers
    const { data: centers, error: centersError } = await supabase
        .from('centers')
        .select('id, center_name')

    if (centersError) {
        console.error('❌ Error fetching centers:', centersError)
        return
    }

    if (!centers || centers.length === 0) {
        console.log('⚠️  No centers found in database')
        return
    }

    console.log(`Found ${centers.length} centers\n`)

    // Get users to invite
    const { data: users } = await supabase
        .from('users')
        .select(`
            email,
            user_types!inner(permission_level)
        `)
        .eq('status', true)

    const validUsers = users?.filter((u: any) =>
        u.user_types && u.user_types.permission_level > 15
    ) || []

    const userEmails = validUsers.map((u: any) => u.email)

    console.log(`Found ${validUsers.length} users with permission to receive alerts\n`)

    // Create channels for each center
    for (const center of centers) {
        console.log(`\n📍 Processing: ${center.center_name}`)

        const result = await createCenterSlackChannel(center.center_name, center.id)

        if (result.error) {
            console.log(`   ❌ Error: ${result.error}`)
            continue
        }

        if (result.channelId) {
            console.log(`   ✅ Channel: ${result.channelName}`)
            console.log(`   📌 Channel ID: ${result.channelId}`)

            // Invite users to the channel
            if (userEmails.length > 0) {
                console.log(`   👥 Inviting ${userEmails.length} users...`)
                const inviteResult = await inviteUsersToChannel(result.channelId, userEmails)

                if (inviteResult.success) {
                    console.log(`   ✅ Users invited successfully`)
                } else {
                    console.log(`   ⚠️  Could not invite users: ${inviteResult.error}`)
                }
            }

            // Update center with channel info (optional - if you want to store it)
            // await supabase
            //     .from('centers')
            //     .update({ slack_channel_id: result.channelId })
            //     .eq('id', center.id)
        } else {
            console.log(`   ⚠️  Channel info not available`)
        }
    }

    console.log('\n\n✨ Slack channel creation complete!\n')
    console.log('📝 Summary:')
    console.log(`   Total centers: ${centers.length}`)
    console.log(`   Users with alert access: ${validUsers.length}`)
}

// Run the script
createSlackChannelsForCenters().catch(error => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
})
