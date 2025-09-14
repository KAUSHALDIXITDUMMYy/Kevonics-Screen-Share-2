"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Play, Square, Monitor, MonitorOff, Mic, MicOff, Video, VideoOff, Users, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { jitsiManager } from "@/lib/jitsi"
import { createStreamSession, endStreamSession, generateRoomId, type StreamSession } from "@/lib/streaming"

interface StreamControlsProps {
  onStreamStart?: (session: StreamSession) => void
  onStreamEnd?: () => void
}

export function StreamControls({ onStreamStart, onStreamEnd }: StreamControlsProps) {
  const { user, userProfile } = useAuth()
  const [isStreaming, setIsStreaming] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [currentSession, setCurrentSession] = useState<StreamSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Stream setup form
  const [streamTitle, setStreamTitle] = useState("")
  const [streamDescription, setStreamDescription] = useState("")
  const [gameName, setGameName] = useState("")
  const [league, setLeague] = useState("")
  const [match, setMatch] = useState("")

  const [jitsiContainer, setJitsiContainer] = useState<HTMLDivElement | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      jitsiManager.dispose()
    }
  }, [])

  const handleStartStream = async () => {
    if (!user || !userProfile) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const roomId = generateRoomId(user.uid)

      // Create stream session in database
      const sessionResult = await createStreamSession({
        publisherId: user.uid,
        publisherName: userProfile.displayName || userProfile.email,
        roomId,
        isActive: true,
        title: streamTitle || "Untitled Stream",
        description: streamDescription,
        gameName: gameName || undefined,
        league: league || undefined,
        match: match || undefined,
      })

      if (!sessionResult.success) {
        throw new Error(sessionResult.error)
      }

      // Initialize Jitsi Meet
      if (jitsiContainer) {
        const api = await jitsiManager.createRoom({
          roomName: roomId,
          width: "100%",
          height: 500,
          parentNode: jitsiContainer,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            prejoinPageEnabled: false,
            disableModeratorIndicator: true,
            startScreenSharing: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: ["microphone", "camera", "desktop", "hangup", "settings", "videoquality", "filmstrip"],
            SHOW_JITSI_WATERMARK: false,
            SHOW_POWERED_BY: false,
            APP_NAME: "Kevonics Screen Share",
          },
          userInfo: {
            displayName: userProfile.displayName || userProfile.email,
            email: userProfile.email,
          },
        })

        // Set up event listeners
        api.addEventListener("videoConferenceJoined", () => {
          setIsStreaming(true)
          setSuccess("Stream started successfully!")
          onStreamStart?.(sessionResult.session!)
        })

        api.addEventListener("videoConferenceLeft", () => {
          handleEndStream()
        })

        api.addEventListener("screenSharingStatusChanged", (event: any) => {
          setIsScreenSharing(event.on)
        })

        api.addEventListener("audioMuteStatusChanged", (event: any) => {
          setIsAudioMuted(event.muted)
        })

        api.addEventListener("videoMuteStatusChanged", (event: any) => {
          setIsVideoMuted(event.muted)
        })

        setCurrentSession(sessionResult.session!)
      }
    } catch (err: any) {
      setError(err.message || "Failed to start stream")
    }

    setLoading(false)
  }

  const handleEndStream = async () => {
    if (!currentSession) return

    setLoading(true)

    try {
      await endStreamSession(currentSession.id!)
      jitsiManager.dispose()
      setIsStreaming(false)
      setIsScreenSharing(false)
      setIsAudioMuted(false)
      setIsVideoMuted(false)
      setCurrentSession(null)
      setStreamTitle("")
      setStreamDescription("")
      setGameName("")
      setLeague("")
      setMatch("")
      setSuccess("Stream ended successfully!")
      onStreamEnd?.()
    } catch (err: any) {
      setError(err.message || "Failed to end stream")
    }

    setLoading(false)
  }

  const handleToggleScreenShare = async () => {
    try {
      await jitsiManager.startScreenShare()
    } catch (err: any) {
      setError("Failed to toggle screen share")
    }
  }

  const handleToggleAudio = async () => {
    try {
      if (isAudioMuted) {
        await jitsiManager.unmuteAudio()
      } else {
        await jitsiManager.muteAudio()
      }
    } catch (err: any) {
      setError("Failed to toggle audio")
    }
  }

  const handleToggleVideo = async () => {
    try {
      if (isVideoMuted) {
        await jitsiManager.unmuteVideo()
      } else {
        await jitsiManager.muteVideo()
      }
    } catch (err: any) {
      setError("Failed to toggle video")
    }
  }

  return (
    <div className="space-y-6">
      {/* Stream Setup */}
      {!isStreaming && (
        <Card>
          <CardHeader>
            <CardTitle>Start New Stream</CardTitle>
            <CardDescription>Configure your stream settings and start broadcasting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Stream Title</Label>
              <Input
                id="title"
                value={streamTitle}
                onChange={(e) => setStreamTitle(e.target.value)}
                placeholder="Enter stream title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={streamDescription}
                onChange={(e) => setStreamDescription(e.target.value)}
                placeholder="Describe your stream"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameName">Game Name</Label>
                <Input
                  id="gameName"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="e.g., League of Legends"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="league">League</Label>
                <Input
                  id="league"
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  placeholder="e.g., LCS, LEC, Worlds"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="match">Match</Label>
                <Input
                  id="match"
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  placeholder="e.g., Team A vs Team B"
                />
              </div>
            </div>

            <Button onClick={handleStartStream} disabled={loading} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              {loading ? "Starting Stream..." : "Start Stream"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Stream Controls */}
      {isStreaming && currentSession && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Badge variant="destructive" className="animate-pulse">
                    LIVE
                  </Badge>
                  <span>{currentSession.title}</span>
                </CardTitle>
                <CardDescription className="flex items-center space-x-4 mt-2">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Started: {new Date(currentSession.createdAt).toLocaleTimeString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Room: {currentSession.roomId}</span>
                  </span>
                </CardDescription>
                {(currentSession.gameName || currentSession.league || currentSession.match) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {currentSession.gameName && <Badge variant="outline">Game: {currentSession.gameName}</Badge>}
                    {currentSession.league && <Badge variant="outline">League: {currentSession.league}</Badge>}
                    {currentSession.match && <Badge variant="outline">Match: {currentSession.match}</Badge>}
                  </div>
                )}
              </div>
              <Button variant="destructive" onClick={handleEndStream} disabled={loading}>
                <Square className="h-4 w-4 mr-2" />
                {loading ? "Ending..." : "End Stream"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant={isScreenSharing ? "default" : "outline"} onClick={handleToggleScreenShare} size="sm">
                {isScreenSharing ? (
                  <>
                    <MonitorOff className="h-4 w-4 mr-2" />
                    Stop Screen Share
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4 mr-2" />
                    Share Screen
                  </>
                )}
              </Button>

              <Button variant={isAudioMuted ? "destructive" : "default"} onClick={handleToggleAudio} size="sm">
                {isAudioMuted ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Mute
                  </>
                )}
              </Button>

              <Button variant={isVideoMuted ? "destructive" : "default"} onClick={handleToggleVideo} size="sm">
                {isVideoMuted ? (
                  <>
                    <VideoOff className="h-4 w-4 mr-2" />
                    Turn On Video
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4 mr-2" />
                    Turn Off Video
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jitsi Meet Container */}
      <Card>
        <CardHeader>
          <CardTitle>Stream View</CardTitle>
          <CardDescription>
            {isStreaming
              ? "Your live stream is active. Use the controls above to manage your broadcast."
              : "Start a stream to see the broadcast interface here."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={setJitsiContainer}
            className="w-full h-[500px] bg-muted rounded-lg flex items-center justify-center"
          >
            {!isStreaming && (
              <div className="text-center text-muted-foreground">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p>Stream interface will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
