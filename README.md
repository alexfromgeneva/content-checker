
# Content Quality Checker

This is a simple web-based tool to check web content against:

- Your corporate style guide
- Web writing best practices (clarity, tone, structure)
- Basic readability metrics

## Features

- Style rule enforcement (customizable)
- Passive voice detection
- Long sentence detection
- Flesch Reading Ease score
- Simple web interface for paste-in content

## Getting Started

### Requirements

- Python 3.7+
- Flask
- textstat

### Installation

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the app:
   ```
   python app.py
   ```

3. Open your browser and go to:
   ```
   http://localhost:5000
   ```

## Hosting

This tool can be hosted for free on [Render](https://render.com).

1. Upload the files to a GitHub repository
2. Create a new Web Service on Render
3. Use:
   - Build command: `pip install -r requirements.txt`
   - Start command: `python app.py`

## License

This project is provided as-is for internal or personal use.
