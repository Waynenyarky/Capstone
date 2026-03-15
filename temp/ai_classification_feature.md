BizClear: A Blockchain-Audited Business Compliance Portal for Alaminos City with AI Business Classification (AI Feature)

1. Problem Statement 
Business owners in Alaminos City simply describe their business in natural language (e.g., "tindahan ng pagkain," "computer repair shop") when applying for permits. BPLO officers must manually interpret these descriptions and map them to the correct Line of Business (LOB) categories, which is time-consuming and inconsistent. Incorrect LOB mapping leads to wrong tax codes, improper fee computation, and compliance issues.

2. Core Feature 
An AI-powered business classification system that combines:
Traditional ML (TF-IDF vectorization with scikit-learn) for business classification
Trained on 1,618 examples for Lines of Business (LOB) categorization
Standalone Python/Flask classificationa service (`ai/predict_app.py`) with REST API
Confidence-scored LOB recommendations to assist LGU staff in permit processing
*Sprint 2 Expansion: Native Filipino language support ("tindahan", "karinderia", "parlor") without hardcoded translation dictionaries*

3. User Story and Acceptance Criteria 
As a BPLO officer, I want to input a business description and receive accurate LOB recommendations so that I can quickly classify businesses and ensure correct tax codes and fees.
Acceptance criteria:
Officer can input business description in English
System returns top 3 LOB recommendations with confidence scores
Classification completes within 2-3 seconds
Service provides REST API endpoint for integration with main BizClear system
System maintains 85%+ accuracy on trained dataset
*Sprint 2 Expansion: Officer can input business description in Filipino or English; System handles Filipino business terms natively*

4. Simple Diagram 

```
Business Description
        ↓
   TF-IDF Vectorization
        ↓
  Scikit-learn Classifier
        ↓
LOB Recommendations with Confidence Scores
```

**Flow Example:**
"tindahan ng pagkain" → [TF-IDF] → [Classifier] → [Food Services: 92%, Retail Trade: 78%, Services: 65%]

5. Tools/APIs 
Python: pandas, scikit-learn, flask, numpy
ML: TF-IDF vectorization, multinomial naive bayes classifier
Dataset: 1,618 business examples
*Sprint 2 Expansion: 73% Filipino language (1,186 examples) + 27% English (432 examples)*
API: Flask REST service (`ai/predict_app.py`)
Environment: Local Python service, integrates with Node.js backend
Classification models: Pre-trained joblib files (`ai/models/lob_model.joblib`)

6. Test Plan 
Happy Path: "computer repair shop" → System returns [Technology Services, Repair Services, Business Services] with confidence scores
Edge Case: Minimal description "store" → System returns general retail recommendations
Edge Case: Technical business "software development" → System returns appropriate technology LOBs
Performance: Classification completes within 3 seconds
Accuracy: Maintains 85%+ accuracy on validation dataset
Integration: Flask service responds correctly to main system API calls
*Sprint 2 Expansion Test Cases:*
Happy Path: "tindahan ng pagkain" → System returns [Food Services, Retail Trade, Services] with confidence scores
Edge Case: Mixed language "parlor for haircut and beauty" → System handles Filipino-English mix
Edge Case: Filipino description "nagbebenta ng mga de-lata" → System returns appropriate retail LOBs

7. Risks & Mitigations 
Risk 1: New business types not in training data
Mitigation: System provides top 3 recommendations; BPLO officer can select appropriate LOB; model can be retrained with new examples
Risk 2: Filipino language variations and regional terms
Mitigation: Training data includes 73% Filipino examples; TF-IDF handles word variations; system learns from actual usage
Risk 3: Low confidence scores for ambiguous descriptions
Mitigation: System flags low confidence (<60%) for manual review; provides multiple options for officer selection

8. Roles & Timeline (Sprint 1)
Roles
Architect: Designs classification pipeline, dataset schema, TF-IDF workflow, and API structure
Builder: Implements TF-IDF vectorization, trains scikit-learn model on English dataset, builds Flask API service
Validator: Tests classification accuracy, API integration, performance
Timeline
Day 1: Dataset preprocessing (English), TF-IDF vectorization, train scikit-learn model, accuracy evaluation
Day 2: Flask API development, confidence scoring, integration testing
Day 3: Performance optimization, API documentation, final validation and deployment

9. Sprint 2 Expansion: Filipino Language Support
Additional Roles
Filipino Language Specialist: Validates Filipino business terms and regional variations
Enhanced Timeline
Day 4: Add 1,186 Filipino examples to dataset (73% Filipino, 27% English total)
Day 5: Retrain model with bilingual data, test Filipino language recognition
Day 6: Comprehensive testing of Filipino-English mixed input, performance optimization
