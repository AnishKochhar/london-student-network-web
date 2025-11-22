# LLM Configuration Guide

Your LinkedIn auto-posting system now supports **multiple LLM providers** with automatic fallback!

---

## Quick Start Configurations

### Option 1: Ultra-Cheap (Recommended for Testing) 💰
**Cost: ~$0.03/year**

```bash
LLM_PROVIDER="gemini"
GEMINI_API_KEY="your-key-here"
GEMINI_MODEL="gemini-2.0-flash-lite"
```

Get key: https://aistudio.google.com/apikey

---

### Option 2: Best Balance (Recommended for Production) ⚖️
**Cost: ~$0.50/year**

```bash
LLM_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

Get key: https://platform.openai.com/api-keys

---

### Option 3: With Fallback (Maximum Reliability) 🛡️
**Cost: ~$0.50/year + fallback only if needed**

```bash
LLM_PROVIDER="openai"
LLM_FALLBACK_PROVIDERS="gemini,anthropic"

# Primary
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"

# Fallback 1
GEMINI_API_KEY="your-key-here"
GEMINI_MODEL="gemini-2.0-flash-lite"

# Fallback 2 (optional)
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-3-haiku-20240307"
```

---

## All Available Models

### 🟢 Google Gemini

| Model | Input Cost | Output Cost | Best For |
|-------|-----------|-------------|----------|
| `gemini-2.0-flash-lite` | $0.02/1M | $0.10/1M | Ultra-cheap, high volume |
| `gemini-2.0-flash` | $0.15/1M | $0.60/1M | Best balance |
| `gemini-2.0-pro` | $1.25/1M | $5.00/1M | Maximum quality |

**Get API Key**: https://aistudio.google.com/apikey

---

### 🔵 OpenAI

| Model | Input Cost | Output Cost | Best For |
|-------|-----------|-------------|----------|
| `gpt-4o-mini` | $0.15/1M | $0.60/1M | Best balance |
| `gpt-3.5-turbo` | $0.50/1M | $1.50/1M | Legacy option |
| `gpt-4o` | $2.50/1M | $10.00/1M | Overkill (not recommended) |

**Get API Key**: https://platform.openai.com/api-keys

---

### 🟣 Anthropic Claude

| Model | Input Cost | Output Cost | Best For |
|-------|-----------|-------------|----------|
| `claude-3-haiku-20240307` | $0.25/1M | $1.25/1M | Good quality |
| `claude-3-5-haiku-20241022` | $1.00/1M | $5.00/1M | Latest features |
| `claude-3-5-sonnet-20241022` | $3.00/1M | $15.00/1M | Overkill (not recommended) |

**Get API Key**: https://console.anthropic.com/settings/keys

---

## How Fallback Works

When you configure fallback providers, the system will:

1. Try the **primary provider** first
2. If it fails (API error, rate limit, etc.), automatically try the **first fallback**
3. Continue through fallbacks until one succeeds
4. Log each attempt for monitoring

**Example scenario:**
```
[LLM Fallback] Attempting with openai...
[LLM Fallback] ❌ openai failed: Rate limit exceeded
[LLM Fallback] Falling back to gemini...
[LLM Fallback] ✅ gemini succeeded
```

---

## Configuration Examples

### Example 1: Gemini Primary, OpenAI Fallback

```bash
LLM_PROVIDER="gemini"
LLM_FALLBACK_PROVIDERS="openai"

GEMINI_API_KEY="your-gemini-key"
GEMINI_MODEL="gemini-2.0-flash-lite"

OPENAI_API_KEY="your-openai-key"
OPENAI_MODEL="gpt-4o-mini"
```

**Why?** Saves money with Gemini Flash-Lite (~$0.03/yr), but has OpenAI as backup if Gemini has issues.

---

### Example 2: OpenAI Only (Simple)

```bash
LLM_PROVIDER="openai"
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
```

**Why?** Simple setup, reliable, well-tested. Cost is still very low (~$0.50/yr).

---

### Example 3: All Three Providers (Maximum Reliability)

```bash
LLM_PROVIDER="gemini"
LLM_FALLBACK_PROVIDERS="openai,anthropic"

GEMINI_API_KEY="..."
GEMINI_MODEL="gemini-2.0-flash"

OPENAI_API_KEY="..."
OPENAI_MODEL="gpt-4o-mini"

ANTHROPIC_API_KEY="..."
ANTHROPIC_MODEL="claude-3-haiku-20240307"
```

**Why?** Mission-critical system that needs 99.99% uptime. If one provider is down, others take over.

---

## Testing Your Configuration

### Test the LLM integration manually:

```bash
# Set up your .env file first, then:
curl -X GET https://your-domain.vercel.app/api/cron/generate-linkedin-post \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check the logs to see which provider was used:
```
[LLM Fallback] Initialized with providers: gemini → openai
[LLM Fallback] Attempting event filtering with gemini...
[LLM Fallback] ✅ gemini succeeded
```

---

## Changing Providers

You can switch providers anytime by updating environment variables:

### On Vercel:
1. Go to Settings → Environment Variables
2. Update `LLM_PROVIDER` to desired provider
3. Ensure the corresponding API key is set
4. Redeploy (or wait for next deployment)

### Locally:
1. Edit `.env` file
2. Update `LLM_PROVIDER` and API keys
3. Restart dev server

---

## Cost Tracking

### Monitor your usage:

**OpenAI**: https://platform.openai.com/usage
**Gemini**: https://aistudio.google.com/app/prompts/new_chat (check quota)
**Anthropic**: https://console.anthropic.com/settings/usage

For your use case (2 posts/week), expect:
- ~234,000 tokens per year
- Cost range: $0.03 - $0.50/year depending on provider

---

## Troubleshooting

### "No LLM providers available"
- **Check**: At least one API key must be configured
- **Fix**: Add API key for your chosen provider

### "Rate limit exceeded"
- **Check**: You may have hit API limits
- **Fix**: Add fallback providers OR wait for rate limit reset

### "API key not configured"
- **Check**: Environment variable names are correct
- **Fix**: Ensure `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `ANTHROPIC_API_KEY` is set

### Provider keeps failing
- **Check**: Logs for specific error message
- **Fix**: Verify API key is valid, check billing status

---

## Best Practices

1. **Start simple**: Use one provider initially (OpenAI or Gemini)
2. **Add fallback later**: Once you trust the system, add fallbacks for reliability
3. **Monitor costs**: Check usage dashboards monthly (though costs are minimal)
4. **Test after changes**: Always test after changing providers
5. **Keep keys secure**: Never commit API keys to git

---

## Recommended Setup by Use Case

### **Personal Project / MVP**
```bash
LLM_PROVIDER="gemini"
GEMINI_MODEL="gemini-2.0-flash-lite"
```
Cost: $0.03/year

### **Small Organization**
```bash
LLM_PROVIDER="openai"
OPENAI_MODEL="gpt-4o-mini"
```
Cost: $0.50/year

### **Production / High Reliability**
```bash
LLM_PROVIDER="gemini"
LLM_FALLBACK_PROVIDERS="openai"
GEMINI_MODEL="gemini-2.0-flash"
OPENAI_MODEL="gpt-4o-mini"
```
Cost: ~$0.50/year (fallback rarely triggered)

---

## Need Help?

- Review logs in Vercel dashboard
- Check API provider status pages
- Verify billing is active on provider accounts
- Test with `curl` command above

Happy posting! 🚀
