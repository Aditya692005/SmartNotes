import { YoutubeTranscript } from 'youtube-transcript'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 })
    }

    // Extract video ID from URL
    const videoId = extractVideoId(url)
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL format' }, { status: 400 })
    }

    console.log(`Processing YouTube video: ${videoId}`)

    // Try to get transcript using youtube-transcript library
    let transcript = ""
    let videoTitle = "YouTube Video"
    
    try {
      // Try multiple approaches to get transcript
      let transcriptData = null
      
      // Approach 1: Try with English
      try {
        transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'en'
        })
        console.log(`Successfully fetched English transcript: ${transcriptData.length} segments`)
      } catch (enError) {
        console.log(`English transcript failed: ${enError instanceof Error ? enError.message : 'Unknown error'}`)
      }

      // Approach 2: Try auto-generated (no language specified)
      if (!transcriptData || transcriptData.length === 0) {
        try {
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId)
          console.log(`Successfully fetched auto-generated transcript: ${transcriptData.length} segments`)
        } catch (autoError) {
          console.log(`Auto-generated transcript failed: ${autoError instanceof Error ? autoError.message : 'Unknown error'}`)
        }
      }

      // Approach 3: Try any available language
      if (!transcriptData || transcriptData.length === 0) {
        try {
          transcriptData = await YoutubeTranscript.fetchTranscript(videoId, {
            lang: 'any'
          })
          console.log(`Successfully fetched transcript in any language: ${transcriptData.length} segments`)
        } catch (anyError) {
          console.log(`Any language transcript failed: ${anyError instanceof Error ? anyError.message : 'Unknown error'}`)
        }
      }

      if (!transcriptData || transcriptData.length === 0) {
        throw new Error("No transcript available")
      }

      // Combine all transcript segments into a single text
      transcript = transcriptData
        .map(item => item.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

      if (!transcript) {
        throw new Error("Transcript is empty")
      }

      console.log(`Transcript length: ${transcript.length} characters`)

    } catch (transcriptError) {
      console.error("Transcript extraction failed:", transcriptError)
      
      // If transcript extraction fails, provide a helpful error message
      return NextResponse.json({ 
        error: `🚫 YouTube Transcript Not Available

Unfortunately, we cannot extract the transcript from this YouTube video. This happens because:

1. **No Captions Available** - The video doesn't have captions or auto-generated subtitles
2. **Captions Disabled** - The creator has disabled captions for this video
3. **Regional Restrictions** - The video may be restricted in your region
4. **Private/Unlisted Video** - The video may be private or unlisted

🔄 **Alternative Solutions:**

1. **📁 File Upload Method:**
   - Download the video as audio (MP3/WAV) using a tool like yt-dlp
   - Use our "File Upload" feature to transcribe it
   - This method works with any audio/video file

2. **🎤 Live Recording Method:**
   - Play the YouTube video on your device
   - Use our "Live Recording" feature to record the audio
   - This captures the audio in real-time

3. **📝 Manual Method:**
   - Copy the transcript from YouTube's captions manually
   - Paste it directly into our text input
   - Generate notes and mindmaps from the text

💡 **Recommended Videos:**
Try videos that typically have captions:
• Educational content (TED talks, Khan Academy, Crash Course)
• News videos (BBC, CNN, etc.)
• Official music videos with lyrics
• Documentary content

Try one of the alternative methods above - they work with any content!` 
      }, { status: 404 })
    }

    return NextResponse.json({
      transcript,
      videoTitle,
      videoId,
      audioSize: 0 // No audio download needed for transcript method
    })

  } catch (error) {
    console.error('YouTube transcription error:', error)
    
    return NextResponse.json({ 
      error: `Failed to process YouTube video: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    // Standard YouTube watch URLs
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short YouTube URLs
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // YouTube embed URLs
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube URLs with additional parameters
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    // YouTube mobile URLs
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // YouTube URLs with timestamp
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:&t=\d+)?/
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      const videoId = match[1]
      if (videoId.length === 11) {
        console.log(`Extracted video ID: ${videoId}`)
        return videoId
      }
    }
  }

  console.log(`Failed to extract video ID from URL: ${url}`)
  return null
}
