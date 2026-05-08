import { query, queryOne } from "@/lib/db";
import type { DuelAnswer, DuelChallenge, DuelWord } from "@/lib/types";

export type DuelRow = DuelChallenge & {
  challenger_name: string;
  challenger_avatar: string | null;
  opponent_name: string;
  opponent_avatar: string | null;
};

export async function getUserXp(userId: string) {
  const row = await queryOne<{ xp: number }>(
    `select greatest(
       coalesce((
         select sum(mastery * 20)::int
         from user_word_mastery
         where user_id = $1
       ), 0) + coalesce((
         select sum(amount)::int
         from user_xp_ledger
         where user_id = $1
       ), 0),
       0
     )::int as xp`,
    [userId]
  );

  return row?.xp ?? 0;
}

export async function getDuel(id: string) {
  return queryOne<DuelRow>(
    `select
       d.*,
       challenger.name as challenger_name,
       challenger.avatar as challenger_avatar,
       opponent.name as opponent_name,
       opponent.avatar as opponent_avatar,
       c.name as category_name
     from duel_challenges d
     join users challenger on challenger.id = d.challenger_id
     join users opponent on opponent.id = d.opponent_id
     left join categories c on c.id = d.category_id
     where d.id = $1`,
    [id]
  );
}

export function scoreDuelAnswers(words: DuelWord[], answers: DuelAnswer[], timeLimitSeconds: number) {
  const answerMap = new Map(answers.map((answer) => [answer.wordId, answer]));
  const timeLimitMs = timeLimitSeconds * 1000;

  return words.reduce((total, word) => {
    const answer = answerMap.get(word.id);
    if (!answer) return total;

    const normalizedAnswer = answer.answer.trim().toLowerCase();
    const normalizedMeaning = word.meaning.trim().toLowerCase();
    const isCorrect =
      normalizedAnswer.length > 0 &&
      (normalizedMeaning.includes(normalizedAnswer) ||
        normalizedAnswer.includes(normalizedMeaning));

    if (!isCorrect) return total;

    const speedBonus = Math.max(0, Math.round((timeLimitMs - answer.timeMs) / 1000));
    return total + 100 + speedBonus;
  }, 0);
}

export async function settleDuelIfReady(duelId: string) {
  const duel = await getDuel(duelId);
  if (
    !duel ||
    duel.status === "completed" ||
    duel.challenger_score === null ||
    duel.opponent_score === null
  ) {
    return duel;
  }

  const winnerId =
    duel.challenger_score > duel.opponent_score
      ? duel.challenger_id
      : duel.opponent_score > duel.challenger_score
        ? duel.opponent_id
        : null;

  const loserId =
    winnerId === duel.challenger_id
      ? duel.opponent_id
      : winnerId === duel.opponent_id
        ? duel.challenger_id
        : null;

  await query(
    `update duel_challenges
     set status = 'completed',
         winner_id = $2,
         settled_at = now(),
         updated_at = now()
     where id = $1 and status <> 'completed'`,
    [duel.id, winnerId]
  );

  if (winnerId && loserId) {
    await query(
      `insert into user_xp_ledger (user_id, amount, reason, source_type, source_id)
       values ($1, $2, '1v1 сорилт ялсан', 'duel_win', $3)
       on conflict (user_id, source_type, source_id) do nothing`,
      [winnerId, duel.stake_xp, duel.id]
    );
    await query(
      `insert into user_xp_ledger (user_id, amount, reason, source_type, source_id)
       values ($1, $2, '1v1 сорилт ялагдсан', 'duel_loss', $3)
       on conflict (user_id, source_type, source_id) do nothing`,
      [loserId, -duel.stake_xp, duel.id]
    );
  }

  return getDuel(duel.id);
}
