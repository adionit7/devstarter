"""
routers/ai.py
──────────────
OpenAI-powered code review endpoint.

Endpoint:
  POST /api/ai/review  → Submit code, get AI review (protected — must be logged in)

Interview talking points:
  1. We use GPT-4o-mini — cheap ($0.15/1M tokens) but very capable for code review
  2. System prompt engineering: we give it a specific persona + output format
  3. Protected route: only logged-in users can use AI (prevents API cost abuse)
  4. In production: add rate limiting per user (e.g. 10 reviews/day on free plan)
"""

from fastapi import APIRouter, Depends, HTTPException
from openai import OpenAI
from core.security import decode_token
from schemas.user import CodeReviewRequest, CodeReviewResponse
import os

router = APIRouter(prefix="/api/ai", tags=["AI"])

# Groq is OpenAI-compatible; use their base URL and GROQ_API_KEY
client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

SYSTEM_PROMPT = """You are an expert software engineer conducting a code review.
Analyze the provided code and give structured, actionable feedback covering:

1. **Bugs & Issues** — anything that could cause errors or unexpected behavior
2. **Security** — potential vulnerabilities (SQL injection, XSS, secrets in code, etc.)
3. **Performance** — inefficiencies, unnecessary complexity, better algorithms
4. **Best Practices** — naming, structure, type hints, error handling
5. **Quick Wins** — the 1-2 most impactful improvements to make first

Be specific. Reference line patterns or function names where possible.
Format your response in clean markdown. Keep it under 400 words — be concise and actionable."""


@router.post("/review", response_model=CodeReviewResponse)
def review_code(
    body: CodeReviewRequest,
    token_data: dict = Depends(decode_token),   # 🔒 must be logged in
):
    """
    Submit code for AI-powered review.
    Uses GPT-4o-mini for cost efficiency — great for a SaaS free tier.

    Interview tip: In production you'd:
    - Check user's plan (free = 5 reviews/day, pro = unlimited)
    - Log usage to DB for billing
    - Stream the response for better UX (OpenAI supports streaming)
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Groq API key not configured. Add GROQ_API_KEY to your .env"
        )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Please review this {body.language} code:\n\n```{body.language}\n{body.code}\n```"
                }
            ],
            max_tokens=800,
            temperature=0.3,   # lower = more consistent, focused output
        )

        review_text = response.choices[0].message.content or "No review generated."

        return CodeReviewResponse(
            review=review_text,
            language=body.language,
            model="llama-3.3-70b-versatile",
        )

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI API error: {str(e)}"
        )
