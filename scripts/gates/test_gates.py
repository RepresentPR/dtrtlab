"""Tests for the durable gates in scripts/gates/ (done_gate.py, copy_lint.py).

Banned words are built from character codes so this public file never spells them.
"""
import contextlib, importlib.util, io, os, subprocess, sys, tempfile, unittest
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
SOMD = w(83, 111, 77, 68)
DMV = w(68, 77, 86)
STATE = w(109, 97, 114, 121, 108, 97, 110, 100)
ISLAND_TOKEN = w(98, 111, 114, 105, 99, 117, 97)
WAITLIST = w(119, 97, 105, 116, 108, 105, 115, 116)
OLD_HANDLE = w(111, 102, 102, 105, 99, 105, 97, 108, 108, 121, 100, 116, 114, 116)
MOTION_BAD = w(67, 97, 102, 102, 101, 105, 110, 101, 32, 112, 111, 117, 99, 104, 101, 115, 32, 119, 105, 116, 104, 32, 110, 111, 32, 110, 105, 99, 111, 116, 105, 110, 101, 46)
MOTION_GOOD = w(90, 101, 114, 111, 32, 110, 105, 99, 111, 116, 105, 110, 101, 32, 97, 110, 100, 32, 122, 101, 114, 111, 32, 116, 111, 98, 97, 99, 99, 111, 44, 32, 116, 111, 111, 46)
INVESTORS = w(105, 110, 118, 101, 115, 116, 111, 114, 115)
OUR_INVESTORS = w(111, 117, 114, 32, 105, 110, 118, 101, 115, 116, 111, 114, 115)
INVESTORS_BACKED = w(105, 110, 118, 101, 115, 116, 111, 114, 115, 32, 98, 97, 99, 107, 101, 100)
AI_IS_LIVE = w(65, 73, 32, 105, 115, 32, 108, 105, 118, 101)
LIVE_AI = w(108, 105, 118, 101, 32, 65, 73)
OUR_AI_NOW_LIVE = w(111, 117, 114, 32, 65, 73, 32, 105, 115, 32, 110, 111, 119, 32, 108, 105, 118, 101)
MY_SON = w(109, 121, 32, 115, 111, 110)
MY_DAUGHTER = w(109, 121, 32, 100, 97, 117, 103, 104, 116, 101, 114)
MY_KIDS = w(109, 121, 32, 107, 105, 100, 115)
MI_HIJA = w(109, 105, 32, 104, 105, 106, 97)
MI_HIJO = w(109, 105, 32, 104, 105, 106, 111)
GOOD_LINE = "Referral link. We earn from fees. Trading is risky, not financial advice."


class CopyLintTests(unittest.TestCase):
    def test_term_lists_load_from_repo_and_extras(self):
        single, pairs = copy_lint.term_sets()
        self.assertGreater(len(copy_lint.repo_sets()["SINGLE"]), 10, "private-terms.test.cjs lists not parsed")
        self.assertTrue(copy_lint.EXTRA_SINGLE <= single)
        self.assertTrue(copy_lint.EXTRA_PAIRS <= pairs)

    def test_clean_copy_passes(self):
        self.assertEqual(copy_lint.lint_text("Four quick fixes for a slow week. Free map at dtrtlab.com"), [])

    def test_personal_location_and_employer_fail_even_with_accents_and_case(self):
        for text in (f"my {EMPLOYER} days", f"near {TOWN}", f"shot in {SOMD}", f"{DMV} area shop",
                     "Rinc" + chr(243) + "n vibes"):
            with self.subTest(text=len(text)):
                self.assertTrue(copy_lint.lint_text(text))

    def test_marketplace_island_name_is_allowed(self):
        for text in (f"Shop the {ISLAND} market at /mercado/", f"{ISLAND.upper()} small businesses",
                     f"Go live with the {ISLAND} market.", f"{ISLAND_TOKEN} owned shops"):
            with self.subTest(text=len(text)):
                self.assertEqual(copy_lint.lint_text(text), [])

    def test_bare_state_name_is_allowed_personal_location_terms_are_not(self):
        self.assertEqual(copy_lint.lint_text(f"A {STATE} filing is not required."), [])
        self.assertTrue(copy_lint.lint_text(f"near {TOWN}"))
        self.assertTrue(copy_lint.lint_text(SOMD))
        self.assertTrue(copy_lint.lint_text(DMV))

    def test_output_never_prints_the_word(self):
        issues = copy_lint.lint_text(f"near {TOWN}")
        self.assertTrue(all(TOWN.lower() not in d.lower() for _k, _n, d in issues))

    def test_phrase_wrapped_across_lines_fails(self):
        south = w(115, 111, 117, 116, 104, 101, 114, 110)
        self.assertTrue(any(k == "PAIR" for k, _n, _d in copy_lint.lint_text(f"filmed in {south}\n{STATE} today")))

    def test_missing_repo_lists_refuses_instead_of_passing(self):
        with tempfile.TemporaryDirectory() as d:
            good = Path(d, "good.md")
            good.write_text("Clean caption.\n", encoding="utf-8")
            with redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()) as err:
                self.assertEqual(copy_lint.main([str(good), "--terms", str(Path(d, "missing.cjs"))]), 2)
            self.assertIn("--terms", err.getvalue())

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
            bad.write_text(f"Line one\nshot in {TOWN}\n", encoding="utf-8")
            with redirect_stdout(io.StringIO()) as out:
                self.assertEqual(copy_lint.main([str(good)]), 0)
                self.assertEqual(copy_lint.main([str(bad)]), 1)
                self.assertEqual(copy_lint.main([d]), 1)
            self.assertIn("L2", out.getvalue())
            self.assertNotIn(ISLAND, out.getvalue())
            with redirect_stdout(io.StringIO()):
                self.assertEqual(copy_lint.main([str(Path(d, "empty-dir-missing"))]), 1)

    def test_investor_claims_fail_but_bare_word_passes(self):
        self.assertEqual(copy_lint.lint_text(f"Notes for an {INVESTORS} briefing."), [])
        self.assertTrue(copy_lint.lint_text(OUR_INVESTORS + " agree."))
        self.assertTrue(copy_lint.lint_text(INVESTORS_BACKED + " the shop."))

    def test_motion_paraphrase_fails_official_wording_passes(self):
        self.assertTrue(copy_lint.lint_text("MOTION: " + MOTION_BAD))
        self.assertEqual(copy_lint.lint_text("MOTION: " + MOTION_GOOD + " Affiliate link. We earn a commission."), [])

    def test_waitlist_and_retired_handle_fail(self):
        self.assertTrue(copy_lint.lint_text("Join the " + WAITLIST + " today."))
        self.assertTrue(copy_lint.lint_text("Find us at @" + OLD_HANDLE))
        self.assertEqual(copy_lint.lint_text("Find us at @dtrt.xyng"), [])

    def test_ai_is_live_claims_fail_accepted_wording_passes(self):
        self.assertTrue(copy_lint.lint_text(AI_IS_LIVE + ". Try it today."))
        self.assertTrue(copy_lint.lint_text(LIVE_AI + " is ready."))
        self.assertTrue(copy_lint.lint_text(OUR_AI_NOW_LIVE + ". Try it today."))
        self.assertEqual(copy_lint.lint_text("Very early AI test, not live yet."), [])
        self.assertEqual(copy_lint.lint_text("The assistant shown is a scripted preview; " + LIVE_AI + " is not connected."), [])
        self.assertEqual(copy_lint.lint_text("This switch does not activate " + LIVE_AI + " or paid work."), [])

    def test_generic_kids_phrases_fail(self):
        for phrase in (MY_SON, MY_DAUGHTER, MY_KIDS, MI_HIJA, MI_HIJO):
            with self.subTest(phrase=len(phrase)):
                self.assertTrue(copy_lint.lint_text("Weekend with " + phrase + "."))


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
    @staticmethod
    def code_lines(path):
        return [l for l in path.read_text(encoding="utf-8").splitlines() if l.strip() and not l.lstrip().startswith("#")]

    def test_ci_runs_the_gates(self):
        wf = self.code_lines(HERE.parent.parent / ".github" / "workflows" / "gates.yml")
        self.assertTrue(any("run: bash scripts/gates/run_ci.sh" in l for l in wf))
        self.assertFalse(any("continue-on-error" in l for l in wf))
        sh = self.code_lines(HERE / "run_ci.sh")
        for needle in ("python3 -m unittest scripts/gates/test_gates.py", "python3 scripts/gates/copy_lint.py",
                       "python3 scripts/gates/done_gate.py", "set -euo pipefail"):
            self.assertTrue(any(needle in l for l in sh), needle)

    def test_ci_draft_filter_covers_every_copy_lint_extension(self):
        sh = (HERE / "run_ci.sh").read_text(encoding="utf-8")
        for ext in copy_lint.TEXT_EXT:
            self.assertIn(ext.lstrip("."), sh, ext)


if __name__ == "__main__":
    unittest.main()
