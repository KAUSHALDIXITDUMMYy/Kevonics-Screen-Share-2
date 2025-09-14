"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { getAvailableStreams } from "@/lib/subscriber"
import type { SubscriberPermission } from "@/lib/subscriber"
import { StreamViewer } from "./stream-viewer"
import { Monitor, Activity, Gamepad2, Trophy, Users } from "lucide-react"

export function RealTimeStreams() {
  const { user } = useAuth()
  const [availableStreams, setAvailableStreams] = useState<SubscriberPermission[]>([])
  const [selectedStream, setSelectedStream] = useState<SubscriberPermission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!user) return

    const loadStreams = async () => {
      try {
        console.log("[v0] Loading streams for user:", user.uid)
        const streams = await getAvailableStreams(user.uid)
        console.log("[v0] Available streams loaded:", streams.length)
        setAvailableStreams(streams)
        setError("")
      } catch (err: any) {
        console.error("[v0] Error loading streams:", err)
        setError("Failed to load streams")
      } finally {
        setLoading(false)
      }
    }

    loadStreams()

    // Set up polling for real-time updates
    const interval = setInterval(loadStreams, 5000) // Poll every 5 seconds

    return () => clearInterval(interval)
  }, [user])

  const handleSelectStream = (stream: SubscriberPermission) => {
    console.log("[v0] Selecting stream:", stream.id)
    setSelectedStream(stream)
  }

  const handleBackToList = () => {
    setSelectedStream(null)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading streams...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show selected stream viewer
  if (selectedStream) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={handleBackToList}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            ← Back to Streams
          </button>
        </div>
        <StreamViewer permission={selectedStream} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Real-time Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-500" />
              <CardTitle>Live Streams</CardTitle>
              <Badge variant="outline" className="animate-pulse">
                Auto-updating
              </Badge>
            </div>
          </div>
          <CardDescription>Your stream access is managed by administrators</CardDescription>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Available Streams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {availableStreams.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center text-muted-foreground">
                <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Active Streams</h3>
                <p>There are currently no live streams available to you.</p>
                <p className="text-sm mt-2">
                  Contact your administrator to get stream access or wait for publishers to start streaming.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          availableStreams.map((stream) => (
            <Card key={stream.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center space-x-2">
                      <Badge variant="destructive" className="animate-pulse">
                        LIVE
                      </Badge>
                      <span>{stream.streamSession?.title || "Untitled Stream"}</span>
                    </CardTitle>
                    <CardDescription>Publisher: {stream.publisherName}</CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {stream.streamSession?.description && (
                  <p className="text-sm text-muted-foreground">{stream.streamSession.description}</p>
                )}

                {(stream.streamSession?.gameName || stream.streamSession?.league || stream.streamSession?.match) && (
                  <div className="space-y-2">
                    {stream.streamSession.gameName && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Gamepad2 className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">Game:</span>
                        <span>{stream.streamSession.gameName}</span>
                      </div>
                    )}
                    {stream.streamSession.league && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span className="font-medium">League:</span>
                        <span>{stream.streamSession.league}</span>
                      </div>
                    )}
                    {stream.streamSession.match && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Match:</span>
                        <span>{stream.streamSession.match}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge variant={stream.allowVideo ? "default" : "secondary"}>
                      Video: {stream.allowVideo ? "✓" : "✗"}
                    </Badge>
                    <Badge variant={stream.allowAudio ? "default" : "secondary"}>
                      Audio: {stream.allowAudio ? "✓" : "✗"}
                    </Badge>
                  </div>
                  <button
                    onClick={() => handleSelectStream(stream)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Watch Stream
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
