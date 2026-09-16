// /static/js/beta.js

const MASTERED_STORAGE_KEY = 'chibiquestToolMasteredJobs';

document.addEventListener('DOMContentLoaded', function () {

    if (typeof allJobData === 'undefined' || !Array.isArray(allJobData) || allJobData.length === 0) {
        document.querySelectorAll('.beta-tab-content').forEach(el => {
            el.innerHTML = '<p style="color:red;">データ読み込みエラー。ページを再読み込みしてください。</p>';
        });
        return;
    }

    // ─── タブ切替 ───
    document.querySelectorAll('.beta-tab').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.beta-tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.beta-tab-content').forEach(c => c.style.display = 'none');
            this.classList.add('active');
            document.getElementById('beta-tab-' + this.dataset.tab).style.display = '';
        });
    });

    // ─── localStorage ───
    function loadMastered() {
        try {
            const d = localStorage.getItem(MASTERED_STORAGE_KEY);
            return d ? new Set(JSON.parse(d)) : new Set();
        } catch (e) { return new Set(); }
    }

    // ─── 前提職の再帰探索 (共通) ───
    function findAllPrereqs(targetJob) {
        const result = new Set();
        function recurse(jobName, depth) {
            if (depth > 50 || !jobName || result.has(jobName) || !jobDataMap.has(jobName)) return;
            result.add(jobName);
            const info = jobDataMap.get(jobName);
            const prereq = info['前提/アイテム'] || '';
            if (prereq === 'なし' || prereq === '' || parseInt(info['職階'], 10) === 0) return;
            prereq.split(',').map(s => s.trim()).filter(s => s && s !== '?' && s !== '[[]]')
                .forEach(p => { if (jobDataMap.has(p)) recurse(p, depth + 1); });
        }
        recurse(targetJob, 0);
        return result;
    }

    // ══════════════════════════════════════════
    // Tab 1: 育成ロードマップ
    // ══════════════════════════════════════════
    const roadmapSelect = document.getElementById('roadmap-target-job');
    const roadmapOutput = document.getElementById('roadmap-output');
    const roadmapCsvBtn = document.getElementById('roadmap-csv-btn');
    let lastRoadmapSteps = [];

    // 目標職業ドロップダウン構築（職次グループ化）
    const jobsSorted = [...allJobData]
        .filter(j => parseInt(j['職階'], 10) > 0 && j['職業の名前'])
        .sort((a, b) => {
            const rA = parseInt(a['職階'], 10), rB = parseInt(b['職階'], 10);
            return rA !== rB ? rA - rB : a['職業の名前'].localeCompare(b['職業の名前'], 'ja');
        });
    let prevRank = -1;
    jobsSorted.forEach(job => {
        const rank = parseInt(job['職階'], 10);
        if (rank !== prevRank) {
            const grp = document.createElement('option');
            grp.disabled = true;
            grp.textContent = `── ${rank}次職 ──`;
            roadmapSelect.appendChild(grp);
            prevRank = rank;
        }
        const opt = document.createElement('option');
        opt.value = job['職業の名前'];
        opt.textContent = `${job['職業の名前']}  (マスターLv${job['最大LV'] || '?'})`;
        roadmapSelect.appendChild(opt);
    });

    document.getElementById('roadmap-generate-btn').addEventListener('click', function () {
        const target = roadmapSelect.value;
        if (!target) { alert('目標職業を選択してください。'); return; }

        const mastered = loadMastered();
        const prereqSet = findAllPrereqs(target);
        const steps = [...prereqSet].sort((a, b) => {
            const rA = parseInt(jobDataMap.get(a)?.['職階'], 10);
            const rB = parseInt(jobDataMap.get(b)?.['職階'], 10);
            return rA !== rB ? rA - rB : a.localeCompare(b, 'ja');
        });
        lastRoadmapSteps = steps;
        renderRoadmap(steps, target, mastered);
    });

    function renderRoadmap(steps, target, mastered) {
        roadmapOutput.innerHTML = '';
        if (steps.length === 0) {
            roadmapOutput.innerHTML = '<p style="color:green;">この職業には前提職がありません。</p>';
            return;
        }

        let totalLv = 0, remainLv = 0, remainCount = 0;

        const table = document.createElement('table');
        table.style.cssText = 'width:100%; border-collapse:collapse; font-size:0.9em;';

        const rankColors = {
            0: '#6c757d', 1: '#0d6efd', 2: '#198754', 3: '#0dcaf0',
            4: '#ffc107', 5: '#fd7e14', 6: '#dc3545', 7: '#6f42c1',
            8: '#20c997', 9: '#d63384', 10: '#495057', 11: '#343a40'
        };

        let html = `<thead><tr style="background:#8B4513; color:white;">
            <th style="padding:7px 10px; text-align:center; width:45px;">順</th>
            <th style="padding:7px 10px;">職業名</th>
            <th style="padding:7px 10px; text-align:center; width:80px;">職次</th>
            <th style="padding:7px 10px; text-align:center; width:95px;">マスターLv</th>
            <th style="padding:7px 10px; text-align:center; width:75px;">状態</th>
        </tr></thead><tbody>`;

        steps.forEach((jobName, idx) => {
            const info = jobDataMap.get(jobName);
            const rank = parseInt(info?.['職階'], 10);
            const maxLv = parseInt(info?.['最大LV'], 10) || 0;
            const isMastered = mastered.has(jobName);
            const isTarget = jobName === target;
            const color = rankColors[rank] || '#6c757d';

            totalLv += maxLv;
            if (!isMastered) { remainLv += maxLv; remainCount++; }

            const rowBg = isMastered ? '#f0f0f0' : (idx % 2 === 0 ? '#fdfaf4' : '#f8f3eb');
            const rankLabel = rank === 0 ? 'アイテム' : rank + '次';
            html += `<tr style="background:${rowBg}; ${isMastered ? 'opacity:0.55;' : ''}">
                <td style="padding:5px 10px; text-align:center; color:#aaa; font-size:0.85em;">${idx + 1}</td>
                <td style="padding:5px 10px; font-weight:${isTarget ? 'bold' : 'normal'};">
                    ${isTarget ? '<span style="color:#dc3545;">★ </span>' : ''}${jobName}
                </td>
                <td style="padding:5px 10px; text-align:center;">
                    <span style="background:${color}; color:white; padding:2px 7px; border-radius:10px; font-size:0.8em;">${rankLabel}</span>
                </td>
                <td style="padding:5px 10px; text-align:center;">${maxLv || '-'}</td>
                <td style="padding:5px 10px; text-align:center; font-size:0.9em;">${isMastered ? '✅ 済' : '⬜ 未'}</td>
            </tr>`;
        });

        html += '</tbody>';
        table.innerHTML = html;
        roadmapOutput.appendChild(table);

        const summary = document.createElement('div');
        summary.style.cssText = 'margin-top:14px; padding:12px 16px; background:#fff8e8; border:1px solid #e8d08c; border-radius:6px; display:flex; gap:24px; flex-wrap:wrap; font-size:0.95em;';
        summary.innerHTML = `
            <span>📋 合計ステップ: <strong>${steps.length}</strong> 職業</span>
            <span>✅ 完了: <strong>${steps.length - remainCount}</strong> 職業</span>
            <span style="color:#dc3545;">⬜ 残り: <strong>${remainCount}</strong> 職業</span>
            <span style="color:#dc3545;">🎯 残りマスターLv合計: <strong style="font-size:1.15em;">${remainLv.toLocaleString()}</strong></span>
        `;
        roadmapOutput.appendChild(summary);
        roadmapCsvBtn.style.display = '';
    }

    roadmapCsvBtn.addEventListener('click', function () {
        if (!lastRoadmapSteps.length) return;
        const mastered = loadMastered();
        const header = ['順序', '職業名', '職次', 'マスターLv', '前提/アイテム', '状態'];
        const rows = lastRoadmapSteps.map((jobName, idx) => {
            const info = jobDataMap.get(jobName);
            const rank = parseInt(info?.['職階'], 10);
            const rankLabel = rank === 0 ? 'アイテム職' : rank + '次';
            return [idx + 1, jobName, rankLabel, info?.['最大LV'] || '-', info?.['前提/アイテム'] || '-', mastered.has(jobName) ? 'マスター済み' : '未マスター'];
        });
        const csv = [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }));
        a.download = 'leveling_roadmap.csv'; a.click();
    });

    // ══════════════════════════════════════════
    // Tab 2: ステータス合算
    // ══════════════════════════════════════════
    document.getElementById('stats-load-btn').addEventListener('click', function () {
        const mastered = loadMastered();
        const info = document.getElementById('stats-info');
        const output = document.getElementById('stats-output');

        if (mastered.size === 0) {
            info.textContent = '前提職計算ツールでマスター済み職業を設定してから再度お試しください。';
            output.innerHTML = '';
            return;
        }

        const totals = { hp: 0, mp: 0, atk: 0, mag: 0, lck: 0 };
        const rows = [];

        mastered.forEach(jobName => {
            const jobInfo = jobDataMap.get(jobName);
            if (!jobInfo) return;
            const hp  = parseInt(jobInfo['最大HPアップ']) || 0;
            const mp  = parseInt(jobInfo['最大MPアップ']) || 0;
            const atk = parseInt(jobInfo['最大攻撃力アップ']) || 0;
            const mag = parseInt(jobInfo['最大魔力アップ']) || 0;
            const lck = parseInt(jobInfo['最大運アップ']) || 0;
            totals.hp += hp; totals.mp += mp; totals.atk += atk; totals.mag += mag; totals.lck += lck;
            rows.push({ jobName, rank: parseInt(jobInfo['職階'], 10), hp, mp, atk, mag, lck });
        });

        rows.sort((a, b) => a.rank !== b.rank ? a.rank - b.rank : a.jobName.localeCompare(b.jobName, 'ja'));
        info.textContent = `マスター済み ${mastered.size} 職業から集計`;

        const maxVal = Math.max(totals.hp, totals.mp, totals.atk, totals.mag, totals.lck, 1);
        function bar(val, color) {
            const pct = (val / maxVal * 100).toFixed(1);
            return `<div style="display:flex; align-items:center; gap:10px; margin:4px 0;">
                <div style="width:180px; background:#e9ecef; border-radius:3px; height:14px; overflow:hidden; flex-shrink:0;">
                    <div style="width:${pct}%; height:100%; background:${color}; transition:width 0.4s;"></div>
                </div>
                <span style="font-weight:bold; min-width:36px; font-size:1.05em;">+${val}</span>
            </div>`;
        }

        let html = `<div style="display:flex; flex-wrap:wrap; gap:20px; margin-bottom:20px;">
            <div style="padding:16px 20px; background:#fdfaf4; border:1px solid #e0d8c0; border-radius:8px; min-width:280px;">
                <h3 style="margin:0 0 14px; color:#8B4513; font-size:1em; border-bottom:2px solid #8B4513; padding-bottom:6px;">合計ステータス上昇値</h3>
                <table style="border:none; width:auto; margin:0;">
                    <tr><td style="border:none; padding:2px 10px 2px 0; font-weight:bold; color:#c0392b;">最大HP</td><td style="border:none; padding:2px 0;">${bar(totals.hp, '#e74c3c')}</td></tr>
                    <tr><td style="border:none; padding:2px 10px 2px 0; font-weight:bold; color:#2980b9;">最大MP</td><td style="border:none; padding:2px 0;">${bar(totals.mp, '#3498db')}</td></tr>
                    <tr><td style="border:none; padding:2px 10px 2px 0; font-weight:bold; color:#d35400;">攻撃力</td><td style="border:none; padding:2px 0;">${bar(totals.atk, '#e67e22')}</td></tr>
                    <tr><td style="border:none; padding:2px 10px 2px 0; font-weight:bold; color:#8e44ad;">魔力</td><td style="border:none; padding:2px 0;">${bar(totals.mag, '#9b59b6')}</td></tr>
                    <tr><td style="border:none; padding:2px 10px 2px 0; font-weight:bold; color:#27ae60;">運</td><td style="border:none; padding:2px 0;">${bar(totals.lck, '#2ecc71')}</td></tr>
                </table>
            </div>
        </div>
        <h3 style="margin-top:0;">職業別内訳 (${rows.length}職業)</h3>
        <div style="max-height:420px; overflow-y:auto; border:1px solid #e0d8c0; border-radius:4px;">
        <table style="width:100%; border-collapse:collapse; font-size:0.88em; margin:0;">
            <thead><tr style="background:#8B4513; color:white; position:sticky; top:0; z-index:1;">
                <th style="padding:7px 10px; text-align:left; border:none;">職業名</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:60px;">職次</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:55px; color:#ffaaaa;">HP↑</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:55px; color:#aad4ff;">MP↑</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:55px; color:#ffccaa;">攻↑</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:55px; color:#ddaaff;">魔↑</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:55px; color:#aaffcc;">運↑</th>
            </tr></thead><tbody>`;

        rows.forEach((r, idx) => {
            const bg = idx % 2 === 0 ? '#fdfaf4' : '#f5f0e8';
            const rankLabel = r.rank === 0 ? 'ア' : r.rank + '次';
            html += `<tr style="background:${bg};">
                <td style="padding:4px 10px; border:none;">${r.jobName}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#888;">${rankLabel}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#c0392b;">${r.hp || '-'}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#2980b9;">${r.mp || '-'}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#d35400;">${r.atk || '-'}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#8e44ad;">${r.mag || '-'}</td>
                <td style="padding:4px 10px; text-align:center; border:none; color:#27ae60;">${r.lck || '-'}</td>
            </tr>`;
        });

        html += `<tr style="background:#f0e8d8; font-weight:bold; position:sticky; bottom:0;">
            <td style="padding:6px 10px; border:none;">合計</td>
            <td style="border:none;"></td>
            <td style="padding:6px 10px; text-align:center; border:none; color:#c0392b;">${totals.hp}</td>
            <td style="padding:6px 10px; text-align:center; border:none; color:#2980b9;">${totals.mp}</td>
            <td style="padding:6px 10px; text-align:center; border:none; color:#d35400;">${totals.atk}</td>
            <td style="padding:6px 10px; text-align:center; border:none; color:#8e44ad;">${totals.mag}</td>
            <td style="padding:6px 10px; text-align:center; border:none; color:#27ae60;">${totals.lck}</td>
        </tr></tbody></table></div>`;

        output.innerHTML = html;
    });

    // ══════════════════════════════════════════
    // Tab 3: スキル逆引き
    // ══════════════════════════════════════════
    const skillInput = document.getElementById('skill-search-input');
    const skillRankFilter = document.getElementById('skill-rank-filter');
    const skillsOutput = document.getElementById('skills-output');

    // スキルデータをパース: "ホイミ(10), ベホイミ(30)" → [{name:'ホイミ', lv:10}, ...]
    function parseSkills(skillStr) {
        if (!skillStr) return [];
        return skillStr.split(',').map(s => s.trim()).filter(Boolean).map(s => {
            const m = s.match(/^(.+?)\((\d+)\)$/);
            return m ? { name: m[1].trim(), lv: parseInt(m[2], 10) } : { name: s, lv: null };
        });
    }

    function runSkillSearch() {
        const query = skillInput.value.trim().toLowerCase();
        const rankFilter = skillRankFilter.value;

        if (!query && !rankFilter) {
            skillsOutput.innerHTML = '<p style="color:#aaa;">スキル名を入力するか職次を選択してください。</p>';
            return;
        }

        const results = [];
        allJobData.forEach(job => {
            const rank = parseInt(job['職階'], 10);
            if (rankFilter !== '' && rank !== parseInt(rankFilter, 10)) return;
            const skills = parseSkills(job['覚える技 (覚える職業LV)']);
            const matched = query ? skills.filter(s => s.name.toLowerCase().includes(query)) : skills;
            if (matched.length > 0) {
                results.push({ job, skills: matched, allSkills: skills });
            }
        });

        results.sort((a, b) => {
            const rA = parseInt(a.job['職階'], 10), rB = parseInt(b.job['職階'], 10);
            return rA !== rB ? rA - rB : a.job['職業の名前'].localeCompare(b.job['職業の名前'], 'ja');
        });

        if (results.length === 0) {
            skillsOutput.innerHTML = `<p style="color:#888;">「${query || ''}」に一致するスキルは見つかりませんでした。</p>`;
            return;
        }

        const rankColors = {
            0: '#6c757d', 1: '#0d6efd', 2: '#198754', 3: '#0dcaf0',
            4: '#b8860b', 5: '#fd7e14', 6: '#dc3545', 7: '#6f42c1',
            8: '#20c997', 9: '#d63384', 10: '#495057', 11: '#343a40'
        };

        let html = `<div style="margin-bottom:8px; color:#666; font-size:0.9em;">${results.length}件の職業が一致</div>
        <div style="max-height:500px; overflow-y:auto; border:1px solid #e0d8c0; border-radius:4px;">
        <table style="width:100%; border-collapse:collapse; font-size:0.88em; margin:0;">
            <thead><tr style="background:#8B4513; color:white; position:sticky; top:0; z-index:1;">
                <th style="padding:7px 10px; text-align:center; border:none; width:65px;">職次</th>
                <th style="padding:7px 10px; text-align:left; border:none;">職業名</th>
                <th style="padding:7px 10px; text-align:center; border:none; width:90px;">マスターLv</th>
                <th style="padding:7px 10px; text-align:left; border:none;">${query ? '一致スキル' : 'スキル一覧'}</th>
            </tr></thead><tbody>`;

        results.forEach((r, idx) => {
            const rank = parseInt(r.job['職階'], 10);
            const rankLabel = rank === 0 ? 'アイテム職' : rank + '次';
            const color = rankColors[rank] || '#6c757d';
            const bg = idx % 2 === 0 ? '#fdfaf4' : '#f5f0e8';

            const skillTags = r.skills.map(s => {
                const highlight = query && s.name.toLowerCase().includes(query);
                return `<span style="display:inline-block; margin:2px; padding:2px 7px; border-radius:10px;
                    background:${highlight ? '#fff3cd' : '#e9ecef'};
                    border:1px solid ${highlight ? '#ffc107' : '#dee2e6'};
                    font-size:0.88em;">
                    ${s.name}${s.lv !== null ? `<span style="color:#888; font-size:0.85em;">(Lv${s.lv})</span>` : ''}
                </span>`;
            }).join('');

            html += `<tr style="background:${bg};">
                <td style="padding:5px 10px; text-align:center; border:none;">
                    <span style="background:${color}; color:white; padding:2px 7px; border-radius:10px; font-size:0.8em; white-space:nowrap;">${rankLabel}</span>
                </td>
                <td style="padding:5px 10px; border:none; font-weight:bold;">${r.job['職業の名前']}</td>
                <td style="padding:5px 10px; text-align:center; border:none; color:#888;">${r.job['最大LV'] || '-'}</td>
                <td style="padding:5px 10px; border:none;">${skillTags}</td>
            </tr>`;
        });

        html += '</tbody></table></div>';
        skillsOutput.innerHTML = html;
    }

    skillInput.addEventListener('input', runSkillSearch);
    skillRankFilter.addEventListener('change', runSkillSearch);

});
