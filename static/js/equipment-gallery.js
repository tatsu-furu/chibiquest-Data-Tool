// static/js/equipment-gallery.js

console.log('[EquipmentGallery] Script execution started.');

document.addEventListener('DOMContentLoaded', function() {
    console.log('[EquipmentGallery] DOMContentLoaded event fired.');

    // UI要素の取得
    const listContainer = document.getElementById('equipment-list-container');
    const loadingMessage = document.getElementById('equipment-loading-message');
    const searchNameInput = document.getElementById('equip-search-name');
    const filterPartSelect = document.getElementById('equip-filter-part');
    const filterColorSelect = document.getElementById('equip-filter-color');
    const sortSelect = document.getElementById('equip-sort');
    const filterResetButton = document.getElementById('equip-filter-reset');
    const toggleDetailsDisplaySwitch = document.getElementById('toggle-stats-display-list');

    // UI要素取得確認ログ (適宜確認が必要であればコメント解除)
    /*
    console.log('[EquipmentGallery] listContainer:', listContainer ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] loadingMessage:', loadingMessage ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] searchNameInput:', searchNameInput ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] filterPartSelect:', filterPartSelect ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] filterColorSelect:', filterColorSelect ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] sortSelect:', sortSelect ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] filterResetButton:', filterResetButton ? 'Found' : 'NOT FOUND');
    console.log('[EquipmentGallery] toggleDetailsDisplaySwitch:', toggleDetailsDisplaySwitch ? 'Found' : 'NOT FOUND');
    */

    let allEquipmentData = [];
    const hugoDataKeys = ['head', 'body', 'legs', 'right_hand', 'left_hand'];
    const localStorageKeyShowDetailsList = 'chibiquestEquipmentShowDetailsList';

    // localStorageから詳細表示設定を読み込む (デフォルトはOFF: false)
    function loadShowDetailsListSetting() {
        const storedSetting = localStorage.getItem(localStorageKeyShowDetailsList);
        return storedSetting === 'true';
    }

    let showDetailsInList = loadShowDetailsListSetting();

    if (toggleDetailsDisplaySwitch) {
        toggleDetailsDisplaySwitch.checked = showDetailsInList;
    }

    // データの読み込みと初期表示
    function loadAndDisplayEquipment() {
        console.log('[EquipmentGallery] loadAndDisplayEquipment function called.');
        if (!listContainer || !loadingMessage) {
            console.error('[EquipmentGallery] CRITICAL: List container or loading message element not found.');
            if (loadingMessage) loadingMessage.textContent = '表示エリアの準備エラー。';
            return;
        }
        loadingMessage.textContent = '装備データを処理中...';
        loadingMessage.style.display = 'block';
        listContainer.innerHTML = '';

        if (typeof window.allEquipmentDataFromHugo === 'object' && window.allEquipmentDataFromHugo !== null) {
            console.log('[EquipmentGallery] Found window.allEquipmentDataFromHugo:', JSON.parse(JSON.stringify(window.allEquipmentDataFromHugo)));
            allEquipmentData = [];
            hugoDataKeys.forEach(partKey => {
                const partDataArray = window.allEquipmentDataFromHugo[partKey];
                if (partDataArray && Array.isArray(partDataArray)) {
                    const processedPartData = partDataArray.map(item => ({ ...item, part: item.part || partKey }));
                    allEquipmentData = allEquipmentData.concat(processedPartData);
                } else {
                    console.warn(`[EquipmentGallery] No data or invalid data for part "${partKey}" in window.allEquipmentDataFromHugo. Received:`, partDataArray);
                }
            });
            console.log(`[EquipmentGallery] All equipment data processed. Total items: ${allEquipmentData.length}`);
            if (allEquipmentData.length === 0) {
                loadingMessage.textContent = '登録されている装備データがまだありません。';
                console.log('[EquipmentGallery] No equipment data to display after processing Hugo data.');
            } else {
                loadingMessage.style.display = 'none';
                setListContainerClass(); // リストコンテナのクラスを初期設定
                renderEquipmentList();
            }
        } else {
            console.error('[EquipmentGallery] CRITICAL: window.allEquipmentDataFromHugo is not defined or not an object.');
            loadingMessage.textContent = '装備データの受け渡しに失敗しました。';
        }
    }

    // リストコンテナのBootstrap列クラスを設定する関数
    function setListContainerClass() {
        if (listContainer) {
            if (showDetailsInList) {
                // 詳細表示ON: 大画面でも情報量が多いため、1列または最大2列に
                listContainer.className = 'row row-cols-1 row-cols-lg-2 g-4';
            } else {
                // 詳細表示OFF: シンプルなので、より多くの列で表示
                listContainer.className = 'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 row-cols-xxl-6 g-4';
            }
            console.log(`[EquipmentGallery] List container class set to: "${listContainer.className}" (showDetailsInList: ${showDetailsInList})`);
        } else {
            console.error("[EquipmentGallery] listContainer not found in setListContainerClass.");
        }
    }

    // 装備リストの描画
    function renderEquipmentList() {
        console.log('[EquipmentGallery] renderEquipmentList function called. Show details in list:', showDetailsInList);
        if (!listContainer) {
            console.error('[EquipmentGallery] listContainer not found in renderEquipmentList.');
            return;
        }
        listContainer.innerHTML = ''; // 表示をクリア
        let filteredAndSortedData = [...allEquipmentData];

        // 1. フィルタリング
        const nameQuery = searchNameInput ? searchNameInput.value.toLowerCase().trim() : '';
        const partFilter = filterPartSelect ? filterPartSelect.value : '';
        const colorFilter = filterColorSelect ? filterColorSelect.value : '';

        if (nameQuery) {
            filteredAndSortedData = filteredAndSortedData.filter(item => item.name && item.name.toLowerCase().includes(nameQuery));
        }
        if (partFilter) {
            filteredAndSortedData = filteredAndSortedData.filter(item => item.part === partFilter);
        }
        if (colorFilter) {
            filteredAndSortedData = filteredAndSortedData.filter(item => item.color === colorFilter);
        }
        console.log(`[EquipmentGallery] After filtering, items count: ${filteredAndSortedData.length}`);

        // 2. ソート
        const sortValue = sortSelect ? sortSelect.value : 'name_asc';
        switch (sortValue) {
            case 'name_asc': filteredAndSortedData.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja')); break;
            case 'name_desc': filteredAndSortedData.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'ja')); break;
            case 'level_asc': filteredAndSortedData.sort((a, b) => (parseInt(a.level, 10) || 0) - (parseInt(b.level, 10) || 0)); break;
            case 'level_desc': filteredAndSortedData.sort((a, b) => (parseInt(b.level, 10) || 0) - (parseInt(a.level, 10) || 0)); break;
            default: console.warn(`[EquipmentGallery] Unknown sort value: ${sortValue}`);
        }

        if (filteredAndSortedData.length === 0) {
            listContainer.innerHTML = '<div class="col-12"><p>該当する装備が見つかりませんでした。</p></div>';
            console.log('[EquipmentGallery] No equipment items to display after filtering/sorting.');
            return;
        }

        const partDisplayNameMapping = {"head": "頭", "body": "上半身", "legs": "下半身", "right_hand": "右手", "left_hand": "左手"};
        const statNameMapping = {
            "attack": "攻撃力", "defense": "防御力", "magicAttack": "魔法攻撃力", "magicDefense": "魔法防御力",
            "luck": "運", "hp_up": "HP上昇", "mp_up": "MP上昇", "fire_resist": "火耐性"
        };

        filteredAndSortedData.forEach(item => {
            const cardWrapper = document.createElement('div');
            // ★★★ 各カードラッパーに 'col' クラスを明示的に付与 ★★★
            cardWrapper.className = 'col'; 

            const displayPart = partDisplayNameMapping[item.part] || item.part || '不明';
            let cardContentHtml = '';

            if (showDetailsInList) {
                // --- 詳細表示 ON の時のカード内容 ---
                let statsDetailHtml = '<ul class="list-unstyled mb-2 small">';
                let hasVisibleStats = false;
                if (item.stats && typeof item.stats === 'object' && Object.keys(item.stats).length > 0) {
                    for (const [key, value] of Object.entries(item.stats)) {
                        if (value !== null && value !== undefined && value !== "") {
                            statsDetailHtml += `<li>${statNameMapping[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: <strong>${value}</strong></li>`;
                            hasVisibleStats = true;
                        }
                    }
                }
                if (!hasVisibleStats && Object.keys(item.stats || {}).length > 0) {
                    statsDetailHtml += '<li>特筆すべき性能なし</li>';
                } else if (!hasVisibleStats) {
                    statsDetailHtml += '<li>性能情報なし</li>';
                }
                statsDetailHtml += '</ul>';

                const descriptionHtml = item.description ? item.description.replace(/\n/g, '<br>') : 'なし';

                cardContentHtml = `
                    <div class="card h-100 equipment-card-detailed">
                        <div class="row g-0 h-100">
                            <div class="col-lg-3 col-md-4 text-center p-2 d-flex flex-column justify-content-center align-items-center">
                                <img src="${item.image_path || '/images/placeholder.png'}" class="img-fluid rounded equipment-image-detailed" alt="${item.name || '装備画像'}">
                            </div>
                            <div class="col-lg-9 col-md-8">
                                <div class="card-body py-2 px-3 d-flex flex-column">
                                    <div>
                                        <h5 class="card-title fs-6 equip-name mb-1">${item.name || '名称未設定'}</h5>
                                        <p class="card-text small mb-1"><strong>部位:</strong> ${displayPart} | <strong>色:</strong> ${item.color || '未設定'}</p>
                                        <p class="card-text small mb-2"><strong>装着Lv:</strong> ${item.level !== undefined ? item.level : '不明'}</p>
                                    </div>
                                    <div class="mt-2 scrollable-stats-desc">
                                        <h6 class="small mb-1"><strong>性能:</strong></h6>
                                        ${statsDetailHtml}
                                        <h6 class="small mt-2 mb-1"><strong>説明:</strong></h6>
                                        <p class="small card-text-description">${descriptionHtml}</p>
                                    </div>
                                    <div class="mt-auto pt-1">
                                        <hr class="my-1">

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // --- 詳細表示 OFF の時のカード内容 (シンプル表示) ---
                const statNameMappingCardSimple = { "attack": "攻", "defense": "防", "magicAttack": "魔攻", "magicDefense": "魔防", "luck": "運" };
                let cardStatsHtmlSimple = '';
                if (item.stats && typeof item.stats === 'object') {
                    let visibleStatsCountInCard = 0;
                    cardStatsHtmlSimple += '<ul class="list-unstyled list-inline list-stats-card small mt-1 mb-0">';
                    for (const [key, value] of Object.entries(item.stats)) {
                        const shouldDisplayStatInCard = (value !== null && value !== undefined) && ((typeof value === 'number' && value !== 0) || (typeof value === 'string' && value !== ""));
                        if (shouldDisplayStatInCard && statNameMappingCardSimple[key]) {
                            cardStatsHtmlSimple += `<li class="list-inline-item me-2">${statNameMappingCardSimple[key]}:<strong class="ms-1">${value}</strong></li>`;
                            visibleStatsCountInCard++;
                        }
                    }
                    cardStatsHtmlSimple += '</ul>';
                    if (visibleStatsCountInCard === 0) cardStatsHtmlSimple = '';
                }

                cardContentHtml = `
                    <div class="card h-100 equipment-card-simple">
                        <img src="${item.image_path || '/images/placeholder.png'}" class="card-img-top p-3 equipment-image" alt="${item.name || '装備画像'}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title fs-6 equip-name">${item.name || '名称未設定'}</h5>
                            <p class="card-text small mb-1">
                                <span class="me-2">部位: ${displayPart}</span> | 
                                <span>色: ${item.color || '未設定'}</span>
                            </p>
                            <p class="card-text small mb-1">装着Lv: ${item.level !== undefined ? item.level : '不明'}</p>
                            <div class="mt-auto card-stats-container-simple">
                                ${cardStatsHtmlSimple}
                            </div>
                        </div>
                    </div>
                `;
            }
            cardWrapper.innerHTML = cardContentHtml;
            listContainer.appendChild(cardWrapper);
        });
        console.log('[EquipmentGallery] Finished rendering items.');
    }

    // イベントリスナー設定
    if(searchNameInput) searchNameInput.addEventListener('input', renderEquipmentList);
    if(filterPartSelect) filterPartSelect.addEventListener('change', renderEquipmentList);
    if(filterColorSelect) filterColorSelect.addEventListener('change', renderEquipmentList);
    if(sortSelect) sortSelect.addEventListener('change', renderEquipmentList);

    if(filterResetButton) {
        filterResetButton.addEventListener('click', () => {
            if(searchNameInput) searchNameInput.value = '';
            if(filterPartSelect) filterPartSelect.value = '';
            if(filterColorSelect) filterColorSelect.value = '';
            if(sortSelect) sortSelect.value = 'name_asc';
            if(toggleDetailsDisplaySwitch) {
                toggleDetailsDisplaySwitch.checked = false;
                showDetailsInList = false;
                localStorage.setItem(localStorageKeyShowDetailsList, 'false');
            }
            setListContainerClass();
            renderEquipmentList();
        });
    }

    if (toggleDetailsDisplaySwitch) {
        toggleDetailsDisplaySwitch.addEventListener('change', function() {
            showDetailsInList = this.checked;
            localStorage.setItem(localStorageKeyShowDetailsList, showDetailsInList.toString());
            console.log(`[EquipmentGallery] Details display in list toggled to: ${showDetailsInList}`);
            setListContainerClass();
            renderEquipmentList();
        });
    }

    // 初期データ読み込み実行
    loadAndDisplayEquipment();

    console.log('[EquipmentGallery] End of DOMContentLoaded.');
});

console.log('[EquipmentGallery] Script execution finished (end of file).');