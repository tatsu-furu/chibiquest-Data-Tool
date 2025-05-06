// /static/js/calculator.js (最終版 - 全機能・修正含む)

// グローバルスコープに allJobData と jobDataMap が定義されている前提 (tool.htmlで定義)

document.addEventListener('DOMContentLoaded', function() {

    // --- localStorage キー ---
    const masteredJobsStorageKey = 'chibiquestToolMasteredJobs';

    // --- HTML要素の取得 ---
    const masteredCheckboxContainer = document.getElementById('mastered-job-checkbox-list');
    const masteredRankFilter = document.getElementById('mastered-rank-filter-select');
    const masteredNameFilter = document.getElementById('mastered-job-filter-input');
    const masteredCheckAllButton = document.getElementById('mastered-check-all');
    const masteredUncheckAllButton = document.getElementById('mastered-uncheck-all');
    const targetCheckboxContainer = document.getElementById('target-job-checkbox-list');
    const targetRankFilter = document.getElementById('target-rank-filter-select');
    const targetNameFilter = document.getElementById('target-job-filter-input');
    const currentJobSelect = document.getElementById('current-job-select');
    const currentJobLevelInput = document.getElementById('current-job-level');
    const calculateButton = document.getElementById('calculate-button');
    const jobListOutput = document.getElementById('required-jobs-output');
    const totalGrindOutput = document.getElementById('total-grind-output'); // 最終的な必要レベル合計表示用

    // --- データチェック ---
    if (typeof allJobData === 'undefined' || !Array.isArray(allJobData) || allJobData.length === 0 || typeof jobDataMap === 'undefined' || jobDataMap.size === 0) {
        console.error('Error: Job data (allJobData or jobDataMap) not loaded correctly from HTML.');
        if(masteredCheckboxContainer) masteredCheckboxContainer.innerHTML = '<p style="color: red;">データ読み込みエラー</p>';
        if(targetCheckboxContainer) targetCheckboxContainer.innerHTML = '<p style="color: red;">データ読み込みエラー</p>';
        if(calculateButton) calculateButton.disabled = true;
        if(masteredCheckAllButton) masteredCheckAllButton.disabled = true;
        if(masteredUncheckAllButton) masteredUncheckAllButton.disabled = true;
        if(masteredRankFilter) masteredRankFilter.disabled = true;
        if(masteredNameFilter) masteredNameFilter.disabled = true;
        if(targetRankFilter) targetRankFilter.disabled = true;
        if(targetNameFilter) targetNameFilter.disabled = true;
        return;
    }
    console.log(`Job data loaded successfully. ${jobDataMap.size} jobs mapped.`);

    // --- localStorage からマスター済みデータを読み込み ---
    let masteredJobsSet = loadMasteredJobs();

    // --- チェックボックスリストをレンダリングする関数 ---
    function renderCheckboxList(container, rankFilter, nameFilter, listType) {
        if (!container || !rankFilter || !nameFilter) {
            console.error("Render target missing for list type:", listType);
            if(container) container.innerHTML = '<p style="color:red;">リスト表示エラー(要素不足)</p>';
            return;
        }

        const selectedRankRaw = rankFilter.value; // 選択されたランク (文字列 "" or "0", "1", ...)
        const nameFilterValue = nameFilter.value.toLowerCase().trim();
        container.innerHTML = ''; // リストをクリア

        try {
            const filteredAndSortedJobs = allJobData
                .filter(job => { // フィルタリング
                    const rank = parseInt(job['職階'], 10);
                    const name = job['職業の名前'] ? job['職業の名前'].toLowerCase() : '';
                    if (isNaN(rank) || !name || !job['職業の名前']) return false;

                    let rankFilterPassed = true;
                    if (listType === 'target' && rank === 0) rankFilterPassed = false; // 目標リストは職階0除外

                    // 選択された職階での絞り込み ("" は全て、"0" は 0次職のみ)
                    const selectedRankFilterPassed = (selectedRankRaw === "" || rank === parseInt(selectedRankRaw, 10));
                    const nameFilterPassed = name.includes(nameFilterValue);

                    return rankFilterPassed && selectedRankFilterPassed && nameFilterPassed;
                })
                .sort((a, b) => { // ソート
                    const nameA = a['職業の名前'] || '';
                    const nameB = b['職業の名前'] || '';
                    const isCheckedA = (listType === 'mastered') && masteredJobsSet.has(nameA);
                    const isCheckedB = (listType === 'mastered') && masteredJobsSet.has(nameB);
                    if (listType === 'mastered' && isCheckedA !== isCheckedB) return isCheckedA ? -1 : 1; // Masteredはチェック優先
                    const rankA = parseInt(a['職階'], 10);
                    const rankB = parseInt(b['職階'], 10);
                    if (isNaN(rankA) || isNaN(rankB)) return 0;
                    if (rankA !== rankB) return rankA - rankB; // 職階順
                    return nameA.localeCompare(nameB, 'ja'); // 名前順
                });

            // HTML生成
            if (filteredAndSortedJobs.length === 0) {
                 container.innerHTML = '<p>該当する職業がありません。</p>';
            } else {
                 filteredAndSortedJobs.forEach(job => {
                    const jobName = job['職業の名前'];
                    const jobRank = job['職階'];
                    const safeIdName = jobName.replace(/[^a-zA-Z0-9_-]/g, '-');
                    const isChecked = (listType === 'mastered') && masteredJobsSet.has(jobName);
                    const div = document.createElement('div');
                    div.className = 'job-selection-item'; // CSS用クラス
                    const rankDisplay = `${jobRank}${jobRank == 0 ? '' : '次'}`; // 0次には「次」を付けない
                    div.innerHTML = `
                        <input type="checkbox" id="${container.id}-${safeIdName}" data-job-name="${jobName}" ${isChecked ? 'checked' : ''}>
                        <label for="${container.id}-${safeIdName}">${jobName} (${rankDisplay})</label>
                    `;
                    // マスター済みリストのチェックボックスにイベントリスナー追加
                    if (listType === 'mastered') {
                        const checkbox = div.querySelector('input[type="checkbox"]');
                        checkbox.addEventListener('change', function() {
                            if (this.checked) masteredJobsSet.add(this.dataset.jobName);
                            else masteredJobsSet.delete(this.dataset.jobName);
                            saveMasteredJobs(masteredJobsSet);
                            console.log('Mastered jobs saved:', Array.from(masteredJobsSet));
                            renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered'); // 保存後に再描画
                        });
                    }
                    container.appendChild(div); // コンテナに追加
                 });
            }
        } catch (e) {
             console.error("Error during rendering checkbox list:", e);
             container.innerHTML = '<p style="color:red;">リスト表示中にエラーが発生しました。</p>';
        }
    }

    // --- localStorage 関連関数 ---
    function saveMasteredJobs(set) {
        try {
            localStorage.setItem(masteredJobsStorageKey, JSON.stringify(Array.from(set)));
        } catch (e) { console.error("Error saving to localStorage:", e); }
    }
    function loadMasteredJobs() {
        try {
            const storedData = localStorage.getItem(masteredJobsStorageKey);
            return storedData ? new Set(JSON.parse(storedData)) : new Set();
        } catch (e) { console.error("Error loading from localStorage:", e); localStorage.removeItem(masteredJobsStorageKey); return new Set(); }
    }

    // --- 全選択/全解除 関数 ---
    function setCheckAllMasteredVisible(isChecked) {
        if (!masteredCheckboxContainer) return;
        const visibleItems = masteredCheckboxContainer.querySelectorAll('.job-selection-item');
        visibleItems.forEach(item => {
            if (item.style.display !== 'none') {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const jobName = checkbox.dataset.jobName;
                if (checkbox && jobName) {
                    checkbox.checked = isChecked; // 状態設定
                    if (isChecked) masteredJobsSet.add(jobName); else masteredJobsSet.delete(jobName); // Set更新
                }
            }
        });
        saveMasteredJobs(masteredJobsSet); // 保存
        renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered'); // 再描画
        console.log(`Set all visible mastered jobs to ${isChecked ? 'checked' : 'unchecked'}`);
    }

    // --- イベントリスナー設定 ---
    if (calculateButton) calculateButton.addEventListener('click', handleCalculation); else console.error('Calculate button not found.');
    if (masteredRankFilter) masteredRankFilter.addEventListener('change', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); else console.error('Mastered rank filter not found.');
    if (masteredNameFilter) masteredNameFilter.addEventListener('input', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); else console.error('Mastered name filter not found.');
    if (targetRankFilter) targetRankFilter.addEventListener('change', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); else console.error('Target rank filter not found.');
    if (targetNameFilter) targetNameFilter.addEventListener('input', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); else console.error('Target name filter not found.');
    if (masteredCheckAllButton) masteredCheckAllButton.addEventListener('click', () => setCheckAllMasteredVisible(true)); else console.error("Button #mastered-check-all not found.");
    if (masteredUncheckAllButton) masteredUncheckAllButton.addEventListener('click', () => setCheckAllMasteredVisible(false)); else console.error("Button #mastered-uncheck-all not found.");


    // --- 計算実行関数 (handleCalculation) ---
    function handleCalculation() {
        console.log('Calculation started...');
        // 1. 目標職業を取得
        const selectedTargetJobNames = [];
        if (targetCheckboxContainer) { const checkboxes = targetCheckboxContainer.querySelectorAll('.job-selection-item input[type="checkbox"]:checked'); checkboxes.forEach(cb => { if (cb.dataset.jobName) { selectedTargetJobNames.push(cb.dataset.jobName); } }); } else { console.error('Target checkbox container not found.'); return; }
        if (selectedTargetJobNames.length === 0) { alert('目標職業を選択してください。'); return; }

        // 1b. マスター済み職業を取得
        const currentMasteredSet = masteredJobsSet;

        // 2. 現在の職業とレベルを取得
        let currentJobName = ''; let currentJobLevel = 0;
        if (currentJobSelect) { currentJobName = currentJobSelect.value; } else { console.error('Current job select not found.'); return; }
        if (currentJobLevelInput) { currentJobLevel = parseInt(currentJobLevelInput.value, 10) || 0; } else { console.error('Current job level input not found.'); return; }
        if (!currentJobName) { alert('現在の職業を選択してください。'); return; }
        if (currentJobLevel <= 0) { alert('現在の職業のレベルを正しく入力してください。'); return; }

        // 3. 目標に必要な前提職リスト(Set)を作成
        const targetPrereqsSet = new Set();
        let recursionDepth = 0; const maxRecursionDepth = 50;
        function findPrerequisitesRecursive(jobName) {
            recursionDepth++;
            if (recursionDepth > maxRecursionDepth) { throw new Error("最大再帰深度到達。循環参照の可能性"); }
            if (!jobName || targetPrereqsSet.has(jobName) || !jobDataMap.has(jobName)) { recursionDepth--; return; }
            targetPrereqsSet.add(jobName);
            const jobInfo = jobDataMap.get(jobName);
            const rank = jobInfo['職階'];
            const prereqOrItem = jobInfo['前提/アイテム'] || '';
            if (rank === 0 || rank === '0' || prereqOrItem === 'なし' || prereqOrItem === '') { recursionDepth--; return; }
            const firstPrereq = prereqOrItem.split(',')[0].trim();
            if (firstPrereq !== '' && !jobDataMap.has(firstPrereq) && firstPrereq !== '?' && firstPrereq !== '[[]]') { recursionDepth--; return; }
            const prerequisites = prereqOrItem.split(',').map(name => name.trim()).filter(name => name !== '');
            prerequisites.forEach(prereqName => {
                if (prereqName !== '?' && prereqName !== '[[]]') {
                    if (!jobDataMap.has(prereqName)) { console.warn(`Prereq "${prereqName}" not found.`); } else { findPrerequisitesRecursive(prereqName); }
                }
            });
            recursionDepth--;
        }
        try { selectedTargetJobNames.forEach(targetName => { recursionDepth = 0; findPrerequisitesRecursive(targetName); }); }
        catch (e) { console.error("Error during prerequisite search:", e); alert(`前提職計算エラー: ${e.message}`); return; }

        // 4a. 仮のマスター済みセット作成
        const tempMasteredSet = new Set([...currentMasteredSet, currentJobName]);
        // 4b. 仮のマスター済みを除いた前提職リスト
        const pseudoNeededJobsSet = new Set([...targetPrereqsSet].filter(jobName => !tempMasteredSet.has(jobName)));
        // 4c. 4bのレベル合計(A)
        let pseudoNeededMasterLv = 0;
        pseudoNeededJobsSet.forEach(jobName => { const jobInfo = jobDataMap.get(jobName); if (jobInfo) { const maxLvRaw = jobInfo['最大LV']; const maxLv = parseFloat(maxLvRaw); if (!isNaN(maxLv)) { pseudoNeededMasterLv += maxLv; } else { console.warn(`Max Lv NaN for ${jobName}`); } } });
        // 4d. 現在職の残りレベル(B)
        let remainingForCurrent = 0;
        if (currentJobName && jobDataMap.has(currentJobName)) { if (!currentMasteredSet.has(currentJobName)) { const info = jobDataMap.get(currentJobName); const maxLv = parseFloat(info['最大LV']); if (!isNaN(maxLv)) { remainingForCurrent = Math.max(0, maxLv - currentJobLevel); } else { console.warn(`Max Lv NaN for current job ${currentJobName}`); } } }
        // 4e. 必要総レベル数 (A + B)
        const totalGrindNeeded = pseudoNeededMasterLv + remainingForCurrent;
        // 4f. 実際に必要な職業リスト(Set)
        const actualNeededJobsSet = new Set([...targetPrereqsSet].filter(jobName => !currentMasteredSet.has(jobName)));

        // 5. 結果表示
        if(jobListOutput) jobListOutput.innerHTML = '';
        if(totalGrindOutput) totalGrindOutput.textContent = '0';

        if (jobListOutput) {
            // 5a. 結果リスト用配列をソート
            let sortedNeededJobsArray = Array.from(actualNeededJobsSet);
            sortedNeededJobsArray.sort((a, b) => {
                const jobA = jobDataMap.get(a); const jobB = jobDataMap.get(b); if (!jobA || !jobB) return 0;
                const rankA = parseInt(jobA['職階'], 10); const rankB = parseInt(jobB['職階'], 10);
                if (isNaN(rankA) || isNaN(rankB)) return 0; if (rankA !== rankB) return rankA - rankB;
                return a.localeCompare(b, 'ja');
            });

            // 5b. リスト項目(li)を生成（アイテム職のアイテム名表示含む）
            if (sortedNeededJobsArray.length === 0 && selectedTargetJobNames.length > 0) {
                 const li = document.createElement('li'); li.textContent = '目標達成に必要な職業は全てマスター済みです！'; jobListOutput.appendChild(li);
            } else {
                sortedNeededJobsArray.forEach(jobName => {
                    const li = document.createElement('li'); const jobInfo = jobDataMap.get(jobName);
                    if (jobInfo) {
                        const rank = parseInt(jobInfo['職階'], 10);
                        li.classList.add(`rank-${rank}`); // CSS用クラス追加
                        if (!isNaN(rank) && rank === 0) { const item = jobInfo['前提/アイテム'] || '不明'; li.textContent = `${jobName} (要: ${item})`; }
                        else { li.textContent = jobName; }
                    } else { li.textContent = `${jobName} (?)`; }
                    jobListOutput.appendChild(li);
                });
            }
        }
        // 5c. 合計レベル表示
        if (totalGrindOutput) totalGrindOutput.textContent = totalGrindNeeded;
        console.log('Calculation finished.');
    } // handleCalculation 関数の終わり

    // --- 初期表示 ---
    // ページ読み込み時に両方のリストを初回描画
    renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered');
    renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target');

}); // DOMContentLoaded イベントリスナーの終わり