# WMO Translation Accuracy Checker

A Flask-based API for validating translations of World Meteorological Organization (WMO) content against UN translation guidelines and WMO terminology standards. The service supports English, French, Spanish, Arabic, Simplified Chinese, and Russian.

## Features

- **Terminology validation** using an embedded UNTERM/WMO sample glossary
- **Country name verification** against official UN forms
- **Numeric consistency checks** to ensure all figures are preserved
- **Formatting and style heuristics** that flag spacing and punctuation risks
- **Weighted scoring** (terminology, grammar, style, completeness, formatting)
- **Single and batch analysis** endpoints
- **Secure file text extraction** for `.txt`, `.docx`, and `.xlsx` files with size limits

## API Overview

### Health Check

```
GET /api/health
```

Returns service status and the supported language codes.

### Extract Text from File

```
POST /api/extract-text
Content-Type: multipart/form-data (field: file)
```

Extracts UTF-8 text from supported file types. Useful for preprocessing batch uploads before running translation checks.

### Translation Check

```
POST /api/check-translation
Content-Type: application/json
```

Example payload:

```json
{
  "sourceText": "The atmosphere is warming over Canada.",
  "sourceLanguage": "en",
  "translations": {
    "fr": "L'atmosphère se réchauffe au Canada.",
    "es": "La atmósfera se está calentando sobre Canadá."
  }
}
```

The response includes accuracy scores, issues (with severity, suggestions, and references), strengths, and verified terminology for each target language.

### Batch Translation Check

```
POST /api/check-translation/batch
Content-Type: application/json
```

Submit multiple translation objects (e.g., one per uploaded file). Each result echoes the source metadata and per-language assessments.

## Running Locally

1. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Start the development server:

   ```bash
   python app.py
   ```

3. The API listens on `http://localhost:5000` by default.

## Environment Variables

| Variable | Purpose | Default |
| -------- | ------- | ------- |
| `PORT` | Flask server port | `5000` |

## Extending Terminology Coverage

The current implementation ships with a small embedded glossary suitable for demos. For production use you should:

1. Replace `TERMINOLOGY_DB` and `COUNTRY_TERMS` in `app.py` with data sourced from UNTERM/WMO APIs.
2. Add caching for terminology lookups to avoid rate limits.
3. Persist terminology and translation history using a relational database.

## Testing

At minimum ensure the module loads successfully:

```bash
python -m compileall app.py
```

Add unit and integration tests as the service evolves to cover terminology ingestion, scoring logic, and file parsing.

## License

Provided as-is for internal or personal use. Ensure compliance with UN and WMO content licensing when deploying.
