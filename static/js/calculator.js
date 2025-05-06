// /static/js/calculator.js (マスター済みリストにアイテム職を含む修正版)

// グローバルスコープに allJobData と jobDataMap が定義されている前提

document.addEventListener('DOMContentLoaded', function() {

    // --- localStorage キー ---
    const masteredJobsStorageKey = 'chibiquestToolMasteredJobs';

    // --- HTML要素の取得 ---
    // (変更なし)
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

    // --- データチェック (変更なし) ---
    if (typeof allJobData === 'undefined' || !Array.isArray(allJobData) || allJobData.length === 0 || typeof jobDataMap === 'undefined' || jobDataMap.size === 0) { /*...*/ return; }
    console.log(`Job data loaded successfully. ${jobDataMap.size} jobs mapped.`);

    // --- localStorage からマスター済みデータを読み込み (変更なし) ---
    let masteredJobsSet = loadMasteredJobs();

    // --- ★ チェックボックスリストをレンダリングする関数 (フィルタ条件を修正) ★ ---
    function renderCheckboxList(container, rankFilter, nameFilter, listType) { // listType引数は維持
        if (!container || !rankFilter || !nameFilter) { console.error("Render target missing for list type:", listType); return; }

        const selectedRank = parseInt(rankFilter.value, 10);
        const nameFilterValue = nameFilter.value.toLowerCase().trim();
        container.innerHTML = ''; // クリア

        const filteredAndSortedJobs = allJobData
            .filter(job => { // --- ▼▼▼ フィルタリング条件を修正 ▼▼▼ ---
                const rank = parseInt(job['職階'], 10);
                const name = job['職業の名前'] ? job['職業の名前'].toLowerCase() : '';

                // 職階フィルタリング: rankが数値かどうかをまず確認
                if (isNaN(rank)) {
                    return false; // 職階が数値でないデータは除外
                }

                let rankFilterPassed = true;
                // 目標リストの場合のみ、職階0を除外する
                if (listType === 'target' && rank === 0) {
                    rankFilterPassed = false;
                }
                // マスター済みリストの場合は職階0もOK

                // 選択された職階での絞り込み (0は「全て表示」)
                const selectedRankFilterPassed = (selectedRank === 0 || rank === selectedRank);

                // 名前での絞り込み
                const nameFilterPassed = name.includes(nameFilterValue);

                // 全ての条件を満たすか？
                return rankFilterPassed && selectedRankFilterPassed && nameFilterPassed;
                 // --- ▲▲▲ フィルタリング条件を修正 ▲▲▲ ---
            })
            .sort((a, b) => { // --- ▼▼▼ ソートロジック修正 (masteredJobsSet参照を修正) ▼▼▼ ---
                const nameA = a['職業の名前'] || '';
                const nameB = b['職業の名前'] || '';

                // listTypeに応じてチェック状態を取得 (masteredリストのみ)
                const isCheckedA = (listType === 'mastered') && masteredJobsSet.has(nameA); // ★ここをmasteredJobsSetから直接見る
                const isCheckedB = (listType === 'mastered') && masteredJobsSet.has(nameB); // ★ここをmasteredJobsSetから直接見る

                // 1. チェック状態を比較 (チェックありが先) - Masteredリストのみ
                if (listType === 'mastered' && isCheckedA !== isCheckedB) {
                    return isCheckedA ? -1 : 1;
                }

                // 2. 職階で比較 (昇順)
                const rankA = parseInt(a['職階'], 10);
                const rankB = parseInt(b['職階'], 10);
                 // isNaNチェックを追加してエラーを防ぐ
                if (isNaN(rankA) || isNaN(rankB)) return 0; // 数値でない場合は順序維持
                if (rankA !== rankB) {
                    return rankA - rankB;
                }

                // 3. 職階も同じなら、職業名で比較 (日本語)
                return nameA.localeCompare(nameB, 'ja');
                 // --- ▲▲▲ ソートロジック修正 ▲▲▲ ---
            });

        // HTMLを生成して挿入 (変更なし)
        if (filteredAndSortedJobs.length === 0) { container.innerHTML = '<p>該当する職業がありません。</p>'; }
        else { filteredAndSortedJobs.forEach(job => { /* ... (リスト生成部分は変更なし) ... */ }); }
         // ★ 省略したリスト生成部分 (変更なし) ★
          else { filteredAndSortedJobs.forEach(job => { const jobName = job['職業の名前']; const jobRank = job['職階']; const safeIdName = jobName.replace(/[^a-zA-Z0-9_-]/g, '-'); const isChecked = (listType === 'mastered') && masteredJobsSet.has(jobName); const div = document.createElement('div'); div.className = 'job-selection-item'; div.innerHTML = ` <input type="checkbox" id="${container.id}-${safeIdName}" data-job-name="${jobName}" ${isChecked ? 'checked' : ''}> <label for="${container.id}-${safeIdName}">${jobName} (${jobRank}${jobRank==0 ? '':'次'})</label> `; if (listType === 'mastered') { const checkbox = div.querySelector('input[type="checkbox"]'); checkbox.addEventListener('change', function() { if (this.checked) { masteredJobsSet.add(this.dataset.jobName); } else { masteredJobsSet.delete(this.dataset.jobName); } saveMasteredJobs(masteredJobsSet); console.log('Mastered jobs saved:', Array.from(masteredJobsSet)); renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered'); }); } container.appendChild(div); }); }
    }


    // --- localStorage 関連関数 (変更なし) ---
    function saveMasteredJobs(set) { /* ... 省略 ... */ }
    function loadMasteredJobs() { /* ... 省略 ... */ }
     // ★ 省略した saveMasteredJobs, loadMasteredJobs (前回と同じ) ★
     function saveMasteredJobs(set) { try { localStorage.setItem(masteredJobsStorageKey, JSON.stringify(Array.from(set))); } catch (e) { console.error("Error saving to localStorage:", e); alert("マスター済み職業の保存に失敗しました。"); } }
     function loadMasteredJobs() { try { const storedData = localStorage.getItem(masteredJobsStorageKey); return storedData ? new Set(JSON.parse(storedData)) : new Set(); } catch (e) { console.error("Error loading from localStorage:", e); alert("マスター済み職業の読み込みに失敗しました。"); return new Set(); } }


    // --- イベントリスナー設定 (変更なし) ---
    if (calculateButton) { calculateButton.addEventListener('click', handleCalculation); } else { console.error('Error: Calculate button not found.'); }
    if (masteredRankFilter) { masteredRankFilter.addEventListener('change', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); } else { console.error('Error: Mastered rank filter select not found.'); }
    if (masteredNameFilter) { masteredNameFilter.addEventListener('input', () => renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered')); } else { console.error('Error: Mastered name filter input not found.'); }
    if (targetRankFilter) { targetRankFilter.addEventListener('change', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); } else { console.error('Error: Target rank filter select not found.'); }
    if (targetNameFilter) { targetNameFilter.addEventListener('input', () => renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target')); } else { console.error('Error: Target name filter input not found.'); }


    // --- 計算実行関数 (handleCalculation) (変更なし) ---
    function handleCalculation() { /* ... 省略 (内容は前回と同じ) ... */ }
     // ★ 省略した handleCalculation (変更なし) ★
     function handleCalculation() { console.log('Calculation started...'); const selectedTargetJobNames = []; if (targetCheckboxContainer) { const checkboxes = targetCheckboxContainer.querySelectorAll('.job-selection-item input[type="checkbox"]:checked'); checkboxes.forEach(cb => { if (cb.dataset.jobName) { selectedTargetJobNames.push(cb.dataset.jobName); } }); } else { console.error('Error: Target checkbox container not found.'); return; } if (selectedTargetJobNames.length === 0) { alert('目標職業を選択してください。'); return; } console.log('Selected target jobs:', selectedTargetJobNames); const currentMasteredSet = masteredJobsSet; console.log('Currently mastered jobs:', Array.from(currentMasteredSet)); let currentJobName = ''; let currentJobLevel = 0; if (currentJobSelect) { currentJobName = currentJobSelect.value; } else { console.error('Error: Current job select not found.'); return; } if (currentJobLevelInput) { currentJobLevel = parseInt(currentJobLevelInput.value, 10) || 0; } else { console.error('Error: Current job level input not found.'); return; } if (!currentJobName) { alert('現在の職業を選択してください。'); return; } if (currentJobLevel <= 0) { alert('現在の職業のレベルを正しく入力してください。'); return; } console.log(`Current job: ${currentJobName}, Level: ${currentJobLevel}`); const targetPrereqsSet = new Set(); function findPrerequisitesRecursive(jobName) { if (!jobName || targetPrereqsSet.has(jobName) || !jobDataMap.has(jobName)) { return; } targetPrereqsSet.add(jobName); const jobInfo = jobDataMap.get(jobName); const rank = jobInfo['職階']; const prereqOrItem = jobInfo['前提/アイテム'] || ''; if (rank === 0 || rank === '0' || prereqOrItem === 'なし' || prereqOrItem === '') { return; } const prerequisites = prereqOrItem.split(',').map(name => name.trim()).filter(name => name !== ''); prerequisites.forEach(prereqName => { if (prereqName !== '?' && prereqName !== '[[]]') { if (!jobDataMap.has(prereqName)) { console.warn(`Prerequisite job "${prereqName}" (for "${jobName}") not found in data list. Skipping.`); } else { findPrerequisitesRecursive(prereqName); } } }); } try { selectedTargetJobNames.forEach(targetName => { findPrerequisitesRecursive(targetName); }); } catch (e) { console.error("Error during prerequisite search:", e); alert("前提職の計算中にエラーが発生しました。"); return; } const tempMasteredSet = new Set([...currentMasteredSet, currentJobName]); const pseudoNeededJobsSet = new Set([...targetPrereqsSet].filter(jobName => !tempMasteredSet.has(jobName))); let pseudoNeededMasterLv = 0; pseudoNeededJobsSet.forEach(jobName => { const jobInfo = jobDataMap.get(jobName); if (jobInfo) { const maxLvRaw = jobInfo['最大LV']; const maxLv = parseFloat(maxLvRaw); if (!isNaN(maxLv)) { pseudoNeededMasterLv += maxLv; } else { console.warn(`Max Level for job "${jobName}" is not a number (${maxLvRaw}). Excluding from total (A).`); } } }); console.log('Levels needed for other prerequisites (A):', pseudoNeededMasterLv); let remainingForCurrent = 0; if (currentJobName && jobDataMap.has(currentJobName)) { if (!currentMasteredSet.has(currentJobName)) { const currentJobInfo = jobDataMap.get(currentJobName); const currentJobMaxLvRaw = currentJobInfo['最大LV']; const currentJobMaxLv = parseFloat(currentJobMaxLvRaw); if (!isNaN(currentJobMaxLv) && currentJobLevel < currentJobMaxLv) { remainingForCurrent = currentJobMaxLv - currentJobLevel; } } } console.log('Remaining levels for current job (B):', remainingForCurrent); const totalGrindNeeded = pseudoNeededMasterLv + remainingForCurrent; console.log('Total grind needed (A+B):', totalGrindNeeded); const actualNeededJobsSet = new Set([...targetPrereqsSet].filter(jobName => !currentMasteredSet.has(jobName))); console.log('Actual needed jobs (for display):', Array.from(actualNeededJobsSet)); if(jobListOutput) jobListOutput.innerHTML = ''; if(totalGrindOutput) totalGrindOutput.textContent = '0'; if (jobListOutput) { if (actualNeededJobsSet.size === 0 && selectedTargetJobNames.length > 0) { const li = document.createElement('li'); li.textContent = '目標達成に必要な職業は全てマスター済みです！'; jobListOutput.appendChild(li); } else { Array.from(actualNeededJobsSet).sort().forEach(jobName => { const li = document.createElement('li'); li.textContent = jobName; jobListOutput.appendChild(li); }); } } if (totalGrindOutput) totalGrindOutput.textContent = totalGrindNeeded; console.log('Calculation finished and results displayed.'); } // handleCalculation 関数の終わり


    // --- 初期表示 (変更なし) ---
    renderCheckboxList(masteredCheckboxContainer, masteredRankFilter, masteredNameFilter, 'mastered');
    renderCheckboxList(targetCheckboxContainer, targetRankFilter, targetNameFilter, 'target');

}); // DOMContentLoaded イベントリスナーの終わり