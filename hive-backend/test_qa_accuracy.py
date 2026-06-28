"""
QA Pair Accuracy Testing Script
Tests actual QA pairs from knowledge base and calculates accuracy metrics
"""

import json
import random
from difflib import SequenceMatcher

# Load QA pairs from knowledge base
def load_qa_pairs(file_path, sample_size=15):
    """Load QA pairs from JSONL file"""
    qa_pairs = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                qa_pairs.append(json.loads(line))
    
    # Get diverse sample across different question types
    random.seed(42)  # Reproducible results
    
    # Categorize by tags
    by_tag = {}
    for qa in qa_pairs:
        for tag in qa.get('tags', ['other']):
            if tag not in by_tag:
                by_tag[tag] = []
            by_tag[tag].append(qa)
    
    # Sample from each category
    sample = []
    for tag, items in by_tag.items():
        sample.extend(random.sample(items, min(2, len(items))))
    
    # Ensure we have exactly sample_size items
    if len(sample) < sample_size:
        remaining = [qa for qa in qa_pairs if qa not in sample]
        sample.extend(random.sample(remaining, min(sample_size - len(sample), len(remaining))))
    else:
        sample = random.sample(sample, sample_size)
    
    return sample

def calculate_similarity(expected, actual):
    """Calculate similarity score between expected and actual answers"""
    expected_lower = expected.lower().strip()
    actual_lower = actual.lower().strip()
    
    # Use SequenceMatcher for semantic similarity
    ratio = SequenceMatcher(None, expected_lower, actual_lower).ratio()
    
    # Check for key information presence
    expected_words = set(expected_lower.split())
    actual_words = set(actual_lower.split())
    
    # Remove common words
    common_words = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with'}
    expected_words -= common_words
    actual_words -= common_words
    
    # Calculate word overlap
    if len(expected_words) > 0:
        overlap = len(expected_words & actual_words) / len(expected_words)
    else:
        overlap = 0
    
    # Combined score (70% sequence match, 30% word overlap)
    final_score = (ratio * 0.7) + (overlap * 0.3)
    
    return final_score

def categorize_accuracy(score):
    """Categorize accuracy score"""
    if score >= 0.8:
        return "Excellent"
    elif score >= 0.6:
        return "Good"
    elif score >= 0.4:
        return "Fair"
    elif score >= 0.2:
        return "Poor"
    else:
        return "Failed"

# Main test function
if __name__ == "__main__":
    print("=" * 80)
    print("QA PAIR ACCURACY TEST")
    print("=" * 80)
    print()
    
    # Load sample
    qa_sample = load_qa_pairs('../docs/new doc/hive_course_qa_pairs.jsonl', sample_size=15)
    
    print(f"✓ Loaded {len(qa_sample)} QA pairs for testing")
    print()
    
    # Display test set
    print("Test Set:")
    print("-" * 80)
    for i, qa in enumerate(qa_sample, 1):
        print(f"{i}. [{qa['course_code']}] {qa.get('tags', [])[0] if qa.get('tags') else 'general'}")
        print(f"   Q: {qa['question'][:70]}...")
        print()
    
    # Save test set for manual browser testing
    with open('qa_test_set.json', 'w', encoding='utf-8') as f:
        json.dump(qa_sample, f, indent=2, ensure_ascii=False)
    
    print("✓ Test set saved to qa_test_set.json")
    print()
    print("NOTE: Use browser UI testing to get actual responses,")
    print("      then run accuracy calculations with the results.")
