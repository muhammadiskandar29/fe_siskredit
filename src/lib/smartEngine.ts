import { prisma } from './prisma';

export class SmartEngineService {
  /**
   * Compute SMART utility u(a_i)
   */
  static computeUtility(
    cOut: number,
    type: 'benefit' | 'cost' | string,
    cMin = 25.0,
    cMax = 100.0
  ): number {
    if (cMax === cMin) {
      return 100.0;
    }

    let val: number;
    if (type.toLowerCase() === 'cost') {
      // Formula Cost: (C_max - C_out) / (C_max - C_min) * 100%
      val = ((cMax - cOut) / (cMax - cMin)) * 100.0;
    } else {
      // Formula Benefit: (C_out - C_min) / (C_max - C_min) * 100%
      val = ((cOut - cMin) / (cMax - cMin)) * 100.0;
    }

    const clamped = Math.max(0, Math.min(100, val));
    return Math.round(clamped * 100) / 100;
  }

  /**
   * Map loan nominal to C5 score (Cost: 25, 50, 75, 100)
   */
  static getSubCriteriaValueC5(nominal: number): number {
    if (nominal <= 5000000) return 25.0;
    if (nominal <= 10000000) return 50.0;
    if (nominal <= 15000000) return 75.0;
    return 100.0;
  }

  /**
   * Re-rank all active evaluations descending by final_score
   */
  static async reRankAll(): Promise<void> {
    try {
      // High-performance single SQL execution for PostgreSQL
      await prisma.$executeRawUnsafe(`
        UPDATE smart_evaluations e
        SET rank = ranked.new_rank
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY final_score DESC, id ASC) as new_rank
          FROM smart_evaluations
          WHERE is_delete = 0
        ) ranked
        WHERE e.id = ranked.id AND (e.rank IS NULL OR e.rank != ranked.new_rank);
      `);
    } catch {
      // Fallback
      const allEvals = await prisma.smartEvaluation.findMany({
        where: { is_delete: 0 },
        orderBy: [{ final_score: 'desc' }, { id: 'asc' }],
      });

      let rank = 1;
      for (const item of allEvals) {
        if (item.rank !== rank) {
          await prisma.smartEvaluation.update({
            where: { id: item.id },
            data: { rank },
          });
        }
        rank++;
      }
    }
  }

  /**
   * Re-normalize weights across all criteria (wj = Wj / Σ Wk)
   */
  static async renormalizeCriteria() {
    const allCriteria = await prisma.criterion.findMany();
    const total = allCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (total > 0) {
      for (const c of allCriteria) {
        const norm = Math.round((c.weight / total) * 10000) / 10000;
        await prisma.criterion.update({
          where: { id: c.id },
          data: { normalized_weight: norm },
        });
      }
    }
  }

  /**
   * Calculate SMART evaluation with assessed sub-criteria values
   */
  static async calculateWithAssessedValues(
    applicationId: number,
    nominalPengajuan: number,
    v1: number,
    v2: number,
    v3: number,
    v4: number,
    altCode = 'A1'
  ) {
    const criteria = await prisma.criterion.findMany({
      orderBy: { order_num: 'asc' },
    });

    const w: Record<string, number> = {
      C1: 0.3,
      C2: 0.2,
      C3: 0.2,
      C4: 0.15,
      C5: 0.15,
    };

    for (const c of criteria) {
      w[c.code] = c.normalized_weight;
    }

    const v5 = this.getSubCriteriaValueC5(nominalPengajuan);

    const u1 = this.computeUtility(v1, 'benefit', 25.0, 100.0);
    const u2 = this.computeUtility(v2, 'benefit', 25.0, 100.0);
    const u3 = this.computeUtility(v3, 'benefit', 25.0, 100.0);
    const u4 = this.computeUtility(v4, 'benefit', 25.0, 100.0);
    const u5 = this.computeUtility(v5, 'cost', 25.0, 100.0);

    const finalScore = Math.round(
      ((w['C1'] ?? 0.3) * u1 +
        (w['C2'] ?? 0.2) * u2 +
        (w['C3'] ?? 0.2) * u3 +
        (w['C4'] ?? 0.15) * u4 +
        (w['C5'] ?? 0.15) * u5) *
        100
    ) / 100;

    let recommendation = 'Tidak Layak (Ditolak)';
    if (finalScore >= 75.0) {
      recommendation = 'Sangat Layak (Disetujui Penuh)';
    } else if (finalScore >= 50.0) {
      recommendation = 'Layak dengan Penyesuaian';
    }

    const evalRecord = await prisma.smartEvaluation.upsert({
      where: { loan_application_id: applicationId },
      update: {
        alternative_code: altCode,
        val_c1: v1,
        val_c2: v2,
        val_c3: v3,
        val_c4: v4,
        val_c5: v5,
        utility_c1: u1,
        utility_c2: u2,
        utility_c3: u3,
        utility_c4: u4,
        utility_c5: u5,
        final_score: finalScore,
        recommendation,
        calculated_at: new Date(),
      },
      create: {
        loan_application_id: applicationId,
        alternative_code: altCode,
        val_c1: v1,
        val_c2: v2,
        val_c3: v3,
        val_c4: v4,
        val_c5: v5,
        utility_c1: u1,
        utility_c2: u2,
        utility_c3: u3,
        utility_c4: u4,
        utility_c5: u5,
        final_score: finalScore,
        recommendation,
        calculated_at: new Date(),
      },
    });

    await this.reRankAll();
    return evalRecord;
  }

  /**
   * Recalculate all active applications and simulations
   */
  static async calculateAllBatch() {
    const criteria = await prisma.criterion.findMany({
      orderBy: { order_num: 'asc' },
    });

    const w: Record<string, number> = {
      C1: 0.3,
      C2: 0.2,
      C3: 0.2,
      C4: 0.15,
      C5: 0.15,
    };
    for (const c of criteria) {
      w[c.code] = c.normalized_weight;
    }

    const evaluations = await prisma.smartEvaluation.findMany({
      where: { is_delete: 0 },
    });

    for (const evalItem of evaluations) {
      const u1 = this.computeUtility(evalItem.val_c1, 'benefit', 25.0, 100.0);
      const u2 = this.computeUtility(evalItem.val_c2, 'benefit', 25.0, 100.0);
      const u3 = this.computeUtility(evalItem.val_c3, 'benefit', 25.0, 100.0);
      const u4 = this.computeUtility(evalItem.val_c4, 'benefit', 25.0, 100.0);
      const u5 = this.computeUtility(evalItem.val_c5, 'cost', 25.0, 100.0);

      const finalScore = Math.round(
        ((w['C1'] ?? 0.3) * u1 +
          (w['C2'] ?? 0.2) * u2 +
          (w['C3'] ?? 0.2) * u3 +
          (w['C4'] ?? 0.15) * u4 +
          (w['C5'] ?? 0.15) * u5) *
          100
      ) / 100;

      let recommendation = 'Tidak Layak (Ditolak)';
      if (finalScore >= 75.0) {
        recommendation = 'Sangat Layak (Disetujui Penuh)';
      } else if (finalScore >= 50.0) {
        recommendation = 'Layak dengan Penyesuaian';
      }

      await prisma.smartEvaluation.update({
        where: { id: evalItem.id },
        data: {
          utility_c1: u1,
          utility_c2: u2,
          utility_c3: u3,
          utility_c4: u4,
          utility_c5: u5,
          final_score: finalScore,
          recommendation,
          calculated_at: new Date(),
        },
      });
    }

    await this.reRankAll();

    return {
      total_recalculated: evaluations.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Manual simulation alternative in the SPK Research Lab
   */
  static async calculateManualSimulation(data: any, skipReRank = false) {
    const criteria = await prisma.criterion.findMany({
      orderBy: { order_num: 'asc' },
    });

    const w: Record<string, number> = {};
    for (const c of criteria) {
      w[c.code] = c.normalized_weight;
    }

    const v1 = parseFloat(data.val_c1 ?? 75);
    const v2 = parseFloat(data.val_c2 ?? 75);
    const v3 = parseFloat(data.val_c3 ?? 75);
    const v4 = parseFloat(data.val_c4 ?? 75);

    const plafon = parseFloat(data.candidate_plafon ?? 10000000);
    const v5 = data.val_c5 !== undefined ? parseFloat(data.val_c5) : this.getSubCriteriaValueC5(plafon);

    const u1 = this.computeUtility(v1, 'benefit', 25.0, 100.0);
    const u2 = this.computeUtility(v2, 'benefit', 25.0, 100.0);
    const u3 = this.computeUtility(v3, 'benefit', 25.0, 100.0);
    const u4 = this.computeUtility(v4, 'benefit', 25.0, 100.0);
    const u5 = this.computeUtility(v5, 'cost', 25.0, 100.0);

    const w1 = w['C1'] ?? 0.3;
    const w2 = w['C2'] ?? 0.2;
    const w3 = w['C3'] ?? 0.2;
    const w4 = w['C4'] ?? 0.15;
    const w5 = w['C5'] ?? 0.15;

    const finalScore = Math.round(((w1 * u1) + (w2 * u2) + (w3 * u3) + (w4 * u4) + (w5 * u5)) * 100) / 100;

    let recommendation = 'Tidak Layak (Ditolak)';
    if (finalScore >= 75.0) {
      recommendation = 'Sangat Layak (Disetujui Penuh)';
    } else if (finalScore >= 50.0) {
      recommendation = 'Layak dengan Penyesuaian';
    }

    let record;
    if (data.id) {
      record = await prisma.smartEvaluation.update({
        where: { id: parseInt(data.id) },
        data: {
          candidate_name: data.candidate_name || 'Kandidat Riset Simulasi',
          candidate_nik: data.candidate_nik || `SIM-${Math.floor(100 + Math.random() * 900)}`,
          candidate_unit: data.candidate_unit || 'Unit Akademik',
          candidate_plafon: plafon,
          val_c1: v1,
          val_c2: v2,
          val_c3: v3,
          val_c4: v4,
          val_c5: v5,
          utility_c1: u1,
          utility_c2: u2,
          utility_c3: u3,
          utility_c4: u4,
          utility_c5: u5,
          final_score: finalScore,
          recommendation,
          dynamic_scores: data.dynamic_scores || null,
          calculated_at: new Date(),
        },
      });
    } else {
      const totalCount = await prisma.smartEvaluation.count();
      const altCode = `A${totalCount + 1}`;
      record = await prisma.smartEvaluation.create({
        data: {
          alternative_code: altCode,
          is_manual_simulation: true,
          candidate_name: data.candidate_name || 'Kandidat Riset Simulasi',
          candidate_nik: data.candidate_nik || `SIM-${Math.floor(100 + Math.random() * 900)}`,
          candidate_unit: data.candidate_unit || 'Unit Akademik',
          candidate_plafon: plafon,
          val_c1: v1,
          val_c2: v2,
          val_c3: v3,
          val_c4: v4,
          val_c5: v5,
          utility_c1: u1,
          utility_c2: u2,
          utility_c3: u3,
          utility_c4: u4,
          utility_c5: u5,
          final_score: finalScore,
          recommendation,
          dynamic_scores: data.dynamic_scores || null,
          calculated_at: new Date(),
        },
      });
    }

    if (!skipReRank) {
      await this.reRankAll();
    }
    return record;
  }

  /**
   * High-performance batch simulation calculation for up to 150+ records
   */
  static async calculateBatchSimulations(batch: any[]) {
    const criteria = await prisma.criterion.findMany({
      orderBy: { order_num: 'asc' },
    });

    const w: Record<string, number> = {};
    for (const c of criteria) {
      w[c.code] = c.normalized_weight;
    }

    const w1 = w['C1'] ?? 0.3;
    const w2 = w['C2'] ?? 0.2;
    const w3 = w['C3'] ?? 0.2;
    const w4 = w['C4'] ?? 0.15;
    const w5 = w['C5'] ?? 0.15;

    const startCount = await prisma.smartEvaluation.count();
    const insertData: any[] = [];

    for (let i = 0; i < batch.length; i++) {
      const item = batch[i];
      if (!item.candidate_name) continue;

      const v1 = parseFloat(item.val_c1 ?? 75);
      const v2 = parseFloat(item.val_c2 ?? 75);
      const v3 = parseFloat(item.val_c3 ?? 75);
      const v4 = parseFloat(item.val_c4 ?? 75);
      const plafon = parseFloat(item.candidate_plafon ?? 10000000);
      const v5 = item.val_c5 !== undefined ? parseFloat(item.val_c5) : this.getSubCriteriaValueC5(plafon);

      const u1 = this.computeUtility(v1, 'benefit', 25.0, 100.0);
      const u2 = this.computeUtility(v2, 'benefit', 25.0, 100.0);
      const u3 = this.computeUtility(v3, 'benefit', 25.0, 100.0);
      const u4 = this.computeUtility(v4, 'benefit', 25.0, 100.0);
      const u5 = this.computeUtility(v5, 'cost', 25.0, 100.0);

      const finalScore = Math.round(((w1 * u1) + (w2 * u2) + (w3 * u3) + (w4 * u4) + (w5 * u5)) * 100) / 100;

      let recommendation = 'Tidak Layak (Ditolak)';
      if (finalScore >= 75.0) {
        recommendation = 'Sangat Layak (Disetujui Penuh)';
      } else if (finalScore >= 50.0) {
        recommendation = 'Layak dengan Penyesuaian';
      }

      insertData.push({
        alternative_code: `A${startCount + i + 1}`,
        is_manual_simulation: true,
        candidate_name: item.candidate_name,
        candidate_nik: item.candidate_nik || `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
        candidate_unit: item.candidate_unit || 'Unit Akademik',
        candidate_plafon: plafon,
        val_c1: v1,
        val_c2: v2,
        val_c3: v3,
        val_c4: v4,
        val_c5: v5,
        utility_c1: u1,
        utility_c2: u2,
        utility_c3: u3,
        utility_c4: u4,
        utility_c5: u5,
        final_score: finalScore,
        recommendation,
        calculated_at: new Date(),
      });
    }

    if (insertData.length > 0) {
      await prisma.smartEvaluation.createMany({
        data: insertData,
      });
    }

    await this.reRankAll();
    return insertData;
  }
}
