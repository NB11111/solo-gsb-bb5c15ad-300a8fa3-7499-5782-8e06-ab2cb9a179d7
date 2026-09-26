'use strict';

/**
 * 演员走位冲突检查：
 * 基于排程结果（earliestStart / earliestFinish），按演员找出被分配到
 * 时间重叠的提示点。
 * - 仅检查可排程（scheduled）的提示点；环依赖及其阻塞项没有有效时间，不参与检查
 * - 一项的结束恰好等于另一项的开始不算冲突（严格重叠才算）
 *
 * 输入：schedule() 输出的 cues 数组（含 actors、scheduled、earliestStart、earliestFinish）
 * 输出：[{ actor, cueA, cueB, overlapStart, overlapFinish }]，按演员、重叠开始时间排序
 */

function findActorConflicts(cues) {
  /** 演员 -> 参与的可排程提示点 */
  const byActor = new Map();
  for (const c of cues) {
    if (!c.scheduled) continue;
    for (const actor of c.actors || []) {
      if (!byActor.has(actor)) byActor.set(actor, []);
      byActor.get(actor).push(c);
    }
  }

  const conflicts = [];
  for (const [actor, list] of byActor) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) =>
      a.earliestStart !== b.earliestStart
        ? a.earliestStart - b.earliestStart
        : a.id - b.id
    );
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const a = sorted[i];
        const b = sorted[j];
        // 按开始时间升序：b 开始不早于 a 结束时，其后的项更不可能与 a 重叠
        if (b.earliestStart >= a.earliestFinish) break;
        const overlapStart = Math.max(a.earliestStart, b.earliestStart);
        const overlapFinish = Math.min(a.earliestFinish, b.earliestFinish);
        // 结束恰好等于另一项开始 => overlapStart === overlapFinish，不算冲突
        if (overlapStart < overlapFinish) {
          conflicts.push({
            actor,
            cueA: pick(a),
            cueB: pick(b),
            overlapStart,
            overlapFinish,
          });
        }
      }
    }
  }

  conflicts.sort((x, y) =>
    x.actor !== y.actor
      ? x.actor.localeCompare(y.actor, 'zh')
      : x.overlapStart - y.overlapStart
  );
  return conflicts;
}

/** 冲突中提示点的摘要信息（接口返回用） */
function pick(c) {
  return {
    id: c.id,
    ref: c.ref,
    title: c.title,
    earliestStart: c.earliestStart,
    earliestFinish: c.earliestFinish,
  };
}

module.exports = { findActorConflicts };
