import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('proof_freshness_job', Path(__file__).with_name('proof_freshness_job.py'))
job = importlib.util.module_from_spec(spec)
spec.loader.exec_module(job)


class ProofFreshnessJobTests(unittest.TestCase):
    def test_real_jobs_and_the_clean_fixture_match_the_allowlist(self):
        report = job.self_test()
        self.assertEqual(report['clean'], [])
        self.assertEqual(report['workflows'], {'site-gate.yml': [], 'tests.yml': []})

    def test_each_bypass_is_rejected(self):
        for name, text in job.mutations():
            with self.subTest(name=name):
                self.assertTrue(job.problems(text), name)


if __name__ == '__main__':
    unittest.main()
