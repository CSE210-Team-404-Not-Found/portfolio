# Project editor branch

The editor keeps the existing project CRUD and adds image, YouTube, recorded audio, GLB, and Tiptap JSON import/export. Preview is local and does not publish a project or create a public route. The public profile and team-member navigation remain separate work.

## Media and formats

- Text, headings, bold, italic, lists and links use Tiptap. Images and YouTube use official extensions. `audioRecording` and `model3d` are small custom nodes; model-viewer is loaded when needed.
- Local media is represented by data URLs while editing and in downloaded JSON. Import into an empty editor restores the document; import into existing content inserts blocks at the cursor. Invalid imports leave the current draft intact.
- Saving uploads media separately, replaces data URLs with PDS blob URLs and stores each real blob reference in the project's optional `media` array. References inside a JSON blob alone do not retain the media on the PDS.
- Saved media nodes carry `mediaCid`. Reopening resolves them against the account's current PDS and restores local data URLs. Deleted nodes lose their record references on the next save.
- JSON and HTML are generated together; the record uses `descriptionFormat: tiptap-media-v1`. Older text-only records still open. Consumers must support these nodes and sanitize generated HTML; a consumer of 3D HTML also needs model-viewer.
- A downloaded JSON document contains the description and its media, not the project title, summary, or thumbnail.

## Limits and permissions

Images: 1 MB each, up to 5. Audio/GLB: 10 MB each, up to 20 total media blocks and 20 MB of embedded media. Recording stops after 2 minutes, on size limit, or when the editor unmounts. Description text: 20,000 characters; stored JSON and HTML: 500 KB each. JSON import: 30 MB (including embedded media).

The OAuth scope adds `blob:audio/*` and `blob:model/gltf-binary`; existing sessions may need sign-out and sign-in to grant them. Microphone access is requested only when the user clicks Record audio. Remote video playback depends on the provider's availability and embedding settings.

This branch expands the text-only format in `docs/user-stories.md`. The media node contract, optional lexicon fields and expanded HTML allowlist need coordination with teammates before merging; the editor does not change the collaboration model.

## Check locally

Run `npm ci`, then `npm run dev` in `client`. Use `http://127.0.0.1:5173/`. Sign in, enter title/summary, add media or import a JSON document, and use Preview project. Download JSON before leaving if you need a local backup of unsaved content. Save to test account persistence; reload, choose Edit, and verify the document and media reopen. `npm test`, `npm run lint`, and `npm run build` validate the branch.

Audio-only WebM recordings can be reported as `video/webm` by PDS MIME detection. The media lexicon accepts that exact container type and preserves server-returned metadata. Reopening accepts it in audioRecording nodes. This requires no video upload OAuth scope because the upload request remains audio; it does not add a local-video upload UI.
