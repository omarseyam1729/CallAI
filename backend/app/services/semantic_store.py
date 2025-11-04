# app/services/semantic_store.py
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json
from pathlib import Path
from app.core.database import SessionLocal
from app.models import Segment,AudioChunk


class SemanticStore:
    def __init__(
        self,
        index_path: str = "faiss.index",
        meta_path:  str = "faiss.meta.json",
        dim:        int = 384,
        model_name: str = "all-MiniLM-L6-v2",
    ):
        self.index_path = Path(index_path)
        self.meta_path  = Path(meta_path)
        self.dimension  = dim
        self.index      = faiss.IndexFlatL2(self.dimension)
        self.metadata   = []  # will load from JSON
        self.model      = SentenceTransformer(model_name)
        self._load_index_and_meta()

    def _load_index_and_meta(self):
        # 1. Load or create FAISS index
        if self.index_path.exists():
            self.index = faiss.read_index(str(self.index_path))
        # 2. Load or initialize metadata JSON
        if self.meta_path.exists():
            with open(self.meta_path, "r") as f:
                try:
                    self.metadata = json.load(f)
                except json.JSONDecodeError:
                    # corrupt file? re-init
                    self.metadata = []
        else:
            # first run: create empty JSON file
            with open(self.meta_path, "w") as f:
                json.dump(self.metadata, f)

    def add_segment(self, segment: Segment):
        """Embed & add one ORM Segment to the index + metadata."""
        if not segment.text:
            return
        vec = self.model.encode(segment.text).astype(np.float32)
        self.index.add(np.array([vec]))
        self.metadata.append({
            "segment_id": segment.id,
            "text":       segment.text,
            "call_id":    segment.chunk.call_id,
            "start":      segment.start,
            "end":        segment.end,
            "speaker":    segment.speaker
        })

    def save(self):
        """Persist FAISS index and JSON metadata to disk."""
        faiss.write_index(self.index, str(self.index_path))
        with open(self.meta_path, "w") as f:
            json.dump(self.metadata, f, indent=2)
    def update_with_call(self, call_id: str) -> int:
        """
        Index all Segments for a specific call_id that are not yet in metadata.
        Returns the number of newly indexed segments.
        """
        db = SessionLocal()
        try:
            seen_ids = {m["segment_id"] for m in self.metadata if "segment_id" in m}
            segs = (
                db.query(Segment)
                  .join(AudioChunk, AudioChunk.id == Segment.chunk_id)
                  .filter(AudioChunk.call_id == call_id)
            )
            if seen_ids:
                segs = segs.filter(~Segment.id.in_(seen_ids))
            segs = segs.all()

            if not segs:
                return 0

            for seg in segs:
                self.add_segment(seg)

            if segs:
                self.save()   # reuse your existing save()
            return len(segs)
        finally:
            db.close()

    def populate_from_db(self) -> int:
        """
        Index all DB Segments not yet in metadata.
        Returns count of newly indexed segments.
        """
        db = SessionLocal()
        try:
            seen_ids = {entry["segment_id"] for entry in self.metadata}
            new_segs = db.query(Segment).filter(Segment.id.notin_(seen_ids)).all()
            for seg in new_segs:
                self.add_segment(seg)
            if new_segs:
                self.save()
            return len(new_segs)
        finally:
            db.close()

    def search_with_call_and_duration(self, query: str, top_k: int = 5):
        """
        Perform semantic search and return:
          segment_id, text, call_id, speaker, start, end, duration, score
        """
        qv = self.model.encode(query).astype(np.float32)
        D, I = self.index.search(np.array([qv]), top_k)
        results = []
        for dist, idx in zip(D[0], I[0]):
            meta     = self.metadata[idx]
            duration = meta["end"] - meta["start"]
            results.append({
                **meta,
                "duration": duration,
                "score":    float(dist)
            })
        return results
    def delete_call(self, call_id: str) -> int:
        """
        Lazily delete all segments belonging to a given call_id.
        - Removes entries from metadata.
        - Leaves FAISS vectors in place (so no expensive rebuild).
        - Search results will never return deleted metadata.
        
        Returns number of entries removed from metadata.
        """
        before = len(self.metadata)
        self.metadata = [m for m in self.metadata if m.get("call_id") != call_id]
        removed = before - len(self.metadata)

        if removed:
            self.save()  # persist pruned metadata
        return removed

    def compact(self) -> int:
        """
        Rebuild the FAISS index from current metadata (expensive).
        Use periodically to drop stale vectors after lazy deletes.
        
        Returns number of vectors in rebuilt index.
        """
        self.index = faiss.IndexFlatL2(self.dimension)
        for m in self.metadata:
            vec = self.model.encode(m["text"]).astype(np.float32)
            self.index.add(np.array([vec]))
        self.save()
        return len(self.metadata)
    

# instantiate once for import elsewhere
store = SemanticStore()

if __name__ == "__main__":
    store.compact()
    print("Index compacted.")

