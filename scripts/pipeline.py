#!/usr/bin/env python3
import argparse
import re
from pathlib import Path

import pyarrow.parquet as pq
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

EXCLUDE_PREFIXES = (
    "파일:", "분류:", "https:", "http:",
    "틀:", "템플릿:", "나무위키:", "사용자:", "도움말:"
)
BATCH_SIZE = 10_000


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


def main() -> None:
    parser = argparse.ArgumentParser(description="나무위키 덤프 전처리 파이프라인")
    parser.add_argument("parquet_file", help="입력 parquet 파일 경로")
    parser.add_argument("--dry-run", action="store_true", help="업로드 없이 처리 통계만 출력")
    args = parser.parse_args()

    pf = pq.ParquetFile(args.parquet_file)

    total_docs = 0
    total_redirects = 0
    total_links = 0
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
            print(f"[{rows_processed:,}행] 문서: {total_docs:,}, 리다이렉트: {total_redirects:,}")

        if not args.dry_run:
            # TODO: R2 업로드 + Supabase INSERT (커밋 2/2)
            pass

    avg_links = total_links / total_docs if total_docs else 0.0
    print(f"\n=== {'dry-run ' if args.dry_run else ''}처리 완료 ===")
    print(f"처리 문서:  {total_docs:,}개")
    print(f"리다이렉트: {total_redirects:,}개")
    print(f"평균 링크:  {avg_links:.1f}개")


if __name__ == "__main__":
    main()
