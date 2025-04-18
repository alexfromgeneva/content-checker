from flask import Flask, request, jsonify, render_template_string
import re
import textstat

app = Flask(__name__)

# Sample style guide rules
STYLE_RULES = {
    "utilize": "use",
    "in order to": "to",
    "prior to": "before",
    "member countries": "Member States"
}

# Passive voice pattern (simplified)
PASSIVE_VOICE_REGEX = re.compile(r'\b(be|is|was|were|are|been|being)\b\s+\w+ed\b', re.IGNORECASE)

# Max sentence length
MAX_SENTENCE_LENGTH = 25


def check_style(text):
    issues = []
    for term, suggestion in STYLE_RULES.items():
        if term in text:
            issues.append({
                "type": "style",
                "message": f"Avoid using '{term}'. Consider '{suggestion}'.",
                "term": term
            })
    return issues


def check_readability(text):
    issues = []
    sentences = re.split(r'(?<=[.!?]) +', text)
    for sentence in sentences:
        if len(sentence.split()) > MAX_SENTENCE_LENGTH:
            issues.append({
                "type": "readability",
                "message": "Long sentence detected. Consider splitting.",
                "sentence": sentence
            })
        if PASSIVE_VOICE_REGEX.search(sentence):
            issues.append({
                "type": "readability",
                "message": "Possible passive voice detected.",
                "sentence": sentence
            })

    score = textstat.flesch_reading_ease(text)
    issues.append({
        "type": "readability",
        "message": f"Flesch Reading Ease Score: {score:.1f}. (60-70 = acceptable, higher is easier)"
    })
    return issues


@app.route('/', methods=['GET', 'POST'])
def index():
    result = None
    if request.method == 'POST':
        content = request.form.get('text', '')
        style_issues = check_style(content)
        readability_issues = check_readability(content)
        result = style_issues + readability_issues

    return render_template_string('''
        <!doctype html>
        <html>
        <head>
            <title>Content Quality Checker</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 2em; }
                textarea { width: 100%; height: 200px; }
                .issue { margin-bottom: 1em; padding: 0.5em; border-left: 4px solid #d9534f; background: #f9f2f4; }
            </style>
        </head>
        <body>
            <h1>Content Quality Checker</h1>
            <form method="post">
                <textarea name="text" placeholder="Paste your content here..."></textarea><br>
                <button type="submit">Analyze</button>
            </form>
            {% if result %}
                <h2>Results:</h2>
                {% for issue in result %}
                    <div class="issue">
                        <strong>{{ issue.type.capitalize() }}:</strong> {{ issue.message }}
                    </div>
                {% endfor %}
            {% endif %}
        </body>
        </html>
    ''', result=result)


if __name__ == '__main__':
    app.run(debug=True)
