#!/usr/bin/env python3
"""
Download small ID/document datasets for ID verification training.
Use this when bandwidth is limited; choose one or more options.

Usage:
  pip install huggingface_hub requests  # if not already installed

  # Download only the smallest option (ud-biometrics passport, ~tens of MB):
  python download_id_datasets.py --passport

  # Download Hugging Face synthetic passports:
  python download_id_datasets.py --synthetic-passports

  # Download 1 part of DocXPand-25k (subset to limit size):
  python download_id_datasets.py --docxpand-parts 1

  # Download multiple:
  python download_id_datasets.py --passport --docxpand-parts 2

  # All small HF options (passport + synthetic-passports):
  python download_id_datasets.py --all-small
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

# Base directory for ID verification data (next to this script)
SCRIPT_DIR = Path(__file__).resolve().parent
ID_VERIFICATION_DIR = SCRIPT_DIR / "id_verification"


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def download_hf_dataset(repo_id: str, local_dir_name: str) -> Path:
    """Download a Hugging Face dataset via huggingface_hub."""
    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("Install with: pip install huggingface_hub", file=sys.stderr)
        raise SystemExit(1)

    out_dir = ensure_dir(ID_VERIFICATION_DIR / local_dir_name)
    print(f"Downloading {repo_id} to {out_dir} ...")
    snapshot_download(
        repo_id=repo_id,
        repo_type="dataset",
        local_dir=str(out_dir),
        local_dir_use_symlinks=False,
    )
    print(f"Done: {out_dir}")
    return out_dir


def download_docxpand_parts(num_parts: int) -> Path:
    """
    Download first N parts of DocXPand-25k from GitHub releases.
    Each part is a chunk of the full archive; 1 part = smallest download.
    """
    import urllib.request

    base_url = "https://github.com/QuickSign/docxpand/releases/download/v1.0.0/DocXPand-25k.tar.gz"
    out_dir = ensure_dir(ID_VERIFICATION_DIR / "docxpand_parts")
    for i in range(num_parts):
        part_suffix = f".{i:02d}"
        url = base_url + part_suffix
        out_file = out_dir / f"DocXPand-25k.tar.gz{part_suffix}"
        if out_file.exists():
            print(f"Already exists: {out_file}, skipping.")
            continue
        print(f"Downloading part {i + 1}/{num_parts}: {url} ...")
        urllib.request.urlretrieve(url, out_file)
        print(f"Saved: {out_file}")
    print(
        f"Downloaded {num_parts} part(s) to {out_dir}. "
        "Extract with: cat DocXPand-25k.tar.gz.* | tar xzvf - (from that directory, and requires all 12 parts for full set; 1–2 parts give a subset.)"
    )
    return out_dir


def clone_mask_rcnn_dataset() -> Path:
    """Clone MASK-RCNN passport/ID dataset from GitHub (shallow to save bandwidth)."""
    out_dir = ID_VERIFICATION_DIR / "MASK-RCNN-Dataset"
    if out_dir.exists():
        print(f"Already exists: {out_dir}, skipping clone.")
        return out_dir
    ensure_dir(ID_VERIFICATION_DIR)
    print("Cloning MASK-RCNN-Dataset (shallow) ...")
    subprocess.run(
        [
            "git", "clone", "--depth", "1",
            "https://github.com/iAmmarTahir/MASK-RCNN-Dataset.git",
            str(out_dir),
        ],
        check=True,
    )
    print(f"Done: {out_dir}")
    return out_dir


def main():
    global ID_VERIFICATION_DIR
    parser = argparse.ArgumentParser(
        description="Download small ID/document datasets for ID verification (bandwidth-friendly)."
    )
    parser.add_argument(
        "--passport",
        action="store_true",
        help="Download ud-biometrics/passport-dataset from Hugging Face (small).",
    )
    parser.add_argument(
        "--synthetic-passports",
        action="store_true",
        help="Download UniDataPro/synthetic-passports from Hugging Face (small).",
    )
    parser.add_argument(
        "--docxpand-parts",
        type=int,
        metavar="N",
        default=0,
        help="Download first N parts of DocXPand-25k (1–2 recommended for limited bandwidth).",
    )
    parser.add_argument(
        "--mask-rcnn",
        action="store_true",
        help="Clone MASK-RCNN-Dataset from GitHub (500+ passport/ID images, shallow clone).",
    )
    parser.add_argument(
        "--all-small",
        action="store_true",
        help="Download all small HF options: --passport and --synthetic-passports.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help=f"Base output directory (default: {ID_VERIFICATION_DIR}).",
    )
    args = parser.parse_args()

    if args.output_dir is not None:
        ID_VERIFICATION_DIR = Path(args.output_dir).resolve()

    if args.all_small:
        args.passport = True
        args.synthetic_passports = True

    did_anything = False
    if args.passport:
        download_hf_dataset("ud-biometrics/passport-dataset", "passport-dataset")
        did_anything = True
    if args.synthetic_passports:
        download_hf_dataset("UniDataPro/synthetic-passports", "synthetic-passports")
        did_anything = True
    if args.docxpand_parts and args.docxpand_parts > 0:
        download_docxpand_parts(args.docxpand_parts)
        did_anything = True
    if args.mask_rcnn:
        clone_mask_rcnn_dataset()
        did_anything = True

    if not did_anything:
        print("No dataset selected. Use --passport, --synthetic-passports, --docxpand-parts 1, --mask-rcnn, or --all-small.")
        parser.print_help()
        raise SystemExit(0)

    print(f"\nDatasets saved under: {ID_VERIFICATION_DIR}")


if __name__ == "__main__":
    main()
