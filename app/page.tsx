import { getHomeData } from "@/lib/data";
import { WordsApp } from "@/components/words-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomeData();
  return <WordsApp initialData={data} />;
}
  