import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('export_live', Path(__file__).with_name('export-live.py'))
export = importlib.util.module_from_spec(spec)
spec.loader.exec_module(export)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.snapshots = self.root/'snapshots'
        self.snapshots.mkdir()
        self.private = self.root/'private'
        self.private.mkdir()
        self.save(self.private/'variant-tests.json', {'tests': []})
        self.inventory([])
        for name in ['instagram.json', 'tiktok.json']:
            self.save(self.snapshots/name, {'observedAt': '2026-10-11T14:00:00Z', 'rows': []})

    def save(self, path, value):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value), encoding='utf-8')

    def inventory(self, rows, at='2026-10-11T14:00:00Z'):
        self.save(self.snapshots/'youtube-shorts.json', {'observedAt': at, 'rows': rows})

    def row(self, ident='abcdefghijk', visibility='Public', views=7):
        return {'url': f'https://studio.youtube.com/video/{ident}/edit', 'title': 'Saved title',
                'cells': ['', '', '', visibility, 'Oct 9, 2026\nPublished', str(views)]}

    def post(self, ident='abcdefghijk', views=100, at='2026-10-11T16:00:00Z'):
        return {'id':'youtube:'+ident, 'platform':'YouTube', 'title':'Existing public episode',
                'url':'https://www.youtube.com/watch?v='+ident, 'views':views, 'observedAt':at,
                'review':'Documented review and learning', 'publicationDate':'Oct 9, 2026'}

    def build(self, existing):
        return export.build(self.snapshots, existing=existing, private=self.private)

    def test_explicit_snapshot_required_before_any_write(self):
        isolated=self.root/'scripts/export-live.py'
        isolated.parent.mkdir()
        isolated.write_text(Path(export.__file__).read_text(encoding='utf-8'),encoding='utf-8')
        (self.root/'content').mkdir()
        result=subprocess.run([sys.executable,str(isolated)],capture_output=True,text=True)
        self.assertNotEqual(result.returncode,0)
        self.assertIn('required',result.stderr)

    def test_old_snapshot_preserves_new_records_and_learning(self):
        self.inventory([self.row()])
        posts=[self.post(),self.post('lmnopqrstuv')]
        result=self.build({'posts':posts,'reviews':[{'decision':'Latest actual review'}],
            'experiments':[{'id':'test-1','status':'complete','result':'Measured result','history':[1,2]}],
            'campaignAddedHistory':[{'observedAt':'2026-10-11T16:26:56.740Z','value':957}]})
        self.assertEqual(result['posts'],posts)
        self.assertEqual(result['reviews'],[{'decision':'Latest actual review'}])
        self.assertEqual(result['experiments'][0]['history'],[1,2])
        self.assertEqual(result['campaignAddedHistory'][-1]['value'],957)

    def test_newer_counter_correction_updates_metric_without_erasing_review(self):
        self.inventory([self.row(views=90)],at='2026-10-11T13:00:01-04:00')
        result=self.build({'posts':[self.post(at='2026-10-11T17:00:00Z')]})['posts'][0]
        self.assertEqual(result['views'],90)
        self.assertEqual(result['review'],'Documented review and learning')

    def test_fresh_explicit_nonpublic_inventory_removes_identity(self):
        for visibility in ['Private','Unlisted']:
            self.inventory([self.row(visibility=visibility)],at='2026-10-11T18:00:00Z')
            result=self.build({'posts':[self.post()]})
            self.assertEqual(result['posts'],[])
            self.assertNotIn('abcdefghijk',json.dumps(result))
        self.inventory([self.row(visibility='Private')],at='2026-10-11T12:00:00Z')
        self.assertEqual(len(self.build({'posts':[self.post()]})['posts']),1)

    def test_history_merge_keeps_new_point_and_experiment_result(self):
        self.save(self.private/'observations/heartbeat-old/metric-export.json',
                  {'observedThrough':'2026-10-11T13:31:26Z','summedMeasuredPostViews':685})
        self.save(self.private/'variant-tests.json', {'tests':[{'variantId':'test-1','status':'approved_unscheduled','treatment':'Opening test','result':None,'createdAt':'2026-10-11T11:00:00Z'}]})
        existing={'posts':[],'campaignAddedHistory':[{'observedAt':'2026-10-11T16:26:56.740Z','value':957}],
                  'experiments':[{'id':'test-1','status':'complete','result':'Measured result'}]}
        result=self.build(existing)
        self.assertEqual([x['value'] for x in result['campaignAddedHistory']],[685,957])
        self.assertEqual(result['experiments'][0]['status'],'complete')
        self.assertEqual(result['experiments'][0]['result'],'Measured result')

    def test_safe_watch_links_allowed_and_spoofed_or_mismatched_links_rejected(self):
        export.validate({'posts':[self.post()]})
        for url in ['https://www.youtube.com.evil.test/watch?v=abcdefghijk',
                    'https://user@www.youtube.com/watch?v=abcdefghijk',
                    'https://www.youtube.com/watch?v=otherpostid',
                    'https://www.youtube.com/watch?v=abcdefghijk&v=otherpostid']:
            with self.subTest(url=url),self.assertRaises(ValueError):
                export.validate({'posts':[dict(self.post(),url=url)]})

    def test_videos_inventory_keeps_private_rows_out_of_public_export(self):
        self.save(self.snapshots/'youtube-videos-metric.json',{
            'observedAt':'2026-10-11T18:00:00Z','rows':[
                {'id':'abcdefghijk','views':222,'visibility':'private'},
                {'id':'lmnopqrstuv','views':29,'visibility':'public','title':'Public video'}]})
        result=self.build({'posts':[self.post()]})
        self.assertEqual([x['id'] for x in result['posts']],['youtube:lmnopqrstuv'])
        self.assertNotIn('abcdefghijk',json.dumps(result))

    def test_financial_fields_and_notes_cannot_be_exported(self):
        for extra in [{'revenueGoalUsd':12345},
                      {'results':{'revenue':None}},
                      {'reviews':[{'note':'No verified receipts'}]},
                      {'donations':[{'amount':23}]},
                      {'paymentAmountUsd':23},
                      {'experiments':[{'id':'money','result':{'amountUsd':125}}]},
                      {'reviews':[{'note':'Collected $125 this week.'}]},
                      {'reviews':[{'note':'Collected 125 USD this week.'}]},
                      {'reviews':[{'note':'Collected 125 dollars this week.'}]}]:
            with self.subTest(extra=extra),self.assertRaisesRegex(ValueError,'financial'):
                self.build(dict(posts=[],**extra))

    def test_private_experiment_financial_result_is_rejected(self):
        self.save(self.private/'variant-tests.json',{'tests':[{
            'variantId':'test-financial','status':'complete','treatment':'Opening test',
            'result':'Company revenue is unknown.'}]})
        with self.assertRaisesRegex(ValueError,'financial'):
            self.build({'posts':[]})


if __name__=='__main__':
    unittest.main()
