"""Merge explicit private metric snapshots into the saved public export; no publishing."""
import argparse
from datetime import datetime, timezone
import json
import os
import pathlib
import re
from urllib.parse import parse_qs, urlparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
UNREVIEWED = 'Not reviewed in a matched publication-age cohort'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def instant(value):
    date = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if date.utcoffset() is None:
        raise ValueError('Observation timestamps require a timezone')
    return date.astimezone(timezone.utc)


def public_post(ident, platform, title, url, views, observed_at, publication_date=None):
    return dict(id=platform.lower()+':'+ident, platform=platform, title=title.strip(),
                url=url, views=views, observedAt=observed_at,
                publicationDate=publication_date, review=UNREVIEWED)


def snapshot_records(snapshots):
    """Nonpublic observations remain internal and never become public tombstones."""
    posts, nonpublic, found = [], {}, False
    for name in ('youtube-shorts.json', 'youtube-videos-metric.json'):
        path = snapshots/name
        if not path.is_file():
            continue
        found = True
        data = read(path)
        for row in data['rows']:
            standard = name == 'youtube-videos-metric.json'
            ident = row['id'] if standard else row['url'].split('/video/')[1].split('/')[0]
            visibility = row['visibility'] if standard else row['cells'][3]
            if visibility.lower() != 'public':
                key = 'youtube:'+ident
                if key not in nonpublic or instant(data['observedAt']) > instant(nonpublic[key]):
                    nonpublic[key] = data['observedAt']
                continue
            posts.append(public_post(ident, 'YouTube', row['title'],
                'https://www.youtube.com/'+('watch?v=' if standard else 'shorts/')+ident,
                row['views'] if standard else int(row['cells'][5].replace(',', '')),
                data['observedAt'], row.get('date') if standard else row['cells'][4].split('\n')[0]))
    for platform, name in [('Instagram', 'instagram.json'), ('TikTok', 'tiktok.json')]:
        path = snapshots/name
        if not path.is_file():
            continue
        found = True
        data = read(path)
        for row in data['rows']:
            ident = row['url'].rstrip('/').split('/')[-1]
            if platform == 'TikTok':
                if 'Everyone\n' not in row['text']:
                    continue
                title = row['text'].split('\n')[1]
                views = int(row['text'].split('Everyone\n')[1].split('\n')[0].replace(',', ''))
            else:
                title = 'Instagram Reel '+ident
                views = int(row['text'].replace(',', ''))
            posts.append(public_post(ident, platform, title, row['url'], views, data['observedAt']))
    if not found:
        raise ValueError('Snapshot directory contains no supported inventory JSON')
    return posts, nonpublic


def merge_history(existing, private, snapshots):
    history = {}
    sources = sorted((private/'observations').glob('heartbeat-*/metric-export.json'))
    if (snapshots/'metric-export.json').is_file():
        sources.append(snapshots/'metric-export.json')
    for path in sources:
        data = read(path)
        value = data.get('summedMeasuredPostViews')
        if type(value) is int and value >= 0:
            point = dict(observedAt=data['observedThrough'], value=value)
            history[instant(point['observedAt'])] = point
    # Existing saved points win same-timestamp conflicts; old exports cannot replace learning.
    for point in existing:
        history[instant(point['observedAt'])] = point
    return [history[key] for key in sorted(history)]


def merge_experiments(existing, private):
    experiments = {item['id']: dict(item) for item in existing}
    path = private/'variant-tests.json'
    for item in read(path)['tests'] if path.is_file() else []:
        candidate = dict(id=item['variantId'], title=item.get('title', item['variantId']),
            status=item['status'], hypothesis=item['treatment'], result=item.get('result'),
            limitation='Shorter duration and different publication time/audience prevent causal attribution.')
        prior = experiments.get(candidate['id'])
        if prior:
            saved_at = prior.get('updatedAt') or prior.get('observedAt')
            incoming_at = item.get('updatedAt') or item.get('observedAt')
            newer = saved_at and incoming_at and instant(incoming_at) > instant(saved_at)
            for key, value in candidate.items():
                if key not in prior or (newer and value is not None):
                    prior[key] = value
            if newer:
                prior['updatedAt'] = incoming_at
        else:
            if item.get('updatedAt'):
                candidate['updatedAt'] = item['updatedAt']
            experiments[candidate['id']] = candidate
    return list(experiments.values())


def private_directory(value=None):
    value = value or os.environ.get('DTRT_PRIVATE_STATE_DIR')
    if not value or not str(value).strip():
        raise ValueError('Supply a private state directory with --private-dir, private=, or DTRT_PRIVATE_STATE_DIR')
    path = pathlib.Path(value)
    if not path.is_dir():
        raise ValueError('The supplied private state directory must exist')
    return path


def build(snapshots, *, existing=None, private=None):
    snapshots, private = pathlib.Path(snapshots), private_directory(private)
    if existing is None:
        path = ROOT/'content/live-performance.json'
        existing = read(path) if path.is_file() else {}
    merged = {post['id']: dict(post) for post in existing.get('posts', [])
              if post.get('visibility', 'public').lower() == 'public'}
    incoming, nonpublic = snapshot_records(snapshots)
    for post in incoming:
        prior = merged.get(post['id'])
        if not prior or instant(post['observedAt']) > instant(prior['observedAt']):
            # Metrics can decrease after corrections; editorial conclusions have separate evidence.
            if prior:
                post = dict(prior, **{key:value for key,value in post.items() if key != 'review'})
            merged[post['id']] = post
    for ident, observed_at in nonpublic.items():
        if ident in merged and instant(observed_at) >= instant(merged[ident]['observedAt']):
            del merged[ident]
    data = dict(existing, schemaVersion=1, posts=list(merged.values()),
        campaignAddedHistory=merge_history(existing.get('campaignAddedHistory', []), private, snapshots),
        experiments=merge_experiments(existing.get('experiments', []), private),
        reviews=existing.get('reviews', []))
    old_ids = {post['id'] for post in existing.get('posts', [])}
    if set(merged) != old_ids or not data.get('coverage'):
        data['coverage'] = (str(len(merged))+' public video records from dated observations. Private/unlisted '
            'identities are omitted; historical aggregate coverage is separate from campaign growth. '
            'This is not a full-library, unique-audience or organic-attribution claim.')
    validate(data)
    return data


def validate_financial_privacy(data):
    """Fail before writing when private accounting enters a performance export."""
    if isinstance(data, dict):
        for key, value in data.items():
            if re.search(r'revenue|donation|payment|refund|receipt|profit|income|financial|amount|currency|balance|accounting|monetary|spend|budget|cost|(?:usd|eur|gbp|cad|aud|jpy)$', key, re.I):
                raise ValueError('Public performance exports cannot contain financial fields')
            validate_financial_privacy(value)
    elif isinstance(data, list):
        for value in data:
            validate_financial_privacy(value)
    elif isinstance(data, str) and re.search(r'[$\u00a3\u20ac\u00a5]|\b(?:revenue|donations?|payments?|refunds?|receipts?|profits?|income|financial|spend(?:ing)?|spent|budgets?|costs?|dollars?|cents?|USD|EUR|GBP|CAD|AUD|JPY)\b', data, re.I):
        raise ValueError('Public performance exports cannot contain financial notes')


def validate(data):
    validate_financial_privacy(data)
    seen = set()
    for post in data['posts']:
        if post['id'] in seen or type(post['views']) is not int or post['views'] < 0:
            raise ValueError('Public records require unique IDs and nonnegative integer views')
        seen.add(post['id'])
        instant(post['observedAt'])
        url = urlparse(post['url'])
        if url.scheme != 'https' or url.username or url.password or url.port:
            raise ValueError('Public URLs require HTTPS without credentials or explicit ports')
        ident = None
        if url.hostname == 'www.youtube.com':
            match = re.fullmatch(r'/shorts/([A-Za-z0-9_-]+)', url.path)
            if match:
                ident = 'youtube:'+match[1]
            elif url.path == '/watch':
                values = parse_qs(url.query).get('v', [])
                if len(values) == 1 and re.fullmatch(r'[A-Za-z0-9_-]+', values[0]):
                    ident = 'youtube:'+values[0]
        elif url.hostname == 'www.instagram.com':
            match = re.fullmatch(r'/(?:[^/]+/)?(?:reel|p)/([A-Za-z0-9_-]+)/?', url.path)
            if match:
                ident = 'instagram:'+match[1]
        elif url.hostname == 'www.tiktok.com':
            match = re.fullmatch(r'/@[^/]+/video/(\d+)/?', url.path)
            if match:
                ident = 'tiktok:'+match[1]
        if ident != post['id']:
            raise ValueError('Public URL must match the supported platform and exact post ID')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('snapshots', type=pathlib.Path, help='Explicit directory containing saved inventory JSON')
    parser.add_argument('--private-dir', type=pathlib.Path,
                        help='Private state directory; alternatively set DTRT_PRIVATE_STATE_DIR. No machine default.')
    args = parser.parse_args()
    try:
        private = private_directory(args.private_dir)
    except ValueError as error:
        parser.error(str(error))
    data = build(args.snapshots, private=private)
    (ROOT/'content/live-performance.json').write_text(json.dumps(data, indent=2)+'\n', encoding='utf-8')
    print('Export verified:', len(data['posts']), 'public records;', sum(x['views'] for x in data['posts']), 'public lifetime views.')
