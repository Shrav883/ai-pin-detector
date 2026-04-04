# simple keyword-based classifier used when the Claude API is unavailable
# returns the same shape of data as the claude based classifier

AI_KEYWORDS = [# Pinterest's own labels
    "ai generated", "ai modified", "ai content", "created with ai",
    "generated with ai", "ai-generated", "ai-modified",
    # Tool names
    "midjourney", "stable diffusion", "dall-e", "dalle", "firefly",
    "adobe firefly", "imagen", "ideogram",
    # Common tags
    "ai art", "ai image", "ai artwork", "#aiart", "#midjourney",
    "#stablediffusion", "digital art", "prompt:"
    ]

def fallback_classify(text):
    """
    check the text against AI-related keywords. 
    Returns a dict with label, confidence and reason.
    """
    
    text_lower = text.lower()
    matched = [word for word in AI_KEYWORDS if word in text_lower]
    
    if matched:
        return{
            "label": "likely_ai_generated",
            "confidence":0.7,
            "reason": f"Matched keyword(s): {', '.join(matched)}",
            "source": "fallback"
        }
    return {
        "label": "likely_human",
        "confidence": 0.6,
        "reason": "No AI-related keywords found.",
        "source": "fallback"
    }