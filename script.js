document.addEventListener("DOMContentLoaded", function () {

    //カフェイン上限
    let DAILY_LIMIT = 400;

    let records = [];

    let savedData = localStorage.getItem("caffeineRecords");
    if (savedData) {
        records = JSON.parse(savedData);
    }

    //アニメーション系
    function fadeIn(element) {
        let opacity = 0;
        element.style.opacity = 0;
        let timer = setInterval(function () {
            opacity = opacity + 0.1;
            element.style.opacity = opacity;
            if (opacity >= 1) {
                clearInterval(timer);
            }
        }, 30);
    }

    function fadeOut(element, callback) {
        let opacity = 1;
        element.style.opacity = 1;
        let timer = setInterval(function () {
            opacity = opacity - 0.1;
            element.style.opacity = opacity;
            if (opacity <= 0) {
                clearInterval(timer);
                if (callback) {
                    callback();
                }
            }
        }, 30);
    }

    function animateProgressBar(element, targetWidth) {
        let currentWidth = 0;
        let timer = setInterval(function () {
            currentWidth = currentWidth + 2;
            if (currentWidth >= targetWidth) {
                currentWidth = targetWidth;
                clearInterval(timer);
            }
            element.style.width = currentWidth + "%";
        }, 20);
    }

    // 記録の削除
    function deleteRecord(id) {
        if (confirm("本当に削除しますか？")) {
            //削除対象の要素を探す
            let items = document.querySelectorAll(".record-item");
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (item.dataset.id == id) {
                    //フェードアウトしてから削除
                    fadeOut(item, function () {
                        for (let j = 0; j < records.length; j++) {
                            if (records[j].id == id) {
                                //見つけたら削除
                                records.splice(j, 1);
                                break;
                            }
                        }
                        displayRecords();
                    });
                    break;
                }
            }
        }
    }

    //合計摂取量
    function getTodayTotal() {
        let dt = new Date();
        let y = dt.getFullYear();
        let m = dt.getMonth() + 1;
        let d = dt.getDate();
        let todayStr = y + "-" + m + "-" + d;

        let total = 0;

        //全ての記録をループして今日の分を合計
        for (let i = 0; i < records.length; i++) {
            let rd = new Date(records[i].date);
            let ry = rd.getFullYear();
            let rm = rd.getMonth() + 1;
            let rd_day = rd.getDate();
            let recordDateStr = ry + "-" + rm + "-" + rd_day;

            // 日付が一致したら合計に加算
            if (recordDateStr == todayStr) {
                total += parseInt(records[i].amount);
            }
        }
        return total;
    }

    // 記録を表示する関数
    function displayRecords() {

        // ローカルストレージに保存
        let jsonStr = JSON.stringify(records);
        localStorage.setItem("caffeineRecords", jsonStr);

        // リスト要素を取得してクリア
        let list = document.getElementById("record-list");
        list.innerHTML = "";

        // 日付順にソート(新しい順)
        records.sort(function (a, b) {
            return new Date(b.date) - new Date(a.date);
        });

        // 各記録を表示
        for (let i = 0; i < records.length; i++) {
            let record = records[i];
            let item = document.createElement("div");
            item.className = "record-item";
            item.dataset.id = record.id;

            // 日付と時刻をフォーマット
            let d = new Date(record.date);
            let year = d.getFullYear();
            let month = d.getMonth() + 1;
            let day = d.getDate();
            let hour = d.getHours();
            let min = d.getMinutes();

            // 1桁の場合の0付与
            if (min < 10) min = "0" + min;
            if (hour < 10) hour = "0" + hour;

            let dateStr = year + "/" + month + "/" + day + " " + hour + ":" + min;

            //HTML作成
            item.innerHTML =
                '<div class="record-info">' +
                '<div class="record-main">' +
                '<strong class="record-name">' + record.name + '</strong>' +
                '<span class="record-amount">' + record.amount + ' mg</span>' +
                '</div>' +
                '<span class="record-date">' + dateStr + '</span>' +
                '</div>' +
                '<div class="record-actions">' +
                '<button class="btn btn-icon delete-btn">✖</button>' +
                '</div>';

            //削除ボタンにクリックイベントを設定
            let deleteBtn = item.querySelector(".delete-btn");
            if (deleteBtn) {
                deleteBtn.addEventListener("click", function () {
                    deleteRecord(record.id);
                });
            }

            //リストに追加してアニメーション
            list.appendChild(item);
            fadeIn(item);
        }

        //記録がない場合のメッセージ
        if (records.length == 0) {
            list.innerHTML = '<p class="empty-state">まだ記録はありません</p>';
        }

        //各要素を取得
        let totalCountEl = document.getElementById("total-count");
        let todayTotalEl = document.getElementById("today-total");
        let progressFill = document.getElementById("progress-fill");
        let statusMessage = document.getElementById("status-message");
        let statusCard = document.getElementById("status-card");

        //件数を表示
        if (totalCountEl) {
            totalCountEl.textContent = "(" + records.length + "件)";
        }

        //今日の合計を取得して表示
        let todayAmount = getTodayTotal();

        if (todayTotalEl) {
            todayTotalEl.textContent = todayAmount;
        }

        //バーの割合計算
        let percentage = (todayAmount / DAILY_LIMIT) * 100;
        if (percentage > 100) percentage = 100;

        if (progressFill) {
            animateProgressBar(progressFill, percentage);
        }

        // 上限を超えたときの警告
        if (todayAmount > DAILY_LIMIT) {
            statusCard.classList.add("status-warning");
            if (progressFill) progressFill.style.backgroundColor = "#e57373";
            if (statusMessage) statusMessage.textContent = "1日の摂取目安を超えています";
        } else {
            statusCard.classList.remove("status-warning");
            if (progressFill) progressFill.style.backgroundColor = "var(--accent-color)";
            if (statusMessage) statusMessage.textContent = "安全圏内です";
        }
    }

    displayRecords();

    let addBtn = document.getElementById("add-btn");

    if (addBtn) {
        addBtn.addEventListener("click", function () {
            let nameInput = document.getElementById("drink-name");
            let amountInput = document.getElementById("caffeine-amount");

            let name = nameInput.value;
            let amount = amountInput.value;

            // 両方入力されている場合
            if (name && amount) {
                let now = new Date();

                // 新しい記録オブジェクトを作成
                let newRecord = {
                    id: new Date().getTime(),
                    date: now.toString(),
                    name: name,
                    amount: amount
                };

                // 配列に追加
                records.push(newRecord);

                // 画面を更新
                displayRecords();

                // 上限を超えた場合はアラート
                let currentTodayAmount = getTodayTotal();
                if (currentTodayAmount > DAILY_LIMIT) {
                    alert("本日の摂取量(" + currentTodayAmount + "mg)が目安を超えました。");
                }

                // 入力欄をクリア
                nameInput.value = "";
                amountInput.value = "";
            } else {
                alert("内容と数値を入力してください");
            }
        });
    }
});
