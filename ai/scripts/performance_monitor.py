"""
Performance monitoring for AI components
Add timing measurements to critical functions
"""

import time
import json
import os

def timed_function(func_name, func, *args, **kwargs):
    """Time a function execution"""
    start = time.time()
    result = func(*args, **kwargs)
    end = time.time()
    execution_time = end - start
    print(f"{func_name}: {execution_time:.4f} seconds")
    return result, execution_time  # Return (result, time) tuple

# Test the bootstrap dataset performance
if __name__ == "__main__":
    # Import the function we want to test
    from bootstrap_lob_dataset import flatten_labels_and_examples, load_taxonomy
    
    print("=== AI Performance Monitoring ===")
    
    # Test 1: Load taxonomy
    taxonomy, taxonomy_time = timed_function("load_taxonomy", load_taxonomy)
    
    # Test 2: Process dataset with different sizes
    test_datasets = [
        "lob_recommendation_dataset.json",
        "generated_batch_1.json", 
        "generated_batch_2_low_recall.json"
    ]
    
    ai_root = os.path.dirname(os.path.dirname(__file__))
    dataset_dir = os.path.join(ai_root, "datasets")
    
    results = []
    
    for dataset_file in test_datasets:
        dataset_path = os.path.join(dataset_dir, dataset_file)
        if os.path.exists(dataset_path):
            print(f"\n--- Testing {dataset_file} ---")
            
            with open(dataset_path, 'r') as f:
                dataset = json.load(f)
            
            counts_result, counts_time = timed_function(
                f"flatten_labels_{dataset_file}", 
                flatten_labels_and_examples, 
                dataset
            )
            
            # counts_result is a tuple (counts, examples_by_label) from the original function
            counts_data, examples_data = counts_result
            
            results.append({
                "dataset": dataset_file,
                "entries": len(dataset),
                "time": counts_time,
                "labels": len(counts_data)
            })
    
    print("\n=== AI Performance Results ===")
    for result in results:
        print(f"Dataset: {result['dataset']}")
        print(f"  Entries: {result['entries']}")
        print(f"  Time: {result['time']:.4f} sec")
        print(f"  Labels: {result['labels']}")
        print()
