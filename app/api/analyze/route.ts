import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { feature, kmlContext } = await request.json()

    // Extract all available information from the feature
    const analysis: any = {
      projectCode: extractProjectCode(feature),
      location: extractLocation(feature),
      projectType: extractProjectType(feature),
      status: extractStatus(feature),
      description: feature.description || 'No description provided',
      additionalInfo: feature.extendedData || {},
      interpretation: generateInterpretation(feature, kmlContext)
    }

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze feature' },
      { status: 500 }
    )
  }
}

function extractProjectCode(feature: any): string {
  // Try to extract project code from various fields
  const extData = feature.extendedData || {}

  // Common field names for project codes
  const codeFields = ['code', 'project_code', 'projectcode', 'id', 'project_id', 'projectid', 'pser_code']

  for (const field of codeFields) {
    const key = Object.keys(extData).find(k => k.toLowerCase() === field)
    if (key && extData[key]) return extData[key]
  }

  // Try to extract from name
  const nameMatch = feature.name?.match(/[A-Z]{2,}-\d+|PSER-\d+|\d{4,}/i)
  if (nameMatch) return nameMatch[0]

  return feature.name || 'N/A'
}

function extractLocation(feature: any): string {
  const coords = feature.coordinates?.[0]
  if (coords) {
    const [lat, lng] = coords
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const extData = feature.extendedData || {}
  const locationFields = ['location', 'address', 'site', 'area', 'barangay', 'municipality']

  for (const field of locationFields) {
    const key = Object.keys(extData).find(k => k.toLowerCase().includes(field))
    if (key && extData[key]) return extData[key]
  }

  return 'Location not specified'
}

function extractProjectType(feature: any): string {
  const extData = feature.extendedData || {}

  const typeFields = ['type', 'project_type', 'projecttype', 'category', 'work_type']

  for (const field of typeFields) {
    const key = Object.keys(extData).find(k => k.toLowerCase() === field)
    if (key && extData[key]) return extData[key]
  }

  // Infer from geometry
  if (feature.coordinates.length > 1) {
    return 'Linear infrastructure (Power line, Road, Pipeline, etc.)'
  }

  return 'Point infrastructure'
}

function extractStatus(feature: any): string {
  const extData = feature.extendedData || {}

  const statusFields = ['status', 'project_status', 'state', 'phase']

  for (const field of statusFields) {
    const key = Object.keys(extData).find(k => k.toLowerCase().includes(field))
    if (key && extData[key]) return extData[key]
  }

  return 'Status not specified'
}

function generateInterpretation(feature: any, kmlContext?: string): string {
  const parts: string[] = []

  parts.push(`This is a PSER (Power Sector Engineering Resources) project feature named "${feature.name}".`)

  if (feature.coordinates.length > 1) {
    const distance = calculateDistance(feature.coordinates)
    parts.push(`It represents a linear structure spanning approximately ${distance.toFixed(2)} km.`)
  } else {
    parts.push('It represents a point location.')
  }

  const extData = feature.extendedData || {}
  if (Object.keys(extData).length > 0) {
    parts.push(`The feature contains ${Object.keys(extData).length} extended data attributes.`)
  }

  // Analyze description for keywords
  const desc = (feature.description || '').toLowerCase()
  if (desc.includes('transmission')) parts.push('This appears to be a transmission line project.')
  else if (desc.includes('distribution')) parts.push('This appears to be a distribution line project.')
  else if (desc.includes('substation')) parts.push('This appears to be a substation project.')
  else if (desc.includes('tower')) parts.push('This appears to involve transmission towers.')

  return parts.join(' ')
}

function calculateDistance(coordinates: [number, number][]): number {
  let totalDistance = 0

  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lon1] = coordinates[i]
    const [lat2, lon2] = coordinates[i + 1]

    // Haversine formula
    const R = 6371 // Earth's radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    totalDistance += R * c
  }

  return totalDistance
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}
