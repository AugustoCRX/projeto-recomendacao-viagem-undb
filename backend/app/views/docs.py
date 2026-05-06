"""
views/docs.py
─────────────
Serves the project's living developer guide (``documentation.md``) as both
rendered HTML and raw markdown JSON. The frontend can fetch the raw markdown
to render in-app while ``/docs-md`` HTML renders Mermaid diagrams via a CDN.
"""

from pathlib import Path

import markdown as md_lib
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse

router = APIRouter()

# documentation.md lives at backend/documentation.md (one level above app/)
_DOC_PATH = Path(__file__).resolve().parents[2] / "documentation.md"

_HTML_SHELL = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Smart Travel Planner — Documentation</title>
<style>
 body{{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
       max-width:920px;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#222}}
 pre{{background:#f5f5f7;padding:1rem;border-radius:6px;overflow:auto}}
 code{{font-family:ui-monospace,Menlo,Consolas,monospace}}
 table{{border-collapse:collapse;margin:1rem 0}}
 th,td{{border:1px solid #ddd;padding:.4rem .6rem}}
 h1,h2,h3{{border-bottom:1px solid #eee;padding-bottom:.3rem}}
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<script>document.addEventListener("DOMContentLoaded",()=>{{
  document.querySelectorAll("pre>code.language-mermaid").forEach(el=>{{
    const d=document.createElement("div");d.className="mermaid";
    d.textContent=el.textContent;el.parentElement.replaceWith(d);}});
  mermaid.initialize({{startOnLoad:true,theme:"default"}});
}});</script>
</head>
<body>
{body}
</body></html>"""


def _read_markdown() -> str:
    if not _DOC_PATH.exists():
        raise HTTPException(status_code=404, detail="documentation.md not found")
    return _DOC_PATH.read_text(encoding="utf-8")


@router.get(
    "",
    response_class=HTMLResponse,
    summary="Project documentation rendered as HTML (with Mermaid diagrams)",
)
def docs_html() -> HTMLResponse:
    text = _read_markdown()
    body = md_lib.markdown(text, extensions=["fenced_code", "tables", "toc"])
    return HTMLResponse(_HTML_SHELL.format(body=body))


@router.get(
    "/raw",
    summary="Raw markdown (for the frontend to render in-app)",
    description="Returns ``{ markdown: string }``.",
)
def docs_raw() -> JSONResponse:
    return JSONResponse({"markdown": _read_markdown()})
