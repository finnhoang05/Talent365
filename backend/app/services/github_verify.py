import httpx
import re
from app.config import get_settings


def extract_github_username(github_url: str) -> str | None:
    """Extract username from GitHub URL."""
    patterns = [
        r'github\.com/([a-zA-Z0-9_-]+)/?$',
        r'github\.com/([a-zA-Z0-9_-]+)/?\?',
        r'^([a-zA-Z0-9_-]+)$',  # Just username
    ]
    
    for pattern in patterns:
        match = re.search(pattern, github_url)
        if match:
            return match.group(1)
    
    return None


async def verify_github_skills(
    github_url: str,
    claimed_skills: list[str]
) -> dict:
    """
    Verify claimed skills against GitHub activity.
    Returns trust score and lists of verified/flagged skills.
    """
    settings = get_settings()
    
    username = extract_github_username(github_url)
    if not username:
        return {
            "trust_score": 0,
            "verified_skills": [],
            "flagged_skills": claimed_skills,
        }
    
    headers = {"Accept": "application/vnd.github.v3+json"}
    if settings.github_token:
        headers["Authorization"] = f"token {settings.github_token}"
    
    async with httpx.AsyncClient() as client:
        try:
            # Fetch user's repositories
            repos_response = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers=headers,
                params={"per_page": 100, "sort": "updated"}
            )
            
            if repos_response.status_code != 200:
                return {
                    "trust_score": 0,
                    "verified_skills": [],
                    "flagged_skills": claimed_skills,
                }
            
            repos = repos_response.json()
            
            # Collect languages from all repos
            languages = set()
            repo_names = []
            
            for repo in repos:
                repo_names.append(repo.get("name", "").lower())
                
                # Primary language
                if repo.get("language"):
                    languages.add(repo["language"].lower())
                
                # Fetch detailed language stats for top repos
                if len(languages) < 20:
                    lang_url = repo.get("languages_url")
                    if lang_url:
                        try:
                            lang_response = await client.get(lang_url, headers=headers)
                            if lang_response.status_code == 200:
                                for lang in lang_response.json().keys():
                                    languages.add(lang.lower())
                        except:
                            pass
            
            # Build a set of evidence (languages + common tech terms from repo names)
            evidence = languages.copy()
            
            # Add common frameworks/tools often in repo names
            tech_indicators = {
                'react': 'react',
                'vue': 'vue',
                'angular': 'angular',
                'django': 'django',
                'flask': 'flask',
                'fastapi': 'fastapi',
                'express': 'express',
                'node': 'nodejs',
                'next': 'nextjs',
                'nuxt': 'nuxt',
                'docker': 'docker',
                'kubernetes': 'kubernetes',
                'k8s': 'kubernetes',
                'api': 'api',
                'graphql': 'graphql',
                'rest': 'rest',
                'ml': 'machine learning',
                'ai': 'ai',
                'tensorflow': 'tensorflow',
                'pytorch': 'pytorch',
                'pandas': 'pandas',
            }
            
            for repo_name in repo_names:
                for indicator, skill in tech_indicators.items():
                    if indicator in repo_name:
                        evidence.add(skill)
            
            # Normalize claimed skills for comparison
            skill_mappings = {
                'js': 'javascript',
                'ts': 'typescript',
                'py': 'python',
                'node': 'javascript',
                'nodejs': 'javascript',
                'react': 'javascript',
                'vue': 'javascript',
                'angular': 'typescript',
                'nextjs': 'javascript',
                'django': 'python',
                'flask': 'python',
                'fastapi': 'python',
                'express': 'javascript',
                'sklearn': 'python',
                'scikit-learn': 'python',
                'pandas': 'python',
                'numpy': 'python',
                'tensorflow': 'python',
                'pytorch': 'python',
            }
            
            verified = []
            flagged = []
            
            for skill in claimed_skills:
                skill_lower = skill.lower().strip()
                
                # Direct match
                if skill_lower in evidence:
                    verified.append(skill)
                    continue
                
                # Check if it's a framework that implies a language
                mapped = skill_mappings.get(skill_lower)
                if mapped and mapped in evidence:
                    verified.append(skill)
                    continue
                
                # Check partial matches
                found = False
                for ev in evidence:
                    if skill_lower in ev or ev in skill_lower:
                        verified.append(skill)
                        found = True
                        break
                
                if not found:
                    flagged.append(skill)
            
            # Calculate trust score
            total = len(claimed_skills)
            if total == 0:
                trust_score = 50  # Neutral if no skills claimed
            else:
                trust_score = round((len(verified) / total) * 100, 1)
            
            return {
                "trust_score": trust_score,
                "verified_skills": verified,
                "flagged_skills": flagged,
            }
            
        except Exception as e:
            print(f"GitHub API error: {e}")
            return {
                "trust_score": 0,
                "verified_skills": [],
                "flagged_skills": claimed_skills,
            }
