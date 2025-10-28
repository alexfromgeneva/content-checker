// ============================================
// server.js - Express Backend API
// ============================================

const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Helper that performs the translation analysis with Claude.
 * @param {object} params
 * @param {string} params.sourceText
 * @param {string} params.targetText
 * @param {string} params.sourceLang
 * @param {string} params.targetLang
 */
async function checkTranslation({ sourceText, targetText, sourceLang, targetLang }) {
  if (!sourceText || !targetText || !sourceLang || !targetLang) {
    throw new Error('Missing required fields: sourceText, targetText, sourceLang, targetLang');
  }

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    tools: [
      {
        type: 'web_search_20250305',
        name: 'web_search',
      },
    ],
    messages: [
      {
        role: 'user',
        content: `You are a WMO (World Meteorological Organization) translation accuracy checker with access to web search.

Analyze this translation according to UN translation guidelines and WMO terminology standards:

Source Language: ${sourceLang}
Source Text: ${sourceText}

Target Language: ${targetLang}
Translation: ${targetText}

Use web_search to verify terminology against:
1. UNTERM (unterm.un.org) - Official UN terminology database
2. UN Country Names (unterm.un.org/unterm2/en/country)
3. WMO Glossaries and official meteorological terminology

Check for:
- Terminology accuracy using UNTERM and WMO standards
- Consistency with UN/WMO guidelines
- Technical accuracy for meteorological terms
- Country name compliance with UN conventions
- Style and formatting per UN translation guidelines
- Proper use of official terminology

Provide analysis in JSON format:
{
  "overallScore": 0-100,
  "issues": [
    {
      "type": "terminology|consistency|technical|country|style|grammar",
      "severity": "high|medium|low",
      "original": "text in source",
      "translation": "text in translation",
      "issue": "specific description",
      "suggestion": "recommended correction with official term",
      "reference": "specific UN/WMO reference URL or citation"
    }
  ],
  "summary": "comprehensive assessment",
  "strengths": ["list of strengths"],
  "verifiedTerms": ["terms verified against UNTERM/WMO"]
}

Return ONLY valid JSON, no other text.`,
      },
    ],
  });

  let analysisText = '';
  for (const block of message.content) {
    if (block.type === 'text') {
      analysisText += block.text;
    }
  }

  const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from API response');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Main translation check endpoint
 * POST /api/check-translation
 */
app.post('/api/check-translation', async (req, res) => {
  try {
    const result = await checkTranslation(req.body);
    res.json(result);
  } catch (error) {
    console.error('Translation check error:', error);
    res.status(error.message?.includes('Missing required fields') ? 400 : 500).json({
      error: 'Translation check failed',
      message: error.message,
    });
  }
});

/**
 * Batch translation check endpoint
 * POST /api/check-batch
 */
app.post('/api/check-batch', async (req, res) => {
  try {
    const { translations } = req.body;

    if (!Array.isArray(translations)) {
      return res.status(400).json({
        error: 'translations must be an array',
      });
    }

    const results = [];

    for (const translation of translations) {
      try {
        const result = await checkTranslation(translation);
        results.push({
          ...translation,
          result,
        });
      } catch (error) {
        results.push({
          ...translation,
          error: error.message,
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Batch check error:', error);
    res.status(500).json({
      error: 'Batch check failed',
      message: error.message,
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`WMO Translation Checker API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = { app, checkTranslation };
