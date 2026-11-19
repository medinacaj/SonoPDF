#!/usr/bin/env python3
"""Snapshot de metadatos GitHub del propio repositorio. No inspecciona despliegues."""
import datetime
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

def fetch(path):
    token = os.environ.get("GITHUB_TOKEN", "")
    req = Request("https://api.github.com" + path, headers={
        "Accept": "application/vnd.github+json",
        "User-Agent": "project-memory-snapshot",
        **({"Authorization": "Bearer " + token} if token else {}),
    })
    try:
        with urlopen(req, timeout=20) as res:
            return json.load(res)
    except (HTTPError, URLError, TimeoutError, ValueError) as err:
        raise RuntimeError("GitHub API query failed: " + type(err).__name__) from err

def render(repo, info, branch, prs, issues, runs, timestamp):
    head = branch.get("commit") or {}
    lines = [
        "# Estado GitHub automático — " + repo,
        "",
        "**Consulta UTC:** " + timestamp,
        "",
        "> Solo metadatos GitHub. CI ≠ despliegue, demo ≠ producción, N/D ≠ éxito.",
        "> Archivo generado: no modificar decisiones, secretos ni registros manuales.",
        "",
        "## Rama predeterminada",
        "- Rama: `" + info.get("default_branch", "N/D") + "`",
        "- SHA: `" + head.get("sha", "N/D") + "`",
        "",
        "## PR abiertos",
    ]
    if not prs:
        lines.append("- Ninguno")
    for p in prs:
        lines.append("- [#" + str(p["number"]) + "](" + p["html_url"] + ") " +
                     ("draft" if p.get("draft") else "open") + " | SHA `" +
                     (p.get("head") or {}).get("sha", "N/D") + "`")
    lines.extend(["", "## Issues abiertos (sin PR)"])
    real_issues = [i for i in issues if "pull_request" not in i]
    if not real_issues:
        lines.append("- Ninguno")
    for i in real_issues:
        lines.append("- [#" + str(i["number"]) + "](" + i["html_url"] + ")")
    lines.extend(["", "## Últimas ejecuciones Actions"])
    workflows = runs.get("workflow_runs", [])
    if not workflows:
        lines.append("- Ninguna")
    for r in workflows[:10]:
        lines.append("- [" + str(r["id"]) + "](" + r["html_url"] + ") " +
                     str(r.get("conclusion") or r.get("status") or "N/D") +
                     " | SHA `" + str(r.get("head_sha") or "N/D") + "`")
    lines.extend(["", "## Estado del entorno",
                  "- **N/D: despliegue no verificado por GitHub Actions.**",
                  "- El bloqueo y la siguiente acción se mantienen manualmente en MEMORIA_OPERATIVA.md.",
                  ""])
    return "\n".join(lines)

def main():
    repo = os.environ["GITHUB_REPOSITORY"]
    root = "/repos/" + repo
    info = fetch(root)
    branch = fetch(root + "/branches/" + info["default_branch"])
    prs = fetch(root + "/pulls?state=open&per_page=100")
    issues = fetch(root + "/issues?state=open&per_page=100")
    runs = fetch(root + "/actions/runs?per_page=10")
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    path = Path("docs/ESTADO_GITHUB_AUTO.md")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render(repo, info, branch, prs, issues, runs, now), encoding="utf-8")

if __name__ == "__main__":
    main()
