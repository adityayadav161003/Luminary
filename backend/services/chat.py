"""
Luminary — Chat service via OpenRouter API.
Only the query text and context are sent to the LLM. PDF bytes are NEVER transmitted.
Uses OpenAI-compatible async client pointed at OpenRouter.
"""

import os
import json
from typing import AsyncGenerator, List, Dict, Optional
from openai import AsyncOpenAI

MODEL = "anthropic/claude-3-haiku"

SYSTEM_PROMPT = """You are Luminary, an intelligent PDF analysis assistant built for privacy-conscious professionals.

Your responsibilities:
- Answer questions accurately using ONLY the provided document context
- Cite sources using [Source: filename, Page N] format
- Acknowledge when context is insufficient — never fabricate
- Use clear, well-structured formatting with headers and bullet points

Document context:

{context}

Answer the user's question based on the above context."""


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY", ""),
        base_url="https://openrouter.ai/api/v1",
    )


async def stream_chat_response(
    query: str,
    context: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> AsyncGenerator[str, None]:
    """
    Stream chat completion from OpenRouter via SSE.
    Only query text is transmitted — PDF bytes never leave the server.
    """
    client = _get_client()
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": SYSTEM_PROMPT.format(context=context)}
    ]

    if history:
        messages.extend(history[-6:])

    messages.append({"role": "user", "content": query})

    try:
        stream = await client.chat.completions.create(
            model=MODEL,
            messages=messages,
            stream=True,
            max_tokens=2048,
            temperature=0.3,
        )

        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                token = chunk.choices[0].delta.content
                yield f"data: {json.dumps({'token': token})}\n\n"

        yield f"data: {json.dumps({'done': True})}\n\n"

    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
