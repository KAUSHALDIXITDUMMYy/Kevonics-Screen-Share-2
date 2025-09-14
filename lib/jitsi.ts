declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

export interface JitsiConfig {
  roomName: string
  width: string | number
  height: string | number
  parentNode: HTMLElement
  configOverwrite?: {
    startWithAudioMuted?: boolean
    startWithVideoMuted?: boolean
    enableWelcomePage?: boolean
    prejoinPageEnabled?: boolean
    disableModeratorIndicator?: boolean
    startScreenSharing?: boolean
    enableEmailInStats?: boolean
  }
  interfaceConfigOverwrite?: {
    TOOLBAR_BUTTONS?: string[]
    SETTINGS_SECTIONS?: string[]
    SHOW_JITSI_WATERMARK?: boolean
    SHOW_WATERMARK_FOR_GUESTS?: boolean
    SHOW_BRAND_WATERMARK?: boolean
    BRAND_WATERMARK_LINK?: string
    SHOW_POWERED_BY?: boolean
    DISPLAY_WELCOME_PAGE_CONTENT?: boolean
    DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT?: boolean
    APP_NAME?: string
    NATIVE_APP_NAME?: string
    PROVIDER_NAME?: string
    LANG_DETECTION?: boolean
    CONNECTION_INDICATOR_DISABLED?: boolean
    VIDEO_QUALITY_LABEL_DISABLED?: boolean
    RECENT_LIST_ENABLED?: boolean
    OPTIMAL_BROWSERS?: string[]
    UNSUPPORTED_BROWSERS?: string[]
    AUTO_PIN_LATEST_SCREEN_SHARE?: boolean
    DISABLE_VIDEO_BACKGROUND?: boolean
    DISABLE_BLUR_SUPPORT?: boolean
  }
  userInfo?: {
    displayName?: string
    email?: string
  }
  jwt?: string
}

export class JitsiManager {
  private api: any = null
  private domain = "8x8.vc"
  private magicCookie = "vpaas-magic-cookie-803ebf0cf2d54a5c91f4f55168c2811e"
  private jwt =
    "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtODAzZWJmMGNmMmQ1NGE1YzkxZjRmNTUxNjhjMjgxMWUiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NTc4NzU0MjUsImV4cCI6MTc1Nzg4MjYyNSwibmJmIjoxNzU3ODc1NDIwLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtODAzZWJmMGNmMmQ1NGE1YzkxZjRmNTUxNjhjMjgxMWUiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDEwMzY3NjQ0MjA4OTcxNjY3NDYyNCIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.RoJM3erucgdXQ-P8H7MS2MjwHCb9Nx3vMmAD7zI73Ljw6o-UDlVZAIx3cN1ODASWHzNsrUSJQaksvwGDIp2S7XpdSt6wB9m5ea9s-GfdlFDNao4Nm2-F42nhc8qgjEphehzqDHgLqnMdwKeSgXmhcJc-I9Co0C2Sz6coUOMFSMeFSpT7um4VmNMRKlEgjqb6tJrO0pHHp6SJHvWX5RrBOQAMdPVl1FyOSzUUGCwWLbI2krnfvR0i5P8Q1Ls6zBnWisvP_yVZKbVVN1bSbKgHleqFQAVo_kphOJKqTUKEmQ_BFXorQivmmebXlxgC-6YFUGU4mPuR7USL_Oy_OpGxNA"

  constructor() {
    this.loadJitsiScript()
  }

  private loadJitsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.JitsiMeetExternalAPI) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = `https://${this.domain}/${this.magicCookie}/external_api.js`
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load Jitsi Meet API"))
      document.head.appendChild(script)
    })
  }

  private generateJaaSRoomName(roomName: string): string {
    return `${this.magicCookie}/${roomName}`
  }

  async createRoom(config: JitsiConfig): Promise<any> {
    await this.loadJitsiScript()

    const defaultConfig = {
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        enableWelcomePage: false,
        prejoinPageEnabled: false,
        disableModeratorIndicator: true,
        startScreenSharing: false,
        enableEmailInStats: false,
        ...config.configOverwrite,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          "microphone",
          "camera",
          "desktop",
          "fullscreen",
          "fodeviceselection",
          "hangup",
          "profile",
          "recording",
          "livestreaming",
          "etherpad",
          "sharedvideo",
          "settings",
          "raisehand",
          "videoquality",
          "filmstrip",
          "feedback",
          "stats",
          "shortcuts",
          "tileview",
          "videobackgroundblur",
          "download",
          "help",
          "mute-everyone",
          "security",
        ],
        SETTINGS_SECTIONS: ["devices", "language", "moderator", "profile", "calendar"],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        DISPLAY_WELCOME_PAGE_TOOLBAR_ADDITIONAL_CONTENT: false,
        APP_NAME: "Kevonics Screen Share",
        NATIVE_APP_NAME: "Kevonics Screen Share",
        PROVIDER_NAME: "Kevonics Screen Share",
        LANG_DETECTION: false,
        CONNECTION_INDICATOR_DISABLED: false,
        VIDEO_QUALITY_LABEL_DISABLED: false,
        RECENT_LIST_ENABLED: false,
        AUTO_PIN_LATEST_SCREEN_SHARE: true,
        DISABLE_VIDEO_BACKGROUND: false,
        DISABLE_BLUR_SUPPORT: false,
        ...config.interfaceConfigOverwrite,
      },
      jwt: config.jwt || this.jwt,
      ...config,
      roomName: this.generateJaaSRoomName(config.roomName),
    }

    console.log("[v0] Creating JaaS room with config:", {
      domain: this.domain,
      roomName: defaultConfig.roomName,
      hasJWT: !!defaultConfig.jwt,
    })

    this.api = new window.JitsiMeetExternalAPI(this.domain, defaultConfig)

    this.api.addEventListener("videoConferenceJoined", () => {
      console.log("[v0] Successfully joined JaaS conference")
    })

    this.api.addEventListener("videoConferenceLeft", () => {
      console.log("[v0] Left JaaS conference")
    })

    return this.api
  }

  async startScreenShare(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleShareScreen")
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleShareScreen")
    }
  }

  async muteAudio(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleAudio")
    }
  }

  async unmuteAudio(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleAudio")
    }
  }

  async muteVideo(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleVideo")
    }
  }

  async unmuteVideo(): Promise<void> {
    if (this.api) {
      await this.api.executeCommand("toggleVideo")
    }
  }

  addEventListener(event: string, listener: Function): void {
    if (this.api) {
      this.api.addEventListener(event, listener)
    }
  }

  removeEventListener(event: string, listener: Function): void {
    if (this.api) {
      this.api.removeEventListener(event, listener)
    }
  }

  dispose(): void {
    if (this.api) {
      this.api.dispose()
      this.api = null
    }
  }

  getApi(): any {
    return this.api
  }
}

export const jitsiManager = new JitsiManager()
