import json
from pathlib import Path


KB_DIR = Path(__file__).resolve().parents[1] / "data" / "kb"


def count_jsonl_rows(path: Path) -> int:
    return sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())


def test_rebuilt_qa_artifacts_exist_and_are_populated():
    programme_structure = KB_DIR / "programme_structure.jsonl"
    qa_pairs = KB_DIR / "intelligent_robotics_qa_pairs.jsonl"
    source_facts = KB_DIR / "intelligent_robotics_source_facts.json"
    connected_graph = KB_DIR / "intelligent_robotics_connected_graph.json"

    assert programme_structure.exists()
    assert qa_pairs.exists()
    assert source_facts.exists()
    assert connected_graph.exists()
    assert count_jsonl_rows(programme_structure) >= 60
    assert count_jsonl_rows(qa_pairs) >= 1300


def test_scraped_mmu_page_facts_are_in_source_facts():
    facts = json.loads((KB_DIR / "intelligent_robotics_source_facts.json").read_text(encoding="utf-8"))

    assert facts["page_meta_description"].startswith("Explore robotics in Malaysia")
    assert facts["page_modified_time"] == "2026-05-18T04:30:16+00:00"
    assert facts["apel_a_url"] == "https://www.mmu.edu.my/apel-a/"

    action_links = {link["label"]: link["url"] for link in facts["page_action_links"]}
    assert "DOWNLOAD PROGRAMME FEES" in action_links
    assert action_links["DOWNLOAD PROGRAMME FEES"].endswith("UG_Fee-Structure_update_150725_MQA.pdf")


def test_prerequisite_rules_cover_project_and_training_gates():
    rules = json.loads((KB_DIR / "prereq_rules.json").read_text(encoding="utf-8"))

    assert rules["ARP6110-P1"]["prerequisites"] == ["Completed 60 credit hours"]
    assert rules["ARP6110-P2"]["prerequisites"] == ["Completed 60 credit hours", "ARP6110-P1 Project I"]
    assert rules["ART6116"]["prerequisites"] == ["Completed 60 credit hours"]
