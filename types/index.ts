export interface KMLData {
  features: KMLFeature[]
  rawXml: string
}

export interface KMLFeature {
  name: string
  description: string
  coordinates: [number, number][]
  extendedData?: Record<string, any>
  rawXml: string
}

export interface ProjectDetails {
  projectCode?: string
  location?: string
  projectType?: string
  status?: string
  description?: string
  additionalInfo?: Record<string, any>
  interpretation?: string
}
