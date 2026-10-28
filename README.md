# CV Job Finder

CV Job Finder helps job seekers find opportunities that may fit their skills
and experience. A candidate submits a CV and basic role interest; the n8n
workflow analyses the profile, searches external job platforms, and returns
job recommendations for the candidate to review and apply to on the source
website.

## Current features

- Responsive home, about, and CV submission pages.
- CV upload validation for PDF and DOCX files up to 5 MB.
- Required name and role-interest fields, plus consent validation.
- Multipart form submission to an n8n webhook.
- Dynamic display of job matches returned by the workflow directly on the
  application page.
- A clear empty state when the workflow returns no matching jobs.
- Recommended-job links open the original listing in a separate tab.

## Project structure

```text
.
├── README.md
├── about.css
├── about.html
├── apply.css
├── apply.html
├── index.html
├── script.js
└── style.css
```

## Run locally

This is a static HTML, CSS, and JavaScript site and has no build step or npm
dependencies.

1. Open this folder in Visual Studio Code.
2. Serve it using the Live Server extension (recommended), or another local
   static web server.
3. Open the local `index.html` page.
4. Submit test details with a dummy PDF or DOCX CV and accept the consent
   checkbox.
5. Confirm that the n8n workflow runs and the returned matches appear below
   the form.

Use a local web server rather than opening the HTML as a `file://` URL so
webhook requests work consistently.

## n8n response format

The form submits `FormData` to the production webhook configured in
`script.js`. The workflow response may be the direct object below, or the
n8n/OpenAI wrapper where the object appears under
`output[0].content[0].text`.

```json
{
  "ai_analysis": "A concise profile summary based on the CV.",
  "top_15_jobs": [
    {
      "title": "Example role",
      "company_name": "Example company",
      "location": "Remote",
      "match_score": 92,
      "summary": "The role aligns with the candidate's relevant skills.",
      "apply_url": "https://jobs.example.com/role"
    }
  ]
}
```

For no matches, return an empty list:

```json
{
  "ai_analysis": "A concise profile summary based on the CV.",
  "top_15_jobs": []
}
```

Jobs may be returned in `top_15_jobs`, `job_matches`, `jobs`, or `matches`.
Each job needs a title (`title` or `job_title`) and an apply link
(`apply_url`, `url`, or `link`). Company, location, score, and summary are
optional; the renderer also accepts common alternatives such as `company`,
`score`, `match_reason`, and `description`. Only HTTP and HTTPS apply links
are displayed. Results are rendered on the application page and are not
stored in browser storage.

The webhook URL is public in frontend JavaScript. It is not a place for
credentials or API keys. Protect the workflow and its upstream credentials in
n8n, and configure the workflow to accept requests from the site origin.

## Publish with GitHub Pages

1. Push the project files to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the default branch and the `/(root)` folder, then save.
5. Wait for deployment and open the published URL shown in the Pages settings.
6. Test the deployed form using a dummy CV and verify that the n8n workflow
   accepts requests from the published site.
