$(document).ready( function() {
	if ($(".datepicker").length) {
        var dates = $(".datepicker").datepicker({
            defaultDate: "+1w",
            //defaultDate: "20-06-2018",
            changeMonth: true,
            changeYear: true,
            numberOfMonths: 1,
            //showOtherMonths:true,
            //selectOtherMonths:true,
            //minDate:-20,
            //maxDate:"+1M +10D",
            dateFormat: "dd/mm/yy",
            language: 'ru',
            onSelect: function (selectedDate) {
                var option = $(this).hasClass("from") ? "minDate" : "maxDate",
                    instance = $(this).data("datepicker"),
                    date = $.datepicker.parseDate(
                        instance.settings.dateFormat || $.datepicker._defaults.dateFormat,
                        selectedDate, instance.settings
                    );
                dates.not(this).datepicker("option", option, date);
                //$(this).val(date);
                $(this).change();
            }
        });

        /*$.datepicker.regional['ru'] = {
            closeText: 'Закрыть',
            prevText: '&#x3c;Пред',
            nextText: 'След&#x3e;',
            currentText: 'Сегодня',
            monthNames: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            monthNamesShort: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
            dayNames: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
            dayNamesShort: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'сбт'],
            dayNamesMin: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
            weekHeader: 'Нед',
            dateFormat: 'dd.mm.yy',
            firstDay: 1,
            isRTL: false,
            showMonthAfterYear: false,
            yearSuffix: ''
        };
        $.datepicker.setDefaults($.datepicker.regional['ru']);*/
    }
});