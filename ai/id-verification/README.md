# ID Verification AI Model

## Overview

This module contains the training code and data generation scripts for the ID verification model. The model classifies images as either **legitimate ID documents** or **fake/wrong documents**.

## Important Notes

- **No Government Database**: This model does NOT verify IDs against any government database (PhilSys, SSS, LTO, etc.)
- **Appearance-Based Classification**: The model only determines if an image looks like a legitimate ID document by its visual characteristics
- **Synthetic Training Data**: The model is trained primarily on synthetic ID templates and collected fake/wrong document images
- **No Legal Claim**: Verification is automated and may be reviewed by staff

## Directory Structure

```
ai/id-verification/
├── README.md                 # This file
├── data/                     # Training data
│   ├── train/
│   │   ├── legit/           # Legitimate ID images
│   │   └── fake/            # Fake/wrong document images
│   └── val/
│       ├── legit/
│       └── fake/
├── generators/
│   ├── synthetic_id_generator.py    # Generate synthetic ID templates
│   └── fake_document_collector.py   # Generate/collect fake documents
├── training/
│   └── train_classifier.py          # Transfer learning training script
└── models/
    └── id_verification_v1.h5        # Trained model (after training)
```

## Data Classes

### Class "legit" (looks like a real ID)
- Synthetic IDs generated with card-shaped images
- Various layouts: card-like, passport-like
- Text blocks, photo areas, typical ID proportions
- Multiple templates aligned with supported ID types

### Class "fake/wrong"
- Hand-drawn "IDs" on paper
- Wrong documents: receipts, book covers, screenshots
- Random objects (non-document images)
- Obvious fakes: heavily edited, memes, cropped random text

## Supported ID Types

The generator creates templates for:
- Driver's License
- Passport
- SSS ID
- PhilHealth ID
- PRC ID
- Voter's ID
- Postal ID
- National ID (PhilSys)
- UMID
- TIN ID
- Senior Citizen ID
- PWD ID
- Company ID
- School ID
- Barangay ID

## Usage

### 1. Generate Synthetic Data

```bash
cd ai/id-verification
python generators/synthetic_id_generator.py --output data/train/legit --count 500
python generators/synthetic_id_generator.py --output data/val/legit --count 100
```

### 2. Generate Fake/Wrong Documents

```bash
python generators/fake_document_collector.py --output data/train/fake --count 500
python generators/fake_document_collector.py --output data/val/fake --count 100
```

### 3. Train the Model

```bash
python training/train_classifier.py \
  --data-dir data \
  --export ../models/id_verification/model_v1.h5 \
  --epochs 30
```

## Model Architecture

- **Base**: EfficientNetB0 or MobileNetV2 (transfer learning from ImageNet)
- **Head**: GlobalAveragePooling2D → Dense(1, sigmoid) for binary classification
- **Input**: 224×224 RGB images
- **Output**: Probability that image is a legitimate ID (0-1)

## Inference

The trained model is loaded by the AI microservice (`backend/services/ai-service/`) and exposed via `POST /verify-id`.

## Versioning

Models are versioned with date suffix: `model_v1_YYYYMMDD.h5`
