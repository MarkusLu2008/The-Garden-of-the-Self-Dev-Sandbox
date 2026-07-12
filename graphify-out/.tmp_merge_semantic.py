import json
from pathlib import Path

chunk_paths = [Path(f"graphify-out/.graphify_chunk_{i:02d}.json") for i in range(1, 6)]
valid = []
failed = []
for i, p in enumerate(chunk_paths, start=1):
    if not p.exists():
        print(f"WARNING: chunk {i} missing from disk — subagent may have been read-only. Re-run with general-purpose agent.")
        failed.append(i)
        continue
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
        if not isinstance(d, dict) or "nodes" not in d or "edges" not in d:
            print(f"WARNING: chunk {i} invalid JSON schema — skipping")
            failed.append(i)
            continue
        valid.append((i, d))
    except Exception as e:
        print(f"WARNING: chunk {i} failed parse: {e}")
        failed.append(i)

if len(failed) > len(chunk_paths) / 2:
    print("ERROR: more than half the semantic chunks failed/missing. Re-run with subagent_type=generalPurpose.")
    raise SystemExit(1)

all_nodes, all_edges, all_hyperedges = [], [], []
total_in = 0
total_out = 0
for _, d in valid:
    all_nodes += d.get("nodes", [])
    all_edges += d.get("edges", [])
    all_hyperedges += d.get("hyperedges", [])
    total_in += d.get("input_tokens", 0)
    total_out += d.get("output_tokens", 0)

Path("graphify-out/.graphify_semantic_new.json").write_text(json.dumps({
    "nodes": all_nodes,
    "edges": all_edges,
    "hyperedges": all_hyperedges,
    "input_tokens": total_in,
    "output_tokens": total_out,
}, indent=2, ensure_ascii=False), encoding="utf-8")

print(f"MERGED_CHUNKS={len(valid)}")
print(f"MERGED_NODES={len(all_nodes)}")
print(f"MERGED_EDGES={len(all_edges)}")
print(f"MERGED_HYPEREDGES={len(all_hyperedges)}")
print(f"TOKENS_IN={total_in}")
print(f"TOKENS_OUT={total_out}")
