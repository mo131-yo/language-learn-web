import { NextResponse } from "next/server";
import { addClient, removeClient, type SSEClient } from "@/lib/sse-store";

export const dynamic = "force-dynamic";

export async function GET() {
  let clientRef: SSEClient | null = null;

  const stream = new ReadableStream({
    start(controller) {
      clientRef = { id: crypto.randomUUID(), controller };
      addClient(clientRef);
      controller.enqueue(": heartbeat\n\n");
    },
    cancel() {
      if (clientRef) {
        removeClient(clientRef);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
