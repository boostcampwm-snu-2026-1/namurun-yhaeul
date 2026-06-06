#!/usr/bin/env python3
import argparse
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import boto3
import pyarrow.parquet as pq
from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).parent / ".env")

EXCLUDE_PREFIXES = (
    "파일:", "분류:", "https:", "http:",
    "틀:", "템플릿:", "나무위키:", "사용자:", "도움말:"
)
BATCH_SIZE = 10_000
SUPABASE_BATCH_SIZE = 1_000
R2_MAX_WORKERS = 50


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


def parse_redirect_target(text: str) -> str:
    return text[len("#redirect"):].strip()


def upload_to_r2(r2_client, bucket: str, title: str, text: str) -> str | None:
    try:
        r2_client.put_object(
            Bucket=bucket,
            Key=f"articles/{title}.json",
            Body=json.dumps({"title": title, "text": text}, ensure_ascii=False).encode("utf-8"),
            ContentType="application/json; charset=utf-8",
        )
        return None
    except Exception as e:
        print(f"[R2 실패] {title}: {e}", flush=True)
        return title


def bulk_insert(supa: Client, table: str, rows: list[dict]) -> None:
    for i in range(0, len(rows), SUPABASE_BATCH_SIZE):
        supa.table(table).insert(rows[i : i + SUPABASE_BATCH_SIZE]).execute()


def main() -> None:
    parser = argparse.ArgumentParser(description="나무위키 덤프 전처리 파이프라인")
    parser.add_argument("parquet_file", help="입력 parquet 파일 경로")
    parser.add_argument("--dry-run", action="store_true", help="업로드 없이 처리 통계만 출력")
    args = parser.parse_args()

    if not args.dry_run:
        r2_client = boto3.client(
            "s3",
            endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
            aws_access_key_id=os.environ["R2_ACCESS_KEY"],
            aws_secret_access_key=os.environ["R2_SECRET_KEY"],
        )
        r2_bucket = os.environ["R2_BUCKET"]
        supa = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        )

    pf = pq.ParquetFile(args.parquet_file)

    total_docs = 0
    total_redirects = 0
    total_links = 0
    total_r2_failures = 0
    total_supabase_failures = 0
    rows_processed = 0

    for batch_num, batch in enumerate(
        pf.iter_batches(batch_size=BATCH_SIZE, columns=["title", "text"]), start=1
    ):
        df = batch.to_pandas()
        rows_processed += len(df)

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

        if batch_num % 5 == 0:
            print(
                f"[{rows_processed:,}행] 문서: {total_docs:,}, 리다이렉트: {total_redirects:,}"
                + (f", R2 실패: {total_r2_failures:,}" if total_r2_failures else ""),
                flush=True,
            )

        if not args.dry_run:
            with ThreadPoolExecutor(max_workers=R2_MAX_WORKERS) as executor:
                failures = [
                    t for t in executor.map(
                        lambda a: upload_to_r2(r2_client, r2_bucket, a["title"], a["text"]),
                        articles,
                    )
                    if t is not None
                ]
            total_r2_failures += len(failures)

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
