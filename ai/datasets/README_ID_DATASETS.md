# ID verification datasets (bandwidth-friendly)

Script to download small ID/document datasets for the ID verification module when connection is limited.

## Setup

```bash
cd ai/datasets
pip install huggingface_hub requests
```

(Git is needed for `--mask-rcnn`; usually already installed.)

## Usage

**Smallest download (recommended for limited data):**

```bash
python download_id_datasets.py --passport
```

Downloads `ud-biometrics/passport-dataset` from Hugging Face (very small) into `ai/datasets/id_verification/passport-dataset/`.

**Other options:**

```bash
# Hugging Face synthetic passports (small)
python download_id_datasets.py --synthetic-passports

# Both small HF datasets
python download_id_datasets.py --all-small

# 1 part of DocXPand-25k (partial; full set needs all 12 parts to extract)
python download_id_datasets.py --docxpand-parts 1

# MASK-RCNN passport/ID images from GitHub (shallow clone)
python download_id_datasets.py --mask-rcnn

# Custom output directory
python download_id_datasets.py --passport --output-dir /path/to/data
```

## Output layout

All downloads go under `ai/datasets/id_verification/` by default:

- `passport-dataset/` — ud-biometrics passport images
- `synthetic-passports/` — UniDataPro synthetic passports
- `docxpand_parts/` — DocXPand-25k split archives (if you use `--docxpand-parts`)
- `MASK-RCNN-Dataset/` — passport/ID images from GitHub (if you use `--mask-rcnn`)

Use these paths as "legit" or "document" image sources when building your train/val split for the ID verification model.
