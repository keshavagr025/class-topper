import io
import json
import re
import os
from groq import Groq
from dotenv import load_dotenv
import PyPDF2
import docx

load_dotenv()

# ── File Text Extraction (Helper) ─────────────────────────────────────────────

def extract_text_from_file(file) -> str:
    filename = getattr(file, "filename", "").lower()
    if isinstance(file, io.BytesIO):
        file.seek(0)
    
    if filename.endswith(".pdf") or (isinstance(file, str) and file.lower().endswith(".pdf")):
        # If it's a string, we open it. If it's BytesIO, we read directly.
        f_obj = open(file, "rb") if isinstance(file, str) else file
        reader = PyPDF2.PdfReader(f_obj)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        if isinstance(file, str): f_obj.close()
        return text

    elif filename.endswith(".docx") or (isinstance(file, str) and file.lower().endswith(".docx")):
        doc = docx.Document(file)
        return "\n".join(para.text for para in doc.paragraphs)

    elif filename.endswith(".txt") or (isinstance(file, str) and file.lower().endswith(".txt")):
        if isinstance(file, str):
            with open(file, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        else:
            raw = file.read()
            return raw.decode("utf-8", errors="ignore") if isinstance(raw, bytes) else raw
    return ""

# ── Keyword Extraction via Groq ─────────────────────────────────────────────

def extract_keywords(text: str) -> list[str]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key: return ["Document"]
    
    client = Groq(api_key=api_key)
    prompt = f"Extract the 5 most important keywords from the following text. Return ONLY a JSON array of strings. Text: {text[:4000]}"
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        data = json.loads(completion.choices[0].message.content)
        # Handle if LLM wraps in a key
        if isinstance(data, list): return data[:5]
        for v in data.values():
            if isinstance(v, list): return [str(x) for x in v[:5]]
        return ["Document"]
    except:
        return ["Document"]

# ── Mindmap Tree Generation via Groq ────────────────────────────────────────

def generate_tree(topic: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    client = Groq(api_key=api_key)
    prompt = f"""Create a structured knowledge tree for the topic: {topic}. 
    Return ONLY JSON. Exactly 3 main branches, each with 3 subtopics.
    Schema: {{ "name": "{topic}", "children": [ {{ "name": "Branch", "children": [ {{ "name": "Sub" }} ] }} ] }}
    """
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except:
        return {"name": topic, "children": []}

def json_to_mermaid(tree: dict) -> str:
    lines = ["mindmap"]
    def walk(node, level=1):
        indent = "  " * level
        name = node.get("name", "?").replace("(", "[").replace(")", "]")
        if level == 1: lines.append(f"{indent}root(({name}))")
        elif level == 2: lines.append(f"{indent}[{name}]")
        else: lines.append(f"{indent}{name}")
        for child in node.get("children", []): walk(child, level + 1)
    walk(tree)
    return "\n".join(lines)

def generate_mindmap(file) -> dict:
    text = extract_text_from_file(file)
    keywords = extract_keywords(text)
    primary = keywords[0] if keywords else "Document"
    tree = generate_tree(primary)
    mermaid = json_to_mermaid(tree)
    return {
        "keywords": keywords,
        "primary_topic": primary,
        "mermaid": mermaid,
        "tree": tree
    }