"""Tests for the durable gates in scripts/gates/ (done_gate.py, copy_lint.py).

Banned words are built from character codes so this public file never spells them.
"""
import importlib.util, io, os, subprocess, sys, tempfile, unittest
from contextlib import redirect_stdout
from pathlib import Path

HERE = Path(__file__).resolve().parent


def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / f"{name}.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


copy_lint = load("copy_lint")
done_gate = load("done_gate")
w = lambda *codes: "".join(map(chr, codes))
ISLAND = w(80, 117, 101, 114, 116, 111) + " " + w(82, 105, 99, 111)
EMPLOYER = w(67, 97, 108, 105, 98, 101, 114)
TOWN = w(67, 108, 105, 110, 116, 111, 110)
GOOD_LINE = "Referral link. We earn from fees. Trading is risky, not financial advice."


class CopyLintTests(unittest.TestCase):
    def test_term_lists_load_from_repo_and_extras(self):
        single, pairs = copy_lint.term_sets()
        self.assertGreater(len(copy_lint.repo_sets()["SINGLE"]), 10, "private-terms.test.cjs lists not parsed")
        self.assertTrue(copy_lint.EXTRA_SINGLE <= single)
        self.assertTrue(copy_lint.EXTRA_PAIRS <= pairs)

    def test_clean_copy_passes(self):
        self.assertEqual(copy_lint.lint_text("Four quick fixes for a slow week. Free map at dtrtlab.com"), [])

    def test_location_employer_and_town_fail_even_with_accents_and_case(self):
        for text in (f"Filmed in {ISLAND}", f"{ISLAND.upper()} sunsets", f"my {EMPLOYER} days", f"near {TOWN}",
                     "Rinc" + chr(243) + "n vibes"):
            with self.subTest(text=len(text)):
                self.assertTrue(copy_lint.lint_text(text))

    def test_output_never_prints_the_word(self):
        issues = copy_lint.lint_text(f"near {TOWN}")
        self.assertTrue(all(TOWN.lower() not in d.lower() for _k, _n, d in issues))

    def test_engagement_bait_fails(self):
        self.assertTrue(copy_lint.lint_text("Tag a friend who needs this"))
        self.assertTrue(copy_lint.lint_text("Comment below!"))

    def test_candles_needs_the_exact_disclosure(self):
        self.assertTrue(copy_lint.lint_text("Candles: my pick https://example.com/r"))
        self.assertTrue(copy_lint.lint_text("Candles (referral link. we earn from fees. trading is risky, not financial advice.)"))
        self.assertEqual(copy_lint.lint_text("Candles https://example.com/r " + GOOD_LINE), [])

    def test_ai_voice_flag_requires_disclosure(self):
        self.assertTrue(copy_lint.lint_text("New episode", ai_voice=True))
        self.assertEqual(copy_lint.lint_text("New episode. AI voice used for the intro.", ai_voice=True), [])

    def test_cli_exit_codes(self):
        with tempfile.TemporaryDirectory() as d:
            good, bad = Path(d, "good.md"), Path(d, "bad.md")
            good.write_text("Clean caption.\n", encoding="utf-8")
            bad.write_text(f"Line one\nshot in {ISLAND}\n", encoding="utf-8")
            with redirect_stdout(io.StringIO()) as out:
                self.assertEqual(copy_lint.main([str(good)]), 0)
                self.assertEqual(copy_lint.main([str(bad)]), 1)
                self.assertEqual(copy_lint.main([d]), 1)
            self.assertIn("L2", out.getvalue())
            self.assertNotIn(ISLAND, out.getvalue())
            with redirect_stdout(io.StringIO()):
                self.assertEqual(copy_lint.main([str(Path(d, "empty-dir-missing"))]), 1)


class DoneGateTests(unittest.TestCase):
    def run_gate(self, body, extra_files=()):
        with tempfile.TemporaryDirectory() as d:
            for name in extra_files:
                Path(d, name).write_text("x", encoding="utf-8")
            prog = Path(d, "PROGRESS.md")
            prog.write_text(body, encoding="utf-8")
            r = subprocess.run([sys.executable, str(HERE / "done_gate.py"), str(prog)], capture_output=True, text=True)
            return r.returncode, r.stdout

    def test_claim_with_existing_proof_passes(self):
        code, out = self.run_gate("- FIXED nav overlap, see shot-390.png\nNot checked: Safari\n", ["shot-390.png"])
        self.assertEqual(code, 0, out)

    def test_claim_without_proof_fails(self):
        code, out = self.run_gate("- FIXED nav overlap\n")
        self.assertEqual(code, 1)
        self.assertIn("NO-PROOF", out)

    def test_claim_citing_missing_file_fails(self):
        code, out = self.run_gate("- DONE see missing-proof.png\n")
        self.assertEqual(code, 1)

    def test_self_graded_ready_fails(self):
        body = "score 20/20 (POST-held-out rerun) see a.png\nREADY for QA see a.png\nNot checked: x\n"
        code, out = self.run_gate(body, ["a.png"])
        self.assertEqual(code, 1)
        self.assertIn("SELF-GRADED", out)

    def test_ready_without_not_checked_is_flagged(self):
        code, out = self.run_gate("READY for QA see a.png\n", ["a.png"])
        self.assertIn("NO-NOT-CHECKED", out)


class WiringTests(unittest.TestCase):
    def test_ci_runs_the_gates(self):
        wf = (HERE.parent.parent / ".github" / "workflows" / "gates.yml").read_text(encoding="utf-8")
        self.assertIn("scripts/gates/test_gates.py", wf)
        self.assertIn("scripts/gates/copy_lint.py", wf)
        self.assertIn("scripts/gates/done_gate.py", wf)
        self.assertNotIn("continue-on-error", wf)


if __name__ == "__main__":
    unittest.main()
