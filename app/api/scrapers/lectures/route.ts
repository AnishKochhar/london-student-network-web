import { NextResponse } from 'next/server'
import * as sources from '../../../lib/@package/scrapers/src/sources'

export async function GET() {
  try {
    const soasHost = await sources.imperial.run({})
    return NextResponse.json(soasHost)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch SOAS lectures' }, { status: 500 })
  }
}
