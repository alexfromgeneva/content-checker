# WMO Translation Accuracy Checker

A comprehensive tool for validating translations against UN/WMO standards.

## Features

- Multi-language support (EN, FR, ES, AR, ZH, RU)
- UNTERM integration for terminology validation
- WMO glossary compliance checking
- Batch file processing (TXT, DOCX, XLSX)
- Real-time AI-powered analysis
- Detailed issue reporting with severity levels
- Export results to JSON

## Installation

### Prerequisites
- Node.js 18+
- Anthropic API key

### Setup

1. Clone the repository
```bash
git clone https://github.com/yourorg/wmo-translation-checker.git
cd wmo-translation-checker
```

2. Install dependencies
```bash
npm install
```

3. Configure environment
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

4. Start the backend server
```bash
npm run dev
```

5. Start the frontend (in another terminal)
```bash
npm start
```

## Usage

### API Endpoints

#### Check Single Translation
```bash
POST /api/check-translation
Content-Type: application/json

{
  "sourceText": "The World Meteorological Organization...",
  "targetText": "L'Organisation météorologique mondiale...",
  "sourceLang": "English",
  "targetLang": "French"
}
```

#### Batch Check
```bash
POST /api/check-batch
Content-Type: application/json

{
  "translations": [
    {
      "sourceText": "...",
      "targetText": "...",
      "sourceLang": "English",
      "targetLang": "French"
    }
  ]
}
```

## Development

### Project Structure
```
wmo-translation-checker/
├── src/
│   ├── components/
│   │   └── WMOTranslationChecker.jsx
│   ├── utils/
│   └── App.js
├── server.js
├── package.json
└── .env
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## Deployment

### Docker
```bash
docker build -t wmo-translation-checker .
docker run -p 3001:3001 --env-file .env wmo-translation-checker
```

### Manual Deployment
1. Build the frontend: `npm run build`
2. Deploy build folder to static hosting (Vercel, Netlify, etc.)
3. Deploy backend to Node.js hosting (Heroku, AWS, etc.)

## Configuration

See `.env.example` for all configuration options.

## License

Proprietary - All rights reserved

## Support

For issues and questions, contact: support@example.com
