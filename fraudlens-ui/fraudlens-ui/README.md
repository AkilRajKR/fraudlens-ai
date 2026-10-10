# FraudLens: daily alert queue (demo)

A Next.js app that shows the 200 transactions most worth an analyst's time. This is the **demo version**:
"Start processing" plays a simulated run and then loads a **pre-computed** `alert_queue.json`.
It does not run a model in the browser or on Vercel.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
```

The repo ships with a **synthetic sample** in `public/data/` (marked "Sample data" in the header),
so the app works immediately. Regenerate it any time with `python scripts/make_sample_data.py`.

## Use your real notebook results

1. Open `fraudlens_colab_v3.ipynb` and run it to the end (section 12).
2. Add a last cell with the contents of `scripts/export_for_ui.py` and run it. It downloads
   `alert_queue.json` and `summary.json`.
3. Put both files in `public/data/` (replace the samples).
4. Commit and push. The header badge changes to "Notebook export".

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. In Vercel choose **Add New, Project**, import the repo, and keep the defaults (Framework: Next.js).
3. Deploy. No environment variables are needed.

To update the queue later, replace the two JSON files and push again.

## Using it

- Click **Start processing** (about 8 seconds of simulated stages).
- Select an alert, then **Confirm fraud**, **Escalate** or **Dismiss**. Keys: `J`/`K` move, `C`/`E`/`D` decide.
- Decisions are saved in this browser only (localStorage), keyed to the queue's `generated_at`.
- **Export decisions** downloads a CSV. **Evaluation view** reveals the real outcomes (demo only; never expose these in production).

## Moving to real processing

Keep the UI. Replace the `fetch("/data/...")` calls in `lib/useRun.ts` with calls to a Python worker
(job start, status polling, results). See the architecture plan in the chat.
