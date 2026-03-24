"""Add training examples for low-recall categories to improve model accuracy to 95%+"""
import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
AI_ROOT = os.path.dirname(SCRIPT_DIR)
DATASET_PATH = os.path.join(AI_ROOT, "datasets", "lob_natural_dataset.json")

# Additional training examples for low-recall categories
additional_examples = [
    # AGR|Crop farming - 0% recall
    {"businessDescription": "nagtatanim kami ng palay at mais sa bukid", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "rice and corn farming operation in the province", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "vegetable crop farming business growing lettuce cabbage and tomatoes", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "magsasaka kami ng gulay tulad ng pechay sitaw at talong", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "crop farming and agricultural production of rice wheat and vegetables", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "nagtatanim ng mga pananim tulad ng bigas mais at gulay sa sakahan", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "farming crops like sugarcane coconut and banana plantation", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "agricultural crop production and harvesting of rice fields", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "nag-aani kami ng palay at mga gulay sa taniman namin", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "crop cultivation business growing corn sorghum and millet", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "nagtatanim at nag-aani ng mga agricultural crops sa bukirin", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "rice paddy farming operation producing quality grains", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "we grow and harvest crops such as rice corn and vegetables", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "crop farmer producing staple grains for local markets", "language": "english", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    {"businessDescription": "nagsasaka ng palay bigas at mais para ibenta sa palengke", "language": "filipino", "recommendations": [{"taxCode": "AGR", "lineOfBusiness": "agriculture", "detailedLine": "Crop farming", "psicCode": "0111"}]},
    
    # RET|Convenience store - 0% recall
    {"businessDescription": "convenience store selling snacks drinks and basic necessities 24 hours", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "mini mart convenience store open 24/7 with groceries and snacks", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "convenience store tindahan ng mga meryenda softdrinks at cigarettes", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "7-eleven style convenience store with ready to eat food and beverages", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "mini stop convenience store nagbebenta ng mga snacks at inumin", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "convenience store chain selling groceries snacks and daily essentials", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "family mart type convenience store with hot meals and cold drinks", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "convenience store na bukas 24 oras nagbebenta ng pagkain at gamit", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "neighborhood convenience store with instant noodles coffee and snacks", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    {"businessDescription": "convenience store malapit sa school nagbebenta ng pagkain at school supplies", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Convenience store", "psicCode": "4711"}]},
    
    # RET|Agricultural supplies - 12% recall
    {"businessDescription": "agricultural supplies store selling seeds fertilizers and pesticides", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "farm supplies store nagbebenta ng binhi abono at pestisidyo", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "agricultural supply shop with farming tools seeds and fertilizers", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "tindahan ng mga gamit sa pagsasaka tulad ng binhi at pataba", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "retail store for agricultural inputs farming equipment and supplies", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "nagbebenta ng mga agricultural supplies para sa mga magsasaka", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "farm supply center selling animal feeds seeds and crop chemicals", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "agricultural retail shop with irrigation supplies and farming tools", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "tindahan ng mga kagamitan sa bukid binhi pataba at sprayer", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    {"businessDescription": "selling agricultural supplies like seedlings fertilizer and farm tools", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "Agricultural supplies", "psicCode": "4773"}]},
    
    # WHL|Agricultural raw materials - 22% recall
    {"businessDescription": "wholesale of agricultural raw materials like grains and produce", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "wholesaler ng mga agricultural raw materials tulad ng bigas at mais", "language": "filipino", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "bulk trading of agricultural commodities rice corn and copra", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "wholesale distributor of farm produce and agricultural raw materials", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "nag-wowholesale kami ng mga produktong bukid at agricultural goods", "language": "filipino", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "agricultural commodity trading and wholesale of raw farm products", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "wholesale ng mga raw agricultural materials para sa mga processors", "language": "filipino", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "bulk supplier of agricultural produce grains and farm commodities", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "wholesale trading ng mga produkto galing sa bukid tulad ng palay at mais", "language": "filipino", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    {"businessDescription": "we buy and sell agricultural raw materials in bulk to processors", "language": "english", "recommendations": [{"taxCode": "WHL", "lineOfBusiness": "wholesale", "detailedLine": "Agricultural raw materials", "psicCode": "4621"}]},
    
    # RET|General merchandise - 40% recall
    {"businessDescription": "general merchandise store selling various household items and goods", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "tindahan ng iba-ibang paninda general merchandise at household items", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "general merchandise retail store with assorted products", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "variety store selling general merchandise and miscellaneous goods", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "nagbebenta ng sari-saring paninda general merchandise sa palengke", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "general merchandise shop with home goods kitchenware and supplies", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "tindahan ng general merchandise tulad ng gamit bahay at iba pa", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "general merchandise retailer selling assorted consumer products", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "nagtitinda ng iba-ibang klase ng paninda general merchandise", "language": "filipino", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
    {"businessDescription": "general merchandise store with wide variety of household products", "language": "english", "recommendations": [{"taxCode": "RET", "lineOfBusiness": "retail", "detailedLine": "General merchandise", "psicCode": "4719"}]},
]

def main():
    # Load existing dataset
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        dataset = json.load(f)
    
    print(f"Original dataset size: {len(dataset)} entries")
    
    # Add new examples
    dataset.extend(additional_examples)
    
    # Save updated dataset
    with open(DATASET_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)
    
    print(f"Added {len(additional_examples)} new training examples")
    print(f"Total dataset size: {len(dataset)} entries")

if __name__ == "__main__":
    main()
