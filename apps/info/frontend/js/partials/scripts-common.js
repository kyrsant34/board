$(document).ready( function() {
    let is_active_ps = true;
    let start_date = new Date();
    let end_date = new Date();

    function set_digit_val(el_id, val) {
        $('#' + el_id).text(val.toLocaleString());
    }

    function date_to_string(date) {
        return ('0' + date.getDate()).slice(-2) + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + date.getFullYear();
    }

    function get_query_params() {
        return {
            from_date: date_to_string(start_date),
            to_date: date_to_string(end_date),
            is_active: is_active_ps
        }
    }

    function reload_table() {
        $.ajax({
            url: "withdrawals-by-ps/",
            data: get_query_params(),
        }).done(function(data) {
            let table_el = $("#table-by-ps");
            table_el.html('');

            for (let i = 0; i < data.length; i++) {
                let tl = document.createElement("div");
                tl.className = "table__line";

                const ps_title_text = data[i]['psTitle'];
                const in_out_text = `${data[i]['amountIn'].toLocaleString()} / ${data[i]['amountOut'].toLocaleString()} ${data[i]['currency']}`;
                const balance_text = `${data[i]['balance'].toLocaleString()} ${data[i]['currency']}`;

                for (let text of [ps_title_text, in_out_text , balance_text]) {
                    let tc = document.createElement("div");
                    tc.className = "table__cell";
                    tc.innerHTML = text;
                    tl.append(tc);
                }
                if (ps_title_text === "TOTAL") {
                    tl.className += " table__footer";
                }
                table_el.append(tl);
            }
        })
    }

    function  reload_common_data() {
        $.ajax({
            url: "withdrawal-ready-to-process/"
        }).done(function(p) {
            set_digit_val('js_rtp_count', p.rtpCount);
            set_digit_val('js_rtp_count_cny', p.rtpCountCny);
            set_digit_val('js_rtp_count_usd', p.rtpCountUsd);
        });
        $.ajax({
            url: "mt-account-data/"
        }).done(function(p) {
            set_digit_val('js_trader_balance_cny', p.balanceCny);
            set_digit_val('js_trader_balance_usd', p.balanceUsd);
        });
    }

    function update_period_data() {
        start_date = $('#start-date').datepicker('getDate');
        end_date = $('#end-date').datepicker('getDate');
        if (start_date && end_date) {
            reload_report_data();
            reload_table();
        }
        else {
            $("#table-by-ps").html('');
        }
    }

    function reload_report_data() {
        $.ajax({
            url: "report-data/",
            data: get_query_params()
        }).done(function(data) {
            for (let [date_key, date_val] of Object.entries(data)) {
                for (let [param_key, param_val] of Object.entries(date_val)) {
                    let snake_key = date_key + '_' + param_key;
                    let upper_chars = snake_key.match(/([A-Z])/g);
                    if (upper_chars) {
                        upper_chars.forEach(function (upper_char) {
                            snake_key = snake_key.replace(new RegExp(upper_char), '_' + upper_char.toLowerCase());
                        });
                    }
                    set_digit_val(snake_key, param_val);
                }
            }
        });
    }

    function change_dates(key) {
        let today = new Date();
        $("#start-date").prop('disabled', true);
        $("#end-date").prop('disabled', true);
        switch(key) {
            case 'today':
                start_date = today;
                end_date = today;
                break;
            case 'yesterday':
                let yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                start_date = yesterday;
                end_date = yesterday;
                break;
            case 'week':
                let first_day = today.getDate() - today.getDay() + 1;
                start_date = new Date();
                start_date.setDate(first_day);
                end_date = today;
                break;
            case 'month':
                let y = today.getFullYear(), m = today.getMonth();
                start_date = new Date(y, m, 1);
                end_date = today;
                break;
            case 'custom':
                $("#start-date").prop('disabled', false);
                $("#end-date").prop('disabled', false);
                update_period_data();
                return
        }
        $('#start-date').datepicker('setDate', start_date);
        $('#end-date').datepicker('setDate', end_date);
        reload_report_data();
        reload_table();
    }

    // Changes periods
    $('.js-range-date').on('click', function (e) {
        let el = $(this).closest(".menu__item");
        change_dates(el.attr('date-id'));
        $('.js-range-date').closest(".menu__item").removeClass("menu--active");
        el.addClass("menu--active");
        e.preventDefault();
    });

    // Default state setting
    reload_common_data();
    change_dates('today');

    // Display of active payments
    $('#btn-show-all').on('click', function (e) {
        let el = $(this);
        let el_val = el.attr('data-enabled');
        if (el_val === 'true') {
            el.text('Active only');
            el.attr('data-enabled', 'false');
            is_active_ps = false;
        }
        else {
            el.text('Show all');
            el.attr('data-enabled', 'true');
            is_active_ps = true;
        }
        e.preventDefault();
        reload_table();
    });

    // Changes periods by datepicker
    $('#start-date').change(function() {
        update_period_data();
    });
    $('#end-date').on('change', function () {
        update_period_data();
    });
});