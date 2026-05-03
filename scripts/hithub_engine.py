import os
import requests
import psycopg2
import google.generativeai as genai
from datetime import datetime, timedelta, timezone
import json

# ==============================================================================
# HITHUB AI ENGINE (CRON JOB)
# ==============================================================================
# This script fetches trending GitHub repos, processes them with Gemini 1.5 Flash,
# and inserts/updates them in the Supabase PostgreSQL database.
# ==============================================================================

# 1. Configuration & Secrets
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN") # Optional but recommended for API rate limits

if not GEMINI_API_KEY or not DATABASE_URL:
    print("Error: Missing GEMINI_API_KEY or DATABASE_URL.")
    exit(1)

genai.configure(api_key=GEMINI_API_KEY)

# 2. Fetch Trending GitHub Repos (Top 10 created in the last 24-48 hours)
def fetch_trending_repos():
    print("Fetching trending repos from GitHub...")
    # Using 'created' within the last 2 days to ensure we catch recent active ones
    recent_date = (datetime.now(timezone.utc) - timedelta(days=2)).strftime('%Y-%m-%d')
    url = f"https://api.github.com/search/repositories?q=created:>{recent_date}&sort=stars&order=desc&per_page=10"
    
    headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    response = requests.get(url, headers=headers)
    response.raise_for_status()
    items = response.json().get("items", [])
    
    repos = []
    for item in items:
        # Avoid repos with no description
        desc = item.get("description") or ""
        repos.append({
            "githubId": item["id"],
            "name": item["full_name"],
            "url": item["html_url"],
            "description": desc,
            "language": item.get("language") or "Unknown",
            "githubStars": item.get("stargazers_count", 0),
        })
    return repos

# 3. Process Repos with Gemini 1.5 Flash
def extract_ai_insights(repo):
    print(f"Extracting AI insights for {repo['name']}...")
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    
    prompt = f"""
    Analyze the following GitHub repository:
    Name: {repo['name']}
    Description: {repo['description']}
    Language: {repo['language']}

    Return a JSON object strictly containing the following fields:
    - category: A concise category (e.g., "Developer Tools", "AI/ML", "Web Framework").
    - what_it_does: A clear 1-sentence summary of its core value proposition.
    - under_the_hood: 1-2 sentences explaining its technical architecture or libraries.
    - how_to_use: 1 practical sentence on its primary use case or how a dev would integrate it.

    Ensure the output is strictly valid JSON without Markdown blocks.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        return data
    except Exception as e:
        print(f"Error processing {repo['name']}: {e}")
        # Return fallback on error
        return {
            "category": "Uncategorized",
            "what_it_does": repo['description'] or "No description provided.",
            "under_the_hood": f"Written in {repo['language']}.",
            "how_to_use": "Check the repository README for details."
        }

# 4. Sync Database (Supabase PostgreSQL)
def sync_to_database(repos):
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        for repo in repos:
            insights = extract_ai_insights(repo)
            
            # Upsert logic based on your Prisma schema rules.
            # Using DO UPDATE to update existing entries or insert new ones.
            # Assuming Prisma uses standard naming conventions.
            query = """
            INSERT INTO "Repository" (
                "id", "githubId", "name", "url", "description", "language", "githubStars", "hithubScore", 
                "aiCategory", "aiWhatItDoes", "aiUnderTheHood", "aiHowToUse", "snapshotDate", "createdAt"
            )
            VALUES (
                gen_random_uuid()::text, %(githubId)s, %(name)s, %(url)s, %(description)s, %(language)s, %(githubStars)s, 0,
                %(aiCategory)s, %(aiWhatItDoes)s, %(aiUnderTheHood)s, %(aiHowToUse)s, NOW(), NOW()
            )
            ON CONFLICT ("githubId") DO UPDATE SET
                "githubStars" = EXCLUDED."githubStars",
                "snapshotDate" = NOW();
            """
            
            cursor.execute(query, {
                "githubId": repo["githubId"],
                "name": repo["name"],
                "url": repo["url"],
                "description": repo["description"][:500], # Trucate just in case
                "language": repo["language"],
                "githubStars": repo["githubStars"],
                "aiCategory": insights.get("category", "Uncategorized"),
                "aiWhatItDoes": insights.get("what_it_does", ""),
                "aiUnderTheHood": insights.get("under_the_hood", ""),
                "aiHowToUse": insights.get("how_to_use", ""),
            })
        
        conn.commit()
        print("Database sync completed successfully.")
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    top_repos = fetch_trending_repos()
    if top_repos:
        sync_to_database(top_repos)
    else:
        print("No trending repos found.")
