// Chat (RAG) page — document-grounded Q&A. Step 10 (V2).

import { Badge } from "@/components/ui/Badge";

export default function ChatPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-sand-200 text-xl font-semibold">Chat</h2>
        <Badge variant="info">V2 · Step 10</Badge>
      </div>
      <p className="text-sand-500 text-sm">
        RAG chat with citations over your uploaded course documents coming in
        Step 10. Requires documents to be ingested first (Step 9).
      </p>
    </div>
  );
}
