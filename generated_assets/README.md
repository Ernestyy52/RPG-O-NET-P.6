# generated_assets/

Working area for the ComfyUI asset pipeline (Setup Pack §12).

| Directory | Tracked in git? | Purpose |
|---|---|---|
| `jobs/` | no (gitignored) | Asset job JSON files you queue. |
| `staging/` | no (gitignored) | Raw + processed generation outputs (CANDIDATE). |
| `contact_sheets/` | no (gitignored) | Montages built for human review. |
| `rejected/` | no (gitignored) | Rejected variants (retained per policy). |
| `approved/` | **yes** | Human-approved outputs, provenance-complete, cleared for import. |
| `manifests/` | **yes** | Provenance sidecar manifests for approved assets. |

The gitignored working dirs are created on demand by the scripts — they intentionally hold no
tracked files so raw model output never lands in the repo. Only `approved/` and `manifests/` are
committed. See `config/comfyui/asset-job.example.json` for a job template.
