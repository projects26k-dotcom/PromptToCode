/**
 * Plain fetch streaming client for Google Gemini API via Server-Sent Events (SSE).
 */

export async function* streamGemini({ apiKey, model, systemPrompt, messages, signal }) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please add your key in Settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

  // Find the index of the latest user message that has attached images
  let latestImageMsgIdx = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user' && messages[i].images && messages[i].images.length > 0) {
      latestImageMsgIdx = i;
      break;
    }
  }

  // Format messages for Gemini API
  // Gemini expects roles: "user" and "model"
  const formattedContents = messages.map((msg, idx) => {
    const isAssistant = msg.role === 'assistant' || msg.role === 'model';
    const role = isAssistant ? 'model' : 'user';
    const textContent = msg.content || '';
    const parts = [];

    if (textContent) {
      parts.push({ text: textContent });
    }

    // Attach image parts
    if (msg.images && msg.images.length > 0) {
      if (idx === latestImageMsgIdx) {
        // Only latest user message with images sends full image data
        for (const img of msg.images) {
          if (img.base64) {
            parts.push({
              inline_data: {
                mime_type: img.mimeType || 'image/jpeg',
                data: img.base64,
              },
            });
          }
        }
      } else {
        // Older messages in conversation history send a text placeholder
        parts.push({ text: '[an image was attached here]' });
      }
    }

    if (parts.length === 0) {
      parts.push({ text: ' ' });
    }

    return { role, parts };
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: formattedContents,
  };

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      return;
    }
    throw new Error(`Network error connecting to Gemini API: ${err.message}`);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }

    if (response.status === 400 || response.status === 403) {
      if (errorDetail && (errorDetail.toLowerCase().includes('image') || errorDetail.toLowerCase().includes('multimodal') || errorDetail.toLowerCase().includes('inline_data'))) {
        throw new Error(`The selected model (${model}) does not support images or rejected the attachment. Please use Gemini 2.5 Flash.`);
      }
      throw new Error(`Authentication/Request failed (${response.status}): ${errorDetail || 'Invalid API key. Please check your Gemini API key in Settings.'}`);
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded (429). Please wait a moment and try again.');
    } else {
      throw new Error(`Gemini API Error (${response.status}): ${errorDetail || response.statusText}`);
    }
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported on this response.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;

        const jsonStr = trimmed.slice(5).trim();
        if (!jsonStr || jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const candidates = parsed?.candidates;
          if (candidates && candidates.length > 0) {
            const parts = candidates[0]?.content?.parts;
            if (parts && parts.length > 0) {
              const textChunk = parts.map((p) => p.text || '').join('');
              if (textChunk) {
                yield textChunk;
              }
            }
          }
        } catch {
          // Incomplete JSON chunk, skip to next line
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return;
    }
    throw err;
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming single generation helper for Gemini API (used for quizzes and structured tasks).
 */
export async function generateGemini({ apiKey, model, systemPrompt, prompt, signal }) {
  if (!apiKey) {
    throw new Error('Gemini API key is required. Please set your key in Settings.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  };

  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson?.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`Gemini API Error (${response.status}): ${errorDetail || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  return text;
}

