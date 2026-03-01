# LLM Cost Comparison for LinkedIn Auto-Posting

## Quick Summary

For your LinkedIn auto-posting use case (2x/week, ~7,000 tokens/week):

| Provider | Model | Cost/Year | Best For |
|----------|-------|-----------|----------|
| 🏆 **Google Gemini** | **2.5 Flash-Lite** | **$0.03** | **Cheapest option** |
| 🥈 OpenAI | GPT-4o-mini | $0.50 | Best balance |
| 🥉 Anthropic | Claude Haiku 3 | $0.80 | Quality + price |
| Google Gemini | 2.5 Flash | $0.50 | Good balance |
| Anthropic | Claude Haiku 4.5 | $3.00 | Latest features |
| OpenAI | GPT-3.5 Turbo | $1.00 | Legacy option |

---

## Detailed Pricing Breakdown

### **Usage Estimation**
- **Frequency**: 2 runs per week
- **Tokens per run**:
  - Event filtering: ~2,000 tokens (input) + 500 tokens (output)
  - Post generation: ~1,500 tokens (input) + 500 tokens (output)
- **Total per week**: ~4,500 tokens
- **Total per year**: ~234,000 tokens (~0.234M tokens)

---

## 1️⃣ Google Gemini (Recommended)

### **Gemini 2.5 Flash-Lite** 🏆 CHEAPEST
- **Input**: $0.02 per 1M tokens
- **Output**: $0.10 per 1M tokens
- **Your cost/year**: ~$0.03
- **Pros**:
  - Extremely cheap
  - Fast response times
  - Good for simple tasks
- **Cons**:
  - Less sophisticated reasoning
  - May need better prompting

### **Gemini 2.5 Flash**
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens
- **Your cost/year**: ~$0.50
- **Pros**:
  - Best price-performance balance
  - Excellent quality
  - Fast and reliable
- **Cons**:
  - None significant for this use case

### **Gemini 2.5 Pro**
- **Input**: $1.25 per 1M tokens
- **Output**: $5.00 per 1M tokens
- **Your cost/year**: ~$3.50
- **Pros**:
  - State-of-the-art reasoning
  - Best for complex tasks
- **Cons**:
  - Overkill for this simple task
  - More expensive

---

## 2️⃣ OpenAI

### **GPT-4o-mini** (Current default)
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens
- **Your cost/year**: ~$0.50
- **Pros**:
  - Excellent quality
  - Reliable and well-tested
  - Good JSON mode support
- **Cons**:
  - More expensive than Gemini Flash-Lite

### **GPT-3.5 Turbo**
- **Input**: $0.50 per 1M tokens
- **Output**: $1.50 per 1M tokens
- **Your cost/year**: ~$1.00
- **Pros**:
  - Mature and stable
  - Widely documented
- **Cons**:
  - More expensive
  - Lower quality than GPT-4o-mini

---

## 3️⃣ Anthropic Claude

### **Claude Haiku 3**
- **Input**: $0.25 per 1M tokens
- **Output**: $1.25 per 1M tokens
- **Your cost/year**: ~$0.80
- **Pros**:
  - Good reasoning
  - Helpful and friendly tone
- **Cons**:
  - More expensive than OpenAI/Gemini

### **Claude Haiku 4.5** (Latest)
- **Input**: $1.00 per 1M tokens
- **Output**: $5.00 per 1M tokens
- **Your cost/year**: ~$3.00
- **Pros**:
  - Latest and most advanced
  - Near-frontier performance
- **Cons**:
  - 6x more expensive than GPT-4o-mini

### **Claude Sonnet models**
- **Input**: $3.00 per 1M tokens
- **Output**: $15.00 per 1M tokens
- **Your cost/year**: ~$12.00
- **Notes**: Complete overkill for this task

---

## 💡 Recommendation

### **For Production (Best Balance):**
**Google Gemini 2.5 Flash** or **OpenAI GPT-4o-mini**
- Cost: ~$0.50/year
- Quality: Excellent
- Reliability: Proven
- Setup: Simple

### **For Ultra-Cheap:**
**Google Gemini 2.5 Flash-Lite**
- Cost: ~$0.03/year (17x cheaper!)
- Quality: Good enough for social media posts
- Trade-off: May need more prompt engineering

### **For Maximum Quality:**
**Claude Haiku 4.5** or **Gemini 2.5 Pro**
- Cost: $3-4/year
- Quality: State-of-the-art
- Use case: If you want the absolute best posts

---

## Cost Optimization Tips

### 1. **Use Batch Processing** (if supported)
- Anthropic offers 50% discount for batch API
- Good for non-urgent tasks

### 2. **Prompt Caching** (Anthropic)
- Cache system prompts for 90% savings
- Our system prompts don't change often

### 3. **Fallback Strategy**
```
1st choice: Gemini 2.5 Flash-Lite ($0.03/yr)
Fallback: GPT-4o-mini ($0.50/yr)
Emergency: Claude Haiku 3 ($0.80/yr)
```

### 4. **Token Optimization**
- Shorten event descriptions (already doing this)
- Use efficient JSON mode
- Reduce redundant context

---

## Real-World Cost Comparison

### **Scenario: 1 year of operation (104 posts)**

| Provider | Model | Annual Cost | Cost per Post |
|----------|-------|-------------|---------------|
| Google | Gemini 2.5 Flash-Lite | $0.03 | $0.0003 |
| Google | Gemini 2.5 Flash | $0.50 | $0.0048 |
| OpenAI | GPT-4o-mini | $0.50 | $0.0048 |
| Anthropic | Claude Haiku 3 | $0.80 | $0.0077 |
| OpenAI | GPT-3.5 Turbo | $1.00 | $0.0096 |
| Anthropic | Claude Haiku 4.5 | $3.00 | $0.0288 |
| Google | Gemini 2.5 Pro | $3.50 | $0.0337 |

---

## Quality vs Cost Trade-off

```
Quality  ▲
         │                     ◆ Claude Sonnet ($12)
         │               ◆ Gemini Pro ($3.50)
         │          ◆ Claude Haiku 4.5 ($3.00)
         │     ◆ GPT-4o-mini ($0.50)
         │     ◆ Gemini Flash ($0.50)
         │  ◆ Claude Haiku 3 ($0.80)
         │◆ GPT-3.5 ($1.00)
         ◆ Gemini Flash-Lite ($0.03)
         └──────────────────────────────► Cost
```

**Sweet spot**: GPT-4o-mini or Gemini 2.5 Flash
**Ultra-cheap**: Gemini 2.5 Flash-Lite

---

## Testing Recommendation

1. **Start with**: Gemini 2.5 Flash-Lite ($0.03/yr)
2. **Test quality**: Generate 5-10 posts manually
3. **If quality issues**: Upgrade to GPT-4o-mini ($0.50/yr)
4. **Monitor**: Check post approval rates

The difference between $0.03 and $0.50 per year is negligible, so prioritize quality over cost.

---

## API Key Setup for Each Provider

### **Google Gemini**
```bash
GEMINI_API_KEY="your-key-here"
GEMINI_MODEL="gemini-2.5-flash-lite"
```
Get key: https://aistudio.google.com/apikey

### **OpenAI** (Current)
```bash
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```
Get key: https://platform.openai.com/api-keys

### **Anthropic Claude**
```bash
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-haiku-20240307"
```
Get key: https://console.anthropic.com/settings/keys

---

## Conclusion

For your use case:
- **Budget priority**: Use Gemini 2.5 Flash-Lite ($0.03/year)
- **Quality priority**: Use GPT-4o-mini or Gemini 2.5 Flash ($0.50/year)
- **Don't use**: Claude Sonnet or Gemini Pro (overkill)

The current default (GPT-4o-mini) is already excellent and well-priced. Unless you want to save $0.47/year, stick with it! 😄
