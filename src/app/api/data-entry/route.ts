import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

/**
 * POST /api/data-entry
 * Submit a new sales entry to daily_deal_flow
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      date,
      centerId,
      agent,
      insuredName,
      clientPhoneNumber,
      status,
      callResult,
      carrier,
      productType,
      monthlyPremium,
      faceAmount
    } = body

    if (!date || !centerId || !agent || !insuredName || !status || !callResult || !carrier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { data: entry, error } = await supabase
      .from('daily_deal_flow')
      .insert({
        date,
        center_id: centerId,
        agent,
        insured_name: insuredName,
        client_phone_number: clientPhoneNumber,
        status,
        call_result: callResult,
        carrier,
        product_type: productType,
        monthly_premium: monthlyPremium || 0,
        face_amount: faceAmount || 0,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      entry,
      message: 'Sales entry created successfully'
    })
  } catch (err) {
    console.error('Error creating sales entry:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error creating sales entry'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

/**
 * GET /api/data-entry?date=YYYY-MM-DD&centerId=xxx
 * Get entries for a specific date/center
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const centerId = searchParams.get('centerId')

    const supabase = getSupabaseClient()

    let query = supabase
      .from('daily_deal_flow')
      .select('*')
      .order('created_at', { ascending: false })

    if (date) {
      query = query.eq('date', date)
    }

    if (centerId) {
      query = query.eq('center_id', centerId)
    }

    const { data: entries, error } = await query

    if (error) throw error

    return NextResponse.json({
      entries: entries || [],
      count: entries?.length || 0
    })
  } catch (err) {
    console.error('Error fetching entries:', err)
    const errorMessage = err instanceof Error ? err.message : 'Error fetching entries'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
