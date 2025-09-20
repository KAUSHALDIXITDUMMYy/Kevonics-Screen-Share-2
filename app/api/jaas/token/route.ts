import { NextRequest, NextResponse } from "next/server"
import { SignJWT, importPKCS8 } from "jose"

// Run this route on the Edge to minimize latency when generating JaaS tokens
export const runtime = "edge"
export const dynamic = "force-dynamic"
export const revalidate = 0
// Prefer US-East by default; adjust to where most users are (e.g., "fra1", "lhr1", "sin1")
export const preferredRegion = ["iad1"]

type TokenRequestBody = {
  roomName: string
  user?: {
    name?: string
    email?: string
    id?: string
    moderator?: boolean
  }
}
export async function POST(req: NextRequest) {
  try {
    const appId = process.env.NEXT_PUBLIC_JAAS_APP_ID || "vpaas-magic-cookie-3c21a1fc69704478860d6fde13ead909"
    const apiKey = process.env.JAAS_API_KEY || "vpaas-magic-cookie-3c21a1fc69704478860d6fde13ead909/89576c"
    const privateKeyPem = process.env.JAAS_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC66wwCjl8MkXE1
5P3TNhHTqWxNZS66H+fuMtKhYZCbWRp6hvUFKPNJnxDRE8ohLMWPHI92s/Q+dNKw
/taCa1bHhHck2kNnPBhoMAe2Wgu/wARmjGsA3o5ighwt3DvzhjbqIJH0Gg2iKiNO
5lD+u5cKOgxQjwy2xDcSwSQCuHA5Wk48a9GwMNvzbA6yowNQHtIwVIhJGWfdSdwx
/HLngIe8mSnxxOaq3znA11J6uyGh05F23richYniHAYd+ipOrC/ty6zkzjEXyF+R
5odDr8KkeRYjpGp7BXwh0cdRERIdAqhofXP4yX2bnhUCbZwPn9gCcE9ygzh4otW9
GZBHZSzxAgMBAAECggEAKMJmjQwkt+XjTQBRRURuILy6LCpbRST9+1hDzAMteGK2
vm89cNGcM7qm/SCWnCNaNTniIt1c7l2lMAlyF2B2vO0q2fNqbVGSdO28UMxT8Y1a
qE4Ia1kcrWh34pw6yoDC6s0NZrBjtq//oQ3iLZoUdptv4gU/nX8uDz3kr18uwaKL
JW4qb5mcWAgzyXWAv1EdSYpXFkWfrDGP2ixMKtsAvBhIB2+PYSiAOkJqSKa8lanT
wHlZDKTQ0S2tIF+oXcKR64zpOxzgKXocGTT3k7JiL1Vf1m5y4ybRwDRZl8UCbMiu
NZnP3BXZu4mQajtfE4GRI08WoZ9SaXLKeKsdmQGK7QKBgQDibMA5rSS5UsKAvAId
RJCcYJ4tN8f1a/ilBJKsZns+WazbbJnLz+MNDpQbshSWEtcjtKBViZbOyZgDLFW7
OjJN+M28PcVC8utY/PY/9xC7i64ebwG7ILfsybriWMXGppkHbwYL3FeVenU/KccC
uCUblqbdSJrefmXOhReL38HZjwKBgQDTVUM7nnHwHkdtp1tNLPdnlLZcxr/9z9wd
cMz0pWZQFZKl6Bx9q62QVbXnUaI94QWcYcKvkG+gkPA9Fv7dgikrtEYihdt/PGoj
DvIFHYuqXUiXTKAU8lbJfY/5eoN3tlfyzDeE9BdgNr1kTA1zuc/00IcT9mO8+I0H
35Ozr1xRfwKBgQCpYlevDgLyDKJq8brXMErKYVETXK5ev8YDlNcw132NGELC54xq
NvuQ8f4EdgUGe9Or510mgEZsLc1lWk5MQO4O/HjUQJWITveW265QDcDbvFOmer6d
wY02O3duCqDxygGi2QB58P0oWrLJbLRvKVjBOcNcuQr6NS5t/4ys29hFqwKBgGnS
qx0ChUlY0CmvgP+PQb/jbsHcYC1HVZCEeI0U+bumYc2kAghH3FyHHtRbQ2O69yVM
qsFhERSVH0dn6W2gDN+uoOQOpU/8P6WYiUZYeiRwG7Zvj0WN6DlzH5IscAKVE0so
SbDQzZfHMWU01BOb+u87MDily2HIEE7d/McgS5kfAoGAHUWPjnB3UynfUwgmGl28
XfhfkVSUyWQqFeDUH9256xlhMwhPDobv3YX2SD3iYHqbCUX/qRvGyoe5ZDa2Ch3c
EAvlEeWwFt7ALW34LKLmJUx15q2chnz0zPT+4i4YozGhup0wnt2WRW4/dbWrZQTi
REA31ENwj9XLMkGR0XwwVKw=
-----END PRIVATE KEY-----`


    if (!appId || !apiKey || !privateKeyPem) {
      return NextResponse.json({ error: "Server is missing JaaS configuration" }, { status: 500 })
    }

    const { roomName, user }: TokenRequestBody = await req.json()

    if (!roomName || typeof roomName !== "string") {
      return NextResponse.json({ error: "roomName is required" }, { status: 400 })
    }

    // Import the PKCS8 private key for RS256
    const alg = "RS256"
    const normalizedPem = privateKeyPem.includes("\\n") ? privateKeyPem.replace(/\\n/g, "\n") : privateKeyPem
    const privateKey = await importPKCS8(normalizedPem, alg)

    const nowSeconds = Math.floor(Date.now() / 1000)
    const expSeconds = nowSeconds + 60 * 60 * 8 // 8 hours

    const payload: any = {
      aud: "jitsi",
      iss: "chat",
      sub: appId,
      room: roomName,
      context: {
        user: {
          name: user?.name || "Guest",
          email: user?.email || "",
          id: user?.id || undefined,
          moderator: !!user?.moderator,
        },
      },
      nbf: nowSeconds - 10,
      iat: nowSeconds,
      exp: expSeconds,
    }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg, kid: apiKey })
      .sign(privateKey)

    return NextResponse.json({ token })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to generate token" }, { status: 500 })
  }
}


