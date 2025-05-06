// /static/js/skill-planner.js (シミュレーションロジック実装版)

document.addEventListener('DOMContentLoaded', function() {
    const masteredJobsStorageKey = 'chibiquestToolMasteredJobs';
    const currentSkillsStorageKey = 'chibiquestSkillPlannerCurrentSkills';

    // --- HTML要素の取得 (変更なし) ---
    const desiredSkillListContainer = document.getElementById('desired-skill-list');
    const desiredSkillFilter = document.getElementById('desired-skill-filter');
    const currentSkillListContainer = document.getElementById('current-skill-list');
    const currentSkillFilter = document.getElementById('current-skill-filter');
    const currentSkillCountSpan = document.getElementById('current-skill-count');
    const spMasteredCheckboxContainer = document.getElementById('sp-mastered-job-list');
    const spMasteredRankFilter = document.getElementById('sp-mastered-rank-filter');
    const spMasteredNameFilter = document.getElementById('sp-mastered-job-filter');
    const spMasteredCheckAllButton = document.getElementById('sp-mastered-check-all');
    const spMasteredUncheckAllButton = document.getElementById('sp-mastered-uncheck-all');
    const spTargetCheckboxContainer = document.getElementById('sp-target-job-list');
    const spTargetRankFilter = document.getElementById('sp-target-rank-filter');
    const spTargetNameFilter = document.getElementById('sp-target-job-filter');
    const skillSimulateButton = document.getElementById('skill-simulate-button');
    const skillTimelineOutput = document.getElementById('skill-timeline-output');

    // --- グローバル変数 ---
    let masteredJobsSet = new Set();
    let currentSkillsSet = new Set();
    let sortedUniqueSkills = [];
    let parsedSkillsByJob = new Map(); // ★ パース済みスキルデータ

    // --- データチェック & パース済みスキルデータ作成 ---
    if (typeof allJobData === 'undefined' || !Array.isArray(allJobData) || allJobData.length === 0 || typeof jobDataMap === 'undefined' || jobDataMap.size === 0) {
        console.error('Data loading error.'); /*...*/ return;
    }
    // ★ パース済みスキルデータを準備 ★
    allJobData.forEach(job => {
        const jobName = job['職業の名前'];
        if (jobName) {
            const skills = parseSkillsString(job['覚える技 (覚える職業LV)']);
            skills.sort((a, b) => a.level - b.level); // スキルをレベル順でソート
            parsedSkillsByJob.set(jobName, skills);
        }
    });
    console.log(`Job data loaded. Parsed skills stored for ${parsedSkillsByJob.size} jobs.`);

    // --- localStorage 読み込み ---
    masteredJobsSet = loadDataFromLocalStorage(masteredJobsStorageKey);
    currentSkillsSet = loadDataFromLocalStorage(currentSkillsStorageKey);

    // --- スキルデータ解析関数 (変更なし) ---
    function parseSkillsString(skillsString) { const skills = []; if (!skillsString || typeof skillsString !== 'string') return skills; const skillParts = skillsString.split(',').map(s => s.trim()).filter(s => s !== ''); skillParts.forEach(part => { const match = part.match(/^(.*)\((\d+)\)$/); if (match && match[1] && match[2]) { const sn = match[1].trim(); const sl = parseInt(match[2], 10); if (sn && !isNaN(sl)) skills.push({ name: sn, level: sl }); } else { /* console.warn */ } }); return skills; }
    function generateUniqueSkillList() { const skillSet = new Set(); allJobData.forEach(job => { const s = parseSkillsString(job['覚える技 (覚える職業LV)']); s.forEach(si => skillSet.add(si.name)); }); sortedUniqueSkills = Array.from(skillSet).sort((a, b) => a.localeCompare(b, 'ja')); console.log("All Unique Skills Found:", sortedUniqueSkills.length); }

    // --- localStorage 関連関数 (変更なし) ---
    function saveDataToLocalStorage(key, dataSet) { try { localStorage.setItem(key, JSON.stringify(Array.from(dataSet))); } catch (e) { console.error(`Error saving LS Key ${key}:`, e); } }
    function loadDataFromLocalStorage(key) { try { const d = localStorage.getItem(key); return d ? new Set(JSON.parse(d)) : new Set(); } catch (e) { console.error(`Error loading LS Key ${key}:`, e); localStorage.removeItem(key); return new Set(); } }

    // --- リストレンダリング関数 (変更なし) ---
    function renderSkillCheckboxList(container, nameFilterInput, skillNames, checkedSet, storageKey = null) { /* ... 省略 ... */ }
    function renderJobCheckboxListSP(container, rankFilter, nameFilter, listType) { /* ... 省略 ... */ }
     // ★ 省略した renderSkillCheckboxList (変更なし) ★
      function renderSkillCheckboxList(container, nameFilterInput, skillNames, checkedSet, storageKey = null) { if (!container || !nameFilterInput) { console.error("Render target missing for skill list:", container, nameFilterInput); if(container) container.innerHTML = '<p style="color:red;">リスト表示エラー</p>'; return; } container.innerHTML = ''; const nameFilterValue = nameFilterInput.value.toLowerCase().trim(); const skillsToDisplay = skillNames.filter(skillName => skillName.toLowerCase().includes(nameFilterValue)); if (skillsToDisplay.length === 0) { container.innerHTML = '<p>該当するスキルがありません。</p>'; } else { const fragment = document.createDocumentFragment(); skillsToDisplay.forEach(skillName => { const safeIdName = skillName.replace(/[^a-zA-Z0-9_-]/g, '-'); const isChecked = checkedSet && checkedSet.has(skillName); const div = document.createElement('div'); div.className = 'skill-selection-item'; div.innerHTML = `<input type="checkbox" id="${container.id}-${safeIdName}" data-skill-name="${skillName}" ${isChecked ? 'checked' : ''}><label for="${container.id}-${safeIdName}">${skillName}</label>`; if (storageKey) { const checkbox = div.querySelector('input[type="checkbox"]'); checkbox.addEventListener('change', function() { if (this.checked) checkedSet.add(this.dataset.skillName); else checkedSet.delete(this.dataset.skillName); if (storageKey === currentSkillsStorageKey && checkedSet.size > 10) { if (currentSkillCountSpan) currentSkillCountSpan.style.color = 'red'; /*alert(`注意: 現在スキルが10個を超えています！(${checkedSet.size}個)`);*/ } else { if (currentSkillCountSpan) currentSkillCountSpan.style.color = 'inherit'; } if (currentSkillCountSpan) currentSkillCountSpan.textContent = checkedSet.size; saveDataToLocalStorage(storageKey, checkedSet); console.log(`Saved to ${storageKey}:`, Array.from(checkedSet)); }); } fragment.appendChild(div); }); container.appendChild(fragment); } if (storageKey === currentSkillsStorageKey) { if (currentSkillCountSpan) { currentSkillCountSpan.textContent = checkedSet.size; if(checkedSet.size > 10) currentSkillCountSpan.style.color = 'red'; else currentSkillCountSpan.style.color = 'inherit'; } } }
     // ★ 省略した renderJobCheckboxListSP (変更なし) ★
      function renderJobCheckboxListSP(container, rankFilter, nameFilter, listType) { if (!container || !rankFilter || !nameFilter) { console.error("Render target missing for job list:", listType); return; } const selectedRankRaw = rankFilter.value; const nameFilterValue = nameFilter.value.toLowerCase().trim(); container.innerHTML = ''; try { const filteredAndSortedJobs = allJobData .filter(job => { const rank = parseInt(job['職階'], 10); const name = job['職業の名前'] ? job['職業の名前'].toLowerCase() : ''; if (isNaN(rank) || !name || !job['職業の名前']) return false; let rankFilterPassed = true; if (listType === 'target' && rank === 0) rankFilterPassed = false; const selectedRankFilterPassed = (selectedRankRaw === "" || rank === parseInt(selectedRankRaw, 10)); const nameFilterPassed = name.includes(nameFilterValue); return rankFilterPassed && selectedRankFilterPassed && nameFilterPassed; }) .sort((a, b) => { const nameA = a['職業の名前'] || ''; const nameB = b['職業の名前'] || ''; const isCheckedA = (listType === 'mastered') && masteredJobsSet.has(nameA); const isCheckedB = (listType === 'mastered') && masteredJobsSet.has(nameB); if (listType === 'mastered' && isCheckedA !== isCheckedB) { return isCheckedA ? -1 : 1; } const rankA = parseInt(a['職階'], 10); const rankB = parseInt(b['職階'], 10); if (isNaN(rankA) || isNaN(rankB)) return 0; if (rankA !== rankB) { return rankA - rankB; } return nameA.localeCompare(nameB, 'ja'); }); const fragment = document.createDocumentFragment(); if (filteredAndSortedJobs.length === 0) { container.innerHTML = '<p>該当する職業がありません。</p>'; } else { filteredAndSortedJobs.forEach(job => { const jobName = job['職業の名前']; const jobRank = job['職階']; const safeIdName = jobName.replace(/[^a-zA-Z0-9_-]/g, '-'); const isChecked = (listType === 'mastered') && masteredJobsSet.has(jobName); const div = document.createElement('div'); div.className = 'job-selection-item'; const rankDisplay = `${jobRank}${jobRank == 0 ? '' : '次'}`; div.innerHTML = `<input type="checkbox" id="${container.id}-${safeIdName}" data-job-name="${jobName}" ${isChecked ? 'checked' : ''}><label for="${container.id}-${safeIdName}">${jobName} (${rankDisplay})</label>`; if (listType === 'mastered') { const checkbox = div.querySelector('input[type="checkbox"]'); checkbox.addEventListener('change', function() { if (this.checked) masteredJobsSet.add(this.dataset.jobName); else masteredJobsSet.delete(this.dataset.jobName); saveDataToLocalStorage(masteredJobsStorageKey, masteredJobsSet); console.log('Mastered jobs saved:', Array.from(masteredJobsSet)); renderJobCheckboxListSP(spMasteredCheckboxContainer, spMasteredRankFilter, spMasteredNameFilter, 'mastered'); }); } fragment.appendChild(div); }); } container.appendChild(fragment); } catch (e) { console.error("Error rendering job list:", e); container.innerHTML = '<p style="color:red;">リスト表示エラー</p>'; } }


    // --- 全選択/全解除 関数 (変更なし) ---
    function setCheckAllMasteredVisibleSP(isChecked) { /* ... 省略 ... */ }
     // ★ 省略した全選択/全解除関数 (変更なし) ★
      function setCheckAllMasteredVisibleSP(isChecked) { if (!spMasteredCheckboxContainer) return; const visibleItems = spMasteredCheckboxContainer.querySelectorAll('.job-selection-item'); visibleItems.forEach(item => { if (item.style.display !== 'none') { const checkbox = item.querySelector('input[type="checkbox"]'); const jobName = checkbox.dataset.jobName; if (checkbox && jobName) { checkbox.checked = isChecked; if (isChecked) { masteredJobsSet.add(jobName); } else { masteredJobsSet.delete(jobName); } } } }); saveDataToLocalStorage(masteredJobsStorageKey, masteredJobsSet); renderJobCheckboxListSP(spMasteredCheckboxContainer, spMasteredRankFilter, spMasteredNameFilter, 'mastered'); console.log(`Set all visible SP mastered jobs to ${isChecked ? 'checked' : 'unchecked'}`); }


    // --- イベントリスナー設定 (変更なし) ---
     if (desiredSkillFilter) { desiredSkillFilter.addEventListener('input', () => renderSkillCheckboxList(desiredSkillListContainer, desiredSkillFilter, sortedUniqueSkills, null)); } else console.error('#desired-skill-filter not found');
     if (currentSkillFilter) { currentSkillFilter.addEventListener('input', () => renderSkillCheckboxList(currentSkillListContainer, currentSkillFilter, sortedUniqueSkills, currentSkillsSet, currentSkillsStorageKey)); } else console.error('#current-skill-filter not found');
     if (spMasteredRankFilter) { spMasteredRankFilter.addEventListener('change', () => renderJobCheckboxListSP(spMasteredCheckboxContainer, spMasteredRankFilter, spMasteredNameFilter, 'mastered')); } else console.error('#sp-mastered-rank-filter not found');
     if (spMasteredNameFilter) { spMasteredNameFilter.addEventListener('input', () => renderJobCheckboxListSP(spMasteredCheckboxContainer, spMasteredRankFilter, spMasteredNameFilter, 'mastered')); } else console.error('#sp-mastered-job-filter not found');
     if (spTargetRankFilter) { spTargetRankFilter.addEventListener('change', () => renderJobCheckboxListSP(spTargetCheckboxContainer, spTargetRankFilter, spTargetNameFilter, 'target')); } else console.error('#sp-target-rank-filter not found');
     if (spTargetNameFilter) { spTargetNameFilter.addEventListener('input', () => renderJobCheckboxListSP(spTargetCheckboxContainer, spTargetRankFilter, spTargetNameFilter, 'target')); } else console.error('#sp-target-job-filter not found');
     if (spMasteredCheckAllButton) { spMasteredCheckAllButton.addEventListener('click', () => setCheckAllMasteredVisibleSP(true)); } else console.error("#sp-mastered-check-all not found.");
     if (spMasteredUncheckAllButton) { spMasteredUncheckAllButton.addEventListener('click', () => setCheckAllMasteredVisibleSP(false)); } else console.error("#sp-mastered-uncheck-all not found.");
     if (skillSimulateButton) { skillSimulateButton.addEventListener('click', handleSimulation); } else console.error('#skill-simulate-button not found');


    // --- ▼▼▼ シミュレーション実行関数 (handleSimulation) 本体実装 ▼▼▼ ---
    function handleSimulation() {
        console.log("Simulation started!");
        if (!skillTimelineOutput) { console.error("Output area #skill-timeline-output not found."); return; }
        skillTimelineOutput.innerHTML = '<p>シミュレーション中...</p>'; // 処理中メッセージ

        // 1. 入力値を取得
        const desiredSkillsSet = new Set();
        if (desiredSkillListContainer) { desiredSkillListContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => desiredSkillsSet.add(cb.dataset.skillName)); }

        // 現在のスキルはlocalStorageから最新を取得し、10個に制限
        const currentSkillsFromStorage = Array.from(loadDataFromLocalStorage(currentSkillsStorageKey));
        let skillQueue = currentSkillsFromStorage.slice(0, 10); // 最大10個で初期化

        const currentMasteredJobs = masteredJobsSet; // メモリ上の最新を使用
        const selectedTargetJobNames = [];
        if (spTargetCheckboxContainer) { spTargetCheckboxContainer.querySelectorAll('.job-selection-item input[type="checkbox"]:checked').forEach(cb => selectedTargetJobNames.push(cb.dataset.jobName)); }

        // 入力チェック
        if (selectedTargetJobNames.length === 0) { alert("目標職業を選択してください。"); skillTimelineOutput.innerHTML = ''; return; }
        if (currentSkillsFromStorage.length > 10) { alert(`注意: 現在スキルが10個を超えています(${currentSkillsFromStorage.length}個)。シミュレーションは最初の10個で開始します。`); }

        console.log("Inputs:", { desiredSkills: Array.from(desiredSkillsSet), currentSkills: skillQueue, masteredJobs: Array.from(currentMasteredSet), targetJobs: selectedTargetJobNames });

        // 2. 必要職業パス計算
        const targetPrereqsSet = new Set();
        let recursionError = null;
        function findPrerequisitesRecursive(jobName, depth = 0) {
             const maxRecursionDepth = 50; if (depth > maxRecursionDepth) { throw new Error("最大再帰深度到達"); }
             if (!jobName || targetPrereqsSet.has(jobName) || !jobDataMap.has(jobName)) { return; } targetPrereqsSet.add(jobName);
             const jobInfo = jobDataMap.get(jobName); const rank = jobInfo['職階']; const prereqOrItem = jobInfo['前提/アイテム'] || '';
             if (rank === 0 || rank === '0' || prereqOrItem === 'なし' || prereqOrItem === '') { return; }
             const firstPrereq = prereqOrItem.split(',')[0].trim(); if (firstPrereq !== '' && !jobDataMap.has(firstPrereq) && firstPrereq !== '?' && firstPrereq !== '[[]]') { return; }
             const prerequisites = prereqOrItem.split(',').map(name => name.trim()).filter(name => name !== '');
             prerequisites.forEach(prereqName => { if (prereqName !== '?' && prereqName !== '[[]]') { if (!jobDataMap.has(prereqName)) { console.warn(`Prereq "${prereqName}" not found.`); } else { findPrerequisitesRecursive(prereqName, depth + 1); } } });
        }
        try { selectedTargetJobNames.forEach(targetName => findPrerequisitesRecursive(targetName)); }
        catch (e) { console.error("Prerequisite search error:", e); skillTimelineOutput.innerHTML = `<p style="color:red;">前提職計算エラー: ${e.message}</p>`; return; }

        const actualNeededJobsSet = new Set([...targetPrereqsSet].filter(jobName => !currentMasteredSet.has(jobName)));
        let jobPath = Array.from(actualNeededJobsSet);
        jobPath.sort((a, b) => { /* ... 職階→名前ソート ... */ });
         // 省略したソート
         jobPath.sort((a, b) => { const jobA = jobDataMap.get(a); const jobB = jobDataMap.get(b); if (!jobA || !jobB) return 0; const rankA = parseInt(jobA['職階'], 10); const rankB = parseInt(jobB['職階'], 10); if (isNaN(rankA) || isNaN(rankB)) return 0; if (rankA !== rankB) return rankA - rankB; return a.localeCompare(b, 'ja'); });

        console.log("Job path for simulation:", jobPath);

        // 3. スキル習得シミュレーション
        let simulationLog = [`<strong>シミュレーション開始</strong><br>初期スキル (${skillQueue.length}/10): [${skillQueue.join(', ') || 'なし'}]`];
        let warnings = [];
        let stepCounter = 0; // 処理ステップカウンター（無限ループ防止用）
        const MAX_STEPS = 10000; // 最大処理ステップ数

        jobPath.forEach(jobName => {
            if (stepCounter > MAX_STEPS) { console.error("Max simulation steps exceeded."); warnings.push("【エラー】シミュレーション処理が長すぎるため中断しました。"); return; }

            const jobInfo = jobDataMap.get(jobName);
            if (!jobInfo) return;

            const maxLv = parseInt(jobInfo['最大LV'], 10);
            if (isNaN(maxLv)) return; // 最大レベル不明ならスキップ

            const skillsToLearn = parsedSkillsByJob.get(jobName) || [];
            simulationLog.push(`--- 職業: ${jobName} (Lv1 ～ ${maxLv}) ---`);

            for (let lv = 1; lv <= maxLv; lv++) {
                stepCounter++;
                if (stepCounter > MAX_STEPS) break; // ステップ数超過チェック

                // このレベルで覚えるスキルを取得
                const learnedAtThisLevel = skillsToLearn.filter(skill => skill.level === lv);

                learnedAtThisLevel.forEach(skillInfo => {
                    const newSkill = skillInfo.name;
                    let overwrittenSkill = null;
                    let logMsg = `Lv${lv}: 「${newSkill}」習得`;

                    if (!skillQueue.includes(newSkill)) { // まだ覚えていないスキルなら
                        if (skillQueue.length >= 10) {
                            overwrittenSkill = skillQueue.shift(); // 先頭(最古)を削除
                            logMsg += ` → 「${overwrittenSkill}」を忘却`;
                        }
                        skillQueue.push(newSkill); // 末尾(最新)に追加

                        // 忘れたスキルが「保持したいスキル」だったかチェック
                        if (overwrittenSkill && desiredSkillsSet.has(overwrittenSkill)) {
                            const warningMsg = `【！】${jobName} Lv${lv}で「${newSkill}」習得時に、保持希望の「${overwrittenSkill}」が押し出されます！`;
                            warnings.push(warningMsg);
                            logMsg += ` <strong style="color:red;">[警告!]</strong>`;
                        }
                    } else {
                        // 既に覚えている場合：ログに表示するがキューは変更しない
                         logMsg += ` (習得済み)`;
                         // 必要なら、ここで最後尾に移動させるロジック（ブック使用相当）も検討可能
                         // skillQueue = skillQueue.filter(s => s !== newSkill);
                         // skillQueue.push(newSkill);
                    }
                    simulationLog.push(logMsg);
                }); // end forEach learnedAtThisLevel
                 if (stepCounter > MAX_STEPS) break;
            } // end for lv
             simulationLog.push(`--- ${jobName} マスター ---`);
        }); // end forEach jobPath

        if (stepCounter > MAX_STEPS) { simulationLog.push('<strong style="color:red;">処理ステップ上限を超えたため中断しました。</strong>'); }
        simulationLog.push(`<strong>シミュレーション完了</strong><br>最終スキル (${skillQueue.length}/10): [${skillQueue.join(', ') || 'なし'}]`);
        console.log("Simulation finished.", { finalSkills: skillQueue, warnings: warnings });

        // 4. 結果表示
        let html = '<h3>シミュレーション結果:</h3>';
        if (warnings.length > 0) {
            html += '<h4 style="color: red;">【！】保持したいスキルが忘れられる警告:</h4>';
            html += '<ul>';
            warnings.forEach(w => { html += `<li style="color: red;">${w}</li>`; });
            html += '</ul>';
            html += '<p><small>※警告が出た箇所でスキルチェンジブックの使用や、低レベル職でのスキル再習得をご検討ください。</small></p>';
        } else {
             html += '<p style="color: green;">✓ 保持したいスキルが忘れられる心配はありませんでした。</p>';
        }
        html += '<hr>';
        html += '<h4>最終スキル構成 (10枠・新しい順):</h4>';
        if (skillQueue.length > 0) {
            html += '<ol reversed style="margin-left: 20px;">'; // reversedで新しいものが上にくるように
            [...skillQueue].reverse().forEach((skill, index) => { // 新しい順に表示
                 html += `<li>${skill} ${desiredSkillsSet.has(skill) ? '<span style="color:green; font-weight:bold;" title="保持したいスキル">★</span>' : ''}</li>`;
            });
            html += '</ol>';
        } else {
            html += '<p>最終スキルはありません。</p>';
        }

        // 詳細ログ（必要ならコメント解除）
        // html += '<hr><h4>詳細ログ:</h4><ul style="font-size:0.8em; max-height: 150px; overflow-y:auto; list-style:none; padding-left:0;">';
        // simulationLog.forEach(log => { html += `<li>${log}</li>`; });
        // html += '</ul>';

        skillTimelineOutput.innerHTML = html;

    } // handleSimulation 関数の終わり


    // --- 初期化処理 ---
    masteredJobsSet = loadDataFromLocalStorage(masteredJobsStorageKey);
    currentSkillsSet = loadDataFromLocalStorage(currentSkillsStorageKey);
    generateUniqueSkillList(); // 全スキルリスト生成 -> sortedUniqueSkills

    // 全てのリストを初回描画
    renderSkillCheckboxList(desiredSkillListContainer, desiredSkillFilter, sortedUniqueSkills, null, null);
    renderSkillCheckboxList(currentSkillListContainer, currentSkillFilter, sortedUniqueSkills, currentSkillsSet, currentSkillsStorageKey);
    renderJobCheckboxListSP(spMasteredCheckboxContainer, spMasteredRankFilter, spMasteredNameFilter, 'mastered');
    renderJobCheckboxListSP(spTargetCheckboxContainer, spTargetRankFilter, spTargetNameFilter, 'target');

}); // DOMContentLoaded イベントリスナーの終わり