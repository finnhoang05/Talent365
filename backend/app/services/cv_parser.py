import pdfplumber
import io
import re
from sklearn.feature_extraction.text import TfidfVectorizer


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text from a PDF file."""
    try:
        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf:
            text_parts = []
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts)
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""


def extract_keywords(text: str, max_keywords: int = 30) -> list[str]:
    """
    Extract keywords from text using TF-IDF.
    Returns the top N most important terms.
    """
    if not text or len(text.strip()) < 10:
        return []
    
    # Clean text
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Common tech skills to boost (if found)
    tech_skills = {
        'python', 'javascript', 'typescript', 'react', 'vue', 'angular',
        'node', 'nodejs', 'fastapi', 'django', 'flask', 'express',
        'sql', 'postgresql', 'mysql', 'mongodb', 'redis',
        'docker', 'kubernetes', 'aws', 'azure', 'gcp',
        'git', 'github', 'gitlab', 'ci', 'cd',
        'html', 'css', 'sass', 'tailwind',
        'java', 'kotlin', 'swift', 'rust', 'go', 'golang',
        'machine learning', 'ml', 'ai', 'nlp', 'deep learning',
        'tensorflow', 'pytorch', 'scikit', 'sklearn', 'pandas', 'numpy',
        'api', 'rest', 'graphql', 'microservices',
        'agile', 'scrum', 'jira', 'testing', 'jest', 'pytest',
    }
    
    # Extract words
    words = text.split()
    
    # Find tech skills mentioned in text
    found_skills = [skill for skill in tech_skills if skill in text]
    
    try:
        # Use TF-IDF to find important terms
        vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=1,
            max_df=0.95
        )
        
        # Need multiple "documents" for TF-IDF to work well
        # Split text into chunks as pseudo-documents
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]
        if len(chunks) < 2:
            chunks = [text, text]  # Duplicate if too short
        
        tfidf_matrix = vectorizer.fit_transform(chunks)
        feature_names = vectorizer.get_feature_names_out()
        
        # Get average TF-IDF scores across chunks
        avg_scores = tfidf_matrix.mean(axis=0).A1
        
        # Sort by score
        sorted_indices = avg_scores.argsort()[::-1]
        top_terms = [feature_names[i] for i in sorted_indices[:max_keywords]]
        
        # Combine with found tech skills (prioritize tech skills)
        keywords = list(dict.fromkeys(found_skills + top_terms))[:max_keywords]
        
        return keywords
        
    except Exception as e:
        print(f"Keyword extraction error: {e}")
        # Fallback: return found tech skills
        return list(found_skills)[:max_keywords]
