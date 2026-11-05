#!/usr/bin/env python3
"""Allowlist for the proof-freshness job. Uses the system PyYAML (python3-yaml).

A skipped required check counts as a pass, so the workflow is accepted only
when its top-level keys and the proof-freshness job match the allowlist.
Workflow env and defaults are inherited by the job, so they are rejected.
YAML merge keys, anchors and aliases inside the job are rejected.
"""
import json
import sys
from pathlib import Path

import yaml
from yaml.events import AliasEvent
from yaml.nodes import MappingNode, ScalarNode, SequenceNode

ROOT = Path(__file__).resolve().parents[1]
CHECKOUT = "actions/checkout@11d5960a326750d5838078e36cf38b85af677262"
NODE_PINS = {
    "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020",
    "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
}
RUN = "node --test --test-reporter=spec scripts/freshness/*.test.cjs"
STEP_NAME = "/proof data is under 26 h old"
JOB_KEYS = {"name", "runs-on", "timeout-minutes", "permissions", "steps"}
REQUIRED = {"runs-on", "timeout-minutes", "permissions", "steps"}
# site-gate also has concurrency. tests does not. `on` is the YAML 1.1 boolean true.
TOP_LEVEL = (
    frozenset({"name", "on", "permissions", "concurrency", "jobs"}),
    frozenset({"name", "on", "permissions", "jobs"}),
)


def _anchor_marks(text):
    marks = []
    for event in yaml.parse(text):
        if isinstance(event, AliasEvent):
            marks.append((event.start_mark.line, "alias"))
        elif getattr(event, "anchor", None):
            marks.append((event.start_mark.line, "anchor"))
    return marks


def _job_node(root):
    if not isinstance(root, MappingNode):
        return None
    for key, value in root.value:
        if isinstance(key, ScalarNode) and key.value == "jobs" and isinstance(value, MappingNode):
            for jkey, jvalue in value.value:
                if isinstance(jkey, ScalarNode) and jkey.value == "proof-freshness":
                    return jvalue
    return None


def _merge_keys(node):
    found = []
    if isinstance(node, MappingNode):
        for key, value in node.value:
            if isinstance(key, ScalarNode) and (key.value == "<<" or str(key.tag or "").endswith(":merge")):
                found.append("proof-freshness uses a YAML merge key")
            found.extend(_merge_keys(value))
    elif isinstance(node, SequenceNode):
        for item in node.value:
            found.extend(_merge_keys(item))
    return found


def _allow(job):
    if not isinstance(job, dict):
        return ["proof-freshness is not a mapping"]
    out = []
    for key in sorted(set(job) - JOB_KEYS):
        out.append(f"unexpected key {key}")
    for key in sorted(REQUIRED - set(job)):
        out.append(f"missing key {key}")
    if job.get("runs-on") != "ubuntu-latest":
        out.append("runs-on is not ubuntu-latest")
    if job.get("timeout-minutes") != 5:
        out.append("timeout-minutes is not 5")
    if job.get("permissions") != {"contents": "read"}:
        out.append("permissions are not contents: read")
    if "name" in job and job.get("name") != "proof-freshness":
        out.append("name is not proof-freshness")
    steps = job.get("steps")
    if not isinstance(steps, list) or len(steps) != 3:
        out.append("steps are not the three expected steps")
        return out
    out.extend(_uses_step(steps[0], CHECKOUT, {"persist-credentials": False}, "checkout"))
    node = steps[1].get("uses") if isinstance(steps[1], dict) else None
    if node not in NODE_PINS:
        out.append("setup-node is not one of the pinned actions these workflows already use")
    else:
        out.extend(_uses_step(steps[1], node, {"node-version": "20"}, "setup-node"))
    out.extend(_run_step(steps[2]))
    return out


def _uses_step(step, uses, with_map, label):
    if not isinstance(step, dict):
        return [f"{label} step is not a mapping"]
    out = []
    if set(step) != {"uses", "with"}:
        out.append(f"{label} step keys are {sorted(step)}")
    if step.get("uses") != uses:
        out.append(f"{label} uses an unexpected action")
    if step.get("with") != with_map:
        out.append(f"{label} with is not the expected mapping")
    return out


def _run_step(step):
    if not isinstance(step, dict):
        return ["freshness step is not a mapping"]
    out = []
    if set(step) != {"name", "run", "env"}:
        out.append(f"freshness step keys are {sorted(step)}")
    if step.get("name") != STEP_NAME:
        out.append("freshness step name changed")
    if step.get("env") != {"NODE_OPTIONS": ""}:
        out.append("freshness step must set NODE_OPTIONS to an empty string")
    if step.get("run") != RUN:
        out.append("freshness step run is not the exact command")
    return out


def _workflow_keys(data):
    keys = set()
    for key in data:
        # PyYAML parses the GitHub `on` key as boolean true.
        keys.add("on" if key is True else key)
    return keys


def _workflow_problems(data):
    keys = _workflow_keys(data)
    out = []
    if "env" in keys:
        out.append("workflow env is inherited by proof-freshness")
    if "defaults" in keys:
        out.append("workflow defaults are inherited by proof-freshness")
    if frozenset(keys) not in TOP_LEVEL:
        out.append("workflow keys are " + " ".join(sorted(str(k) for k in keys)))
    return out


def problems(text):
    try:
        root = yaml.compose(text)
        data = yaml.safe_load(text)
        marks = _anchor_marks(text)
    except yaml.YAMLError as exc:
        return [f"workflow YAML did not parse: {exc}"]
    if not isinstance(data, dict):
        return ["workflow is not a mapping"]
    out = _workflow_problems(data)
    jobs = data.get("jobs")
    if not isinstance(jobs, dict) or "proof-freshness" not in jobs:
        out.append("proof-freshness job is missing")
        return out
    composed = _job_node(root)
    if composed is None:
        out.append("proof-freshness job is missing from the YAML node tree")
    else:
        start, end = composed.start_mark.line, composed.end_mark.line
        for line, kind in marks:
            if start <= line <= end:
                out.append(f"proof-freshness uses a YAML {kind}")
        out.extend(_merge_keys(composed))
    out.extend(_allow(jobs["proof-freshness"]))
    return out


def _clean():
    node = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020"
    return f"""
name: example
"on": workflow_dispatch
permissions: {{}}
jobs:
  proof-freshness:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
    steps:
      - uses: {CHECKOUT}
        with:
          persist-credentials: false
      - uses: {node}
        with:
          node-version: "20"
      - name: {STEP_NAME}
        env:
          NODE_OPTIONS: ""
        run: {RUN}
"""


def mutations():
    """Each item is a real way to hide a failing required check, or a YAML alias."""
    base = _clean()
    run_line = f"        run: {RUN}"
    flow = (
        "jobs:\n  proof-freshness: {if: false, runs-on: ubuntu-latest, timeout-minutes: 5, "
        "permissions: {contents: read}, steps: ["
        f"{{uses: {CHECKOUT}, with: {{persist-credentials: false}}}}, "
        "{uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020, with: {node-version: '20'}}, "
        f"{{name: '{STEP_NAME}', run: '{RUN}'}}]}}\n"
    )
    quoted = base.replace(
        "    runs-on: ubuntu-latest\n",
        "    runs-on: ubuntu-latest\n    \"continue-on-error\": true\n",
        1,
    )
    merged = f"""
name: example
"on": workflow_dispatch
sneak: &sneak
  if: false
jobs:
  proof-freshness:
    <<: *sneak
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
    steps:
      - uses: {CHECKOUT}
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020
        with:
          node-version: "20"
      - name: {STEP_NAME}
        run: {RUN}
"""
    anchored = base.replace(run_line, f"        run: &fresh {RUN}", 1)
    env_block = "env:\n  NODE_OPTIONS: --test-name-pattern=zzz\n"
    defaults_block = "defaults:\n  run:\n    shell: bash\n"
    return [
        ("job if: false", base.replace("  proof-freshness:\n", "  proof-freshness:\n    if: false\n", 1)),
        ("step if", base.replace(run_line, "        if: ${{ false }}\n" + run_line, 1)),
        ("run || true", base.replace(run_line, run_line + " || true", 1)),
        ("run || echo stale", base.replace(run_line, run_line + " || echo stale", 1)),
        ("run || exit 0 with extra spaces", base.replace(run_line, run_line + " ||  exit   0", 1)),
        ("set +e", base.replace(run_line, "        run: |\n          set +e\n          " + RUN, 1)),
        ("flow-style if: false", flow),
        ("quoted continue-on-error", quoted),
        ("merge key carries if", merged),
        ("anchor on the run command", anchored),
        ("workflow env NODE_OPTIONS", base.replace('"on": workflow_dispatch\n', '"on": workflow_dispatch\n' + env_block, 1)),
        ("workflow defaults", base.replace('"on": workflow_dispatch\n', '"on": workflow_dispatch\n' + defaults_block, 1)),
        ("step NODE_OPTIONS filter", base.replace('NODE_OPTIONS: ""', "NODE_OPTIONS: --test-name-pattern=zzz", 1)),
        ("site-gate.yml workflow env", _insert_top("site-gate.yml", env_block)),
        ("tests.yml workflow env", _insert_top("tests.yml", env_block)),
        ("site-gate.yml workflow defaults", _insert_top("site-gate.yml", defaults_block)),
        ("tests.yml workflow defaults", _insert_top("tests.yml", defaults_block)),
    ]


def _insert_top(filename, block):
    text = (ROOT / ".github" / "workflows" / filename).read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    for i, line in enumerate(lines):
        if line.startswith("permissions:"):
            lines.insert(i + 1, block)
            return "".join(lines)
    raise RuntimeError(filename + " has no top-level permissions")


def self_test():
    report = {"clean": problems(_clean()), "workflows": {}, "mutations": {}}
    for name in ("site-gate.yml", "tests.yml"):
        text = (ROOT / ".github" / "workflows" / name).read_text(encoding="utf-8")
        report["workflows"][name] = problems(text)
    for name, text in mutations():
        report["mutations"][name] = problems(text)
    return report


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        json.dump(self_test(), sys.stdout)
        return
    json.dump(problems(sys.stdin.read()), sys.stdout)


if __name__ == "__main__":
    main()
