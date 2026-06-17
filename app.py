from flask import Flask, jsonify, render_template
import requests
import xml.etree.ElementTree as ET
import re

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_data = response.content
        
        # Parse XML
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns)
            title_text = title.text if title is not None else "Unknown Date"
            
            updated = entry.find('atom:updated', ns)
            updated_text = updated.text if updated is not None else ""
            
            # Find link alternate
            link_elem = entry.find("atom:link[@rel='alternate']", ns)
            if link_elem is None:
                link_elem = entry.find("atom:link", ns)
            link_href = link_elem.attrib.get('href', '') if link_elem is not None else ""
            
            content_elem = entry.find('atom:content', ns)
            content_html = content_elem.text if content_elem is not None else ""
            
            # Parse individual updates from HTML
            # HTML format: <h3>Type</h3> <p>content</p> ...
            updates = []
            if content_html:
                # Find all <h3>Category</h3> followed by everything until the next <h3> or end of string
                pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
                matches = pattern.findall(content_html)
                for idx, (utype, ucontent) in enumerate(matches):
                    # Strip tags for a clean plaintext version (useful for Tweet preview)
                    clean_text = re.sub(r'<[^>]+>', '', ucontent)
                    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                    
                    updates.append({
                        "id": f"{title_text.replace(' ', '_')}_{idx}",
                        "type": utype.strip(),
                        "content_html": ucontent.strip(),
                        "content_text": clean_text
                    })
            
            # If no updates were extracted, put the entire raw HTML as a generic update
            if not updates:
                clean_text = re.sub(r'<[^>]+>', '', content_html)
                clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                updates.append({
                    "id": f"{title_text.replace(' ', '_')}_0",
                    "type": "Update",
                    "content_html": content_html.strip(),
                    "content_text": clean_text if clean_text else "No details available."
                })
                
            entries.append({
                "date": title_text,
                "updated": updated_text,
                "link": link_href,
                "updates": updates
            })
            
        return {"success": True, "entries": entries}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    data = fetch_and_parse_feed()
    return jsonify(data)

if __name__ == '__main__':
    # Running locally
    app.run(debug=True, host='127.0.0.1', port=5000)
