import importlib.util
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.error

spec = importlib.util.spec_from_file_location('live_refresh', Path(__file__).with_name('live-refresh.py'))
refresh = importlib.util.module_from_spec(spec)
spec.loader.exec_module(refresh)

OLD = '2026-10-15 11:20 ET'
STAMP = '2026-11-05 09:30 ET'


class RefreshStampTests(unittest.TestCase):
    def now(self):
        return refresh.dt.datetime(2026, 11, 5, 9, 30, tzinfo=refresh.ET)

    def owner(self):
        row = {
            'date': '2026-10-15',
            'followers': {'x': 4, 'instagram': None},
            'posts_published': 163,
            'notes': 348,
            'sources': 745,
            'companies': 9,
        }
        return {
            'meta': {'start': '2026-08-28', 'updated_et': OLD, 'errors': ['stale'], 'days_running': 48},
            'history': [dict(row, followers=dict(row['followers']))],
            'today': dict(row, followers=dict(row['followers'])),
        }

    def proof(self):
        return {
            'updated_et': OLD,
            'days_running': 48,
            'companies_studied': 9,
            'sources_collected': 745,
            'knowledge_notes': 348,
            'posts_published': 163,
            'audience_total': None,
            'history': [{'date': '2026-10-15', 'notes': 348, 'sources': 745, 'companies': 9, 'posts': 163}],
        }

    def apply(self, sources):
        owner, proof = self.owner(), self.proof()
        errors = refresh.refresh_owner(owner, self.now(), sources)
        refresh.refresh_proof(proof, owner, fresh=not errors)
        return errors, owner, proof

    def test_both_sources_move_the_stamp_and_clear_errors(self):
        errors, owner, proof = self.apply((('x', lambda: 9), ('postiz', lambda: 170)))
        self.assertEqual(errors, [])
        self.assertEqual(owner['meta']['updated_et'], STAMP)
        self.assertEqual(owner['meta']['errors'], [])
        self.assertEqual(owner['meta']['days_running'], 69)
        self.assertEqual(owner['history'][0]['date'], '2026-10-15')
        self.assertEqual(owner['history'][0]['followers']['x'], 4)
        self.assertEqual(owner['history'][0]['posts_published'], 163)
        self.assertEqual(owner['history'][1]['date'], '2026-11-05')
        self.assertEqual(owner['history'][1]['followers']['x'], 9)
        self.assertEqual(owner['history'][1]['posts_published'], 170)
        self.assertIsNot(owner['history'][0]['followers'], owner['history'][1]['followers'])
        self.assertEqual(proof['updated_et'], STAMP)
        self.assertEqual(proof['posts_published'], 170)
        self.assertEqual(proof['audience_total'], None)
        self.assertEqual(proof['companies_studied'], 9)
        self.assertEqual(proof['history'][0]['posts'], 163)
        self.assertEqual(proof['history'][1]['date'], '2026-11-05')
        self.assertEqual(proof['history'][1]['posts'], 170)

    def test_zero_counts_as_a_real_fetch(self):
        errors, owner, proof = self.apply((('x', lambda: 0), ('postiz', lambda: 0)))
        self.assertEqual(errors, [])
        self.assertEqual(owner['meta']['updated_et'], STAMP)
        self.assertEqual(owner['today']['followers']['x'], 0)
        self.assertEqual(owner['today']['posts_published'], 0)
        self.assertEqual(proof['updated_et'], STAMP)
        self.assertEqual(proof['posts_published'], 0)

    def test_failed_or_skipped_fetch_keeps_the_old_stamp(self):
        def boom():
            raise urllib.error.URLError('down')
        cases = [
            (('x', lambda: None), ('postiz', lambda: 170), ['x: skipped'], 4, 170),
            (('x', lambda: 9), ('postiz', lambda: None), ['postiz: skipped'], 9, 163),
            (('x', boom), ('postiz', lambda: 170), ['x: URLError'], 4, 170),
            (('x', lambda: 9), ('postiz', boom), ['postiz: URLError'], 9, 163),
            (('x', lambda: None), ('postiz', lambda: None), ['x: skipped', 'postiz: skipped'], 4, 163),
            (('x', boom), ('postiz', boom), ['x: URLError', 'postiz: URLError'], 4, 163),
        ]
        for sources in cases:
            x_fn, post_fn, expect, followers, posts = sources
            errors, owner, proof = self.apply((x_fn, post_fn))
            self.assertEqual(errors, expect)
            self.assertEqual(owner['meta']['errors'], expect)
            self.assertEqual(owner['meta']['updated_et'], OLD)
            self.assertEqual(proof['updated_et'], OLD)
            self.assertEqual([row['date'] for row in owner['history']], ['2026-10-15'])
            self.assertEqual([row['date'] for row in proof['history']], ['2026-10-15'])
            self.assertEqual(owner['today']['followers']['x'], followers)
            self.assertEqual(owner['today']['posts_published'], posts)
            self.assertEqual(proof['posts_published'], posts)
            self.assertEqual(proof['audience_total'], None)
            self.assertEqual(proof['companies_studied'], 9)

    def test_missing_token_helpers_are_skips(self):
        with patch.dict(os.environ, {'X_BEARER_TOKEN': '', 'POSTIZ_API_KEY': ''}):
            errors, owner, proof = self.apply((
                ('x', refresh.x_followers),
                ('postiz', refresh.postiz_published),
            ))
        self.assertEqual(errors, ['x: skipped', 'postiz: skipped'])
        self.assertEqual(owner['meta']['updated_et'], OLD)
        self.assertEqual(proof['updated_et'], OLD)
        self.assertEqual(proof['posts_published'], 163)
        self.assertEqual(owner['today']['followers']['x'], 4)

    def _run_main(self, x_value, post_value):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        enc, proof_path = root / 'owner.enc.json', root / 'proof.json'
        enc.write_text('{}', encoding='utf-8')
        proof_path.write_text(json.dumps(self.proof()), encoding='utf-8')
        saved = {}

        def fake_encrypt(owner, pw, it=600000):
            saved['owner'] = owner
            saved['pw'] = pw
            return {'v': 1}

        env = dict(os.environ)
        env['LIVE_PASSWORD'] = 'secret'
        env['X_BEARER_TOKEN'] = ''
        env['POSTIZ_API_KEY'] = ''
        real = refresh.dt.datetime

        class Frozen(real):
            @classmethod
            def now(cls, tz=None):
                return real(2026, 11, 5, 9, 30, tzinfo=tz)

        with patch.dict(os.environ, env, clear=True), \
             patch.object(refresh, 'ENC', str(enc)), \
             patch.object(refresh, 'PROOF', str(proof_path)), \
             patch.object(refresh, 'decrypt', return_value=self.owner()), \
             patch.object(refresh, 'encrypt', side_effect=fake_encrypt), \
             patch.object(refresh, 'x_followers', return_value=x_value), \
             patch.object(refresh, 'postiz_published', return_value=post_value), \
             patch.object(refresh.dt, 'datetime', Frozen):
            refresh.main()
        return saved, json.loads(proof_path.read_text(encoding='utf-8')), json.loads(enc.read_text(encoding='utf-8'))

    def test_main_partial_failure_keeps_stamp_and_records_errors(self):
        saved, proof, blob = self._run_main(None, 170)
        self.assertEqual(blob, {'v': 1})
        self.assertEqual(saved['pw'], 'secret')
        self.assertEqual(saved['owner']['meta']['updated_et'], OLD)
        self.assertEqual(saved['owner']['meta']['errors'], ['x: skipped'])
        self.assertEqual(saved['owner']['today']['posts_published'], 170)
        self.assertEqual(saved['owner']['today']['followers']['x'], 4)
        self.assertEqual(proof['updated_et'], OLD)
        self.assertEqual(proof['posts_published'], 170)
        self.assertEqual(proof['history'], [{'date': '2026-10-15', 'notes': 348, 'sources': 745, 'companies': 9, 'posts': 163}])

    def test_main_full_success_writes_the_new_stamp(self):
        saved, proof, blob = self._run_main(9, 170)
        self.assertEqual(blob['v'], 1)
        self.assertEqual(saved['owner']['meta']['updated_et'], STAMP)
        self.assertEqual(saved['owner']['meta']['errors'], [])
        self.assertEqual(proof['updated_et'], STAMP)
        self.assertEqual(proof['posts_published'], 170)
        self.assertEqual(proof['history'][-1]['date'], '2026-11-05')
        self.assertEqual(proof['history'][-1]['posts'], 170)

    def test_main_without_password_writes_nothing(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        enc, proof_path = root / 'owner.enc.json', root / 'proof.json'
        proof_path.write_text(json.dumps(self.proof()), encoding='utf-8')
        env = dict(os.environ)
        env.pop('LIVE_PASSWORD', None)
        before = proof_path.read_text(encoding='utf-8')
        with patch.dict(os.environ, env, clear=True), \
             patch.object(refresh, 'ENC', str(enc)), \
             patch.object(refresh, 'PROOF', str(proof_path)):
            with self.assertRaises(KeyError):
                refresh.main()
        self.assertFalse(enc.exists())
        self.assertEqual(proof_path.read_text(encoding='utf-8'), before)


if __name__ == '__main__':
    unittest.main()
