// import { getHomeData } from "@/lib/data";
// import { WordsApp } from "@/components/words-app";

// export const dynamic = "force-dynamic";

// export default async function Home() {
//   const data = await getHomeData();
//   return <WordsApp initialData={data} />;
// }
  


// import BookLibrary from "@/components/book-library";

// export default function LibraryPage() {
//   return <BookLibrary />;
// }


import { getHomeData } from "@/lib/data";
import { WordsApp } from "@/components/words-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getHomeData();

  return <WordsApp initialData={data} />;
} 