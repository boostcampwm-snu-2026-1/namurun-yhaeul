#!/usr/bin/env python3
import argparse
import gzip
import json
import os
import re
import time
import urllib.parse
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import boto3
import pyarrow.parquet as pq
from dotenv import load_dotenv
from supabase import Client, create_client
from tqdm import tqdm

load_dotenv(Path(__file__).parent / ".env")

EXCLUDE_PREFIXES = (
    "파일:", "분류:", "https:", "http:",
    "틀:", "템플릿:", "나무위키:", "사용자:", "도움말:"
)
BATCH_SIZE = 10_000
SUPABASE_BATCH_SIZE = 1_000
R2_MAX_WORKERS = 50
R2_MAX_RETRIES = 3


def extract_links(text: str) -> list[str]:
    lines = [line for line in text.split("\n") if not line.startswith("##")]
    cleaned = "\n".join(lines)
    raw = re.findall(r"\[\[([^\]|#]+)(?:\|[^\]]*)?\]\]", cleaned)
    seen: set[str] = set()
    result: list[str] = []
    for raw_link in raw:
        link = raw_link.strip().lstrip(":")
        if link and link not in seen and not any(link.startswith(p) for p in EXCLUDE_PREFIXES):
            seen.add(link)
            result.append(link)
    return result


def get_uploaded_titles(r2_client, bucket: str) -> set[str]:
    print("[resume] R2 업로드 목록 조회 중...", flush=True)
    uploaded: set[str] = set()
    paginator = r2_client.get_paginator("list_objects_v2")
    pages = paginator.paginate(Bucket=bucket, Prefix="articles/")
    for page in tqdm(pages, desc="R2 목록 조회", unit="페이지"):
        for obj in page.get("Contents", []):
            key = obj["Key"]
            title = urllib.parse.unquote(key[len("articles/"):-len(".json")])
            uploaded.add(title)
    print(f"[resume] 이미 업로드된 문서: {len(uploaded):,}개", flush=True)
    return uploaded


def get_non_gzip_titles(r2_client, bucket: str, gzip_since: str) -> set[str]:
    """LastModified 기준으로 gzip 적용 전 업로드된 문서 제목 목록 반환.

    gzip_since: ISO 8601 문자열 (예: '2026-06-09T15:41:00+09:00')
    이 시각 이전에 업로드된 파일 = gzip 없는 구버전.
    """
    from datetime import datetime
    cutoff = datetime.fromisoformat(gzip_since)

    print(f"[gzip-fix] R2 목록 조회 중 (기준: {gzip_since} 이전 업로드)...", flush=True)
    non_gzip: set[str] = set()
    paginator = r2_client.get_paginator("list_objects_v2")
    for page in tqdm(
        paginator.paginate(Bucket=bucket, Prefix="articles/"),
        desc="목록 조회",
        unit="페이지",
    ):
        for obj in page.get("Contents", []):
            if obj["LastModified"] < cutoff:
                title = urllib.parse.unquote(obj["Key"][len("articles/"):-len(".json")])
                non_gzip.add(title)
    print(f"[gzip-fix] gzip 미적용 문서: {len(non_gzip):,}개", flush=True)
    return non_gzip


def parse_redirect_target(text: str) -> str:
    return text[len("#redirect"):].strip()


def upload_to_r2(r2_client, bucket: str, title: str, text: str, max_retries: int = R2_MAX_RETRIES) -> str | None:
    body = json.dumps({"title": title, "text": text}, ensure_ascii=False).encode("utf-8")
    compressed = gzip.compress(body)
    for attempt in range(max_retries):
        try:
            r2_client.put_object(
                Bucket=bucket,
                Key=f"articles/{title}.json",
                Body=compressed,
                ContentType="application/json; charset=utf-8",
                ContentEncoding="gzip",
            )
            return None
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                print(f"[R2 실패] {title}: {e}", flush=True)
                return title


def bulk_insert(supa: Client, table: str, rows: list[dict]) -> None:
    for i in range(0, len(rows), SUPABASE_BATCH_SIZE):
        supa.table(table).insert(rows[i : i + SUPABASE_BATCH_SIZE]).execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="나무위키 덤프 전처리 파이프라인")
    parser.add_argument("parquet_file", help="입력 parquet 파일 경로")
    parser.add_argument("--dry-run", action="store_true", help="업로드 없이 처리 통계만 출력")
    parser.add_argument("--r2-only", action="store_true", help="R2 업로드만 수행 (Supabase INSERT 생략)")
    parser.add_argument("--resume", action="store_true", help="이미 R2에 업로드된 문서 건너뜀")
    parser.add_argument(
        "--gzip-fix",
        metavar="DATETIME",
        help="지정 시각 이전 업로드된 문서만 gzip 재업로드 (예: 2026-06-09T15:41:00+09:00)",
    )
    args = parser.parse_args()

    if not args.dry_run:
        r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ["R2_ACCESS_KEY"],
            aws_secret_access_key=os.environ["R2_SECRET_KEY"],
        )
        r2_bucket = os.environ["R2_BUCKET"]
        if not args.r2_only:
            supa = create_client(
                os.environ["SUPABASE_URL"],
                os.environ["SUPABASE_SERVICE_ROLE_KEY"],
            )

    # skip_titles: 이미 올라간 것 건너뜀 (--resume)
    # only_titles: 이 set에 포함된 것만 업로드 (--gzip-fix), None이면 전체
    skip_titles: set[str] = set()
    only_titles: set[str] | None = None

    if not args.dry_run and args.resume:
        skip_titles = get_uploaded_titles(r2_client, r2_bucket)
    elif not args.dry_run and args.gzip_fix:
        only_titles = get_non_gzip_titles(r2_client, r2_bucket, args.gzip_fix)

    pf = pq.ParquetFile(args.parquet_file)
    total_rows = pf.metadata.num_rows

    total_docs = 0
    total_redirects = 0
    total_links = 0
    total_r2_failures = 0
    total_supabase_failures = 0
    failed_articles: list[dict] = []  # {"title": ..., "text": ...}

    progress = tqdm(total=total_rows, unit="행", desc="처리 중")

    for batch_num, batch in enumerate(
        pf.iter_batches(batch_size=BATCH_SIZE, columns=["title", "text"]), start=1
    ):
        df = batch.to_pandas()

        redirect_mask = df["text"].str.startswith("#redirect")
        redirect_df = df[redirect_mask].copy()
        article_df = df[~redirect_mask].copy()

        redirect_df["target"] = redirect_df["text"].apply(parse_redirect_target)
        redirects = redirect_df[["title", "target"]].to_dict("records")

        article_df["links"] = article_df["text"].apply(extract_links)
        article_df["byte_size"] = article_df["text"].apply(
            lambda t: len(t.encode("utf-8"))
        )
        articles = article_df[["title", "text", "links", "byte_size"]].to_dict("records")

        total_redirects += len(redirects)
        total_docs += len(articles)
        total_links += sum(len(a["links"]) for a in articles)

        progress.update(len(df))
        progress.set_postfix(문서=f"{total_docs:,}", R2실패=total_r2_failures, refresh=False)

        if not args.dry_run:
            upload_targets = [
                a for a in articles
                if a["title"] not in skip_titles
                and (only_titles is None or a["title"] in only_titles)
            ]
            with ThreadPoolExecutor(max_workers=R2_MAX_WORKERS) as executor:
                results = list(executor.map(
                    lambda a: upload_to_r2(r2_client, r2_bucket, a["title"], a["text"]),
                    upload_targets,
                ))
            batch_failures = [a for r, a in zip(results, upload_targets) if r is not None]
            failed_articles.extend({"title": a["title"], "text": a["text"]} for a in batch_failures)
            total_r2_failures += len(batch_failures)
            progress.set_postfix(문서=f"{total_docs:,}", R2실패=total_r2_failures, refresh=False)

            if not args.r2_only:
                try:
                    bulk_insert(
                        supa,
                        "articles",
                        [
                            {"title": a["title"], "links": a["links"], "byte_size": a["byte_size"]}
                            for a in articles
                        ],
                    )
                    bulk_insert(supa, "redirects", redirects)
                except Exception as e:
                    print(f"[Supabase 실패] 배치 {batch_num}: {e}", flush=True)
                    total_supabase_failures += len(articles) + len(redirects)

    progress.close()

    # 실패 문서 재시도
    if not args.dry_run and failed_articles:
        print(f"\n[재시도] 실패한 {len(failed_articles):,}개 문서 재업로드 중...", flush=True)
        retry_progress = tqdm(failed_articles, desc="재시도", unit="개")
        still_failed: list[str] = []
        for article in retry_progress:
            result = upload_to_r2(r2_client, r2_bucket, article["title"], article["text"], max_retries=5)
            if result is not None:
                still_failed.append(article["title"])

        total_r2_failures = len(still_failed)

        if still_failed:
            failures_file = Path(__file__).parent / "failed_uploads.txt"
            failures_file.write_text("\n".join(still_failed), encoding="utf-8")
            print(f"[경고] {len(still_failed):,}개 최종 실패 → {failures_file}", flush=True)
        else:
            print("✓ 재시도 포함 모든 문서 업로드 완료", flush=True)

    avg_links = total_links / total_docs if total_docs else 0.0
    print(f"\n=== {'dry-run ' if args.dry_run else ''}처리 완료 ===", flush=True)
    print(f"처리 문서:  {total_docs:,}개", flush=True)
    print(f"리다이렉트: {total_redirects:,}개", flush=True)
    print(f"평균 링크:  {avg_links:.1f}개", flush=True)
    if not args.dry_run:
        print(f"R2 실패:       {total_r2_failures:,}개", flush=True)
        print(f"Supabase 실패: {total_supabase_failures:,}개", flush=True)


if __name__ == "__main__":
    main()
