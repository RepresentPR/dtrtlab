"""Public-safe export from the existing private evidence ledger; no publishing."""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PRIVATE = pathlib.Path('C:/DTRTWork/dtrt-kept-off-site/clip-growth')
def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))
def build():
    snapshots = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else PRIVATE / 'observations/site-fix-20261011'
    posts = []
    yt = read(snapshots / 'youtube-shorts.json')
    for row in yt['rows']:
        if row['cells'][3] != 'Public':
            continue
        ident = row['url'].split('/video/')[1].split('/')[0]
        posts.append(dict(id='youtube:'+ident, platform='YouTube', title=row['title'].strip(), url='https://www.youtube.com/shorts/'+ident, views=int(row['cells'][5].replace(',','')), observedAt=yt['observedAt'], publicationDate=row['cells'][4].split('\n')[0], review='Not reviewed in a matched publication-age cohort'))
    for platform, filename in [('Instagram','instagram.json'),('TikTok','tiktok.json')]:
        data = read(snapshots / filename)
        for row in data['rows']:
            if platform == 'TikTok':
                bits = row['text'].split('\n')
                title = bits[1]
                views = int(row['text'].split('Everyone\n')[1].split('\n')[0].replace(',',''))
            else:
                title = 'Instagram Reel '+row['url'].strip('/').split('/')[-1]
                views = int(row['text'].replace(',',''))
            posts.append(dict(id=platform.lower()+':'+row['url'].strip('/').split('/')[-1], platform=platform, title=title, url=row['url'], views=views, observedAt=data['observedAt'], publicationDate=None, review='Not reviewed in a matched publication-age cohort'))
    history = []
    for f in sorted((PRIVATE/'observations').glob('heartbeat-*/metric-export.json')):
        data = read(f)
        if isinstance(data.get('summedMeasuredPostViews'),int):
            history.append(dict(observedAt=data['observedThrough'], value=data['summedMeasuredPostViews']))
    tests = read(PRIVATE/'variant-tests.json')['tests']
    experiment = [dict(id=x['variantId'], title='One bullet left: direct exchange opening', status=x['status'], hypothesis=x['treatment'], result=x.get('result'), limitation='Shorter duration and different publication time/audience prevent causal attribution.') for x in tests]
    return dict(schemaVersion=1, posts=posts, campaignAddedHistory=history, experiments=experiment, reviews=[dict(platform='TikTok', observedAt='2026-10-11T11:25:55.340Z', checkpoint='4h review; collected 16.9 minutes late', views=279, averageWatchSeconds=6.52, completionPercent=10.2, decision='Inconclusive: one-post cohort; largest retention drop at 2 seconds. Direct-opening test prepared.'),dict(platform='X',observedAt='2026-10-11T11:26:13.681Z',checkpoint='4h review; collected 16.2 minutes late',views=3,decision='Inconclusive: possible operator contribution; excluded from campaign growth.')], coverage=str(len(posts))+' public short-form posts. Unlisted YouTube views appear only in the overall aggregate. Unavailable archives, X inventory, Twitch, FACEIT and longer videos remain unmeasured. No full library or organic attribution claim.')
if __name__ == '__main__':
    data = build()
    assert len({x['id'] for x in data['posts']}) == len(data['posts'])
    assert all(isinstance(x['views'],int) and x['views'] >= 0 for x in data['posts'])
    assert all(x['url'].startswith(('https://www.youtube.com/shorts/','https://www.instagram.com/','https://www.tiktok.com/')) for x in data['posts'])
    (ROOT/'content/live-performance.json').write_text(json.dumps(data,indent=2)+'\n',encoding='utf-8')
    print('Export verified:',len(data['posts']),'public records;',sum(x['views'] for x in data['posts']),'public lifetime views.')
