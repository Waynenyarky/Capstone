#!/bin/bash

# Complete BPLO Flow Test using curl
# This tests the entire flow from registration to payment generation

set -e  # Exit on error

BASE_URL="http://localhost:3001"
BUSINESS_URL="http://localhost:3002"

echo "🧪 BPLO Complete Flow Test"
echo "=========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create Business Owner (signup gives us a token directly)
echo -e "\n${YELLOW}Step 1: Register Business Owner${NC}"

TIMESTAMP=$(date +%s)
RANDOM_SUFFIX=$RANDOM
EMAIL="testowner${TIMESTAMP}${RANDOM_SUFFIX}@example.com"
PHONE="+6391700${RANDOM_SUFFIX}"
PASSWORD="TestPassword123!@#"

SIGNUP_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"Owner\",
    \"phoneNumber\": \"$PHONE\",
    \"role\": \"business_owner\",
    \"termsAccepted\": true
  }")

echo "Signup Response: $SIGNUP_RESPONSE"

# Extract token from signup (signup returns a token directly)
TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Signup failed${NC}"
  echo "Response: $SIGNUP_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Registered: $EMAIL${NC}"
echo -e "${GREEN}✓ Token received: ${TOKEN:0:20}...${NC}"

# Step 2: Create Business Profile
echo -e "\n${YELLOW}Step 2: Create Business Profile${NC}"
BUSINESS_CREATE=$(curl -s -X POST "${BUSINESS_URL}/api/business/businesses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"businessName\": \"Test Business ${TIMESTAMP}\",
    \"tradeName\": \"Test Trade Name\",
    \"businessType\": \"g\",
    \"primaryLineOfBusiness\": \"Retail Trade\",
    \"businessAddress\": \"123 Test St, Test Barangay, Alaminos City\",
    \"contactNumber\": \"$PHONE\",
    \"emailAddress\": \"$EMAIL\",
    \"registrationAgency\": \"DTI\",
    \"businessRegistrationNumber\": \"DTI-12345-67890\",
    \"location\": {
      \"street\": \"123 Test St\",
      \"barangay\": \"Test Barangay\",
      \"city\": \"Alaminos City\",
      \"province\": \"Pangasinan\",
      \"zipCode\": \"2404\",
      \"geolocation\": {
        \"lat\": 16.1553,
        \"lng\": 119.9811
      }
    }
  }")

echo "Business Create Response: $BUSINESS_CREATE"

# Extract business ID
BUSINESS_ID=$(echo $BUSINESS_CREATE | grep -o '"businessId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$BUSINESS_ID" ]; then
  echo -e "${RED}✗ Failed to create business${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Business created: $BUSINESS_ID${NC}"

# Step 3: Submit Application
echo -e "\n${YELLOW}Step 3: Submit Application${NC}"
SUBMIT_APP=$(curl -s -X POST "${BUSINESS_URL}/api/business/business-registration/${BUSINESS_ID}/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

echo "Submit Response: $SUBMIT_APP"
echo -e "${GREEN}✓ Application submitted${NC}"

# Step 4: Get Business Details
echo -e "\n${YELLOW}Step 4: Get Business Details${NC}"
BUSINESS_DETAILS=$(curl -s -X GET "${BUSINESS_URL}/api/business/businesses/${BUSINESS_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt)

echo "Business Details: $BUSINESS_DETAILS"

# Step 5: Test Payment Creation (This is where it fails)
echo -e "\n${YELLOW}Step 5: Test Payment Creation${NC}"
PAYMENT_CREATE=$(curl -s -X POST "${BUSINESS_URL}/api/business/payments" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -b cookies.txt \
  -d "{
    \"businessId\": \"$BUSINESS_ID\",
    \"paymentType\": \"general_permit_fee\",
    \"description\": \"Mayor's Permit Fee\",
    \"amount\": 2500,
    \"dueDate\": \"$(date -u -v+30d +%Y-%m-%dT%H:%M:%S.000Z)\"
  }")

echo "Payment Create Response: $PAYMENT_CREATE"

if echo "$PAYMENT_CREATE" | grep -q "error"; then
  echo -e "${RED}✗ Payment creation failed${NC}"
  echo "Error details: $PAYMENT_CREATE"
else
  echo -e "${GREEN}✓ Payment created successfully${NC}"
fi

echo -e "\n${GREEN}=========================="
echo "Test Complete!"
echo "==========================${NC}"
echo "Business ID: $BUSINESS_ID"
echo "Email: $EMAIL"
