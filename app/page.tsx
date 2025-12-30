'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { KMLData, ProjectDetails } from '@/types'

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function Home() {
  const [kmlData, setKmlData] = useState<KMLData | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, 'text/xml')

        // Parse KML to extract features
        const placemarks = xmlDoc.getElementsByTagName('Placemark')
        const features: any[] = []

        for (let i = 0; i < placemarks.length; i++) {
          const placemark = placemarks[i]
          const name = placemark.getElementsByTagName('name')[0]?.textContent || `Feature ${i + 1}`
          const description = placemark.getElementsByTagName('description')[0]?.textContent || ''

          // Extract coordinates
          const coords = placemark.getElementsByTagName('coordinates')[0]?.textContent?.trim()
          if (coords) {
            const coordPairs = coords.split(/\s+/).map(coord => {
              const [lng, lat, alt] = coord.split(',').map(Number)
              return [lat, lng]
            })

            // Extract extended data
            const extendedData: any = {}
            const simpleData = placemark.getElementsByTagName('SimpleData')
            for (let j = 0; j < simpleData.length; j++) {
              const dataEl = simpleData[j]
              const key = dataEl.getAttribute('name')
              const value = dataEl.textContent
              if (key) extendedData[key] = value
            }

            features.push({
              name,
              description,
              coordinates: coordPairs,
              extendedData,
              rawXml: new XMLSerializer().serializeToString(placemark)
            })
          }
        }

        setKmlData({
          features,
          rawXml: text
        })
      } catch (err) {
        setError('Error parsing KML file. Please ensure it is a valid KML file.')
        console.error(err)
      }
    }

    reader.readAsText(file)
  }, [])

  const handleFeatureClick = useCallback(async (feature: any) => {
    setSelectedFeature(feature)
    setAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feature,
          kmlContext: kmlData?.rawXml
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze feature')
      }

      const details = await response.json()
      setProjectDetails(details)
    } catch (err) {
      setError('Error analyzing feature. Please try again.')
      console.error(err)
    } finally {
      setAnalyzing(false)
    }
  }, [kmlData])

  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-blue-600 text-white p-4 shadow-lg">
        <h1 className="text-2xl font-bold">KML PSER Project Analyzer</h1>
        <p className="text-sm mt-1">Upload KML files and click on map features to extract project details</p>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-gray-100 dark:bg-gray-800 p-4 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Upload KML File
            </label>
            <input
              type="file"
              accept=".kml"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 rounded-lg cursor-pointer bg-white dark:bg-gray-700 focus:outline-none p-2"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {kmlData && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Loaded Features</h2>
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow">
                <p className="text-sm">Total features: {kmlData.features.length}</p>
              </div>
            </div>
          )}

          {selectedFeature && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Selected Feature</h2>
              <div className="bg-white dark:bg-gray-700 p-3 rounded shadow space-y-2">
                <div>
                  <span className="font-medium">Name:</span> {selectedFeature.name}
                </div>
                {selectedFeature.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="text-sm mt-1">{selectedFeature.description}</p>
                  </div>
                )}
                <div>
                  <span className="font-medium">Location:</span>
                  <p className="text-sm mt-1">
                    {selectedFeature.coordinates[0]?.join(', ')}
                  </p>
                </div>
                {Object.keys(selectedFeature.extendedData || {}).length > 0 && (
                  <div>
                    <span className="font-medium">Extended Data:</span>
                    <pre className="text-xs mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedFeature.extendedData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {analyzing && (
            <div className="mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">
                <p className="text-center">Analyzing with AI...</p>
              </div>
            </div>
          )}

          {projectDetails && !analyzing && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">PSER Project Details</h2>
              <div className="bg-white dark:bg-gray-700 p-4 rounded shadow space-y-3">
                {projectDetails.projectCode && (
                  <div>
                    <span className="font-medium">Project Code:</span>
                    <p className="mt-1">{projectDetails.projectCode}</p>
                  </div>
                )}
                {projectDetails.location && (
                  <div>
                    <span className="font-medium">Location:</span>
                    <p className="mt-1">{projectDetails.location}</p>
                  </div>
                )}
                {projectDetails.projectType && (
                  <div>
                    <span className="font-medium">Project Type:</span>
                    <p className="mt-1">{projectDetails.projectType}</p>
                  </div>
                )}
                {projectDetails.status && (
                  <div>
                    <span className="font-medium">Status:</span>
                    <p className="mt-1">{projectDetails.status}</p>
                  </div>
                )}
                {projectDetails.description && (
                  <div>
                    <span className="font-medium">Description:</span>
                    <p className="mt-1 text-sm">{projectDetails.description}</p>
                  </div>
                )}
                {projectDetails.additionalInfo && (
                  <div>
                    <span className="font-medium">Additional Information:</span>
                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                      {JSON.stringify(projectDetails.additionalInfo, null, 2)}
                    </pre>
                  </div>
                )}
                {projectDetails.interpretation && (
                  <div>
                    <span className="font-medium">AI Interpretation:</span>
                    <p className="mt-1 text-sm">{projectDetails.interpretation}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 h-96 lg:h-auto">
          {kmlData ? (
            <MapComponent
              features={kmlData.features}
              onFeatureClick={handleFeatureClick}
              selectedFeature={selectedFeature}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-300">Upload a KML file to view map</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
