# AI Document Validation Prototype - Tests

## Run AI tests

From project root:

```bash
pip install -r ai/notebooks/requirements.txt
pytest ai/tests/ -v
```

## Test categories

| Category | File | Description |
|----------|------|-------------|
| Preprocessing | `test_preprocessing.py` | Feature encoding, scaling, no NaN |
| Model | `test_model.py` | Accuracy ≥ 70%, confusion matrix, all 6 models train |
| validate_form | `test_validate_form.py` | Valid/invalid form inputs (integration) |
| Gemini | `test_gemini.py` | Prompt format; optional live API test if `GEMINI_API_KEY` set |

## Shared module

`ai/validation/validate_form.py` - form validation logic reused by notebook and tests.
