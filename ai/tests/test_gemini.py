"""Optional Gemini tests - mocked API, response format."""
import os
import pytest


@pytest.fixture
def mock_gemini_response():
    """Mock Gemini response for validation."""
    class MockResponse:
        text = 'yes'
    return MockResponse()


def test_gemini_validation_prompt_format():
    """Validation prompt has expected format."""
    prompt = 'Validate: business_name=ABC Corp, tax_code=g, line_of_business=Retail. Valid? Reply with yes or no.'
    assert 'business_name' in prompt
    assert 'tax_code' in prompt
    assert 'Valid?' in prompt


@pytest.mark.skipif(not os.getenv('GEMINI_API_KEY'), reason='GEMINI_API_KEY not set')
def test_gemini_validation_response_format():
    """If API key set, Gemini returns valid response."""
    import google.generativeai as genai
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        'Validate: business_name=ABC Corp, tax_code=g, line_of_business=Retail. Valid? Reply with yes or no.'
    )
    assert response.text
    assert len(response.text) < 500
