# Vision-aligned labels (create in GitHub UI or via `gh label create`)

Default GitHub labels alone don’t map to DTRT Lab priorities. Add these on **dtrtlab** (and optionally DTRTCore):

| Name | Color | Description |
| --- | --- | --- |
| `vision/usefulness` | `0E8A16` | Free plan, useful tools, visitor next step |
| `vision/entertainment` | `D93F0B` | DTRTC, AFTERLIGHT, clips, stream |
| `vision/evidence` | `0075CA` | `/live`, dated metrics, honest status |
| `vision/trust` | `5319E7` | Legal, email, brand, no fake claims |
| `vision/made-for-all` | `BFDADC` | Inclusive age/size, EN/ES, global |
| `vision/revenue` | `FBCA04` | Shop interest, paid scope (real only) |
| `dual-brand` | `C2E0C6` | Lab vs DTRTC boundary |
| `blocked/ian` | `B60205` | Needs Ian login, counsel, or entity |

```bash
# example
gh label create "vision/usefulness" --color 0E8A16 --description "Free plan, useful tools, visitor next step" --repo RepresentPR/dtrtlab
```
