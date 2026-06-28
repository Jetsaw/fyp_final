# Backend RAG Accuracy Patch

This folder documents the targeted backend RAG accuracy edits for the writable backend copy at:

```text
C:\Users\jeysa\Desktop\Final Years\hive-backend
```

That copy was created from the original backend at:

```text
C:\Users\jeysa\Desktop\Hive\hive-backend
```

The edits do not change the fine-tuned/generator model. They improve retrieval quality by:

- routing progression/course-structure prompts to the structure layer,
- increasing retrieval recall before context building,
- wiring the existing cross-encoder reranker into `/api/chat`,
- returning `sources` and `used_rag` in the chat response.

The helper script applies guarded text edits and is safer for this backend folder because it is not a Git checkout.
When run without `-CheckOnly`, it creates a timestamped backup folder in the backend before editing files.
Restore the latest backup with:

```powershell
npm run backend:patch:restore
```

After applying it in the backend, rebuild indexes if the KB changed, restart the FastAPI server, then run:

```powershell
cd "C:\Users\jeysa\Desktop\Final Years\frontend"
npm run kiosk:check
npm run rag:eval
```

Helper script from the frontend workspace:

```powershell
$env:HIVE_BACKEND_PATH='C:\Users\jeysa\Desktop\Final Years\hive-backend'
npm run backend:patch:check
npm run backend:patch:apply
```

For a different backend location:

```powershell
$env:HIVE_BACKEND_PATH='C:\path\to\hive-backend'
npm run backend:patch:apply
Remove-Item Env:\HIVE_BACKEND_PATH
```
