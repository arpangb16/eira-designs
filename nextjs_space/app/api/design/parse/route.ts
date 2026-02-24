import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { instruction } = body

    if (!instruction) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      )
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a design instruction parser for apparel design automation. Parse natural language design instructions into structured JSON format with placement specifications.'
      },
      {
        role: 'user',
        content: `Parse this design instruction into structured JSON format:

"${instruction}"

Respond with JSON in this exact format:
{
  "elements": [
    {
      "type": "logo" | "text" | "graphic",
      "content": "description of what to place",
      "location": "top left" | "top center" | "top right" | "center" | "bottom left" | "bottom center" | "bottom right" | "back top" | "back center" | "back bottom",
      "size": "small" | "medium" | "large",
      "notes": "any additional specifications"
    }
  ],
  "summary": "brief summary of the design"
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`
      }
    ]

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ABACUSAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        messages: messages,
        stream: true,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      throw new Error('LLM API request failed')
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        const encoder = new TextEncoder()
        let buffer = ''
        let partialRead = ''

        try {
          while (true) {
            const { done, value } = await reader?.read() ?? { done: true, value: undefined }
            if (done) break

            partialRead += decoder.decode(value, { stream: true })
            let lines = partialRead.split('\n')
            partialRead = lines.pop() ?? ''

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer)
                    const finalData = JSON.stringify({
                      status: 'completed',
                      result: finalResult
                    })
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`))
                  } catch (e) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', message: 'Failed to parse response' })}\n\n`))
                  }
                  return
                }
                try {
                  const parsed = JSON.parse(data)
                  buffer += parsed.choices?.[0]?.delta?.content ?? ''
                  const progressData = JSON.stringify({
                    status: 'processing',
                    message: 'Parsing instruction'
                  })
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`))
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error parsing design instruction:', error)
    return NextResponse.json(
      { error: 'Failed to parse design instruction' },
      { status: 500 }
    )
  }
}
