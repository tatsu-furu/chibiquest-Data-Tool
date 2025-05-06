// /static/js/calculator.js (完全版 - 職歴機能・localStorage対応・アイテム職考慮)

// グローバルスコープに allJobData と jobDataMap が定義されている前提

document.addEventListener('DOMContentLoaded', function() {

    // --- localStorage キー ---
    const masteredJobsStorageKey = 'chibiquestToolMasteredJobs';

    // --- HTML要素の取得 ---
    const masteredCheckboxContainer = document.getElementById('mastered-job-checkbox-list');
    const masteredRankFilter = document.getElementById('mastered-rank-filter-select');
    const masteredNameFilter = document.getElementById('mastered-job-filter-input');
    const targetCheckboxContainer = document.getElementById('target-job-checkbox-list');
    const targetRankFilter = document.getElementById('target-rank-filter-select');
    const targetNameFilter = document.getElementById('target-job-filter-input');
    const currentJobSelect = document.getElementById('current-job-select');
    const currentJobLevelInput = document.getElementById('current-job-level');
    const calculateButton = document.getElementById('calculate-button');
    const jobListOutput = document.getElementById('required-jobs-output');
    const totalGrindOutput = document.getElementById('total-grind-output');

    // --- データチェック ---
    if (typeof allJobData === 'undefined' || !Array.isArray(allJobData) || allJobData.length === 0 || typeof jobDataMap === 'undefined' || jobDataMap.size === 0) {
         console.error('Error: Job data not loaded correctly.');
         if(masteredCheckboxContainer) masteredCheckboxContainer.innerHTML = '<p style="color: red;">データ読み込みエラー</p>';
         if(targetCheckboxContainer) targetCheckboxContainer.innerHTML = '<p style="color: red;">データ読み込みエラー</p>';
         if(calculateButton) calculateButton.disabled = true;
        return;
    }
    console.log(`Job data loaded successfully. ${jobDataMap.size} jobs mapped.`);

    // --- localStorage からマスター済みデータを読み込み ---
    let masteredJobsSet = loadMasteredJobs();

    // --- チェックボックスリストをレンダリングする関数 ---
    function renderCheckboxList(container, rankFilter, nameFilter, listType) {
        if (!container || !rankFilter || !nameFilter) {
            console.error("Render target missing for list type:", listType);
            // コンテナが見つからない場合は、"読み込み中..." の表示をエラーメッセージに書き換える
            if(container) container.innerHTML = '<p style="color:red;">リスト表示エラー(要素不足)</p>';
            return;
        }

        const selectedRank = parseInt(rankFilter.value, 10);
        const nameFilterValue = nameFilter.value.toLowerCase().trim();
        container.innerHTML = ''; // クリア

        try { // フィルターやソートでエラーが起きる可能性を考慮
            const filteredAndSortedJobs = allJobData
                .filter(job => {
                    const rank = parseInt(job['職階'], 10);
                    const name = job['職業の名前'] ? job['職業の名前'].toLowerCase() : '';

                    if (isNaN(rank) || !name) { // ランクが数値でないか、名前がないデータは除外
                        return false;
                    }

                    let rankFilterPassed = true;
                    if (listType === 'target' && rank === 0) { // 目標リストは職階0を除外
                        rankFilterPassed = false;
                    }
                     // マスター済みリストは職階0も含む

                    const selectedRankFilterPassed = (selectedRank === 0 || rank === selectedRank);
                    const nameFilterPassed = name.includes(nameFilterValue);

                    return rankFilterPassed && selectedRankFilterPassed && nameFilterPassed;
                })
                .sort((a, b) => {
                    const nameA = a['職業の名前'] || '';
                    const nameB = b['職業の名前'] || '';

                    const isCheckedA = (listType === 'mastered') && masteredJobsSet.has(nameA);
                    const isCheckedB = (listType === 'mastered') && masteredJobsSet.has(nameB);

                    if (listType === 'mastered' && isCheckedA !== isCheckedB) {
                        return isCheckedA ? -1 : 1;
                    }

                    const rankA = parseInt(a['職階'], 10);
                    const rankB = parseInt(b['職階'], 10);
                    if (isNaN(rankA) || isNaN(rankB)) return 0;
                    if (rankA !== rankB) {
                        return rankA - rankB;
                    }
                    return nameA.localeCompare(nameB, 'ja');
                });

            // HTML生成
            if (filteredAndSortedJobs.length === 0) {
                 container.innerHTML = '<p>該当する職業がありません。</p>';
            } else {
                 filteredAndSortedJobs.forEach(job => {
                    const jobName = job['職業の名前'];
                    const jobRank = job['職階'];
                    const safeIdName = jobName.replace(/[^a-zA-Z0-9_-]/g, '-'); // ID用に簡易サニタイズ
                    const isChecked = (listType === 'mastered') && masteredJobsSet.has(jobName);

                    const div = document.createElement('div');
                    div.className = 'job-selection-item';
                    // 職階0の場合は '(0)' のように表示（'次'をつけない）
                    const rankDisplay = `${jobRank}${jobRank == 0 ? '' : '次'}`;
                    div.innerHTML = `
                        <input type="checkbox" id="${container.id}-${safeIdName}" data-job-name="${jobName}" ${isChecked ? 'checked' : ''}>
                        <label for="${container.id}-${safeIdName}">${jobName} (${rankDisplay})</label>
                    `;

                    if (listType === 'mastered') {
                        const checkbox = div.querySelector('input[type="checkbox"]');
                        checkbox.addEventListener('change', function() {
                            if (this.checked) {
                                masteredJobsSet.add(this.dataset.jobName);
                            } else {
                                masteredJobsSet.delete(this.dataset.jobName);
                            }
                            saveMasteredJobs(masteredJobsSet);
                            console.log('Mastered jobs saved:', Array.from(masteredJobsSet));
                            // チェック変更時にリストを再描画してソートを反映
                            renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered');
                        });
                    }
                    container.appendChild(div);
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
        } catch (e) {
            console.error("Error saving to localStorage:", e);
            // alert("マスター済み職業の保存に失敗しました。ブラウザのストレージ設定を確認してください。");
        }
    }
    function loadMasteredJobs() {
        try {
            const storedData = localStorage.getItem(masteredJobsStorageKey);
            return storedData ? new Set(JSON.parse(storedData)) : new Set();
        } catch (e) {
            console.error("Error loading from localStorage:", e);
            // alert("マスター済み職業の読み込みに失敗しました。");
            return new Set();
        }
    }

    // --- イベントリスナー設定 ---
    if (calculateButton) { calculateButton.addEventListener('click', handleCalculation); }
    else { console.error('Error: Calculate button not found.'); }

    // フィルター用イベントリスナー
    if (masteredRankFilter) { masteredRankFilter.addEventListener('change', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); }
    else { console.error('Error: Mastered rank filter select not found.'); }
    if (masteredNameFilter) { masteredNameFilter.addEventListener('input', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); }
    else { console.error('Error: Mastered name filter input not found.'); }

    if (targetRankFilter) { targetRankFilter.addEventListener('change', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); }
    else { console.error('Error: Target rank filter select not found.'); }
    if (targetNameFilter) { targetNameFilter.addEventListener('input', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); }
    else { console.error('Error: Target name filter input not found.'); }


    // --- 計算実行関数 (handleCalculation) ---
    function handleCalculation() {
        console.log('Calculation started...');

        // 1. 選択された目標職業を取得
        const selectedTargetJobNames = [];
        if (targetCheckboxContainer) {
             const checkboxes = targetCheckboxContainer.querySelectorAll('.job-selection-item input[type="checkbox"]:checked');
             checkboxes.forEach(cb => { if (cb.dataset.jobName) { selectedTargetJobNames.push(cb.dataset.jobName); } });
        } else { console.error('Error: Target checkbox container not found.'); return; }
        if (selectedTargetJobNames.length === 0) { alert('目標職業を選択してください。'); return; }

        // 1b. 現在マスター済みの職業を取得
        const currentMasteredSet = masteredJobsSet; // 更新された最新のSetを使う

        // 2. 現在の職業とレベルを取得
        let currentJobName = ''; let currentJobLevel = 0;
        if (currentJobSelect) { currentJobName = currentJobSelect.value; } else { console.error('Error: Current job select not found.'); return; }
        if (currentJobLevelInput) { currentJobLevel = parseInt(currentJobLevelInput.value, 10) || 0; } else { console.error('Error: Current job level input not found.'); return; }
        if (!currentJobName) { alert('現在の職業を選択してください。'); return; }
        if (currentJobLevel <= 0) { alert('現在の職業のレベルを正しく入力してください。'); return; }

        // 3. 目標に必要な前提職リスト(Set)を作成
        const targetPrereqsSet = new Set();
        let recursionDepth = 0; const maxRecursionDepth = 50; // 無限ループ防止

        function findPrerequisitesRecursive(jobName) {
            recursionDepth++;
             if (recursionDepth > maxRecursionDepth) { throw new Error("Max recursion depth exceeded, check for circular prerequisites."); }
            if (!jobName || targetPrereqsSet.has(jobName) || !jobDataMap.has(jobName)) { recursionDepth--; return; }

            targetPrereqsSet.add(jobName);
            const jobInfo = jobDataMap.get(jobName);
            const rank = jobInfo['職階'];
            const prereqOrItem = jobInfo['前提/アイテム'] || '';
            if (rank === 0 || rank === '0' || prereqOrItem === 'なし' || prereqOrItem === '') { recursionDepth--; return; }

            const prerequisites = prereqOrItem.split(',').map(name => name.trim()).filter(name => name !== '');
            prerequisites.forEach(prereqName => {
                if (prereqName !== '?' && prereqName !== '[[]]') {
                     if (!jobDataMap.has(prereqName)) { console.warn(`Prerequisite job "${prereqName}" (for "${jobName}") not found in data list. Skipping.`); }
                     else { findPrerequisitesRecursive(prereqName); }
                }
            });
            recursionDepth--;
        }

        try {
            selectedTargetJobNames.forEach(targetName => {
                 recursionDepth = 0; // ターゲットごとにリセット
                 findPrerequisitesRecursive(targetName);
             });
        } catch (e) {
            console.error("Error during prerequisite search:", e);
            alert(`前提職の計算中にエラーが発生しました: ${e.message}`);
            return;
        }

        // 4a. 「現在の職業」もマスター済みと仮定したセットを作成
        const tempMasteredSet = new Set([...currentMasteredSet, currentJobName]);

        // 4b. 目標前提職から「仮のマスター済み」を除いたリストを作成
        const pseudoNeededJobsSet = new Set(
            [...targetPrereqsSet].filter(jobName => !tempMasteredSet.has(jobName))
        );

        // 4c. 4bのリストに必要なレベル合計(A)を計算
        let pseudoNeededMasterLv = 0;
        pseudoNeededJobsSet.forEach(jobName => {
             const jobInfo = jobDataMap.get(jobName);
             if (jobInfo) {
                const maxLvRaw = jobInfo['最大LV'];
                const maxLv = parseFloat(maxLvRaw);
                if (!isNaN(maxLv)) { pseudoNeededMasterLv += maxLv; }
                else { console.warn(`Max Level for job "${jobName}" is not a number (${maxLvRaw}). Excluding from total (A).`); }
             }
        });

        // 4d. 「現在の職業」をマスターするまでの残りレベル(B)を計算
        let remainingForCurrent = 0;
        if (currentJobName && jobDataMap.has(currentJobName)) {
             if (!currentMasteredSet.has(currentJobName)) { // ★ 既にマスター済みなら残りLvは0
                 const currentJobInfo = jobDataMap.get(currentJobName);
                 const currentJobMaxLvRaw = currentJobInfo['最大LV'];
                 const currentJobMaxLv = parseFloat(currentJobMaxLvRaw);
                 if (!isNaN(currentJobMaxLv)) {
                    // 現在レベルが最大レベルを超えていたら残り0
                    remainingForCurrent = Math.max(0, currentJobMaxLv - currentJobLevel);
                 } else {
                     console.warn(`Max Level for current job "${currentJobName}" is not a number (${currentJobMaxLvRaw}).`);
                 }
             }
        }

        // 4e. 最終的な「これから必要な総レベル数」を計算 (A + B)
        const totalGrindNeeded = pseudoNeededMasterLv + remainingForCurrent;

        // 4f. 結果表示用に、実際に「まだマスターしていない」前提職リストも用意
        const actualNeededJobsSet = new Set(
            [...targetPrereqsSet].filter(jobName => !currentMasteredSet.has(jobName))
        );

        // 5. 結果表示
        if(jobListOutput) jobListOutput.innerHTML = '';
        if(totalGrindOutput) totalGrindOutput.textContent = '0';

        if (jobListOutput) {
            if (actualNeededJobsSet.size === 0 && selectedTargetJobNames.length > 0) {
                 const li = document.createElement('li');
                 li.textContent = '目標達成に必要な職業は全てマスター済みです！';
                 jobListOutput.appendChild(li);
            } else {
                Array.from(actualNeededJobsSet).sort().forEach(jobName => { // 結果リストもソート
                    const li = document.createElement('li');
                    li.textContent = jobName;
                    jobListOutput.appendChild(li);
                });
            }
        }
        if (totalGrindOutput) totalGrindOutput.textContent = totalGrindNeeded;

        console.log('Calculation finished and results displayed.');
    } // handleCalculation 関数の終わり

    // --- 初期表示 ---
    renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered');
    renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target');

}); // DOMContentLoaded イベントリスナーの終わり